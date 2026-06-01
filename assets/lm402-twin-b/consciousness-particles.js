/**
 * consciousness-particles.js — 意識菜市場 · 粒子派（雙時空 B2）
 *
 * 學妹周圍 150 個「記憶碎片」粒子緩慢飄動，每個顏色對應不同年紀的意識。
 * 跟 B3 光柱派 / B4 文字派 並行運作，組合成「七嘴八舌」抽象視覺化。
 *
 * 技術：Three.js Points + 自訂 ShaderMaterial
 *   - 單一 draw call 跑 150 粒子（GPU 高效）
 *   - per-vertex life 控制 alpha + size
 *   - 程式生成 circular alpha texture（不需 .png）
 *   - additive blending：粒子相疊處更亮（記憶感）
 *
 * 公開 API：
 *   const p = createConsciousnessParticles({ parent, anchor });
 *   p.update(time, dt);   // 每幀呼叫
 *   p.setIntensity(0.5);  // 整體強度 0~1
 *   p.dispose();
 */

import * as THREE from "./vendor-three.module.js";

// 5 個年紀色彩（跟 B3 光柱派一致）
const VOICE_COLORS = [
  [1.0, 0.83, 0.61], // young 暖橙
  [1.0, 0.96, 0.91], // now 暖白
  [0.75, 0.94, 0.77], // memory 淡綠
  [0.85, 0.72, 1.0], // dream 淡紫
  [0.66, 0.77, 1.0], // future 月光藍
];

const PARTICLE_COUNT = 150;

// 程式生成圓形粒子紋理（一張 64x64 dot with soft edge）
let _particleTex = null;
function getParticleTexture() {
  if (_particleTex) return _particleTex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.7)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  _particleTex = new THREE.CanvasTexture(c);
  _particleTex.colorSpace = THREE.SRGBColorSpace;
  return _particleTex;
}

// ─── 粒子 vertex shader ───
// 根據 life (0~1) 算 size 跟 alpha：
//   life 0.0~0.2: 漸入（fade in）
//   life 0.2~0.8: 全顯
//   life 0.8~1.0: 漸出
const PARTICLE_VS = /* glsl */ `
  attribute float aLife;          // 0~1，由 update() 每幀更新
  attribute float aSize;           // 個別粒子最大尺寸
  attribute vec3 aColor;           // 個別粒子色彩
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uIntensity;
  uniform float uPixelRatio;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // life 曲線：sin shape 平滑漸入漸出
    float life = clamp(aLife, 0.0, 1.0);
    float lifeCurve = sin(life * 3.14159265);  // 0→1→0
    vAlpha = lifeCurve * uIntensity;
    vColor = aColor;

    // size：lifeCurve × baseSize × distance attenuation
    gl_PointSize = aSize * lifeCurve * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// ─── 粒子 fragment shader ───
// circular alpha texture × vColor × vAlpha
const PARTICLE_FS = /* glsl */ `
  uniform sampler2D uMap;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float texA = texture2D(uMap, gl_PointCoord).r;
    if (texA < 0.02) discard;
    gl_FragColor = vec4(vColor, texA * vAlpha);
  }
`;

export function createConsciousnessParticles(options = {}) {
  const parent = options.parent;
  const anchor = options.anchor || { x: 0, y: 1.4, z: 0 };
  const radius = options.radius ?? 0.55;
  const heightRange = options.heightRange ?? 1.4;
  if (!parent) {
    console.warn("[consciousness-particles] no parent provided");
    return makeNoOp();
  }

  // ─── 配置每個粒子的初始狀態 ───
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const lives = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const speeds = new Float32Array(PARTICLE_COUNT * 3); // 每個粒子的 velocity
  const lifespans = new Float32Array(PARTICLE_COUNT);  // 每個粒子的壽命（秒）
  const phases = new Float32Array(PARTICLE_COUNT);     // 個別 phase 隨機

  function respawn(i) {
    // 隨機在學妹周圍球體分布
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.5 + Math.random() * 0.7);
    positions[i * 3]     = anchor.x + r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = anchor.y + (Math.random() - 0.3) * heightRange;
    positions[i * 3 + 2] = anchor.z + r * Math.sin(phi) * Math.sin(theta);
    // 隨機色彩（5 個 voice 之一）
    const c = VOICE_COLORS[Math.floor(Math.random() * VOICE_COLORS.length)];
    colors[i * 3]     = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
    // velocity：主要往上 + 微擾動（記憶往上飄）
    speeds[i * 3]     = (Math.random() - 0.5) * 0.04;
    speeds[i * 3 + 1] = 0.06 + Math.random() * 0.04;     // 上升速度
    speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    sizes[i] = 14 + Math.random() * 14;                  // 個別 size 變化
    lives[i] = 0;                                         // 從 0 開始
    lifespans[i] = 3 + Math.random() * 4;                // 壽命 3-7 秒
    phases[i] = Math.random() * Math.PI * 2;              // 個別 phase
  }
  for (let i = 0; i < PARTICLE_COUNT; i++) respawn(i);
  // 初始化時讓一些粒子已經在 lifecycle 中段（避免一開始一齊出現）
  for (let i = 0; i < PARTICLE_COUNT; i++) lives[i] = Math.random();

  // ─── 建立 BufferGeometry + ShaderMaterial ───
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: PARTICLE_VS,
    fragmentShader: PARTICLE_FS,
    uniforms: {
      uMap: { value: getParticleTexture() },
      uIntensity: { value: 0.5 },           // 1.0 → 0.5（fix「粒子蓋過學妹」）
      uPixelRatio: { value: window.devicePixelRatio || 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending, // 加法混合：粒子相疊更亮
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = 19;  // 在 cornea (18) 之後渲染
  parent.add(points);

  // ─── 每幀 update ───
  let lastTime = 0;
  function update(time) {
    if (lastTime === 0) lastTime = time;
    const dt = Math.min(0.05, time - lastTime);
    lastTime = time;

    const posAttr = geometry.attributes.position;
    const lifeAttr = geometry.attributes.aLife;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // 推進 life
      lives[i] += dt / lifespans[i];
      if (lives[i] >= 1.0) {
        respawn(i);
        // 同步寫回 buffer
        posAttr.array[i * 3]     = positions[i * 3];
        posAttr.array[i * 3 + 1] = positions[i * 3 + 1];
        posAttr.array[i * 3 + 2] = positions[i * 3 + 2];
        const ca = geometry.attributes.aColor.array;
        ca[i * 3]     = colors[i * 3];
        ca[i * 3 + 1] = colors[i * 3 + 1];
        ca[i * 3 + 2] = colors[i * 3 + 2];
        geometry.attributes.aColor.needsUpdate = true;
        geometry.attributes.aSize.array[i] = sizes[i];
        geometry.attributes.aSize.needsUpdate = true;
      } else {
        // 飄動：position += velocity * dt + 微擾動 sin
        posAttr.array[i * 3]     += speeds[i * 3]     * dt + Math.sin(time * 0.7 + phases[i]) * 0.0005;
        posAttr.array[i * 3 + 1] += speeds[i * 3 + 1] * dt;
        posAttr.array[i * 3 + 2] += speeds[i * 3 + 2] * dt + Math.cos(time * 0.5 + phases[i]) * 0.0005;
      }
      lifeAttr.array[i] = lives[i];
    }
    posAttr.needsUpdate = true;
    lifeAttr.needsUpdate = true;
  }

  function setIntensity(v) {
    material.uniforms.uIntensity.value = Math.max(0, Math.min(1, v));
  }

  function dispose() {
    parent.remove(points);
    geometry.dispose();
    material.dispose();
  }

  return {
    update,
    setIntensity,
    dispose,
    points,
    inspectParticleCount: () => PARTICLE_COUNT,
  };
}

function makeNoOp() {
  return {
    update: () => {}, setIntensity: () => {}, dispose: () => {},
    points: null, inspectParticleCount: () => 0,
  };
}
