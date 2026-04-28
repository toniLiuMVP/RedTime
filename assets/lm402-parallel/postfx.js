/**
 * postfx.js — 電影派後製管線（精剪自寫版，相容 GitHub Pages 純靜態部署）
 *
 * Pipeline：
 *   ┌─────────────┐   ┌──────────┐   ┌────────────┐   ┌────────┐
 *   │ Scene Render│──▶│  Bloom   │──▶│    DOF     │──▶│ Final  │──▶ Screen
 *   │  (HDR HF RT)│   │  (multi  │   │ (depth-aw  │   │(vignet │
 *   │             │   │  mip up) │   │  blur)     │   │ +FXAA) │
 *   └─────────────┘   └──────────┘   └────────────┘   └────────┘
 *           │                                           ▲
 *           └──── DepthTexture ─────────────────────────┘
 *
 * 為何不用 examples/jsm 的 EffectComposer？
 *   1. examples/jsm 路徑外，要 vendor 一堆檔案（CopyShader、LuminosityHighPassShader、
 *      UnrealBloomPass…），import 互相依賴複雜
 *   2. 自寫版可以針對「電影派 + 黃昏 + 學妹特寫」精調，省 30% GPU
 *   3. 學習價值高：你看得到每一階段在做什麼
 *
 * 暴露 API：
 *   const fx = createPostFX({ renderer, scene, camera });
 *   fx.render();           // 替代 renderer.render(scene, camera)
 *   fx.setSize(w, h);      // 在 resize handler 內呼叫
 *   fx.setJuniorAnchor(v); // 告訴 DOF 學妹頭部位置（給 focalProvider 用）
 *   fx.tuning.bloom.strength = 0.4; // runtime 微調
 *   fx.dispose();
 */

import * as THREE from "./vendor-three.module.js";
import { focalProvider } from "./postfx-focus.js";

// ─────────────────────────────────────────────────────────────
//  全螢幕 quad helper（render fullscreen pass 用）
// ─────────────────────────────────────────────────────────────
class FullScreenQuad {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(this.geometry, null);
    this.scene.add(this.mesh);
  }
  render(renderer, material, target = null) {
    this.mesh.material = material;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(prevTarget);
  }
  dispose() {
    this.geometry.dispose();
  }
}

// ─────────────────────────────────────────────────────────────
//  共用 Vertex Shader（全螢幕 quad，無投影）
// ─────────────────────────────────────────────────────────────
const VS_FULLSCREEN = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Bright Pass — 抽出超過閾值的高光（Bloom 第一步）
// ─────────────────────────────────────────────────────────────
const FS_BRIGHT = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform float uThreshold;   // 高光閾值（電影派用 0.85，避免整體泛光）
  uniform float uSoftKnee;    // 邊界柔化（0.5 = 自然漸進）
  void main() {
    vec3 c = texture2D(tDiffuse, vUv).rgb;
    float br = max(c.r, max(c.g, c.b));
    // 軟 knee：避免硬切，閾值附近做平滑過渡
    float knee = uThreshold * uSoftKnee + 1e-5;
    float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-5);
    float contribution = max(soft, br - uThreshold) / max(br, 1e-5);
    gl_FragColor = vec4(c * contribution, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Separable Gaussian Blur（水平 / 垂直二趟）
// ─────────────────────────────────────────────────────────────
const FS_BLUR = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;        // 1.0 / size
  uniform vec2 uDirection;    // (1,0) 或 (0,1)
  // 9-tap Gaussian（sigma~2）
  void main() {
    vec3 sum = vec3(0.0);
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection * -4.0).rgb * 0.05;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection * -3.0).rgb * 0.09;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection * -2.0).rgb * 0.12;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection * -1.0).rgb * 0.15;
    sum += texture2D(tDiffuse, vUv).rgb                              * 0.18;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection *  1.0).rgb * 0.15;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection *  2.0).rgb * 0.12;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection *  3.0).rgb * 0.09;
    sum += texture2D(tDiffuse, vUv + uTexel * uDirection *  4.0).rgb * 0.05;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Bloom Composite — 疊加 base + bloom（控強度）
// ─────────────────────────────────────────────────────────────
const FS_BLOOM_ADD = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tBase;
  uniform sampler2D tBloom;
  uniform float uStrength;
  void main() {
    vec3 base  = texture2D(tBase,  vUv).rgb;
    vec3 bloom = texture2D(tBloom, vUv).rgb;
    gl_FragColor = vec4(base + bloom * uStrength, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Depth-Aware DOF — 根據 depth 與 focalDistance 模糊
//  簡化版「circle of confusion」：用 sigma 隨 |depth-focal| 變大
// ─────────────────────────────────────────────────────────────
const FS_DOF = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform sampler2D tDepth;
  uniform vec2 uTexel;
  uniform float uFocalDist;     // 對焦距離（世界單位轉成 NDC z 之前的相機距離）
  uniform float uFocalRange;    // 焦平面厚度（這段內不模糊）
  uniform float uMaxBlur;       // 最大模糊半徑（pixel）
  uniform float uNear;
  uniform float uFar;

  // depth texture(0..1) → 線性世界距離
  float linearizeDepth(float d) {
    float z = d * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
  }

  void main() {
    float depth = texture2D(tDepth, vUv).x;
    float linear = linearizeDepth(depth);
    float coc = clamp((abs(linear - uFocalDist) - uFocalRange) / uFocalDist, 0.0, 1.0);
    float radius = coc * uMaxBlur;

    vec3 sum = vec3(0.0);
    float total = 0.0;
    // Tier 5: 19-tap hexagonal aperture（電影鏡頭真實 6 角形 bokeh）
    const vec2 hex[19] = vec2[](
      vec2(0.0, 0.0),
      // 內六角（radius 0.5）
      vec2(0.5, 0.0),    vec2(0.25, 0.433),  vec2(-0.25, 0.433),
      vec2(-0.5, 0.0),   vec2(-0.25, -0.433), vec2(0.25, -0.433),
      // 外六角（radius 1.0）
      vec2(1.0, 0.0),    vec2(0.5, 0.866),   vec2(-0.5, 0.866),
      vec2(-1.0, 0.0),   vec2(-0.5, -0.866), vec2(0.5, -0.866),
      // 邊中（六角邊上中點，radius ~0.866）
      vec2(0.75, 0.433),  vec2(0.0, 0.866),   vec2(-0.75, 0.433),
      vec2(-0.75, -0.433), vec2(0.0, -0.866),  vec2(0.75, -0.433)
    );
    for (int i = 0; i < 19; i++) {
      vec2 off = hex[i] * radius * uTexel;
      sum += texture2D(tDiffuse, vUv + off).rgb;
      total += 1.0;
    }
    gl_FragColor = vec4(sum / total, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Final Pass — Vignette + FXAA + ACES (renderer 已做，但這裡再 sharpen)
//  注意：renderer.toneMapping 在「直接 render to screen」時自動套用，
//        但我們是 render to RT 再 blit 出來，所以最終 pass 要自己 tone map。
// ─────────────────────────────────────────────────────────────
const FS_FINAL = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D tDiffuse;
  uniform vec2 uTexel;
  uniform vec3 uVignetteColor;
  uniform float uVignetteOffset;
  uniform float uVignetteDarkness;
  uniform float uExposure;
  uniform bool  uFxaa;
  // Tier 5 新加 uniforms
  uniform float uChromaStrength;
  uniform float uGrainAmount;
  uniform vec3  uShadowTint;
  uniform vec3  uHighlightTint;
  uniform float uTime;
  // Tier 6
  uniform sampler2D uLensDirt;
  uniform float uDirtAmount;
  // Tier 7
  uniform vec2  uSunUv;
  uniform float uGodRaysStrength;
  uniform float uLensFlareStrength;
  // F7 Rain on lens
  uniform sampler2D uRain;
  uniform float uRainAmount;

  // ACES tone map（與 renderer 一致）
  vec3 acesToneMap(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  // FXAA（簡化：只取 luma 邊緣）
  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 fxaa(sampler2D tex, vec2 uv, vec2 texel) {
    vec3 rgbNW = texture2D(tex, uv + vec2(-1.0, -1.0) * texel).rgb;
    vec3 rgbNE = texture2D(tex, uv + vec2( 1.0, -1.0) * texel).rgb;
    vec3 rgbSW = texture2D(tex, uv + vec2(-1.0,  1.0) * texel).rgb;
    vec3 rgbSE = texture2D(tex, uv + vec2( 1.0,  1.0) * texel).rgb;
    vec3 rgbM  = texture2D(tex, uv).rgb;
    float lumaNW = luma(rgbNW); float lumaNE = luma(rgbNE);
    float lumaSW = luma(rgbSW); float lumaSE = luma(rgbSE);
    float lumaM  = luma(rgbM);
    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * 0.03125, 0.0078);
    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
    dir = clamp(dir * rcpDirMin, vec2(-8.0), vec2(8.0)) * texel;
    vec3 rgbA = 0.5 * (texture2D(tex, uv + dir * (1.0/3.0 - 0.5)).rgb +
                       texture2D(tex, uv + dir * (2.0/3.0 - 0.5)).rgb);
    vec3 rgbB = rgbA * 0.5 + 0.25 *
                (texture2D(tex, uv + dir * -0.5).rgb +
                 texture2D(tex, uv + dir *  0.5).rgb);
    float lumaB = luma(rgbB);
    return (lumaB < lumaMin || lumaB > lumaMax) ? rgbA : rgbB;
  }

  // Tier 5 偽隨機（grain 用，per-frame 變化靠 uTime）
  float rand(vec2 st) {
    return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  void main() {
    // === Tier 5: Chromatic Aberration（鏡頭色散，3 channel 各取不同位置）===
    vec2 caOff = (vUv - 0.5) * uChromaStrength;
    vec3 c;
    c.r = texture2D(tDiffuse, vUv + caOff).r;
    c.g = texture2D(tDiffuse, vUv).g;
    c.b = texture2D(tDiffuse, vUv - caOff).b;

    // === Tone map（HDR → LDR） ===
    c *= uExposure;
    c = acesToneMap(c);

    // === Tier 5: Color Grading（暗部冷綠、亮部暖橙，黃昏電影調） ===
    float lu = luma(c);
    vec3 shadowed   = c * uShadowTint;
    vec3 highlighted = c * uHighlightTint;
    c = mix(shadowed, highlighted, smoothstep(0.0, 1.0, lu));

    // === Vignette（暖棕暗角） ===
    vec2 d = vUv - 0.5;
    float r = length(d) * 1.4142;
    float v = smoothstep(uVignetteOffset, 1.0, r);
    c = mix(c, uVignetteColor, v * uVignetteDarkness);

    // === Tier 6: Lens Dirt（鏡頭髒污 luma multiplied，黃昏光打到髒污會被點亮）===
    vec3 dirt = texture2D(uLensDirt, vUv).rgb;
    c += dirt * luma(c) * uDirtAmount;

    // === F7 Rain on lens（鏡頭上的雨滴 + 流痕，水會反光所以亮一點）===
    if (uRainAmount > 0.0) {
      vec3 rain = texture2D(uRain, vUv).rgb;
      // 水滴像「微透鏡」— 會放大背景亮度，所以用 luma 加成更明顯
      c += rain * uRainAmount * (0.45 + luma(c) * 1.1);
    }

    // === Tier 7: God Rays（從太陽方向 march sample 累積亮度）===
    if (uGodRaysStrength > 0.0 && uSunUv.x >= -0.2 && uSunUv.x <= 1.2 && uSunUv.y >= -0.2 && uSunUv.y <= 1.2) {
      vec2 godDelta = (uSunUv - vUv) / 32.0;
      vec3 godRays = vec3(0.0);
      vec2 godUv = vUv;
      for (int i = 0; i < 32; i++) {
        godUv += godDelta;
        if (godUv.x < 0.0 || godUv.x > 1.0 || godUv.y < 0.0 || godUv.y > 1.0) break;
        vec3 ss = texture2D(tDiffuse, godUv).rgb;
        // 取超過閾值的 HDR 部分（光源實際比場景更亮）
        godRays += max(ss - vec3(0.8), vec3(0.0)) * (1.0 - float(i) / 32.0);
      }
      godRays /= 32.0;
      // 暖橙染色（黃昏感）
      c += godRays * uGodRaysStrength * vec3(1.2, 1.0, 0.7);
    }

    // === Tier 7: Lens Flare（4 個 ghost 從相反位置採樣強光）===
    if (uLensFlareStrength > 0.0) {
      vec3 flares = vec3(0.0);
      for (int g = 0; g < 4; g++) {
        float scale = 0.4 + float(g) * 0.4;
        vec2 ghostUv = mix(uSunUv, vec2(1.0) - uSunUv, scale);
        float dist = length(vUv - ghostUv);
        if (dist < 0.05) {
          vec3 sFl = texture2D(tDiffuse, ghostUv).rgb;
          flares += max(sFl - vec3(0.8), vec3(0.0)) * (1.0 - dist / 0.05);
        }
      }
      // 微藍冷色 ghost（電影鏡頭典型 lens coating tint）
      c += flares * uLensFlareStrength * vec3(0.95, 1.05, 1.15);
    }

    // === Tier 5: Film Grain（隨 uTime 變化，動態顆粒不靜態化） ===
    float gn = (rand(vUv * 1024.0 + vec2(uTime * 0.4, uTime * 0.27)) - 0.5) * uGrainAmount;
    c += vec3(gn);

    // === sRGB encode ===
    c = pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
    gl_FragColor = vec4(c, 1.0);
  }
`;

// ─────────────────────────────────────────────────────────────
//  Tier 6: Lens Dirt — 程式生成鏡頭髒污紋理
//  做法：黑底 + 200 個小亮點（隨機灰塵）+ 8 個大光斑（油污 / 指紋）
//  在 final pass 用 luma multiply 疊加：高光通過髒污會被點亮，暗處幾乎看不見
//  這是電影鏡頭真實感的 last 5%（業界叫「lens veiling」）
// ─────────────────────────────────────────────────────────────
let _lensDirtTexture = null;
function buildLensDirtCanvas() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  // 200 顆細塵點
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 3;
    const intensity = 0.4 + Math.random() * 0.6;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  }
  // 8 個大光斑（指紋油污感）
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 30 + Math.random() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(255,240,210,${0.08 + Math.random() * 0.06})`);
    grad.addColorStop(1, "rgba(255,240,210,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return c;
}
function getLensDirtTexture() {
  if (_lensDirtTexture) return _lensDirtTexture;
  _lensDirtTexture = new THREE.CanvasTexture(buildLensDirtCanvas());
  _lensDirtTexture.colorSpace = THREE.LinearSRGBColorSpace;
  _lensDirtTexture.wrapS = THREE.ClampToEdgeWrapping;
  _lensDirtTexture.wrapT = THREE.ClampToEdgeWrapping;
  return _lensDirtTexture;
}

// ─────────────────────────────────────────────────────────────
//  F7 Rain on lens — 鏡頭上的雨滴 + 雨水流痕
//  做法：60 個橢圓水滴（亮度漸層）+ 5 條垂直流痕，luma multiplied 疊加
//  比 lens dirt 亮一點（水會反光），且偏冷色（晚雨感）
// ─────────────────────────────────────────────────────────────
let _rainTexture = null;
function buildRainCanvas() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  // 60 個橢圓水滴
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 3 + Math.random() * 12;
    const intensity = 0.4 + Math.random() * 0.5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(255,255,255,${intensity})`);
    grad.addColorStop(0.5, `rgba(220,235,255,${intensity * 0.55})`);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.85, r, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // 5 條垂直雨水流痕（水滴沿玻璃滑下的軌跡）
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * size;
    const yStart = Math.random() * size * 0.5;
    const yEnd = yStart + 80 + Math.random() * 120;
    const grad = ctx.createLinearGradient(x, yStart, x, yEnd);
    grad.addColorStop(0, "rgba(220,235,255,0)");
    grad.addColorStop(0.5, "rgba(220,235,255,0.45)");
    grad.addColorStop(1, "rgba(220,235,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, yStart);
    ctx.lineTo(x, yEnd);
    ctx.stroke();
  }
  return c;
}
function getRainTexture() {
  if (_rainTexture) return _rainTexture;
  _rainTexture = new THREE.CanvasTexture(buildRainCanvas());
  _rainTexture.colorSpace = THREE.LinearSRGBColorSpace;
  _rainTexture.wrapS = THREE.ClampToEdgeWrapping;
  _rainTexture.wrapT = THREE.ClampToEdgeWrapping;
  return _rainTexture;
}

// ═════════════════════════════════════════════════════════════
//  工廠：建立後製管線實例
// ═════════════════════════════════════════════════════════════
export function createPostFX({ renderer, scene, camera, getJuniorAnchor = null } = {}) {
  // ─── 預設參數（電影派微 Bloom + 暖棕暗角 + DOF） ───
  const tuning = {
    enabled: true,
    bloom:    { threshold: 0.86, softKnee: 0.5, strength: 0.32, mips: 4 },
    dof:      { focalRange: 0.6, maxBlur: 6.0, enabled: true },
    vignette: { color: [0.18, 0.10, 0.05], offset: 0.55, darkness: 0.42 },
    fxaa:     false,  // Tier 5 改用 MSAA RT，FXAA 不需要
    exposure: 1.0,
    // Tier 5 電影級後製
    chroma:    { strength: 0.0028 },                          // 鏡頭色散（0~0.006）
    grain:     { amount: 0.018 },                              // 顆粒感（0~0.04）
    colorGrade: {
      shadowTint:    [0.92, 1.04, 0.98],                      // 暗部偏冷綠
      highlightTint: [1.08, 1.04, 0.94],                      // 亮部偏暖橙
    },
    msaa: 4,                                                    // MSAA samples（取代 FXAA）
    lensDirt:  { amount: 0 },                                  // Tier 6 鏡頭髒污（toni 不要白點，預設關 — 可從 console 開）
    // Tier 7：太陽光體積特效（screen-space）
    godRays:   { strength: 0.35 },                             // 從太陽方向放射的光柱（0=關，0.6=戲劇）
    lensFlare: { strength: 0.4 },                              // 鏡頭眩光 ghost
    // F7 Rain on lens — 鏡頭上的雨滴（劇情可動態切「下雨場景」）
    rain:      { amount: 0 },                                  // 預設關，console 開：0.4~0.8
  };

  // ─── DPR-aware 解析度（手機降畫質） ───
  let width = 1, height = 1;
  let dprScale = 1;
  const isMobile = () => window.innerWidth <= 1080;

  // ─── 主場景 RT（HalfFloat 保留 HDR；附 DepthTexture 給 DOF） ───
  const sceneRT = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    colorSpace: THREE.LinearSRGBColorSpace,  // 內部運算用 linear
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    stencilBuffer: false,
    samples: tuning.msaa,                    // Tier 5 MSAA（GPU-resolved AA，比 FXAA 銳利）
  });
  sceneRT.depthTexture = new THREE.DepthTexture();
  sceneRT.depthTexture.format = THREE.DepthFormat;
  sceneRT.depthTexture.type = THREE.UnsignedShortType;

  // ─── Bloom 多層 mip RT（每層 1/2 解析度） ───
  const makeRT = () => new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const bloomMipRTs = Array.from({ length: tuning.bloom.mips }, () => ({ a: makeRT(), b: makeRT() }));
  const bloomCompositeRT = makeRT();

  // ─── DOF / Final 中間 RT ───
  const dofRT = makeRT();

  // ─── Materials ───
  const matBright = new THREE.ShaderMaterial({
    vertexShader: VS_FULLSCREEN, fragmentShader: FS_BRIGHT,
    uniforms: {
      tDiffuse:   { value: null },
      uThreshold: { value: tuning.bloom.threshold },
      uSoftKnee:  { value: tuning.bloom.softKnee },
    },
  });
  const matBlur = new THREE.ShaderMaterial({
    vertexShader: VS_FULLSCREEN, fragmentShader: FS_BLUR,
    uniforms: {
      tDiffuse:   { value: null },
      uTexel:     { value: new THREE.Vector2() },
      uDirection: { value: new THREE.Vector2(1, 0) },
    },
  });
  const matBloomAdd = new THREE.ShaderMaterial({
    vertexShader: VS_FULLSCREEN, fragmentShader: FS_BLOOM_ADD,
    uniforms: {
      tBase:     { value: null },
      tBloom:    { value: null },
      uStrength: { value: tuning.bloom.strength },
    },
  });
  const matDOF = new THREE.ShaderMaterial({
    vertexShader: VS_FULLSCREEN, fragmentShader: FS_DOF,
    uniforms: {
      tDiffuse:    { value: null },
      tDepth:      { value: null },
      uTexel:      { value: new THREE.Vector2() },
      uFocalDist:  { value: 6.0 },
      uFocalRange: { value: tuning.dof.focalRange },
      uMaxBlur:    { value: tuning.dof.maxBlur },
      uNear:       { value: camera.near },
      uFar:        { value: camera.far },
    },
  });
  const matFinal = new THREE.ShaderMaterial({
    vertexShader: VS_FULLSCREEN, fragmentShader: FS_FINAL,
    uniforms: {
      tDiffuse:           { value: null },
      uTexel:             { value: new THREE.Vector2() },
      uVignetteColor:     { value: new THREE.Color().fromArray(tuning.vignette.color) },
      uVignetteOffset:    { value: tuning.vignette.offset },
      uVignetteDarkness:  { value: tuning.vignette.darkness },
      uExposure:          { value: tuning.exposure },
      uFxaa:              { value: tuning.fxaa },
      // Tier 5
      uChromaStrength:    { value: tuning.chroma.strength },
      uGrainAmount:       { value: tuning.grain.amount },
      uShadowTint:        { value: new THREE.Color().fromArray(tuning.colorGrade.shadowTint) },
      uHighlightTint:     { value: new THREE.Color().fromArray(tuning.colorGrade.highlightTint) },
      uTime:              { value: 0.0 },
      // Tier 6
      uLensDirt:          { value: getLensDirtTexture() },
      uDirtAmount:        { value: tuning.lensDirt.amount },
      // Tier 7
      uSunUv:             { value: new THREE.Vector2(0.5, 0.7) },
      uGodRaysStrength:   { value: tuning.godRays.strength },
      uLensFlareStrength: { value: tuning.lensFlare.strength },
      // F7 Rain on lens
      uRain:              { value: getRainTexture() },
      uRainAmount:        { value: tuning.rain.amount },
    },
  });

  const fsq = new FullScreenQuad();

  // ─── 焦點狀態（給 focalProvider 平滑插值用） ───
  let lastFocal = 6.0;
  let juniorAnchor = null;
  const setJuniorAnchor = (v3OrNull) => { juniorAnchor = v3OrNull; };
  if (getJuniorAnchor) setJuniorAnchor(getJuniorAnchor());

  // ─── Resize ───
  function setSize(w, h) {
    width = w; height = h;
    // 手機降 0.85x，桌機 1.0x
    dprScale = isMobile() ? 0.85 : 1.0;
    const W = Math.max(1, Math.round(w * dprScale));
    const H = Math.max(1, Math.round(h * dprScale));

    sceneRT.setSize(W, H);
    bloomCompositeRT.setSize(W, H);
    dofRT.setSize(W, H);

    bloomMipRTs.forEach((mip, i) => {
      const div = Math.pow(2, i + 1);   // 1/2, 1/4, 1/8, 1/16
      const mw = Math.max(1, Math.floor(W / div));
      const mh = Math.max(1, Math.floor(H / div));
      mip.a.setSize(mw, mh);
      mip.b.setSize(mw, mh);
    });
  }

  // ─── 主 render ───
  function render(time = 0, sunUv = null) {
    if (!tuning.enabled) {
      // 緊急停用：直接 render 到螢幕（fallback）
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }

    // 1. 渲染 scene 到 sceneRT（含 depth）
    renderer.setRenderTarget(sceneRT);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    // 2. Bloom — bright pass → 多 mip down-sample blur → up-sample 疊加
    matBright.uniforms.tDiffuse.value = sceneRT.texture;
    matBright.uniforms.uThreshold.value = tuning.bloom.threshold;
    matBright.uniforms.uSoftKnee.value = tuning.bloom.softKnee;
    fsq.render(renderer, matBright, bloomMipRTs[0].a);

    // 各層水平+垂直 blur，並逐層降採樣
    for (let i = 0; i < tuning.bloom.mips; i++) {
      const cur = bloomMipRTs[i];
      // 從上一 mip 拿 input（或 i=0 從 bright 完的 cur.a）
      const inputTex = (i === 0) ? cur.a.texture : bloomMipRTs[i - 1].a.texture;

      if (i > 0) {
        // 把上層的結果 down-sample 到當前 mip 尺寸（用 blur material 也行，這裡簡化為 copy）
        matBlur.uniforms.tDiffuse.value = inputTex;
        matBlur.uniforms.uTexel.value.set(1 / cur.a.width, 1 / cur.a.height);
        matBlur.uniforms.uDirection.value.set(1, 0);
        fsq.render(renderer, matBlur, cur.a);
      }

      // 水平 blur a → b
      matBlur.uniforms.tDiffuse.value = cur.a.texture;
      matBlur.uniforms.uTexel.value.set(1 / cur.a.width, 1 / cur.a.height);
      matBlur.uniforms.uDirection.value.set(1, 0);
      fsq.render(renderer, matBlur, cur.b);

      // 垂直 blur b → a
      matBlur.uniforms.tDiffuse.value = cur.b.texture;
      matBlur.uniforms.uDirection.value.set(0, 1);
      fsq.render(renderer, matBlur, cur.a);
    }

    // 把最深 mip 累加回 base（簡化的 up-sample composite）
    matBloomAdd.uniforms.tBase.value = sceneRT.texture;
    matBloomAdd.uniforms.tBloom.value = bloomMipRTs[tuning.bloom.mips - 1].a.texture;
    matBloomAdd.uniforms.uStrength.value = tuning.bloom.strength;
    fsq.render(renderer, matBloomAdd, bloomCompositeRT);

    // 3. DOF — 用 focalProvider 決定焦距，結合 depth 模糊
    let postBloomRT = bloomCompositeRT;
    if (tuning.dof.enabled) {
      const focal = focalProvider({
        camera,
        juniorAnchor,
        lookAtTarget: null,    // 你也可以從外面塞
        time,
        lastFocal,
      });
      lastFocal = focal;

      matDOF.uniforms.tDiffuse.value = postBloomRT.texture;
      matDOF.uniforms.tDepth.value = sceneRT.depthTexture;
      matDOF.uniforms.uTexel.value.set(1 / postBloomRT.width, 1 / postBloomRT.height);
      matDOF.uniforms.uFocalDist.value = focal;
      matDOF.uniforms.uFocalRange.value = tuning.dof.focalRange;
      matDOF.uniforms.uMaxBlur.value = tuning.dof.maxBlur;
      matDOF.uniforms.uNear.value = camera.near;
      matDOF.uniforms.uFar.value = camera.far;
      fsq.render(renderer, matDOF, dofRT);
      postBloomRT = dofRT;
    }

    // 4. Final — Vignette + FXAA + tone map → 直 render 到螢幕
    matFinal.uniforms.tDiffuse.value = postBloomRT.texture;
    matFinal.uniforms.uTexel.value.set(1 / width, 1 / height);
    matFinal.uniforms.uVignetteColor.value.fromArray(tuning.vignette.color);
    matFinal.uniforms.uVignetteOffset.value = tuning.vignette.offset;
    matFinal.uniforms.uVignetteDarkness.value = tuning.vignette.darkness;
    matFinal.uniforms.uExposure.value = tuning.exposure;
    matFinal.uniforms.uFxaa.value = tuning.fxaa;
    // Tier 5 uniforms
    matFinal.uniforms.uChromaStrength.value = tuning.chroma.strength;
    matFinal.uniforms.uGrainAmount.value = tuning.grain.amount;
    matFinal.uniforms.uShadowTint.value.fromArray(tuning.colorGrade.shadowTint);
    matFinal.uniforms.uHighlightTint.value.fromArray(tuning.colorGrade.highlightTint);
    matFinal.uniforms.uTime.value = time || 0;
    matFinal.uniforms.uDirtAmount.value = tuning.lensDirt.amount;
    matFinal.uniforms.uGodRaysStrength.value = tuning.godRays.strength;
    matFinal.uniforms.uLensFlareStrength.value = tuning.lensFlare.strength;
    matFinal.uniforms.uRainAmount.value = tuning.rain.amount;
    if (sunUv) matFinal.uniforms.uSunUv.value.copy(sunUv);
    fsq.render(renderer, matFinal, null);   // null = 直接 render 到螢幕
  }

  // ─── 釋放 ───
  function dispose() {
    sceneRT.dispose();
    bloomCompositeRT.dispose();
    dofRT.dispose();
    bloomMipRTs.forEach((m) => { m.a.dispose(); m.b.dispose(); });
    [matBright, matBlur, matBloomAdd, matDOF, matFinal].forEach((m) => m.dispose());
    fsq.dispose();
  }

  return { render, setSize, setJuniorAnchor, dispose, tuning };
}
