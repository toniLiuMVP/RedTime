/**
 * junior-materials-hr.js — 學妹半寫實材質工廠（Half Realistic）
 *
 * 對標：尼爾自動人形 / 學園偶像大師（半寫實亞洲女性）
 * 設計目標：保留 toni 的「程式生成」流派，靠 PBR + procedural texture
 *           升級到「真人感」而非「動漫描邊」。
 *
 * 8 種材質工廠：
 *   1. createSkinMaterialHR  — 主皮膚（暖膚色 + SSS + sheen + procedural normal）
 *   2. createSkinSubMaterialHR — 副皮膚（鼻翼/嘴唇周邊，稍紅）
 *   3. createEyeWhiteMaterialHR — 眼白（偏暖、超低 roughness 製造水汪汪）
 *   4. createIrisMaterialHR — 虹膜（procedural radial pattern + 深棕色）
 *   5. createPupilMaterialHR — 瞳孔（純黑 + 微反光）
 *   6. createHairMaterialHR — 頭髮（各向異性 anisotropy + 雙層 sheen）
 *   7. createLashBrowMaterialHR — 睫毛/眉毛（alpha 漸進邊緣）
 *   8. createLipMaterialHR — 嘴唇（紅潤 + clearcoat 唇蜜感）
 *
 * 3 種程式生成紋理：
 *   - iris pattern（虹膜放射紋路）
 *   - skin normal（皮膚毛孔感微 normal map）
 *   - lash alpha（睫毛/眉毛邊緣漸進透明）
 *
 * 設計哲學：
 *   - 全用 MeshPhysicalMaterial（保留 PBR + envMap 反射）
 *   - 紋理走 CanvasTexture（程式生成，無外部 .png 依賴）
 *   - 不動既有 mesh 結構，只升級材質 → toni 不滿意可一鍵 git revert
 */

import * as THREE from "./vendor-three.module.js";

// ════════════════════════════════════════════════════════════════
//  共用工具
// ════════════════════════════════════════════════════════════════
function lighten(hex, amount) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r + amount);
  c.g = Math.min(1, c.g + amount);
  c.b = Math.min(1, c.b + amount);
  return "#" + c.getHexString();
}
function darken(hex, amount) {
  const c = new THREE.Color(hex);
  c.r = Math.max(0, c.r - amount);
  c.g = Math.max(0, c.g - amount);
  c.b = Math.max(0, c.b - amount);
  return "#" + c.getHexString();
}

// ════════════════════════════════════════════════════════════════
//  Procedural Textures（cache 過避免重複生成）
// ════════════════════════════════════════════════════════════════
const _textureCache = new Map();

/**
 * 虹膜放射紋路紋理（深棕色學妹眼睛）
 * 結構：暗外環 + 中環色彩 + 細紋路 + 中央瞳孔
 */
function buildIrisCanvas(color = "#5d4334") {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // 1. 黑色背景（給 sphere texture 包覆球體用，邊緣會被遮住）
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2,
    cy = size / 2;
  const irisR = size * 0.46;

  // 2. 虹膜主漸層：內亮外暗（模擬虹膜的深度光感）
  const grad = ctx.createRadialGradient(cx, cy, irisR * 0.28, cx, cy, irisR);
  grad.addColorStop(0, lighten(color, 0.18));
  grad.addColorStop(0.4, color);
  grad.addColorStop(0.85, darken(color, 0.18));
  grad.addColorStop(1, "#0a0606");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
  ctx.fill();

  // 3. 放射紋路（虹膜的細密絲線，每根線寬度 + 透明度隨機）
  for (let i = 0; i < 96; i++) {
    const angle = (i / 96) * Math.PI * 2 + Math.random() * 0.02;
    const r0 = irisR * (0.16 + Math.random() * 0.06);
    const r1 = irisR * (0.85 + Math.random() * 0.1);
    const intensity = Math.random() * 0.5 + 0.2;
    const colorChoice = Math.random() < 0.5 ? darken(color, 0.25) : lighten(color, 0.1);
    ctx.strokeStyle = colorChoice;
    ctx.globalAlpha = intensity;
    ctx.lineWidth = 0.6 + Math.random() * 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0);
    ctx.lineTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 4. 瞳孔邊緣 limbal ring（虹膜邊深暗環，是「亞洲眼睛」識別特徵）
  const ringGrad = ctx.createRadialGradient(cx, cy, irisR * 0.86, cx, cy, irisR);
  ringGrad.addColorStop(0, "rgba(0,0,0,0)");
  ringGrad.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
  ctx.fill();

  // 5. 中央瞳孔（純黑）
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy, irisR * 0.32, 0, Math.PI * 2);
  ctx.fill();

  return c;
}

export function getIrisTexture(color = "#5d4334") {
  const key = `iris_${color}`;
  if (_textureCache.has(key)) return _textureCache.get(key);
  const tex = new THREE.CanvasTexture(buildIrisCanvas(color));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  _textureCache.set(key, tex);
  return tex;
}

/**
 * 皮膚 normal map（程式生成毛孔/微皺紋）
 * 純紋理，全身皮膚共用一張即可（在 mesh 上會 wrap）
 */
function buildSkinNormalCanvas() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // normal map 預設「直」方向 = RGB(128,128,255)
  ctx.fillStyle = "rgb(128,128,255)";
  ctx.fillRect(0, 0, size, size);

  // 加微妙噪聲模擬毛孔
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    // 同時擾動 R(X) 和 G(Y)，B 保持 ~255 維持「向外」
    const nx = (Math.random() - 0.5) * 24;
    const ny = (Math.random() - 0.5) * 24;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + nx));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + ny));
  }
  ctx.putImageData(img, 0, 0);

  // 套一個輕微 blur（讓 noise 不要太銳利）
  ctx.filter = "blur(0.6px)";
  ctx.drawImage(c, 0, 0);
  ctx.filter = "none";

  return c;
}

export function getSkinNormalTexture() {
  if (_textureCache.has("skin_normal")) return _textureCache.get("skin_normal");
  const tex = new THREE.CanvasTexture(buildSkinNormalCanvas());
  tex.colorSpace = THREE.LinearSRGBColorSpace; // normal map 是 linear，不是 sRGB
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2); // 在 mesh 上重複（從 4 降到 2，避免毛孔太密像凹凸不平）
  tex.anisotropy = 4;
  _textureCache.set("skin_normal", tex);
  return tex;
}

/**
 * 睫毛/眉毛 alpha 漸進邊緣
 * 上下漸進透明，中間實心 — 讓細長 mesh 的邊緣自然消融
 */
function buildLashAlphaCanvas() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  // 上下漸進，中間實
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, "#000");
  grad.addColorStop(0.25, "#ffffff");
  grad.addColorStop(0.75, "#ffffff");
  grad.addColorStop(1, "#000");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  return c;
}

export function getLashAlphaTexture() {
  if (_textureCache.has("lash_alpha")) return _textureCache.get("lash_alpha");
  const tex = new THREE.CanvasTexture(buildLashAlphaCanvas());
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  _textureCache.set("lash_alpha", tex);
  return tex;
}

// ════════════════════════════════════════════════════════════════
//  Material Factories（半寫實 8 種）
// ════════════════════════════════════════════════════════════════

/**
 * 主皮膚：臉、脖子、手等大面積。SSS + sheen + 微 normal map。
 * @param {string} color 基底膚色（#f9e7da 是亞洲標準偏暖白）
 */
export function createSkinMaterialHR(color = "#f9e7da") {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    normalMap: getSkinNormalTexture(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    sheen: 0.28,
    sheenColor: new THREE.Color("#ffd5bf"),
    sheenRoughness: 0.5,
    // SSS 近似（耳朵鼻翼透光感）
    transmission: 0.05,
    thickness: 0.6,
    ior: 1.4,
    attenuationColor: new THREE.Color("#ff7060"),
    attenuationDistance: 1.2,
    envMapIntensity: 0.85,
  });
}

/**
 * 副皮膚：鼻翼、嘴唇周圍、雙頰，稍微偏紅潤
 */
export function createSkinSubMaterialHR(baseColor = "#f9e7da") {
  const c = new THREE.Color(baseColor).lerp(new THREE.Color("#f4cdbd"), 0.22);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    normalMap: getSkinNormalTexture(),
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughness: 0.66,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
    sheen: 0.18,
    sheenColor: new THREE.Color("#ffc9b0"),
    transmission: 0.04,
    thickness: 0.5,
    ior: 1.4,
    attenuationColor: new THREE.Color("#ff5040"),
    attenuationDistance: 1.0,
    envMapIntensity: 0.85,
  });
}

/**
 * 眼白：超光滑 + clearcoat（水汪感）+ 微暖白（不是純白）
 */
export function createEyeWhiteMaterialHR() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#fefaef"),
    roughness: 0.16,
    metalness: 0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.12,
    sheen: 0.05,
    envMapIntensity: 1.4,
  });
}

/**
 * 虹膜：用 procedural texture 提供放射紋路 + limbal ring + 瞳孔
 * 這是「眼神」的核心 — 替換掉純色 sphere 之後，立刻有真實感
 */
export function createIrisMaterialHR(color = "#5d4334") {
  return new THREE.MeshPhysicalMaterial({
    map: getIrisTexture(color),
    color: new THREE.Color("#ffffff"), // 白色不染色 map（map 主導）
    roughness: 0.32,
    metalness: 0.06,
    clearcoat: 0.22,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.3,
  });
}

/**
 * 瞳孔：純黑但保留微反光（眼睛活著的感覺）
 * （學妹現有實作已經是 MeshBasicMaterial '#161113'，可選擇升級）
 */
export function createPupilMaterialHR() {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0a0608"),
    roughness: 0.18,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
  });
}

/**
 * 頭髮：各向異性 + 雙層 sheen + 高 envMap 反射
 * anisotropy 讓高光沿髮絲方向延伸（而不是 sphere 高光點）
 */
export function createHairMaterialHR(color = "#3c2a22") {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.42,
    metalness: 0.06,
    anisotropy: 0.85,
    anisotropyRotation: Math.PI / 2, // 沿垂直方向（頭髮一般是直下）
    clearcoat: 0.16,
    clearcoatRoughness: 0.36,
    sheen: 0.42,
    sheenColor: new THREE.Color("#9c7b5e"),
    sheenRoughness: 0.32,
    envMapIntensity: 1.0,
  });
}

/**
 * 睫毛 / 眉毛：細長深色 + alpha 漸進邊緣（不會死硬切邊）
 */
export function createLashBrowMaterialHR(color = "#1a0d0a") {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    alphaMap: getLashAlphaTexture(),
    transparent: true,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
}

/**
 * 睫毛梳狀 alpha — 根根分明的睫毛紋理（比 lash capsule 更細緻）
 */
function buildLashFanAlphaCanvas() {
  const w = 128;
  const h = 32;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  // 黑色背景（透明區）
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  // 白色 = 不透明區
  ctx.fillStyle = "#fff";
  // 底部「眼線」實心條
  ctx.fillRect(0, h - 5, w, 5);
  // N 根睫毛三角形向上，邊緣略外傾
  const N = 26;
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * (w / N);
    const tilt = (i - N / 2) * 0.4 + (Math.random() - 0.5) * 1.2;
    const baseY = h - 4;
    const tipY = 2 + Math.random() * 5;
    const baseW = 2.0 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x - baseW / 2, baseY);
    ctx.lineTo(x + baseW / 2, baseY);
    ctx.lineTo(x + tilt, tipY);
    ctx.closePath();
    ctx.fill();
  }
  return c;
}

export function getLashFanAlphaTexture() {
  if (_textureCache.has("lash_fan")) return _textureCache.get("lash_fan");
  const tex = new THREE.CanvasTexture(buildLashFanAlphaCanvas());
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  _textureCache.set("lash_fan", tex);
  return tex;
}

/**
 * 睫毛 plane material — 用梳狀 alpha 模擬根根睫毛
 * 比 capsule 細膩很多，配合 plane mesh 朝鏡頭使用
 */
export function createLashFanMaterialHR() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0d0709"),
    alphaMap: getLashFanAlphaTexture(),
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.78,
    metalness: 0.05,
  });
}

/**
 * 嘴唇：紅潤 + 高 clearcoat（唇蜜感）
 */
export function createLipMaterialHR(color = "#cc8a8a") {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.36,
    metalness: 0,
    clearcoat: 0.42,
    clearcoatRoughness: 0.18,
    sheen: 0.22,
    sheenColor: new THREE.Color("#ffafa0"),
    envMapIntensity: 1.0,
    // (a3) 不再 transparent — 避免多 mesh 重疊時 z 排序鬼影
  });
}

/**
 * 唇線（上下唇分隔線）：稍暗一點的紅
 */
export function createLipLineMaterialHR() {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color("#a86b73"),
    roughness: 0.62,
    metalness: 0,
    transparent: true,
    opacity: 0.7,
  });
}

// ════════════════════════════════════════════════════════════════
//  Diagnostic：列印當前 cache 狀態（debug 用）
// ════════════════════════════════════════════════════════════════
export function inspectMaterialCache() {
  return {
    textureKeys: Array.from(_textureCache.keys()),
    cacheSize: _textureCache.size,
  };
}
