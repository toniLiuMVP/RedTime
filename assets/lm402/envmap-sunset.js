/**
 * envmap-sunset.js — 程式生成「黃昏暖光」HDR 環境貼圖
 *
 * 為何不用 .hdr 檔？
 *   - GitHub Pages 靜態部署，避免增加單檔 1~3MB 的 HDRI 二進位檔
 *   - 程式生成可即時調色，不必為「春天黃昏 / 秋天黃昏 / 室內燈泡」分別存多份
 *   - PMREM 預處理後的成本是 GPU 的，CPU/記憶體幾乎免費
 *
 * 為何要 envMap？
 *   - 整個 renderer.js 用 MeshPhysicalMaterial（PBR），但缺 envMap 時，
 *     metalness/roughness 的差異看不出來（沒有環境可反射）
 *   - 加上 PMREM envMap，材質就會自動「反射黃昏色」，皮膚有暖光、絲帶有粉紅高光
 *
 * 用法：
 *   import { buildSunsetEnvMap } from "./envmap-sunset.js";
 *   const env = buildSunsetEnvMap(renderer);
 *   scene.environment = env;       // 給 PBR 材質做 IBL
 *   // scene.background = env;     // 可選：直接當天空（會蓋掉現有 fog 背景）
 */

import * as THREE from "./vendor-three.module.js";

// ─── Shader：把球面方向 → 黃昏 gradient + 太陽光暈 ───
const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = /* glsl */ `
  varying vec3 vDir;
  uniform vec3  uZenith;       // 天頂色（深藍紫）
  uniform vec3  uHorizon;      // 地平線色（暖桃橙）
  uniform vec3  uGround;       // 地面下方（深紫棕）
  uniform vec3  uSunDir;       // 太陽方向（建議低角度斜射，模擬黃昏）
  uniform vec3  uSunColor;     // 太陽色（暖白偏橙）
  uniform float uSunIntensity; // HDR 強度（>1 才有真實 PBR 反光）

  void main() {
    vec3 d = normalize(vDir);
    float up = d.y;

    // gradient：天頂 ←→ 地平線 ←→ 地面，曲線非線性以模擬大氣散射
    vec3 sky;
    if (up >= 0.0) {
      float t = pow(up, 0.55);                  // 上半球：地平線粗、天頂銳收
      sky = mix(uHorizon, uZenith, t);
    } else {
      float t = pow(-up, 0.7);
      sky = mix(uHorizon, uGround, t);
    }

    // 太陽：銳利核心 + 寬光暈（後者餵給材質的反射）
    float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
    float disc   = pow(sunDot, 96.0);
    float glow   = pow(sunDot, 6.0) * 0.5;
    sky += uSunColor * (disc * uSunIntensity + glow * uSunIntensity * 0.22);

    gl_FragColor = vec4(sky, 1.0);
  }
`;

/**
 * 產生 PMREM 預處理過的環境貼圖。回傳 Texture，可直接賦值 scene.environment。
 * 呼叫一次後務必保留回傳值；若想重新生成（例如劇情切換），先 dispose 舊的。
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {Object} [opts]
 * @param {string} [opts.zenith="#2a3552"]   - 天頂色（深藍紫，營造「快入夜」氛圍）
 * @param {string} [opts.horizon="#ffb58a"]  - 地平線（暖桃橙，黃昏招牌色）
 * @param {string} [opts.ground="#1a1015"]   - 地面下方（深暗，符合 fog 系統）
 * @param {number[]} [opts.sunDir=[0.4,0.18,-0.85]] - 太陽方向（低角度斜後）
 * @param {string} [opts.sunColor="#ffd49c"] - 太陽色（暖白偏橙）
 * @param {number} [opts.sunIntensity=6.0]   - HDR 強度（>=2 才會在 PBR 上看見明顯熱點反射）
 * @returns {THREE.Texture}
 */
export function buildSunsetEnvMap(renderer, opts = {}) {
  const skyScene = new THREE.Scene();
  const skyGeo = new THREE.SphereGeometry(50, 48, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,    // 從球體內側看
    depthWrite: false,
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: {
      uZenith:       { value: new THREE.Color(opts.zenith   ?? "#2a3552") },
      uHorizon:      { value: new THREE.Color(opts.horizon  ?? "#ffb58a") },
      uGround:       { value: new THREE.Color(opts.ground   ?? "#1a1015") },
      uSunDir:       { value: new THREE.Vector3(...(opts.sunDir ?? [0.4, 0.18, -0.85])).normalize() },
      uSunColor:     { value: new THREE.Color(opts.sunColor ?? "#ffd49c") },
      uSunIntensity: { value: opts.sunIntensity ?? 6.0 },
    },
  });
  // 注意：Three.js r152+ 預設 outputColorSpace=sRGB，shader 寫入時要用 linear
  // 我們的 Color 物件預設 sRGB，需轉 linear（讓 PMREM 看到正確 HDR 線性值）
  ["uZenith", "uHorizon", "uGround", "uSunColor"].forEach((k) => {
    skyMat.uniforms[k].value.convertSRGBToLinear();
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  skyScene.add(skyMesh);

  // PMREM：產生多層 mip 的 envMap，給 PBR roughness 用（粗糙 → 高 mip → 模糊反射）
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromScene(skyScene, 0.035); // sigma 微平滑，避開太陽硬邊鋸齒
  const envMap = envRT.texture;

  // 釋放暫時資源
  pmrem.dispose();
  skyGeo.dispose();
  skyMat.dispose();

  return envMap;
}
