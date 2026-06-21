/* ══════════════════════════════════════════════════════════════════════════
   天堂路 (全 3D 軍營養成)  —  Phase 1: 寫實畫質場景 (LM402 路線)
   配方:程式生成黃昏 PMREM 環境貼圖(IBL)+ ACES + PBR 材質 + 低角度拂曉太陽(長影)
        + 月台 postfx(bloom/DOF/SSAO/godRays via sunUv)+ 電影透視相機。
   幾何維持簡單 box,寫實來自材質 + IBL + 光 + 氣氛 + 細節密度。
   角色=toni 親生軍裝立繪去背卡片(面向相機)。
   ══════════════════════════════════════════════════════════════════════════ */
import * as THREE from "../../_vendor/three.module.js";
import { createPostFX } from "../../platform-run/postfx.js";
window.addEventListener("error", (e) => { window.__initErr__ = e.message + " @ " + (e.filename || "").split("/").pop() + ":" + e.lineno; });

/* ───────── 太陽方向(toward sun,上左拂曉,照亮建築正面) ───────── */
const SUN_DIR = new THREE.Vector3(-0.62, 0.6, -0.18).normalize();

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const RC_NOOP = () => { };   // 純裝飾/VFX sprite 不參與射線(否則 Sprite.raycast 需 raycaster.camera，全域 ray 沒設 → 啟動時噴 console.error)

/* ───────── 程式生成黃昏 HDR 環境貼圖(PMREM → IBL) ───────── */
function buildDawnEnvMap(rend) {
  const VERT = `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  const FRAG = `
    varying vec3 vDir;
    uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor; uniform float uSunI;
    void main(){
      vec3 d=normalize(vDir); float up=d.y; vec3 sky;
      if(up>=0.0){ float t=pow(up,0.55); sky=mix(uHorizon,uZenith,t); }
      else { float t=pow(-up,0.7); sky=mix(uHorizon,uGround,t); }
      float sd=max(dot(d,normalize(uSunDir)),0.0);
      float disc=pow(sd,110.0), glow=pow(sd,6.0)*0.5;
      sky += uSunColor*(disc*uSunI + glow*uSunI*0.22);
      gl_FragColor=vec4(sky,1.0);
    }`;
  const sc = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uZenith: { value: new THREE.Color("#33406a") }, uHorizon: { value: new THREE.Color("#ffb074") },
      uGround: { value: new THREE.Color("#241a18") }, uSunDir: { value: SUN_DIR.clone() },
      uSunColor: { value: new THREE.Color("#ffd9a0") }, uSunI: { value: 6.0 },
    },
  });
  ["uZenith", "uHorizon", "uGround", "uSunColor"].forEach((k) => mat.uniforms[k].value.convertSRGBToLinear());
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), mat));
  const pm = new THREE.PMREMGenerator(rend); pm.compileEquirectangularShader();
  const rt = pm.fromScene(sc, 0.035); pm.dispose(); mat.dispose();
  return rt.texture;
}
scene.environment = buildDawnEnvMap(renderer);

/* ───────── 可見天空穹頂(暖色漸層 + 太陽盤) ───────── */
let skyDomeMat = null, sunDiscMat = null, skyHalo = null;   // 漸暗天空用:撐越久天越暗;skyHalo 給呼吸
const skyClouds = [];   // 雲:給極慢側向飄(死貼圖變活氛圍)
(function skyDome() {
  const cv = document.createElement("canvas"); cv.width = 8; cv.height = 512;
  const ctx = cv.getContext("2d"); const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, "#6b6790"); g.addColorStop(0.32, "#9c7e92"); g.addColorStop(0.54, "#c98f7a");
  g.addColorStop(0.70, "#eaa46c"); g.addColorStop(0.85, "#f7cd8c"); g.addColorStop(1, "#fdeac6");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 512);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  skyDomeMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, depthWrite: false, fog: false });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(600, 32, 20), skyDomeMat));
  // 太陽盤 + 光暈
  const sunPos = SUN_DIR.clone().multiplyScalar(520);
  sunDiscMat = new THREE.MeshBasicMaterial({ color: 0xffdca6, fog: false });
  const disc = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 16), sunDiscMat);
  disc.position.copy(sunPos); scene.add(disc);
  const hc = document.createElement("canvas"); hc.width = hc.height = 128; const hx = hc.getContext("2d");
  const hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64); hg.addColorStop(0, "rgba(255,224,168,.95)"); hg.addColorStop(1, "rgba(255,224,168,0)");
  hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(190, 190, 1); halo.position.copy(sunPos); halo.raycast = RC_NOOP; scene.add(halo); skyHalo = halo;
  // 柔雲
  const clc = document.createElement("canvas"); clc.width = 256; clc.height = 128; const cx = clc.getContext("2d");
  for (let i = 0; i < 26; i++) { const x = 30 + Math.random() * 196, y = 50 + Math.random() * 50, r = 18 + Math.random() * 34; const gg = cx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(255,246,232," + (0.5 + Math.random() * 0.3) + ")"); gg.addColorStop(1, "rgba(255,246,232,0)"); cx.fillStyle = gg; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }
  const cloudTex = new THREE.CanvasTexture(clc);
  const cloudPos = [[-180, 120, -340, 150], [220, 150, -380, 200], [-40, 170, -420, 240], [320, 110, -260, 130]];
  for (const [x, y, z, s] of cloudPos) { const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.38, depthWrite: false, fog: false })); cl.position.set(x, y, z); cl.scale.set(s, s * 0.5, 1); cl.raycast = RC_NOOP; scene.add(cl); skyClouds.push(cl); }
})();

/* ───────── 第一人稱相機 (CS 視角) ───────── */
const UP = new THREE.Vector3(0, 1, 0);
const EYE = 1.75;
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.02, 1500);
camera.rotation.order = "YXZ";
camera.position.set(16, EYE, 31);   // 出生在中山室門外(門朝 +Z,玩家面 -Z 朝門),不必跑遠就遇見輔導長
camera.lookAt(16, 1.55, 24);         // 面向中山室門口(-Z 方向)
let yaw = camera.rotation.y, pitch = camera.rotation.x;
scene.add(camera);

/* ───────── 拂曉光(低角度長影) ───────── */
const hemi = new THREE.HemisphereLight(0xbcc6ee, 0x6a564a, 0.9); scene.add(hemi);
const ambient = new THREE.AmbientLight(0xfff0dc, 0.32); scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffe0ad, 3.3);
sun.position.copy(SUN_DIR.clone().multiplyScalar(70)); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.near = 5; sun.shadow.camera.far = 200;
sun.shadow.camera.left = -70; sun.shadow.camera.right = 70; sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.25; sun.shadow.radius = 3;   // normalBias 0.6→0.25 修細幾何(天線/草/欄杆)的 peter-panning 浮影,bias 微調補回避免痘斑
scene.add(sun); scene.add(sun.target);
const rim = new THREE.DirectionalLight(0x9fb0e6, 0.35); rim.position.set(34, 16, -28); scene.add(rim);

/* ───────── 程序貼圖(canvas 雜訊,做 PBR 細節) ───────── */
function tex(draw, px, rep) {
  px = px || 256; const cv = document.createElement("canvas"); cv.width = cv.height = px;
  draw(cv.getContext("2d"), px); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (rep) t.repeat.set(rep[0], rep[1]); return t;
}
function mottle(c, S, base, spots, spotCol, aMax, rMin, rMax) {
  c.fillStyle = base; c.fillRect(0, 0, S, S);
  for (let i = 0; i < spots; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = rMin + Math.random() * (rMax - rMin);
    c.fillStyle = `rgba(${spotCol},${Math.random() * aMax})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
}
const T = {
  concrete: tex((c, S) => { mottle(c, S, "#b9b09b", 160, "90,82,68", 0.18, 2, 14); for (let i = 0; i < 6; i++) { c.strokeStyle = "rgba(70,62,50,0.12)"; c.lineWidth = 1; c.beginPath(); c.moveTo(Math.random() * S, 0); c.lineTo(Math.random() * S, S); c.stroke(); } }, 256, [1, 1]),
  asphalt: tex((c, S) => mottle(c, S, "#4c4944", 220, "20,18,16", 0.22, 1, 8), 256, [1, 1]),
  wall: tex((c, S) => { mottle(c, S, "#d7c9aa", 120, "120,104,78", 0.14, 3, 16); const g = c.createLinearGradient(0, S * 0.55, 0, S); g.addColorStop(0, "rgba(90,78,58,0)"); g.addColorStop(1, "rgba(90,78,58,0.22)"); c.fillStyle = g; c.fillRect(0, S * 0.55, S, S * 0.45); }, 256, [1, 1]),
  roof: tex((c, S) => { c.fillStyle = "#9a4a35"; c.fillRect(0, 0, S, S); for (let x = 0; x < S; x += 10) { c.fillStyle = (x / 10) % 2 ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.06)"; c.fillRect(x, 0, 6, S); } mottle(c, S, "rgba(0,0,0,0)", 50, "40,18,12", 0.10, 4, 12); }, 256, [1, 1]),
  ground: tex((c, S) => { mottle(c, S, "#7d6f54", 240, "50,42,30", 0.20, 3, 22); mottle(c, S, "rgba(0,0,0,0)", 80, "150,140,110", 0.10, 2, 10); }, 512, [1, 1]),
  crate: tex((c, S) => { c.fillStyle = "#9b7a45"; c.fillRect(0, 0, S, S); mottle(c, S, "rgba(0,0,0,0)", 40, "70,50,26", 0.12, 2, 8); c.strokeStyle = "rgba(58,40,18,0.6)"; c.lineWidth = 8; c.strokeRect(5, 5, S - 10, S - 10); c.lineWidth = 5; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(0, i * S / 4); c.lineTo(S, i * S / 4); c.stroke(); } c.beginPath(); c.moveTo(6, 6); c.lineTo(S - 6, S - 6); c.moveTo(S - 6, 6); c.lineTo(6, S - 6); c.stroke(); }, 128, [1, 1]),
};
const mat = (col, o = {}) => new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.9, metalness: 0, envMapIntensity: 1.0, ...o });
const matT = (col, t, rx, ry, o = {}) => { const m = t.clone(); m.needsUpdate = true; m.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.9, map: m, bumpMap: m, bumpScale: 0.35, envMapIntensity: 1.0, ...o }); };   // 同一張程序雜訊 canvas 兼當 bumpMap(灰階明暗推凹凸):破除地面/牆面「塑膠平板」感,在晨光斜射下浮出表面細節,零幾何/drawcall 成本

const ROOT = new THREE.Group(); scene.add(ROOT);
function add(geo, m, x, y, z, parent) { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; (parent || ROOT).add(b); return b; }

/* ── Blender 寫實道具(非阻塞 dynamic import,失敗只 warn 不影響場景)──
   onPlaced:每個道具載完算世界 AABB 推進 OBSTACLES → 玩家/敵人不可穿越(實體碰撞);
   loader 內另有「自動托起貼地」修沉入地板。咾咕石路標 walkable(地面路徑,不擋走)。 */
import("./props-loader.js").then((m) => m.loadSceneProps(THREE, ROOT, {
  base: "./props/",
  onPlaced: (box) => { OBSTACLES.push([box.minX, box.maxX, box.minZ, box.maxZ]); },
  items: [
  // 天堂路 咾咕石路(南緣,沿 X 鋪 ~32m;walkable=可走上去的地面路徑,不擋)
  { file: "coral_path",      pos: [-12, 0, -48], rot: 0, walkable: true },
  { file: "coral_path",      pos: [ -4, 0, -48], rot: 0, walkable: true },
  { file: "coral_path",      pos: [  4, 0, -48], rot: 0, walkable: true },
  { file: "coral_path",      pos: [ 12, 0, -48], rot: 0, walkable: true },
  { file: "sandbag_wall",    pos: [-16, 0, -44], rot: 0 },
  { file: "sandbag_wall",    pos: [ 24, 0,   3], rot: 1.5 },
  // 南營區(bivouac)
  { file: "field_tent",      pos: [-30, 0, -42], rot:  0.2 },
  { file: "field_tent",      pos: [-19, 0, -46], rot: -0.3 },
  { file: "weapon_rack",     pos: [-26, 0, -34], rot:  1.2 },
  // NE 補給platform
  { file: "ammo_crate",      pos: [ 30, 0,   4], rot:  0.1 },
  { file: "ammo_crate",      pos: [ 32, 0,   7], rot:  0.5 },
  { file: "ammo_crate",      pos: [ 29, 0,  10], rot: -0.2 },
  { file: "ammo_crate",      pos: [ 34, 0,   2], rot:  0.8 },
  { file: "fuel_barrel",     pos: [ 33, 0,  14], rot:  0 },
  { file: "fuel_barrel",     pos: [ 35, 0,  16], rot:  0 },
  { file: "fuel_barrel",     pos: [ 31, 0,  18], rot:  0 },
  // 東閱兵場
  { file: "command_podium",  pos: [ 20, 0, -10], rot: -1.57 },
  // 西周界(哨塔 + 鐵絲網)
  { file: "watchtower",      pos: [-60, 0, -20], rot:  0.8 },
  { file: "barbed_wire",     pos: [-55, 0, -10], rot:  1.57 },
  { file: "barbed_wire",     pos: [-55, 0,  -2], rot:  1.57 },
  { file: "barbed_wire",     pos: [-55, 0,   6], rot:  1.57 },
  // 障礙場
  { file: "obstacle_wall",   pos: [-12, 0, -16], rot:  0 },
  { file: "balance_log",     pos: [ -6, 0, -14], rot:  0 },
  { file: "barrier_hedgehog",pos: [ 33, 0,  30], rot:  0 },
  { file: "barrier_hedgehog",pos: [ 30, 0,  28], rot:  0.5 },
] })).catch((e) => { console.warn("[props] module load failed:", e && e.message); });

/* ───────── 地面 + 操場 + 道路 ───────── */
(function terrain() {
  // 大地(泥土草)
  const g = add(new THREE.BoxGeometry(360, 1, 360), matT(0x8a7c5e, T.ground, 40, 40, { roughness: 1 }), 0, -0.5, -30);
  g.castShadow = false;
  // 操場混凝土
  add(new THREE.BoxGeometry(56, 0.14, 46), matT(0xd0c7ae, T.concrete, 10, 8, { roughness: 0.95 }), 0, 0.0, -6).castShadow = false;   // 操場混凝土:top 0.07(與柏油道 0.03/地面 0/白線 0.1 各自錯開,避免共面 z-fighting 雜訊;純視覺不影響站位)
  // 操場白漆邊線 + 中線
  const line = mat(0xe8e2cf, { roughness: 0.85 });
  const ln = (w, d, x, z) => { const m = add(new THREE.BoxGeometry(w, 0.05, d), line, x, 0.1, z); m.castShadow = false; };   // 白漆線壓低貼齊新混凝土面
  ln(46, 0.4, 0, -22); ln(46, 0.4, 0, 10); ln(0.4, 32, -23, -6); ln(0.4, 32, 23, -6); ln(46, 0.3, 0, -6);
  // 主幹道(柏油)
  add(new THREE.BoxGeometry(10, 0.12, 120), matT(0x57534d, T.asphalt, 2, 22, { roughness: 0.85 }), 34, -0.03, -20).castShadow = false;   // 幹道 top 0.03(低於操場混凝土 0.07,重疊處被操場蓋住不 z-fight)
  add(new THREE.BoxGeometry(80, 0.12, 9), matT(0x57534d, T.asphalt, 16, 2, { roughness: 0.85 }), 0, -0.03, 18).castShadow = false;   // 橫向幹道 top 0.03
})();

/* ───────── 地面大尺度變化(破除平坦感:走出來的夯實泥路 / 礫石沙斑 / 晨露水漬) ───────── */
(function groundDetail() {
  const blob = tex((c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.55, "rgba(255,255,255,0.72)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, S, S); }, 128, [1, 1]);
  function patch(x, z, w, l, ang, col, op, rough, metal) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ color: new THREE.Color(col), alphaMap: blob, transparent: true, opacity: op, roughness: rough, metalness: metal || 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, envMapIntensity: metal ? 1.5 : 0.6 }));
    m.rotation.set(-Math.PI / 2, 0, ang); m.position.set(x, 0.03, z); ROOT.add(m);
  }
  const PATH = 0xa3936f, GRAVEL = 0xc2b48c, DAMP = 0x39342a;
  // 走出來的夯實泥路(淺色,低糙度=被踩平)
  patch(31, -10, 8, 28, 0.08, PATH, 0.42, 0.68);     // 通往靶場縱路
  patch(0, -37, 42, 8, 0, PATH, 0.38, 0.68);         // 營房前橫路
  patch(-33, -2, 8, 26, -0.06, PATH, 0.36, 0.68);    // 左側巡邏路
  // 礫石 / 沙斑(較淺,粗糙)
  patch(34, 11, 15, 17, -0.3, GRAVEL, 0.3, 1);
  patch(-35, -26, 14, 12, 0.5, GRAVEL, 0.3, 1);
  patch(20, -39, 17, 11, 0.2, GRAVEL, 0.28, 1);
  // 晨露水漬(深 + 低糙度 + 微金屬感反晨光=濕)
  patch(-27, -31, 11, 7, 0.4, DAMP, 0.5, 0.3, 0.14);
  patch(25, -33, 8, 6, -0.5, DAMP, 0.46, 0.32, 0.12);
  patch(-34, 9, 9, 7, 0.2, DAMP, 0.4, 0.34, 0.1);
  // item 6 地形寫實加碼:更多夯實路/礫石/積水 + 載具區輪胎痕
  patch(22, 28, 13, 16, 0.3, PATH, 0.34, 0.66);      // 載具區夯實路
  patch(0, 7, 34, 9, 0, GRAVEL, 0.2, 1);             // 操場邊礫石帶
  patch(40, -30, 14, 11, 0.3, GRAVEL, 0.26, 1);      // 右後礫石
  patch(-15, -13, 10, 8, 0.4, DAMP, 0.4, 0.34, 0.12);// 操場積水
  patch(13, -27, 9, 7, -0.2, DAMP, 0.36, 0.34, 0.1); // 營前積水
  for (const [tx, tz] of [[23.4, 30], [26.2, 30], [30.2, 23], [32.6, 23]]) patch(tx, tz, 1.9, 9, 0.5, 0x2c281f, 0.34, 0.8);   // 載具區輪胎痕(細長深色)
  // 周界草叢/雜草(破除平坦泥土邊緣,寫實層次)
  const grassA = mat(0x66793f, { roughness: 1, flatShading: true }), grassB = mat(0x76884a, { roughness: 1, flatShading: true });
  const gpts = [[44, 30], [50, 8], [-46, 16], [-50, -4], [46, -14], [-44, -30], [38, -42], [-38, -40], [52, -28], [-52, 24], [30, 40], [-30, 42], [56, -2], [-56, 6], [42, 22], [-42, -18]];
  for (const [gx, gz] of gpts) for (let k = 0; k < 5; k++) { const ox = gx + (Math.random() - 0.5) * 5, oz = gz + (Math.random() - 0.5) * 5, h = 0.32 + Math.random() * 0.34; const t = add(new THREE.ConeGeometry(0.12 + Math.random() * 0.08, h, 5), Math.random() < 0.5 ? grassA : grassB, ox, h / 2, oz); t.castShadow = false; t.rotation.y = Math.random() * 6.28; t.rotation.z = (Math.random() - 0.5) * 0.3; }
})();

/* ───────── 山牆屋頂 helper ───────── */
function gableRoof(parent, w, d, baseY, rh, ov) {
  ov = ov || 0.6; const slabLen = Math.sqrt((d / 2) * (d / 2) + rh * rh) + ov; const ang = Math.atan2(rh, d / 2);
  const rm = matT(0x8f4632, T.roof, w / 4, 1, { roughness: 0.78, metalness: 0.15, envMapIntensity: 0.8, flatShading: false });
  for (const s of [1, -1]) { const sl = new THREE.Mesh(new THREE.BoxGeometry(w + ov * 2, 0.3, slabLen), rm); sl.position.set(0, baseY + rh / 2, s * (d / 4)); sl.rotation.x = s * ang; sl.castShadow = sl.receiveShadow = true; parent.add(sl); }
  const sh = new THREE.Shape(); sh.moveTo(-d / 2, 0); sh.lineTo(d / 2, 0); sh.lineTo(0, rh); sh.closePath();
  const cg = new THREE.ShapeGeometry(sh); const cm = mat(0xcabd9c, { roughness: 0.95 });
  for (const s of [1, -1]) { const cap = new THREE.Mesh(cg, cm); cap.position.set(s * (w / 2), baseY, 0); cap.rotation.y = s * Math.PI / 2; cap.castShadow = true; parent.add(cap); }
}

/* ───────── 寢室(寫實長棟) ───────── */
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x141c2a, roughness: 0.08, metalness: 0, envMapIntensity: 1.8, clearcoat: 0.6, clearcoatRoughness: 0.1 });
const litMat = new THREE.MeshStandardMaterial({ color: 0xffd89a, emissive: new THREE.Color(0xffcf8a), emissiveIntensity: 0.7, roughness: 0.5 });
function barracks(x, z, ry, lit) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; ROOT.add(g);
  const W = 26, H = 4.6, D = 8.5;
  add(new THREE.BoxGeometry(W, H, D), matT(0xd7c9aa, T.wall, 5, 1.2, { roughness: 0.92 }), 0, H / 2, 0, g);
  add(new THREE.BoxGeometry(W + 0.4, 0.7, D + 0.4), mat(0xbcae8c), 0, 0.35, 0, g).receiveShadow = true; // 牆基
  gableRoof(g, W, D, H, 2.6);
  // 窗(玻璃 + 框 + 部分亮燈)
  const fm = mat(0x8a8170, { roughness: 0.8 });
  for (let i = -3; i <= 3; i++) {
    add(new THREE.BoxGeometry(2.7, 2.1, 0.18), fm, i * 3.4, 2.5, D / 2 + 0.02, g).castShadow = false;
    const on = lit && (i === -2 || i === 1 || i === 3);
    add(new THREE.BoxGeometry(2.3, 1.7, 0.12), on ? litMat : glassMat, i * 3.4, 2.5, D / 2 + 0.06, g).castShadow = false;
    // 窗下水漬
    add(new THREE.BoxGeometry(2.3, 1.4, 0.04), mat(0xb8a988, { transparent: true, opacity: 0.35, roughness: 1 }), i * 3.4, 1.0, D / 2 + 0.07, g).castShadow = false;
  }
  // 門 + 雨遮 + 台階
  add(new THREE.BoxGeometry(2.0, 2.9, 0.18), mat(0x6e5436, { roughness: 0.7 }), -W / 2 + 3, 1.45, D / 2 + 0.05, g);
  add(new THREE.BoxGeometry(3.0, 0.2, 1.4), mat(0x9a8f78), -W / 2 + 3, 3.0, D / 2 + 0.6, g);
  add(new THREE.BoxGeometry(2.6, 0.2, 1.2), mat(0xb0a589), -W / 2 + 3, 0.1, D / 2 + 0.7, g);
  // 落水管
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.13, 0.13, H, 8), mat(0x8c8576, { metalness: 0.3, roughness: 0.6 }), sx * (W / 2 - 0.3), H / 2, D / 2 + 0.2, g);
  // ── 寫實補強:屋簷封簷板(陰影線) + 雨槽 + 屋脊蓋 + 通風帽 + 牆腳雨濺髒污 ──
  const trim = mat(0x6f6453, { roughness: 0.72 });
  const metalDark = mat(0x6a6a62, { metalness: 0.45, roughness: 0.6 });
  for (const sz of [1, -1]) {
    add(new THREE.BoxGeometry(W + 1.4, 0.34, 0.16), trim, 0, H + 0.02, sz * (D / 2 + 0.56), g);     // 封簷板:屋簷下緣那條陰影線,最關鍵的「真房子」線索
    add(new THREE.BoxGeometry(W + 1.2, 0.16, 0.26), metalDark, 0, H - 0.12, sz * (D / 2 + 0.46), g).castShadow = false;   // 雨槽:讓落水管接得到水
  }
  add(new THREE.BoxGeometry(W + 0.3, 0.26, 0.5), metalDark, 0, H + 2.55, 0, g);                      // 屋脊蓋
  for (const vx of [-W / 4, W / 4]) add(new THREE.CylinderGeometry(0.32, 0.42, 0.6, 10), metalDark, vx, H + 2.0, 0, g);   // 屋脊通風帽
  add(new THREE.BoxGeometry(W + 0.06, 1.0, D + 0.06), mat(0x5f523f, { roughness: 1, transparent: true, opacity: 0.5 }), 0, 1.15, 0, g).castShadow = false;   // 牆腳雨濺髒污(略大於牆,包四面)
  // ── 住人感:門上連隊番號牌 + 門口沙包垛 + 擱一頂鋼盔 ──
  const dX = -W / 2 + 3;   // 門中心
  const signFrame = mat(0x332c22, { roughness: 0.7 }), signPlate = mat(0xc7bb8e, { roughness: 0.85, emissive: new THREE.Color(0x140f04), emissiveIntensity: 0.25 });
  add(new THREE.BoxGeometry(1.5, 0.66, 0.1), signFrame, dX, 3.32, D / 2 + 0.08, g).castShadow = false;        // 番號牌框
  add(new THREE.BoxGeometry(1.22, 0.42, 0.12), signPlate, dX, 3.32, D / 2 + 0.1, g).castShadow = false;        // 番號牌面(留白,讀作連隊牌)
  const sandMat = mat(0xc3ad82, { roughness: 1 });
  for (const side of [-1, 1]) { const bx = dX + side * 2.05; for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) add(new THREE.BoxGeometry(0.46, 0.26, 0.4), sandMat, bx + (r ? 0.1 : 0), 0.15 + r * 0.26, D / 2 + 0.46 + c * 0.34, g).castShadow = true; }   // 門口沙包垛(兩側,貼牆不擋階)
  add(new THREE.SphereGeometry(0.2, 12, 8, 0, 6.3, 0, 1.7), mat(0x33351f, { roughness: 0.7 }), dX + 2.05, 0.62, D / 2 + 0.63, g).castShadow = true;   // 沙包上擱一頂鋼盔
}
// barracks() 仍保留供他用;原本兩棟實心營房改為可進入的「寢室」(0,-30)與「澡堂」(-30,-16)(#4a),
// 因 ROOM_COLLIDERS 在 roomBuilding 段才宣告,寢室/澡堂的建構移到該段之後呼叫(見 buildBunkRoom / buildBathhouse)。

/* ───────── 旗桿 + 旗(操場中軸) ───────── */
let flagAnim = null;   // 布旗頂點動畫狀態(隨風飄,非木板)
(function flag() {
  add(new THREE.CylinderGeometry(0.18, 0.22, 15, 12), new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.7, roughness: 0.3, envMapIntensity: 1.3 }), 0, 7.5, -6);
  add(new THREE.SphereGeometry(0.36, 12, 8), new THREE.MeshStandardMaterial({ color: 0xe9b44b, metalness: 0.8, roughness: 0.25, envMapIntensity: 1.4 }), 0, 15.2, -6);
  // 中華民國國旗(青天白日滿地紅):紅地 + 左上藍 canton + 12 道白光芒白日
  const fcv = document.createElement("canvas"); fcv.width = 300; fcv.height = 200; const fctx = fcv.getContext("2d");
  fctx.fillStyle = "#cf2331"; fctx.fillRect(0, 0, 300, 200);                     // 滿地紅
  fctx.fillStyle = "#003da5"; fctx.fillRect(0, 0, 150, 100);                     // 藍 canton(左上 1/4)
  const sx = 75, sy = 50;                                                        // 青天白日中心
  fctx.fillStyle = "#fff";
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; fctx.beginPath(); fctx.moveTo(sx + Math.cos(a) * 40, sy + Math.sin(a) * 40); fctx.lineTo(sx + Math.cos(a + 0.135) * 18, sy + Math.sin(a + 0.135) * 18); fctx.lineTo(sx + Math.cos(a - 0.135) * 18, sy + Math.sin(a - 0.135) * 18); fctx.closePath(); fctx.fill(); }   // 12 道白光芒
  fctx.beginPath(); fctx.arc(sx, sy, 21, 0, 7); fctx.fillStyle = "#fff"; fctx.fill();      // 白日外輪
  fctx.beginPath(); fctx.arc(sx, sy, 18, 0, 7); fctx.fillStyle = "#003da5"; fctx.fill();   // 藍環
  fctx.beginPath(); fctx.arc(sx, sy, 15, 0, 7); fctx.fillStyle = "#fff"; fctx.fill();      // 白日內
  const flagTex = new THREE.CanvasTexture(fcv); flagTex.colorSpace = THREE.SRGBColorSpace;
  const fgeo = new THREE.PlaneGeometry(5, 3.2, 20, 6);   // 分段平面=可變形布旗(取代僵硬木板盒)
  const fl = new THREE.Mesh(fgeo, new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.82, side: THREE.DoubleSide, envMapIntensity: 0.5 }));
  fl.position.set(2.7, 12.4, -6); fl.castShadow = true; ROOT.add(fl);
  const fp = fgeo.attributes.position, fn = fp.count, fbz = new Float32Array(fn), fnx = new Float32Array(fn);
  for (let i = 0; i < fn; i++) { fbz[i] = fp.getZ(i); fnx[i] = (fp.getX(i) + 2.5) / 5; }   // fnx:0(貼旗桿端固定)→1(自由端擺最大)
  flagAnim = { geo: fgeo, fp, fbz, fnx, fn };
})();
function updateFlag(t) {   // 布旗隨風飄:自由端擺幅最大、旗桿端固定;兩頻疊加=飄動非僵硬
  if (!flagAnim) return; const a = flagAnim;
  for (let i = 0; i < a.fn; i++) { const f = a.fnx[i]; a.fp.setZ(i, a.fbz[i] + (Math.sin(t * 2.6 + f * 6.5) * 0.5 + Math.sin(t * 4.7 + f * 12) * 0.16) * f); }
  a.fp.needsUpdate = true; a.geo.computeVertexNormals();
}

/* ───────── 哨所(高崗哨) ───────── */
(function watchtower(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -0.6; ROOT.add(g);
  const LH = 10, wood = mat(0x7a5e3c, { roughness: 0.85 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.26, 0.32, LH, 8), wood, sx * 1.9, LH / 2, sz * 1.9, g);
  for (const sz of [-1, 1]) { const br = add(new THREE.BoxGeometry(0.16, 5.4, 0.16), wood, 0, 3.2, sz * 1.9, g); br.rotation.x = sz * 0.62; }
  for (const sx of [-1, 1]) { const br = add(new THREE.BoxGeometry(0.16, 5.4, 0.16), wood, sx * 1.9, 3.2, 0, g); br.rotation.z = sx * 0.62; }
  add(new THREE.BoxGeometry(5.2, 0.32, 5.2), wood, 0, LH, 0, g);
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(5.2, 0.8, 0.12), wood, 0, LH + 0.6, sz * 2.45, g);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.12, 0.8, 5.2), wood, sx * 2.45, LH + 0.6, 0, g);
  add(new THREE.BoxGeometry(4.6, 2.9, 4.6), matT(0xcfc09f, T.wall, 1.6, 1, { roughness: 0.9 }), 0, LH + 1.8, 0, g);
  add(new THREE.BoxGeometry(3.4, 1.3, 4.66), glassMat, 0, LH + 2.1, 0, g).castShadow = false;
  gableRoof(g, 5.0, 5.0, LH + 3.25, 1.8, 0.4);
})(-32, 4);

/* ───────── 靶場 ───────── */
function targetTex() {
  const S = 128, cv = document.createElement("canvas"); cv.width = cv.height = S; const c = cv.getContext("2d");
  c.fillStyle = "#efe7d2"; c.fillRect(0, 0, S, S);
  const cols = ["#efe7d2", "#2b2b2b", "#efe7d2", "#2b2b2b", "#b83f2c"];
  for (let i = 0; i < cols.length; i++) { c.beginPath(); c.arc(S / 2, S / 2, (S / 2) * (1 - i * 0.18), 0, 7); c.fillStyle = cols[i]; c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
(function range(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = -0.25; ROOT.add(g);
  add(new THREE.BoxGeometry(11, 0.4, 22), matT(0xb5a888, T.concrete, 2, 5, { roughness: 0.95 }), 0, 0.25, 0, g).castShadow = false;
  // 射擊位沙包
  for (let i = -1; i <= 1; i++) { add(new THREE.BoxGeometry(2.4, 0.8, 1.1), mat(0xc3ad82, { roughness: 1 }), i * 3, 0.7, 9, g).userData.surface = "sand"; add(new THREE.BoxGeometry(2.0, 0.7, 0.9), mat(0xb8a277, { roughness: 1 }), i * 3, 1.4, 9, g).userData.surface = "sand"; }
  const tm = new THREE.MeshStandardMaterial({ map: targetTex(), roughness: 0.92 });
  for (let i = 0; i < 3; i++) { add(new THREE.BoxGeometry(0.3, 3.4, 0.3), mat(0x6e5436), (i - 1) * 3, 1.7, -9.5, g); add(new THREE.BoxGeometry(2.1, 2.1, 0.18), tm, (i - 1) * 3, 2.9, -9.3, g); }
})(34, -2);

/* ───────── 計算所(觀測掩體 + 天線) ───────── */
(function fdc(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = 0.5; ROOT.add(g);
  add(new THREE.BoxGeometry(8, 3.6, 6.5), matT(0x6b6f42, T.wall, 2, 1, { roughness: 0.93 }), 0, 1.8, 0, g);
  for (let i = -2; i <= 2; i++) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(1.5, 0.6, 1.1), mat(0xc3ad82, { roughness: 1 }), i * 1.5, 3.9, sz * 2.5, g).userData.surface = "sand";
  add(new THREE.BoxGeometry(5, 1.0, 0.12), mat(0x10141a, { roughness: 0.3, metalness: 0.2, envMapIntensity: 1.4 }), 0, 2.3, 3.28, g).castShadow = false;
  add(new THREE.CylinderGeometry(0.07, 0.07, 6.5, 6), new THREE.MeshStandardMaterial({ color: 0x9aa0a4, metalness: 0.7, roughness: 0.4, envMapIntensity: 1.3 }), 2.6, 7, -1.8, g);
  const dish = add(new THREE.SphereGeometry(0.95, 18, 12, 0, 6.3, 0, 1.15), new THREE.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.5, roughness: 0.45, envMapIntensity: 1.4, side: THREE.DoubleSide }), -2.4, 5.0, -1.6, g); dish.rotation.set(1.0, 0.5, 0);
})(-22, 14);

/* ───────── 圍籬 + 燈柱 + 電線桿(細節密度) ───────── */
(function perimeter() {
  const postM = mat(0x9a958a, { metalness: 0.3, roughness: 0.6 });
  const R = 78;
  // 周界水泥樁 + 鐵絲
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R - 20;
    add(new THREE.BoxGeometry(0.4, 3, 0.4), postM, x, 1.5, z).castShadow = false;   // 周界樁不投影:陰影貼圖降載(影子貢獻低)
  }
  // 燈柱(暖色燈泡)
  const lampPos = [[18, 8], [-16, 6], [20, -24], [-14, -30], [6, -2]];
  for (const [x, z] of lampPos) {
    add(new THREE.CylinderGeometry(0.16, 0.2, 6, 8), postM, x, 3, z);
    add(new THREE.BoxGeometry(1.2, 0.3, 0.6), postM, x + 0.5, 6, z);
    const bulb = add(new THREE.SphereGeometry(0.32, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: new THREE.Color(0xffd98c), emissiveIntensity: 1.4, roughness: 0.4 }), x + 0.9, 5.85, z);
    bulb.castShadow = false;
    const pl = new THREE.PointLight(0xffd28a, 6, 14, 2); pl.position.set(x + 0.9, 5.7, z); ROOT.add(pl);
  }
})();

/* ───────── 樹(寫實層疊葉團) ───────── */
function tree(x, z, s) {
  add(new THREE.CylinderGeometry(0.22 * s, 0.32 * s, 2.4 * s, 7), mat(0x6e5436, { roughness: 0.95 }), x, 1.2 * s, z);
  const lm = mat(0x5a7a44, { roughness: 1, flatShading: true });
  add(new THREE.IcosahedronGeometry(2.0 * s, 1), lm, x, 3.6 * s, z);
  add(new THREE.IcosahedronGeometry(1.5 * s, 1), mat(0x6a8a50, { roughness: 1, flatShading: true }), x + 0.6 * s, 4.6 * s, z - 0.3 * s);
  add(new THREE.IcosahedronGeometry(1.3 * s, 1), lm, x - 0.7 * s, 4.4 * s, z + 0.4 * s);
}
tree(27, 21, 1.5); tree(-26, 18, 1.4); tree(48, -10, 1.6); tree(-48, -2, 1.4); tree(44, 30, 1.3); tree(-20, 27, 1.2);

/* ───────── 油桶(可擊爆) ───────── */
const OBSTACLES = [];   // 木箱/油桶 AABB:玩家+敵人都擋,掩體可躲(與建築 COLLIDERS 分開,LOS 不被低掩體擋)
const explosives = [];
for (const [x, z, col, boom] of [[10, 6, 0x7a4030, 1], [11.4, 6.6, 0x4a6a3e, 0], [9.2, 7.2, 0x7a4030, 1], [-14, -6, 0x7a4030, 1], [18, -10, 0x4a6a3e, 0], [-10, 8, 0x7a4030, 1], [22, 8, 0x7a4030, 1]]) {
  const bar = add(new THREE.CylinderGeometry(0.7, 0.7, 1.6, 18), new THREE.MeshStandardMaterial({ color: col, metalness: 0.5, roughness: 0.5, envMapIntensity: 1.1 }), x, 0.8, z);
  bar.userData.boom = !!boom; bar.userData.kind = "barrel"; explosives.push(bar);
  OBSTACLES.push([x - 0.7, x + 0.7, z - 0.7, z + 0.7]);
}

/* ───────── CS 風掩體木箱 ───────── */
function crate(x, z, s) { add(new THREE.BoxGeometry(s, s, s), matT(0x9b7a45, T.crate, 1, 1, { roughness: 0.85 }), x, s / 2, z).userData.surface = "wood"; OBSTACLES.push([x - s / 2, x + s / 2, z - s / 2, z + s / 2]); }
crate(4, 4, 1.7); crate(5.4, 2.6, 1.2); crate(3.4, 2.3, 1.0);
crate(-8, -12, 1.9); crate(-6.3, -12.7, 1.4);
crate(13, -14, 1.8); crate(14.5, -13.2, 1.2); crate(12.6, -12.4, 1.0);

/* ───────── 靜態立柱/樹/旗桿 碰撞(item 12:玩家+敵人都不可穿越實體立柱) ───────── */
function colBox(x, z, r) { OBSTACLES.push([x - r, x + r, z - r, z + r]); }
colBox(0, -6, 0.5);   // 操場旗桿
for (const [lx, lz] of [[18, 8], [-16, 6], [20, -24], [-14, -30], [6, -2]]) colBox(lx, lz, 0.42);   // 5 根燈柱
for (const [tx, tz, ts] of [[27, 21, 1.5], [-26, 18, 1.4], [48, -10, 1.6], [-48, -2, 1.4], [44, 30, 1.3], [-20, 27, 1.2]]) colBox(tx, tz, 0.36 * ts);   // 樹幹

/* ───────── 顧牛(EP40 夢中違和物件:軍營裡一頭牛,「我顧著牠不要亂跑,我也不要亂跑」) ───────── */
let cowTail = null, cowHead = null;
(function buildCow() {
  const cx = -14, cz = 18;
  const hide = mat(0xe9e1d2, { roughness: 0.92, envMapIntensity: 0.42 }), patch = mat(0x2c2823, { roughness: 0.96, envMapIntensity: 0.3 }), hoof = mat(0x191510, { roughness: 0.96 }), muz = mat(0xcea39a, { roughness: 0.72, envMapIntensity: 0.42 }), hornM = mat(0xcabf9e, { roughness: 0.6, metalness: 0.03 });   // 寫實沉穩:牛皮微 env rim、濕鼻頭低 roughness
  const root = new THREE.Group(); root.position.set(cx, 0, cz); root.rotation.y = 0.55; ROOT.add(root);
  const SPH = new THREE.SphereGeometry(0.5, 18, 14);   // 共用球,縮放成橢球=圓潤有機曲面(取代方塊機器牛)
  const el = (m, x, y, z, sx, sy, sz, p) => { const e = new THREE.Mesh(SPH, m); e.position.set(x, y, z); e.scale.set(sx, sy, sz); e.castShadow = e.receiveShadow = true; (p || root).add(e); return e; };
  const cyl = (m, x, y, z, rt, rb, h, p) => { const e = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), m); e.position.set(x, y, z); e.castShadow = e.receiveShadow = true; (p || root).add(e); return e; };
  el(hide, 0, 1.12, 0, 1.85, 0.98, 1.0);            // 桶身(橢球)
  el(hide, -0.05, 0.86, 0, 1.6, 0.6, 0.92);         // 下垂肚腩
  el(hide, 0.78, 1.16, 0, 1.05, 1.05, 1.04);        // 肩胸豐厚
  el(patch, 0.34, 1.42, 0.28, 0.85, 0.6, 0.5);      // 黑白斑(扁橢球貼身,邊緣柔)
  el(patch, -0.5, 1.2, -0.32, 0.78, 0.7, 0.5);
  el(patch, -0.1, 0.98, 0.46, 0.55, 0.55, 0.4);
  const neck = cyl(hide, 0.95, 1.46, 0, 0.27, 0.4, 0.78); neck.rotation.z = 0.55;   // 頸(錐台斜上=抬頭)
  cowHead = new THREE.Group(); cowHead.position.set(1.46, 1.62, 0); root.add(cowHead);   // 頭=Group(乾淨子空間;idle 繞此旋轉/微抬,base y=1.62)
  el(hide, 0, 0, 0, 0.62, 0.6, 0.54, cowHead);          // 頭橢球
  el(patch, 0.06, 0.16, 0, 0.22, 0.5, 0.4, cowHead);    // 額斑(白臉一道黑)
  el(muz, 0.36, -0.14, 0, 0.46, 0.4, 0.5, cowHead);     // 圓口鼻(牛招牌)
  el(patch, 0.44, -0.2, 0.11, 0.09, 0.08, 0.09, cowHead); el(patch, 0.44, -0.2, -0.11, 0.09, 0.08, 0.09, cowHead);   // 鼻孔
  for (const s of [-1, 1]) {
    const ear = el(hide, -0.08, 0.12, 0.32 * s, 0.34, 0.13, 0.24, cowHead); ear.rotation.x = 0.5 * s; ear.rotation.z = 0.12;   // 大垂耳(扁橢球)
    const horn = cyl(hornM, 0.06, 0.32, 0.14 * s, 0.025, 0.07, 0.26, cowHead); horn.rotation.z = -0.5 * s; horn.rotation.x = -0.22;   // 短角上彎
    el(patch, 0.26, 0.04, 0.2 * s, 0.09, 0.11, 0.08, cowHead);   // 眼(圓)
  }
  for (const [lx, lz] of [[0.62, 0.34], [0.62, -0.34], [-0.66, 0.34], [-0.66, -0.34]]) {
    cyl(hide, lx, 0.42, lz, 0.11, 0.15, 0.76); cyl(hoof, lx, 0.08, lz, 0.16, 0.13, 0.16);   // 腿(圓柱)+ 蹄
  }
  cowTail = cyl(hide, -0.95, 0.98, 0, 0.05, 0.07, 0.66); cowTail.rotation.z = 0.5;
  el(patch, 0, -0.4, 0, 0.32, 0.4, 0.32, cowTail);   // 尾穗
  OBSTACLES.push([cx - 1.5, cx + 1.1, cz - 1.0, cz + 1.0]);   // 牛碰撞(item 12:不可穿越)
})();

/* ───────── 夢中違和物件:反穿的學校外套(#3 名字藏起來;軍營裡一件學校外套=夢的錯位) ───────── */
(function buildJacket() {
  const jx = 12, jz = 16;
  const postM = mat(0x6b5236, { roughness: 0.9 });
  const root = new THREE.Group(); root.position.set(jx, 0, jz); root.rotation.y = -0.4; ROOT.add(root);   // 微轉,正面(敞開的前襟)朝操場那側的玩家
  const part = (geo, m, x, y, z, rx, rz) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; if (rz) e.rotation.z = rz; e.castShadow = true; root.add(e); return e; };
  // 曬衣架/單槓:兩柱 + 一橫桿,外套掛在橫桿上(整件攤開=最像外套的剪影)
  for (const s of [-1, 1]) part(new THREE.CylinderGeometry(0.06, 0.075, 2.3, 8), postM, s * 1.2, 1.15, 0, 0, 0);                   // 兩立柱
  part(new THREE.CylinderGeometry(0.045, 0.045, 2.7, 8), postM, 0, 2.26, 0, 0, Math.PI / 2);                                       // 橫桿(單槓)
  for (const s of [-1, 1]) part(new THREE.BoxGeometry(0.16, 0.1, 0.5), postM, s * 1.2, 2.18, 0);                                   // 柱頂托座
  const jOut = mat(0x232c46, { roughness: 0.95, envMapIntensity: 0.4 });   // 深藍校服(正面/領/袖口)
  const jLin = mat(0x9097a3, { roughness: 0.92, envMapIntensity: 0.4 });    // 內裡淺灰(反穿朝外=名字藏住)
  // 反穿外套掛橫桿:寬肩搭桿、身整片垂下、兩袖自然下垂、領/袖口翻出深藍
  part(new THREE.BoxGeometry(1.42, 0.18, 0.36), jLin, 0, 2.16, 0, 0, 0);                 // 肩線(跨橫桿,寬肩=外套輪廓最關鍵)
  part(new THREE.BoxGeometry(1.2, 0.16, 0.2), jOut, 0, 2.31, -0.08, 0, 0);               // 翻出的領(深藍,肩後上緣)
  part(new THREE.BoxGeometry(1.26, 1.12, 0.12), jLin, 0, 1.52, 0.05, 0, 0);              // 身(前襟敞開,灰內裡整片朝外垂下)
  part(new THREE.BoxGeometry(1.32, 0.46, 0.12), jLin, 0, 0.78, 0.06, 0, 0);              // 下襬(略外擴成 A 形)
  part(new THREE.BoxGeometry(0.06, 1.55, 0.14), jOut, 0, 1.46, 0.12, 0, 0);              // 前襟中線拉鍊(深藍細條,點出「正面」)
  for (const s of [-1, 1]) {
    part(new THREE.BoxGeometry(0.28, 1.0, 0.26), jLin, s * 0.7, 1.58, 0.0, 0, s * 0.14); // 袖(從肩端自然下垂,微外撇)
    part(new THREE.BoxGeometry(0.3, 0.18, 0.28), jOut, s * 0.84, 1.06, 0.0, 0, s * 0.05); // 袖口翻出(深藍)
  }
  OBSTACLES.push([jx - 1.35, jx + 1.35, jz - 0.4, jz + 0.4]);   // 衣架碰撞(item 12)
})();

/* ───────── 大兵日記(#4-④ 雋永連結:把拔親寫的韌性 + 連到 LM402/月台) ───────── */
(function buildDiary() {
  const dx = 6, dz = 8;
  const wood = mat(0x5f4730, { roughness: 0.9 }), paper = mat(0xe8e0cf, { roughness: 0.96, envMapIntensity: 0.35 });
  add(new THREE.BoxGeometry(1.1, 0.06, 0.72), wood, dx, 0.8, dz);                                       // 桌面
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.8, 0.08), wood, dx + sx * 0.48, 0.4, dz + sz * 0.28);  // 4 腿
  for (const s of [-1, 1]) { const pg = add(new THREE.BoxGeometry(0.34, 0.025, 0.46), paper, dx + s * 0.18, 0.85, dz); pg.rotation.z = s * 0.05; }   // 攤開兩頁
  add(new THREE.BoxGeometry(0.04, 0.05, 0.48), mat(0x3a2f24, { roughness: 0.85 }), dx, 0.86, dz);       // 書脊
  add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), mat(0x222), dx + 0.1, 0.88, dz + 0.1).rotation.set(0, 0, 1.3);  // 筆
})();

/* ───────── A1 奪命連環 call(EP29 斷聯期:壁掛公共電話,撥了又撥,訊號掉進時間的黑洞) ───────── */
(function buildPhone() {
  const px = 3, pz = -23.6;   // #4a:壁掛公共電話移到寢室前門外(門在 0,-25.5;偏右不擋門洞)
  const root = new THREE.Group(); root.position.set(px, 0, pz); root.rotation.y = Math.PI; ROOT.add(root);   // 話機正面朝寢室門那側(玩家出門即見)
  const part = (geo, m, x, y, z, rx, rz) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; if (rz) e.rotation.z = rz; e.castShadow = e.receiveShadow = true; root.add(e); return e; };
  const postM = mat(0x6b6258, { roughness: 0.85, metalness: 0.2 }), boxM = mat(0x37506b, { roughness: 0.75, metalness: 0.18 }), darkM = mat(0x1a1d22, { roughness: 0.6 }), metalM = mat(0x9aa0a6, { metalness: 0.5, roughness: 0.5 });
  part(new THREE.CylinderGeometry(0.09, 0.11, 2.0, 8), postM, 0, 1.0, 0);                       // 立柱
  part(new THREE.BoxGeometry(0.7, 0.92, 0.34), boxM, 0, 1.78, 0.08);                            // 話機箱體(壁掛機)
  part(new THREE.BoxGeometry(0.58, 0.4, 0.06), darkM, 0, 2.0, 0.27);                            // 面板(按鍵區深色)
  part(new THREE.BoxGeometry(0.5, 0.16, 0.05), metalM, 0, 2.22, 0.28);                          // 上方小聽筒架/顯示條
  part(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), darkM, -0.42, 1.78, 0.18, 0, 0.18);      // 掛在側邊的聽筒(垂下)
  part(new THREE.SphereGeometry(0.07, 10, 8), darkM, -0.46, 2.0, 0.18);                          // 聽筒上端
  part(new THREE.SphereGeometry(0.07, 10, 8), darkM, -0.38, 1.5, 0.18);                          // 聽筒下端
  OBSTACLES.push([px - 0.5, px + 0.5, pz - 0.4, pz + 0.4]);   // 電話柱碰撞(item 12)
})();

/* ───────── A2 機車紙條(EP40:妳在我機車上夾了一張紙條;停在軍營空地的機車,儀表上一張字條) ───────── */
(function buildMotorbike() {
  const mx = 20, mz = -4;   // 操場東側空地(避開外套 12,16 / 靶場 32,0)
  const root = new THREE.Group(); root.position.set(mx, 0, mz); root.rotation.y = -0.6; ROOT.add(root);   // 車身沿 x;前輪 +x、後輪 -x
  const part = (geo, m, x, y, z, rx, rz) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; if (rz) e.rotation.z = rz; e.castShadow = e.receiveShadow = true; root.add(e); return e; };
  const body = mat(0x5a2018, { roughness: 0.4, metalness: 0.45 }), tyre = mat(0x131313, { roughness: 0.95 }), chrome = mat(0xb9c0c6, { metalness: 0.85, roughness: 0.22, envMapIntensity: 1.5 }), metalM = mat(0x9aa0a6, { metalness: 0.55, roughness: 0.45 }), seatM = mat(0x1a1a1f, { roughness: 0.78 }), panelM = mat(0x1a1d22, { roughness: 0.55, metalness: 0.2 }), engineM = mat(0x6a6e72, { metalness: 0.6, roughness: 0.4 }), paper = mat(0xf2ecdd, { roughness: 0.96, envMapIntensity: 0.35 });
  // ── 前後輪(較大、含輪框/輻條暗示)──軸距拉長到 ±1.05 = 像真機車不像玩具
  for (const [wx, wd] of [[1.05, "前"], [-1.05, "後"]]) {
    part(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 20), tyre, wx, 0.38, 0, Math.PI / 2);            // 外胎(較大)
    part(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 16), chrome, wx, 0.38, 0, Math.PI / 2);           // 鋼圈
    part(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 10), metalM, wx, 0.38, 0, Math.PI / 2);          // 輪轂
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; part(new THREE.BoxGeometry(0.012, 0.62, 0.012), chrome, wx, 0.38, 0, 0, a); }   // 輻條(細,六根=有輻條感)
    part(new THREE.BoxGeometry(0.12, 0.04, 0.5), mat(0x3a3a3a, { roughness: 0.7, metalness: 0.3 }), wx, wd === "前" ? 0.62 : 0.7, 0);   // 擋泥板
  }
  // ── 引擎/車架 ──
  part(new THREE.BoxGeometry(0.62, 0.42, 0.5), engineM, 0.1, 0.5, 0);                                   // 引擎缸體(中段下方,機車的重心)
  for (const fz of [-0.18, 0.18]) part(new THREE.BoxGeometry(0.34, 0.34, 0.06), engineM, 0.1, 0.62, fz);   // 散熱鰭片暗示
  part(new THREE.BoxGeometry(1.5, 0.08, 0.12), chrome, 0, 0.82, 0);                                      // 上樑(車架主梁,拉長)
  // ── 油箱(機車最招牌的圓潤量體)──
  const tank = part(new THREE.CylinderGeometry(0.26, 0.3, 0.78, 16), body, 0.32, 0.96, 0, 0, Math.PI / 2); tank.scale.z = 0.78;   // 圓潤油箱(橫躺缸,沿 x)
  part(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), chrome, 0.32, 1.18, 0);                         // 油箱蓋
  // ── 座墊(長條雙人座,微後翹)──
  const seat = part(new THREE.BoxGeometry(0.78, 0.14, 0.34), seatM, -0.4, 0.98, 0); seat.rotation.z = -0.04;
  part(new THREE.BoxGeometry(0.2, 0.18, 0.34), seatM, -0.78, 1.04, 0);                                   // 後座微隆
  // ── 後土除/尾燈 + 排氣管(機車特徵)──
  part(new THREE.BoxGeometry(0.4, 0.1, 0.34), mat(0x2a2a2e, { roughness: 0.7 }), -1.0, 0.96, 0);         // 後土除
  part(new THREE.BoxGeometry(0.1, 0.08, 0.14), mat(0xb43a2a, { roughness: 0.5, emissive: new THREE.Color(0x3a0a06), emissiveIntensity: 0.5 }), -1.18, 0.96, 0);   // 尾燈
  part(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 12), chrome, -0.2, 0.42, 0.26, 0, Math.PI / 2);       // 排氣管(右側,沿 x 伸向後輪)
  part(new THREE.CylinderGeometry(0.075, 0.06, 0.18, 12), chrome, -0.85, 0.42, 0.26, 0, Math.PI / 2);    // 排氣尾段
  // ── 前叉 + 龍頭把手(高、有手把,不像玩具)──
  for (const fz of [-0.12, 0.12]) part(new THREE.CylinderGeometry(0.035, 0.035, 0.86, 8), chrome, 0.92, 0.8, fz, -0.32);   // 雙前叉
  part(new THREE.CylinderGeometry(0.04, 0.04, 0.62, 10), metalM, 0.78, 1.18, 0, Math.PI / 2);            // 龍頭橫桿
  for (const s of [-1, 1]) part(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), seatM, 0.78, 1.18, s * 0.31, Math.PI / 2);   // 兩側手把握把(黑膠)
  for (const s of [-1, 1]) { const mir = part(new THREE.SphereGeometry(0.05, 8, 6), chrome, 0.82, 1.32, s * 0.26); mir.scale.set(1, 1.4, 0.4); part(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), metalM, 0.8, 1.26, s * 0.26); }   // 後照鏡
  part(new THREE.CylinderGeometry(0.12, 0.1, 0.1, 14), chrome, 0.96, 1.06, 0, 0, Math.PI / 2);           // 圓大頭燈(老機車招牌)
  // ── 儀表台 + 夾著的紙條(微掀一角)──
  part(new THREE.BoxGeometry(0.3, 0.12, 0.28), panelM, 0.74, 1.14, 0);                                   // 儀表台
  for (const s of [-1, 1]) part(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), chrome, 0.74, 1.21, s * 0.07);   // 雙圓儀表(時速/轉速)
  // ── 側腳架(停著)──
  part(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), metalM, -0.35, 0.32, 0.4, 0, -0.5);
  const note = part(new THREE.BoxGeometry(0.24, 0.012, 0.18), paper, 0.74, 1.22, 0); note.rotation.x = -0.5; note.rotation.z = 0.12;   // 儀表上夾的字條(掀起一角)
  OBSTACLES.push([mx - 1.3, mx + 1.3, mz - 0.6, mz + 0.6]);   // 機車碰撞(item 12;軸距加長後足跡略大)
})();

/* ───────── A3 伯達樓轉角(EP13:傍晚站在伯達樓的轉角)─────────
   #4b:移除原本獨立懸空的 L 形牆角(看起來怪)。互動點 CORNER_POS 改錨在真實建築的外牆角
   (中山室前左外角,世界 ≈(11.5,27.5)),只在那面牆角掛一面小門牌當視覺暗示,不再有浮空牆。 */
(function buildCornerSign() {
  // 中山室(16,24) W9 D7:前牆 z=27.5、左牆 x=11.5 → 外角(11.5,27.5)。在角柱外側貼一面 EP13 門牌。
  const signM = mat(0x2c3a4f, { roughness: 0.8 }), frameM = mat(0x1a1d22, { roughness: 0.7 });
  add(new THREE.BoxGeometry(0.06, 0.5, 0.42), frameM, 11.5 - 0.18, 2.1, 27.5 - 0.5);   // 牌框(掛中山室左牆外側)
  add(new THREE.BoxGeometry(0.04, 0.36, 0.3), signM, 11.5 - 0.2, 2.1, 27.5 - 0.5);     // 小門牌(暗示某棟樓的轉角,貼在真實牆角=不浮空)
})();

/* ───────── A4 登登登的 7 秒(EP7:MSN 隱身上線等妳 7 秒後現身;辦公桌上一台舊電腦/終端機) ───────── */
(function buildTerminal() {
  const tx = -10.5, tz = -32.4;   // #4a:舊電腦移進寢室遠端「班長室」內(貼後牆,螢幕朝 +Z 房內)
  const root = new THREE.Group(); root.position.set(tx, 0, tz); ROOT.add(root);   // 不旋轉,桌+機件同子空間貼地
  const part = (geo, m, x, y, z, rx) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; e.castShadow = e.receiveShadow = true; root.add(e); return e; };
  const wood = mat(0x5f4730, { roughness: 0.9 }), casing = mat(0xd9d2c2, { roughness: 0.7 }), screenFrame = mat(0xb7b1a4, { roughness: 0.65 }), screen = mat(0x10202a, { roughness: 0.35, metalness: 0.1 }), keyM = mat(0xc7c1b3, { roughness: 0.8 });
  part(new THREE.BoxGeometry(1.5, 0.07, 0.9), wood, 0, 0.82, 0);                                  // 桌面(頂 y≈0.855)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(new THREE.BoxGeometry(0.08, 0.82, 0.08), wood, sx * 0.66, 0.41, sz * 0.36);  // 4 桌腿(底 y=0)
  part(new THREE.BoxGeometry(0.78, 0.62, 0.62), screenFrame, -0.1, 1.18, -0.12);                 // 大頭 CRT 螢幕殼(舊電腦)
  part(new THREE.BoxGeometry(0.6, 0.46, 0.04), screen, -0.1, 1.2, 0.2);                          // 螢幕面(深藍黑=隱身上線那種冷光)
  part(new THREE.BoxGeometry(0.6, 0.12, 0.28), keyM, 0.0, 0.92, 0.28, -0.05);                    // 鍵盤(桌面上)
  part(new THREE.BoxGeometry(0.5, 0.5, 0.24), casing, 0.62, 0.6, -0.1);                          // 主機箱(立在桌側)
  OBSTACLES.push([tx - 0.85, tx + 0.85, tz - 0.5, tz + 0.5]);   // 書桌碰撞(item 12)
})();

/* ───────── 可進入建築(中山室 / 用餐大廳):四壁留前門缺口 + 地板 + 平頂 + 可破窗 ─────────
   toni r14#5:不是實心盒(barracks),是能走進去的房間。前牆切成兩段留 ≥2.4 寬門洞,
   牆段各自加 COLLIDERS AABB(走得過門、撞不穿牆)。室內偏暗,門口明亮=對比。
   座標:中山室(16,24) 門開口朝 +Z(對著 z=31 的玩家出生點,玩家面 -Z 走進門);用餐大廳(-2,26) 在旁。W9 H3.6 D7。 */
const glassPanes = [];   // 可破玻璃 mesh(userData.glass=true);被 shootHit/meleeHit 命中→碎
const ROOM_COLLIDERS = [];   // 可進入房間的牆段 AABB(此處建,COLLIDERS 在檔尾才宣告→先收集再 spread 進去)
function signTexture(text) {   // 把告示文字畫到 canvas → CanvasTexture(深底淺字 + 細框,門外讀得清)
  const c = document.createElement("canvas"); c.width = 320; c.height = 140;
  const x = c.getContext("2d");
  x.fillStyle = "#1c1a12"; x.fillRect(0, 0, 320, 140);                                  // 深底牌
  x.strokeStyle = "#9a8c5a"; x.lineWidth = 6; x.strokeRect(9, 9, 302, 122);             // 黃銅細框
  x.fillStyle = "#f1ead2"; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = "bold 76px 'Songti SC','STKaiti',serif";                                     // 大字楷/宋體
  x.shadowColor = "rgba(0,0,0,0.6)"; x.shadowBlur = 4;
  x.fillText(text, 160, 78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function roomBuilding(cx, cz, ry, label, signText) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = ry; ROOT.add(g);
  const W = 9, H = 3.6, D = 7, TH = 0.3, DOOR = 2.6;   // DOOR 門洞寬(>2.2,含 PLAYER_R 走得過)
  const wallM = matT(0xb9ac8c, T.wall, 2.4, 1, { roughness: 0.93 });   // 軍綠偏卡其風化牆(同 barracks 調性)
  const trimM = mat(0x6f6453, { roughness: 0.72 });
  // 地板(室內,壓低)
  add(new THREE.BoxGeometry(W, 0.12, D), matT(0x8d8064, T.concrete, 2, 2, { roughness: 0.95 }), 0, 0.06, 0, g).castShadow = false;
  // 後牆(整片)+ 左右側牆(整片)
  add(new THREE.BoxGeometry(W, H, TH), wallM, 0, H / 2, -D / 2, g);
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(TH, H, D), wallM, sx * (W / 2 - TH / 2), H / 2, 0, g);
  // 前牆切兩段留門洞(門朝 g 的 +Z 方向=本地正面)
  const segW = (W - DOOR) / 2;
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(segW, H, TH), wallM, sx * (DOOR / 2 + segW / 2), H / 2, D / 2 - TH / 2, g);
  add(new THREE.BoxGeometry(DOOR + 0.4, 0.5, TH + 0.1), trimM, 0, H - 0.25, D / 2 - TH / 2, g);   // 門楣(門洞上方過梁,不擋通行)
  // 平頂(略外伸)+ 屋脊封簷
  add(new THREE.BoxGeometry(W + 0.5, 0.3, D + 0.5), matT(0x8f8470, T.wall, 3, 2, { roughness: 0.9 }), 0, H + 0.1, 0, g);
  add(new THREE.BoxGeometry(W + 0.7, 0.18, 0.18), trimM, 0, H + 0.02, D / 2 + 0.25, g).castShadow = false;
  add(new THREE.BoxGeometry(W + 0.4, 0.6, D + 0.4), mat(0xbcae8c), 0, 0.32, 0, g).receiveShadow = true;   // 牆基
  // 窗(框 + 可破玻璃):後牆兩扇 + 兩側牆各一扇
  const fm = mat(0x8a8170, { roughness: 0.8 });
  function win(lx, ly, lz, rot) {
    const fr = add(new THREE.BoxGeometry(1.9, 1.5, 0.16), fm, lx, ly, lz, g); fr.rotation.y = rot; fr.castShadow = false;
    const gp = add(new THREE.BoxGeometry(1.5, 1.1, 0.1), glassMat, lx, ly, lz, g); gp.rotation.y = rot; gp.castShadow = false;   // add() 已把 gp 掛進 g
    gp.userData.glass = true; gp.userData.broken = false; gp.userData.shardPos = new THREE.Vector3();
    gp.updateWorldMatrix(true, false); gp.getWorldPosition(gp.userData.shardPos);   // 記世界座標(碎屑噴發位置 fallback)
    glassPanes.push(gp);
  }
  win(-2.2, 1.95, -D / 2 + 0.06, 0); win(2.2, 1.95, -D / 2 + 0.06, 0);                 // 後牆兩扇
  win(-W / 2 + 0.06, 1.95, 0, Math.PI / 2); win(W / 2 - 0.06, 1.95, 0, Math.PI / 2);   // 兩側牆各一扇
  // 門牌(本地 +Z 正面,門洞旁)
  const plateM = mat(0xc7bb8e, { roughness: 0.85, emissive: new THREE.Color(0x140f04), emissiveIntensity: 0.25 });
  add(new THREE.BoxGeometry(1.3, 0.5, 0.1), mat(0x332c22, { roughness: 0.7 }), -DOOR / 2 - segW / 2, H - 0.6, D / 2 + 0.04, g).castShadow = false;
  add(new THREE.BoxGeometry(1.06, 0.34, 0.12), plateM, -DOOR / 2 - segW / 2, H - 0.6, D / 2 + 0.06, g).castShadow = false;
  // 外掛告示牌(門楣上方、本地 +Z 正面;玩家從門外讀得到名稱)— 深底淺字 plane,不擋門洞
  if (signText) {
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture(signText), toneMapped: false });
    add(new THREE.BoxGeometry(1.26, 0.54, 0.06), mat(0x0f0d09, { roughness: 0.8 }), 0, H - 0.12, D / 2 + 0.05, g).castShadow = false;   // 牌框/背板(門楣上方小尺寸,不擋視野不衝 HUD)
    const sp = add(new THREE.PlaneGeometry(1.12, 0.44), signMat, 0, H - 0.12, D / 2 + 0.09, g); sp.castShadow = false; sp.receiveShadow = false;   // 文字面朝門外
  }
  // 室內陳設(廉價 box/cylinder,全靠後牆/側牆,不擋門洞=本地 +Z 中段、不擋走道、不碰 NPC@local(0,-2.4))
  (function interior() {
    const isDining = signText === "餐廳";
    const woodM = mat(0x7a5d38, { roughness: 0.9 }), seatM = mat(0x4a4034, { roughness: 0.85 });
    if (isDining) {   // 用餐大廳:兩側各一張長餐桌 + 長板凳(靠側牆,中央走道與後牆 NPC 留空)
      for (const s of [-1, 1]) {
        const tx = s * (W / 2 - 1.2);
        add(new THREE.BoxGeometry(1.0, 0.08, 3.4), woodM, tx, 0.78, 0.4, g);                         // 桌面
        for (const lz of [-1.4, 1.4]) for (const ls of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.74, 0.08), woodM, tx + ls * 0.4, 0.39, 0.4 + lz, g);   // 四桌腳
        for (const bs of [-1, 1]) { add(new THREE.BoxGeometry(0.28, 0.06, 3.4), seatM, tx + bs * 0.75, 0.44, 0.4, g); add(new THREE.BoxGeometry(0.06, 0.42, 3.2), seatM, tx + bs * 0.95, 0.21, 0.4, g); }   // 兩側長板凳 + 凳腳板
      }
      add(new THREE.BoxGeometry(2.6, 1.2, 0.06), mat(0xb9ac8c, { roughness: 0.9 }), -W / 2 + 0.2, 2.2, -D / 2 + 1.0, g).rotation.y = Math.PI / 2;   // 側牆菜單/公告板
    } else {   // 中山室:後牆標語板 + 側牆長椅 + 小邊桌(NPC 在 local(0,-2.4),陳設靠角落)
      add(new THREE.BoxGeometry(3.6, 1.3, 0.08), mat(0xc7402e, { roughness: 0.85, emissive: new THREE.Color(0x2a0a06), emissiveIntensity: 0.3 }), -2.4, 2.3, -D / 2 + 0.12, g);   // 後牆標語紅板
      add(new THREE.BoxGeometry(3.4, 1.1, 0.04), mat(0xe8e0cc, { roughness: 0.9 }), -2.4, 2.3, -D / 2 + 0.16, g);                                    // 標語白底(留給字)
      for (const s of [-1, 1]) {   // 兩側牆各一張長椅(沿側牆,貼牆不擋走道)
        const bx = s * (W / 2 - 0.55);
        add(new THREE.BoxGeometry(0.5, 0.08, 2.2), woodM, bx, 0.46, -0.6, g);                         // 椅面
        add(new THREE.BoxGeometry(0.5, 0.5, 0.08), seatM, bx, 0.7, -1.6, g);                          // 椅背
        for (const lz of [-1.3, 0.9]) add(new THREE.BoxGeometry(0.42, 0.42, 0.1), woodM, bx, 0.23, -0.6 + lz, g);   // 椅腳板
      }
      add(new THREE.CylinderGeometry(0.4, 0.4, 0.7, 12), woodM, W / 2 - 0.7, 0.42, 1.8, g);            // 角落小圓邊桌
      add(new THREE.CylinderGeometry(0.46, 0.46, 0.06, 12), seatM, W / 2 - 0.7, 0.78, 1.8, g);         // 桌面
    }
  })();
  // 室內昏暖燈(門口外亮 vs 室內暗的對比;餐廳/中山室都暖一階,讓陳設浮出)
  const il = new THREE.PointLight(0xffcf94, 2.6, 9, 2); il.position.set(0, H - 0.6, 0); g.add(il);
  // 前牆兩段 + 後牆 + 兩側牆:各自 AABB(世界座標;這兩棟 ry=0 不旋轉,直接用本地→世界平移)
  for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (DOOR / 2 + segW / 2) - segW / 2, cx + sx * (DOOR / 2 + segW / 2) + segW / 2, cz + D / 2 - TH, cz + D / 2]);   // 前牆兩段
  ROOM_COLLIDERS.push([cx - W / 2, cx + W / 2, cz - D / 2, cz - D / 2 + TH]);   // 後牆
  for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (W / 2 - TH / 2) - TH / 2, cx + sx * (W / 2 - TH / 2) + TH / 2, cz - D / 2, cz + D / 2]);   // 兩側牆
  g.userData.label = label;
  return g;
}
roomBuilding(16, 24, 0, "中山室", "中山室");      // 門開口朝 +Z 對玩家出生點(玩家在 z=31 面 -Z 走進門);告示「中山室」

/* ───────── 用餐大廳(可容 ~100 人的大食堂):前門 + 後門(永遠敞開的門洞,對牆相向)─────────
   toni #0b:把原本小用餐大廳放大成真食堂。17 張長桌,每桌兩側各一條長板凳、每凳坐 3 →
   每桌 6 人 ×17 = 102 座(≈100)。整齊行列留走道,不擋兩門也不擋連長(-2,23.6)。
   桌凳 LOW-poly 純 box、貼地。後牆此版也切門洞 → ROOM_COLLIDERS 收進更大的足跡。 */
function diningHall(cx, cz, signText) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); ROOT.add(g);
  const W = 18, H = 4.0, D = 14, TH = 0.3, DOOR = 2.8;   // 大食堂:前(+Z)後(-Z)各一門洞
  const wallM = matT(0xb9ac8c, T.wall, 4.5, 1.1, { roughness: 0.93 });
  const trimM = mat(0x6f6453, { roughness: 0.72 });
  add(new THREE.BoxGeometry(W, 0.12, D), matT(0x8d8064, T.concrete, 4, 3, { roughness: 0.95 }), 0, 0.06, 0, g).castShadow = false;   // 地板
  // 左右側牆(整片)
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(TH, H, D), wallM, sx * (W / 2 - TH / 2), H / 2, 0, g);
  // 前牆(+Z)與後牆(-Z)各切兩段留門洞
  const segW = (W - DOOR) / 2;
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) add(new THREE.BoxGeometry(segW, H, TH), wallM, sx * (DOOR / 2 + segW / 2), H / 2, sz * (D / 2 - TH / 2), g);
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(DOOR + 0.4, 0.5, TH + 0.1), trimM, 0, H - 0.25, sz * (D / 2 - TH / 2), g);   // 前後門楣
  // 平頂 + 牆基
  add(new THREE.BoxGeometry(W + 0.5, 0.3, D + 0.5), matT(0x8f8470, T.wall, 5, 4, { roughness: 0.9 }), 0, H + 0.1, 0, g);
  add(new THREE.BoxGeometry(W + 0.4, 0.6, D + 0.4), mat(0xbcae8c), 0, 0.32, 0, g).receiveShadow = true;
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(W + 0.7, 0.18, 0.18), trimM, 0, H + 0.02, sz * (D / 2 + 0.25), g).castShadow = false;   // 前後封簷
  // 側牆窗(框 + 可破玻璃,各兩扇)
  const fm = mat(0x8a8170, { roughness: 0.8 });
  function win(lx, lz, rot) {
    const fr = add(new THREE.BoxGeometry(1.9, 1.5, 0.16), fm, lx, 2.1, lz, g); fr.rotation.y = rot; fr.castShadow = false;
    const gp = add(new THREE.BoxGeometry(1.5, 1.1, 0.1), glassMat, lx, 2.1, lz, g); gp.rotation.y = rot; gp.castShadow = false;
    gp.userData.glass = true; gp.userData.broken = false; gp.userData.shardPos = new THREE.Vector3();
    gp.updateWorldMatrix(true, false); gp.getWorldPosition(gp.userData.shardPos); glassPanes.push(gp);
  }
  for (const lz of [-3.4, 3.4]) { win(-W / 2 + 0.06, lz, Math.PI / 2); win(W / 2 - 0.06, lz, Math.PI / 2); }   // 兩側牆各兩扇
  // 告示牌(前門 +Z 門楣上方)
  if (signText) {
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture(signText), toneMapped: false });
    add(new THREE.BoxGeometry(1.5, 0.6, 0.06), mat(0x0f0d09, { roughness: 0.8 }), 0, H - 0.1, D / 2 + 0.05, g).castShadow = false;
    add(new THREE.PlaneGeometry(1.34, 0.5), signMat, 0, H - 0.1, D / 2 + 0.09, g).castShadow = false;
  }
  // ── 餐桌 + 長板凳(17 桌,每桌兩條長凳、每凳 3 人 = 6/桌 ×17 = 102 座)──
  // 桌長(沿 z)2.2,桌寬(沿 x)0.9;兩側長凳貼桌身,凳長 = 桌長(3 人並坐)。
  // 行列:5 直行(x)× 4 橫列(z)= 20 格,扣 3 格(中央前/後門通道 + 連長後牆區)= 17 桌。
  const woodM = mat(0x7a5d38, { roughness: 0.9 }), seatM = mat(0x4a4034, { roughness: 0.85 });
  const TLEN = 2.2, TWID = 0.9, BEN_W = 0.32, BEN_GAP = 0.62;   // 桌長/桌寬/凳寬/桌中心到凳中心
  function unit(ux, uz) {   // 一桌(貼地:桌腿底 y=0)+ 兩側各一條 3 人長凳
    add(new THREE.BoxGeometry(TWID, 0.08, TLEN), woodM, ux, 0.76, uz, g);                                   // 桌面(頂 y≈0.80)
    for (const lz of [-1, 1]) for (const lx of [-1, 1]) add(new THREE.BoxGeometry(0.08, 0.72, 0.08), woodM, ux + lx * (TWID / 2 - 0.08), 0.36, uz + lz * (TLEN / 2 - 0.12), g);   // 四桌腿(底 y=0)
    for (const bs of [-1, 1]) {
      add(new THREE.BoxGeometry(BEN_W, 0.06, TLEN), seatM, ux + bs * BEN_GAP, 0.44, uz, g);                 // 凳面(頂 y=0.47)
      for (const lz of [-1, 1]) add(new THREE.BoxGeometry(BEN_W, 0.41, 0.06), seatM, ux + bs * BEN_GAP, 0.205, uz + lz * (TLEN / 2 - 0.18), g);   // 兩端凳腳板(底 y=0)
    }
  }
  // 左右兩塊桌陣,中央 x≈0 整條縱向走道留空(前門↔後門↔連長 z=-2.4 都在此縱軸,絕不放桌)。
  // 左塊 x:-6.6 / -3.4(2 直行)、右塊 x:3.4 / 6.6(2 直行);橫列 z:-4.2 / -1.6 / 1.0 / 3.6 / 5.0?
  // 4 直行 × 4 橫列 = 16 桌 + 左塊補 1 桌 = 17。橫向走道留在列與列之間(行距 2.6 > 桌長 2.2)。
  const leftCols = [-6.6, -3.4], rightCols = [3.4, 6.6], rows = [-4.0, -1.4, 1.2, 3.8];
  let placed = 0;
  for (const uz of rows) for (const ux of [...leftCols, ...rightCols]) { unit(ux, uz); placed++; }   // 16 桌
  unit(-6.6, 5.0); placed++;   // 第 17 桌(左塊最前緣多補一桌;靠側牆不擋中央走道與前門)
  // #0c:左右兩塊桌陣各一個合併 AABB(玩家/敵人不可穿桌;中央 x∈world[-4.5,0.5] 縱向走道 + 前後門全留空可通行)
  const HALF = 0.78, ZH = 1.1;   // unit 桌+凳半寬 / 半長
  OBSTACLES.push([cx + (-6.6 - HALF), cx + (-3.4 + HALF), cz + (-4.0 - ZH), cz + (5.0 + ZH)]);   // 左塊(含第 17 桌)
  OBSTACLES.push([cx + (3.4 - HALF), cx + (6.6 + HALF), cz + (-4.0 - ZH), cz + (3.8 + ZH)]);      // 右塊
  // 室內昏暖燈(兩盞,大空間)
  for (const lz of [-3, 3]) { const il = new THREE.PointLight(0xffcf94, 2.2, 11, 2); il.position.set(0, H - 0.7, lz); g.add(il); }
  // ── ROOM_COLLIDERS:側牆(整片)+ 前後牆各兩段(留門洞)──
  for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (W / 2 - TH / 2) - TH / 2, cx + sx * (W / 2 - TH / 2) + TH / 2, cz - D / 2, cz + D / 2]);   // 兩側牆
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (DOOR / 2 + segW / 2) - segW / 2, cx + sx * (DOOR / 2 + segW / 2) + segW / 2, cz + sz * (D / 2 - TH / 2) - TH / 2, cz + sz * (D / 2 - TH / 2) + TH / 2]);   // 前後牆各兩段
  g.userData.label = "用餐大廳"; g.userData.tables = placed;
  return g;
}
diningHall(-2, 26, "餐廳");      // 中山室旁;前後門對牆;告示「餐廳」;17 桌 ×6 座 ≈ 100

/* ───────── 寢室(原 barracks(0,-30) 改可進入)─────────
   #4a:中空可進入,前(+Z)後(-Z)門洞永遠敞開。沿兩長牆排上下兩層大通鋪。
   遠端(-X)以隔牆切出小「班長室」(自帶門洞),舊終端機 TERMINAL 擺班長室內。電話 PHONE 擺寢室門外。 */
function buildBunkRoom(cx, cz, signText) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); ROOT.add(g);
  const W = 26, H = 4.0, D = 9, TH = 0.3, DOOR = 2.6;
  const wallM = matT(0xb9ac8c, T.wall, 6, 1.1, { roughness: 0.93 });
  const trimM = mat(0x6f6453, { roughness: 0.72 });
  add(new THREE.BoxGeometry(W, 0.12, D), matT(0x8d8064, T.concrete, 5, 2, { roughness: 0.95 }), 0, 0.06, 0, g).castShadow = false;   // 地板
  for (const sx of [-1, 1]) add(new THREE.BoxGeometry(TH, H, D), wallM, sx * (W / 2 - TH / 2), H / 2, 0, g);   // 左右端牆(整片)
  const segW = (W - DOOR) / 2;
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) add(new THREE.BoxGeometry(segW, H, TH), wallM, sx * (DOOR / 2 + segW / 2), H / 2, sz * (D / 2 - TH / 2), g);   // 前後牆各兩段(留門洞)
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(DOOR + 0.4, 0.5, TH + 0.1), trimM, 0, H - 0.25, sz * (D / 2 - TH / 2), g);   // 前後門楣
  add(new THREE.BoxGeometry(W + 0.5, 0.3, D + 0.5), matT(0x8f8470, T.wall, 6, 3, { roughness: 0.9 }), 0, H + 0.1, 0, g);   // 平頂
  add(new THREE.BoxGeometry(W + 0.4, 0.6, D + 0.4), mat(0xbcae8c), 0, 0.32, 0, g).receiveShadow = true;   // 牆基
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(W + 0.7, 0.18, 0.18), trimM, 0, H + 0.02, sz * (D / 2 + 0.25), g).castShadow = false;
  // 側牆窗(前後牆段上的小窗:框 + 可破玻璃,各兩扇)
  const fm = mat(0x8a8170, { roughness: 0.8 });
  function win(lx, lz) {
    const fr = add(new THREE.BoxGeometry(1.9, 1.4, 0.16), fm, lx, 2.4, lz, g); fr.castShadow = false;
    const gp = add(new THREE.BoxGeometry(1.5, 1.0, 0.1), glassMat, lx, 2.4, lz, g); gp.castShadow = false;
    gp.userData.glass = true; gp.userData.broken = false; gp.userData.shardPos = new THREE.Vector3();
    gp.updateWorldMatrix(true, false); gp.getWorldPosition(gp.userData.shardPos); glassPanes.push(gp);
  }
  for (const sz of [-1, 1]) { win(6.0, sz * (D / 2 - 0.06)); win(-6.0, sz * (D / 2 - 0.06)); }
  // 告示牌(前門 +Z 門楣上方)
  if (signText) {
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture(signText), toneMapped: false });
    add(new THREE.BoxGeometry(1.4, 0.56, 0.06), mat(0x0f0d09, { roughness: 0.8 }), 4.5, H - 0.1, D / 2 + 0.05, g).castShadow = false;
    add(new THREE.PlaneGeometry(1.24, 0.46), signMat, 4.5, H - 0.1, D / 2 + 0.09, g).castShadow = false;
  }
  // ── 班長室隔牆(local x=-8,沿 z;靠後牆側留門洞)── 班長室佔 local x∈[-13,-8]
  const PARTX = -8;
  add(new THREE.BoxGeometry(TH, H, D - DOOR - 0.6), wallM, PARTX, H / 2, -(DOOR / 2 + 0.3 + (D - DOOR - 0.6) / 2) + D / 2, g);   // 隔牆(留 +Z 側門洞給人進班長室)
  add(new THREE.BoxGeometry(TH + 0.1, 0.5, DOOR), trimM, PARTX, H - 0.25, D / 2 - DOOR / 2 - 0.3, g).castShadow = false;   // 隔牆門楣
  add(new THREE.PlaneGeometry(1.0, 0.34), new THREE.MeshBasicMaterial({ map: signTexture("班長室"), toneMapped: false }), PARTX + 0.18, 2.5, D / 2 - DOOR / 2 - 0.3, g).rotation.y = Math.PI / 2;   // 班長室門牌(朝寢室側)
  // ── 上下兩層大通鋪(LOW-poly 鋪架 + 床墊),沿前後長牆排;避開門洞 x∈[-1.3,1.3] 與班長室 x<-7.7 ──
  const frameM = mat(0x6b6f52, { roughness: 0.6, metalness: 0.25 }), mattM = mat(0xb9b09a, { roughness: 0.95 }), pillowM = mat(0xe6e0d2, { roughness: 0.95 });
  function bunk(bx, bz, faceZ) {   // faceZ=+1 床頭朝 +Z(貼後牆,開口朝室內 -Z);床長沿 x
    const BL = 2.0, BW = 1.0;
    for (const lev of [0.5, 1.9]) {   // 下鋪 y=0.5、上鋪 y=1.9
      add(new THREE.BoxGeometry(BL, 0.1, BW), frameM, bx, lev, bz, g);                 // 床板
      add(new THREE.BoxGeometry(BL - 0.1, 0.14, BW - 0.1), mattM, bx, lev + 0.12, bz, g);   // 床墊
      add(new THREE.BoxGeometry(0.4, 0.12, BW - 0.2), pillowM, bx - BL / 2 + 0.3, lev + 0.2, bz, g);   // 枕頭
    }
    for (const lx of [-1, 1]) for (const lz of [-1, 1]) add(new THREE.BoxGeometry(0.09, 2.3, 0.09), frameM, bx + lx * (BL / 2 - 0.1), 1.15, bz + lz * (BW / 2 - 0.1), g);   // 四立柱(底 y=0)
    OBSTACLES.push([cx + bx - BL / 2, cx + bx + BL / 2, cz + bz - BW / 2, cz + bz + BW / 2]);   // #0c:每張通鋪 AABB(玩家/敵人不可穿;貼牆不擋中央走道與門洞)
  }
  // 後牆側(local z<0)一排、前牆側(local z>0)一排,各排沿 x 多張;床頭貼牆
  for (const bx of [-5.5, -2.5, 2.5, 5.5]) { bunk(bx, -D / 2 + 0.7, -1); bunk(bx, D / 2 - 0.7, 1); }   // 寢室主區 8 組(避開中央門洞 x≈0)
  bunk(10.5, -D / 2 + 0.7, -1); bunk(10.5, D / 2 - 0.7, 1);   // 右端再兩組
  // ── 班長室內:舊終端機(TERMINAL prop 在此座標重建)+ 一張單人床 ──
  bunk(-10.5, -D / 2 + 0.7, -1);   // 班長單人鋪
  // 室內昏暖燈
  const il = new THREE.PointLight(0xffcf94, 2.4, 13, 2); il.position.set(2, H - 0.7, 0); g.add(il);
  const il2 = new THREE.PointLight(0xffcf94, 1.8, 8, 2); il2.position.set(-10.5, H - 0.8, 0); g.add(il2);   // 班長室燈
  // ── ROOM_COLLIDERS:左右端牆 + 前後牆各兩段(留門洞)+ 班長室隔牆 ──
  for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (W / 2 - TH / 2) - TH / 2, cx + sx * (W / 2 - TH / 2) + TH / 2, cz - D / 2, cz + D / 2]);   // 左右端牆
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) ROOM_COLLIDERS.push([cx + sx * (DOOR / 2 + segW / 2) - segW / 2, cx + sx * (DOOR / 2 + segW / 2) + segW / 2, cz + sz * (D / 2 - TH / 2) - TH / 2, cz + sz * (D / 2 - TH / 2) + TH / 2]);   // 前後牆各兩段
  // 班長室隔牆 collider(後牆側那段,留 +Z 門洞)
  const partLen = D - DOOR - 0.6, partCz = cz + (-(DOOR / 2 + 0.3 + partLen / 2) + D / 2);
  ROOM_COLLIDERS.push([cx + PARTX - TH / 2, cx + PARTX + TH / 2, partCz - partLen / 2, partCz + partLen / 2]);
  g.userData.label = "寢室";
  return g;
}
buildBunkRoom(0, -30, "寢室");

/* ───────── 澡堂(原 barracks(-30,-16) 改可進入)─────────
   #4a:無門(開放入口,+X 側整面敞開)。室內一座大冷水池(矮長方水槽 + 冷藍水面),簡樸 —
   無蓮蓬頭、無熱水設備(三分鐘戰鬥澡的冷水池)。盥洗台+鏡子 WASH 擺澡堂入口。 */
function buildBathhouse(cx, cz, signText) {
  const g = new THREE.Group(); g.position.set(cx, 0, cz); ROOT.add(g);
  const W = 9, H = 3.8, D = 22, TH = 0.3;   // 沿 z 長棟(對齊原 barracks(-30,-16) 旋轉足跡)
  const wallM = matT(0x9aa39a, T.wall, 2.4, 3, { roughness: 0.9 });   // 澡堂牆偏冷灰(磁磚感)
  const trimM = mat(0x5f6358, { roughness: 0.7 });
  add(new THREE.BoxGeometry(W, 0.12, D), matT(0x808a82, T.concrete, 2, 5, { roughness: 0.9 }), 0, 0.06, 0, g).castShadow = false;   // 地板(冷灰磁磚)
  // 後牆(-X 整片)+ 前後端牆(±Z 整片);+X 側整面敞開(入口),僅留兩段短矮牆框住開口
  add(new THREE.BoxGeometry(TH, H, D), wallM, -(W / 2 - TH / 2), H / 2, 0, g);   // 西牆(整片)
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(W, H, TH), wallM, 0, H / 2, sz * (D / 2 - TH / 2), g);   // 南北端牆(整片)
  // +X 入口側:不做整面牆,只在兩端各留一小段牆(框出大開口,中間敞開可走入)
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(TH, H, 4.5), wallM, W / 2 - TH / 2, H / 2, sz * (D / 2 - 2.55), g);   // 入口兩端短牆段
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(0.5, 0.5, 4.7), trimM, W / 2 - TH / 2, H - 0.25, sz * (D / 2 - 2.55), g).castShadow = false;   // 入口楣樑(兩端,中央敞開)
  add(new THREE.BoxGeometry(W + 0.5, 0.3, D + 0.5), matT(0x808a82, T.wall, 3, 6, { roughness: 0.88 }), 0, H + 0.1, 0, g);   // 平頂
  add(new THREE.BoxGeometry(W + 0.4, 0.6, D + 0.4), mat(0x8f968c), 0, 0.32, 0, g).receiveShadow = true;   // 牆基
  // 西牆高窗(採光,可破)
  const fm = mat(0x7f867d, { roughness: 0.75 });
  for (const lz of [-6, 0, 6]) {
    const fr = add(new THREE.BoxGeometry(0.16, 1.2, 1.6), fm, -(W / 2 - 0.06), 2.7, lz, g); fr.castShadow = false;
    const gp = add(new THREE.BoxGeometry(0.1, 0.9, 1.3), glassMat, -(W / 2 - 0.06), 2.7, lz, g); gp.castShadow = false;
    gp.userData.glass = true; gp.userData.broken = false; gp.userData.shardPos = new THREE.Vector3();
    gp.updateWorldMatrix(true, false); gp.getWorldPosition(gp.userData.shardPos); glassPanes.push(gp);
  }
  // 告示牌(入口 +X 側、北端短牆上)
  if (signText) {
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture(signText), toneMapped: false });
    add(new THREE.BoxGeometry(0.06, 0.56, 1.4), mat(0x0f0d09, { roughness: 0.8 }), W / 2 + 0.04, H - 0.1, -(D / 2 - 2.55), g).castShadow = false;
    add(new THREE.PlaneGeometry(1.24, 0.46), signMat, W / 2 + 0.08, H - 0.1, -(D / 2 - 2.55), g).rotation.y = -Math.PI / 2;
  }
  // ── 中央大冷水池(矮長方水槽 + 冷藍水面;貼地)──
  const poolM = mat(0x7f8a86, { roughness: 0.5, metalness: 0.1 });   // 磨石子池壁
  const POOLW = 4.4, POOLD = 13, POOLH = 0.7, RIM = 0.35;
  add(new THREE.BoxGeometry(POOLW, POOLH, POOLD), poolM, 0, POOLH / 2, 0, g);   // 池體(實心矮塊,底 y=0)
  // 內凹水:在池體頂面挖一圈池緣後鋪水面(用一層略小的深色內壁 + 水面 plane)
  add(new THREE.BoxGeometry(POOLW - RIM * 2, 0.45, POOLD - RIM * 2), mat(0x33454a, { roughness: 0.6 }), 0, POOLH - 0.18, 0, g);   // 內池壁(深色,凹陷感)
  const waterM = new THREE.MeshPhysicalMaterial({ color: 0x3f6f86, roughness: 0.08, metalness: 0, transmission: 0.4, transparent: true, opacity: 0.82, envMapIntensity: 1.4, clearcoat: 0.5 });   // 冷藍水面
  const water = add(new THREE.PlaneGeometry(POOLW - RIM * 2 - 0.1, POOLD - RIM * 2 - 0.1), waterM, 0, POOLH - 0.02, 0, g); water.rotation.x = -Math.PI / 2; water.castShadow = false;
  // 池邊一只鋁瓢/水桶(三分鐘冷水澡:舀水沖)
  add(new THREE.CylinderGeometry(0.22, 0.18, 0.26, 14), mat(0x9aa0a6, { metalness: 0.5, roughness: 0.5 }), POOLW / 2 + 0.5, POOLH + 0.13, 3.0, g);
  add(new THREE.CylinderGeometry(0.2, 0.16, 0.22, 14), mat(0xb0635a, { roughness: 0.7 }), -POOLW / 2 - 0.5, POOLH + 0.11, -2.0, g);   // 紅塑膠水瓢
  // 室內冷光(澡堂不暖,偏冷白一階)
  const il = new THREE.PointLight(0xcfe0ee, 1.8, 16, 2); il.position.set(0, H - 0.7, 0); g.add(il);
  // ── ROOM_COLLIDERS:西牆 + 南北端牆 + 入口兩端短牆段(中央開口可走入)+ 水池當實體障礙 ──
  ROOM_COLLIDERS.push([cx - (W / 2), cx - (W / 2) + TH, cz - D / 2, cz + D / 2]);   // 西牆
  for (const sz of [-1, 1]) ROOM_COLLIDERS.push([cx - W / 2, cx + W / 2, cz + sz * (D / 2 - TH / 2) - TH / 2, cz + sz * (D / 2 - TH / 2) + TH / 2]);   // 南北端牆
  for (const sz of [-1, 1]) ROOM_COLLIDERS.push([cx + W / 2 - TH, cx + W / 2, cz + sz * (D / 2 - 2.55) - 2.25, cz + sz * (D / 2 - 2.55) + 2.25]);   // 入口兩端短牆段
  OBSTACLES.push([cx - POOLW / 2, cx + POOLW / 2, cz - POOLD / 2, cz + POOLD / 2]);   // 冷水池(玩家+敵人不可穿越)
  g.userData.label = "澡堂";
  return g;
}
buildBathhouse(-30, -16, "澡堂");

/* ───────── C2 剝好的牡丹蝦(EP28:年夜飯全家圍坐大圓桌,把整盤牡丹蝦都剝好,最後全進自己肚子裡)
   用餐大廳右側餐桌上一盤剝好的牡丹蝦 + 對面那個空著的位子=那份缺。盤子擺桌前緣,不擋連長(z23.6)也不擋門(z29.5)。 */
(function buildShrimp() {
  const sx = 1.3, sz = 27.2;   // 用餐大廳右側餐桌(local +3.3→world x=1.3)桌前緣;避開連長 -2,23.6 與門口 z=29.5
  const root = new THREE.Group(); root.position.set(sx, 0, sz); ROOT.add(root);
  const part = (geo, m, x, y, z) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); e.castShadow = e.receiveShadow = true; root.add(e); return e; };
  const plateM = mat(0xe7e2d4, { roughness: 0.45, metalness: 0.05 }), rimM = mat(0xcfc8b6, { roughness: 0.5 });
  const shrimpM = mat(0xe98a64, { roughness: 0.55, metalness: 0.08 });   // 剝好的牡丹蝦肉(粉橙)
  const TY = 0.82;   // 桌面 world y=0.78,盤底略高一階
  part(new THREE.CylinderGeometry(0.34, 0.3, 0.04, 20), plateM, 0, TY, 0);                          // 盤身
  part(new THREE.TorusGeometry(0.33, 0.02, 8, 20), rimM, 0, TY + 0.02, 0).rotation.x = Math.PI / 2;  // 盤緣
  for (let i = 0; i < 7; i++) { const a = i * 0.92, rr = 0.06 + (i % 3) * 0.07; const sh = part(new THREE.CapsuleGeometry(0.05, 0.1, 4, 8), shrimpM, Math.cos(a) * rr, TY + 0.06, Math.sin(a) * rr); sh.rotation.z = Math.PI / 2; sh.rotation.y = a * 1.7; }   // 一盤剝好的蝦肉(彎彎一隻隻疊著)
  // 對面那個空著的位子:餐桌另一頭一只空碗(那份缺=空座)
  part(new THREE.CylinderGeometry(0.13, 0.1, 0.07, 16), plateM, -0.02, 0.84, -1.7);                  // 對座空碗(那個沒人坐的位子)
})();

/* ───────── C3 鏡子·純白的紙(EP11:像一張白紙的他,才有機會成為救贖她的那個他;那版本的學長一捏就爛、一碰就碎)
   軍營空地一座盥洗台+鏡子。站到鏡前,EP11 verbatim 在把拔自己的倒影裡浮現(純白=命中注定的承)。 */
(function buildWashstand() {
  const wx = -26.5, wz = -10;   // #4a:盥洗台+鏡子移到澡堂入口(+X 開口側 x≈-25.5;鏡背朝西牆方向 -X)
  const root = new THREE.Group(); root.position.set(wx, 0, wz); root.rotation.y = -Math.PI / 2; ROOT.add(root);   // 鏡面朝 +X 入口側,洗臉者背對開口
  const part = (geo, m, x, y, z, rx) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; e.castShadow = e.receiveShadow = true; root.add(e); return e; };
  const postM = mat(0x6b6258, { roughness: 0.85, metalness: 0.2 }), porcelain = mat(0xe9e6dc, { roughness: 0.4, metalness: 0.05 }), frameM = mat(0x4a4034, { roughness: 0.8 });
  const mirrorM = mat(0xaeb6bd, { roughness: 0.12, metalness: 0.85, envMapIntensity: 1.5 });   // 鏡面(冷亮金屬反光=倒影裡的自己)
  const tapM = mat(0x9aa0a6, { metalness: 0.55, roughness: 0.45 });
  part(new THREE.BoxGeometry(0.9, 0.74, 0.5), postM, 0, 0.37, 0);                                    // 盥洗台座(底 y=0,頂 y=0.74)
  part(new THREE.BoxGeometry(0.96, 0.1, 0.56), porcelain, 0, 0.79, 0);                              // 台面(頂 y≈0.84)
  part(new THREE.CylinderGeometry(0.22, 0.26, 0.16, 16), porcelain, 0, 0.87, 0.02);                 // 搪瓷臉盆
  part(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), tapM, 0, 0.93, -0.18);                       // 水龍頭立柱
  part(new THREE.BoxGeometry(0.04, 0.04, 0.16), tapM, 0, 1.01, -0.11);                               // 水龍頭出水管
  // 鏡子背板(從台面一路接到鏡框 = 不再懸空、不再有陰影縫)
  part(new THREE.BoxGeometry(0.72, 1.4, 0.04), mat(0x8f968c, { roughness: 0.85 }), 0, 1.52, -0.26);  // 背板/壁面(底 y≈0.82 接台面,撐住鏡子)
  part(new THREE.BoxGeometry(0.66, 0.86, 0.05), frameM, 0, 1.6, -0.235);                            // 鏡框(貼背板)
  part(new THREE.BoxGeometry(0.56, 0.76, 0.02), mirrorM, 0, 1.6, -0.21);                            // 鏡面
  OBSTACLES.push([wx - 0.5, wx + 0.5, wz - 0.5, wz + 0.5]);   // 盥洗台碰撞(item 12;玩家不可穿越)
})();

/* ───────── 室內 NPC(輔導長 / 連長):柔白輝光剪影,引玩家「這裡有故事」 ─────────
   輔導長站中山室、連長站用餐大廳。各自 nearXxx() 偵測 + #tb-act 紅光提示。
   敘事閘:metCounselor→raisedHand,raisedHand 前靶場上鎖。NPC 在待辦步驟前柔白脈動引導。 */
const COUNSELOR_POS = new THREE.Vector3(16, 0, 21.6);   // 中山室內(後牆側,門在 z=27.5,玩家進門面向他)
const COMMANDER_POS = new THREE.Vector3(-2, 0, 23.6);   // 用餐大廳內(後牆側,門在 z=29.5)
let counselorGlow = null, commanderGlow = null;        // 柔白點光(待辦步驟前脈動)
function buildOfficer(pos, torsoCol, role) {   // 寫實國軍軍官立姿(primitives,廉價,但讀得出大盤帽/領章/名牌/階級/腰帶)
  const o = role || {};                        // o.commander=連長(較高階較嚴肅) / 否則輔導長(較親和、夾板)
  const isCmd = !!o.commander;
  const g = new THREE.Group(); g.position.copy(pos); g.rotation.y = 0; ROOT.add(g);   // 面 +Z 朝門口(玩家從門口 +Z 側進來對到正面)
  const skin = mat(0xc89c7a, { roughness: 0.65, envMapIntensity: 0.4 }), torso = mat(torsoCol, { roughness: 0.78, envMapIntensity: 0.5 });   // 寫實沉穩:膚色軟一點、軍服微 sheen
  const legs = mat(0x3a4a2c, { roughness: 0.9 }), boot = mat(0x141210, { roughness: 0.6, metalness: 0.15 });
  const dark = mat(0x14130f, { roughness: 0.8 }), belt = mat(0x20180f, { roughness: 0.5, metalness: 0.25 });
  const capCol = mat(isCmd ? 0x232a18 : 0x2c3320, { roughness: 0.78 });                // 連長帽色更深(較肅)
  const brass = mat(0xd8b24a, { roughness: 0.4, metalness: 0.7, emissive: new THREE.Color(0x4a3a10), emissiveIntensity: 0.5 });  // 帽徽/階級板黃銅亮點
  const tag = mat(0xe8e4d6, { roughness: 0.6 });                                        // 胸前名牌(淺底)
  const broad = isCmd ? 0.30 : 0.27;                                                    // 連長肩較寬
  // 軀幹 + 領口
  add(new THREE.CapsuleGeometry(broad, 0.6, 4, 8), torso, 0, isCmd ? 1.20 : 1.18, 0, g);     // 軀幹(連長略高挺)
  add(new THREE.CylinderGeometry(0.17, 0.21, 0.12, 10), torso, 0, 1.54, 0, g);               // 襯衫立領
  for (const s of [-1, 1]) { const cl = add(new THREE.BoxGeometry(0.16, 0.1, 0.04), torso, s * 0.1, 1.5, broad - 0.02, g); cl.rotation.z = s * 0.5; }   // 翻領 V
  // 脖子 + 頭 + 臉
  add(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 10), skin, 0, 1.62, 0, g);                 // 脖子
  add(new THREE.SphereGeometry(0.21, 14, 10), skin, 0, 1.76, 0, g);                          // 頭
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.032, 8, 6), dark, s * 0.08, 1.78, 0.185, g);   // 雙眼
  add(new THREE.BoxGeometry(0.24, 0.022, 0.03), dark, 0, 1.83, 0.18, g);                     // 眉線
  add(new THREE.ConeGeometry(0.035, 0.08, 6), skin, 0, 1.74, 0.205, g).rotation.x = Math.PI / 2;   // 鼻子暗示
  if (isCmd) add(new THREE.BoxGeometry(0.13, 0.018, 0.03), dark, 0, 1.70, 0.185, g);         // 連長抿嘴一線(更嚴肅)
  // 大盤帽:帽身(crown)+ 平帽簷(brim)+ 帽牆 + 正面帽徽
  add(new THREE.CylinderGeometry(0.235, 0.235, 0.16, 16), capCol, 0, 1.97, 0, g);            // 帽身
  add(new THREE.CylinderGeometry(0.245, 0.245, 0.06, 16), dark, 0, 1.88, 0, g);              // 帽牆(深色帶)
  const brim = add(new THREE.CylinderGeometry(0.33, 0.33, 0.035, 16), dark, 0, 1.855, 0.07, g); brim.scale.z = 0.78;   // 平帽簷(前伸)
  add(new THREE.CircleGeometry(isCmd ? 0.06 : 0.045, 12), brass, 0, 1.93, 0.235, g).rotation.x = 0;   // 正面帽徽(連長更大更顯)
  if (isCmd) add(new THREE.TorusGeometry(0.075, 0.012, 6, 14), brass, 0, 1.93, 0.232, g);    // 連長帽徽外環(更隆重)
  // 胸前:名牌 + 口袋
  add(new THREE.BoxGeometry(0.2, 0.05, 0.02), tag, 0.12, 1.34, broad - 0.01, g);             // 名牌(右胸)
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.18, 0.16, 0.02), mat(torsoCol, { roughness: 0.9 }), s * 0.13, 1.08, broad - 0.015, g);   // 雙胸袋
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.18, 0.02, 0.025), dark, s * 0.13, 1.16, broad - 0.012, g);   // 口袋蓋線
  // 腰帶
  add(new THREE.CylinderGeometry(broad + 0.01, broad + 0.01, 0.1, 12), belt, 0, 0.86, 0, g);
  add(new THREE.BoxGeometry(0.1, 0.08, 0.04), brass, 0, 0.86, broad - 0.01, g);              // 皮帶扣
  // 肩章階級(連長兩排亮點較多、較高階;輔導長一排)
  const pips = isCmd ? 3 : 2;
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(0.16, 0.04, 0.13), tag, s * (broad - 0.04), 1.46, 0, g);       // 肩板
    for (let i = 0; i < pips; i++) add(new THREE.SphereGeometry(0.018, 6, 6), brass, s * (broad - 0.04), 1.485, -0.04 + i * 0.045, g);   // 階級星點
  }
  // 雙臂(稍前垂、放鬆,不僵直)+ 手 + 手套口
  for (const s of [-1, 1]) {
    const arm = add(new THREE.CapsuleGeometry(0.085, 0.46, 4, 6), torso, s * (broad + 0.07), 1.12, 0.05, g); arm.rotation.x = -0.18; arm.rotation.z = s * 0.06;
    add(new THREE.SphereGeometry(0.075, 8, 6), skin, s * (broad + 0.1), 0.82, 0.14, g);      // 手
  }
  // 輔導長:左前臂夾板(politico/輔導意象);連長:右臂叉腰更挺(較嚴)
  if (isCmd) { const fa = add(new THREE.CapsuleGeometry(0.07, 0.3, 4, 6), torso, broad + 0.1, 0.98, 0.04, g); fa.rotation.x = -0.9; }
  else {
    const fa = add(new THREE.CapsuleGeometry(0.07, 0.28, 4, 6), torso, -(broad + 0.08), 0.95, 0.18, g); fa.rotation.x = -1.0;
    const cb = add(new THREE.BoxGeometry(0.26, 0.34, 0.03), mat(0x8a6a3a, { roughness: 0.85 }), -(broad + 0.04), 0.96, 0.34, g); cb.rotation.x = -0.35;   // 夾板
    add(new THREE.BoxGeometry(0.2, 0.26, 0.012), tag, -(broad + 0.04), 0.98, 0.355, g).rotation.x = -0.35;   // 夾板上的紙
    add(new THREE.BoxGeometry(0.06, 0.018, 0.04), dark, -(broad + 0.18), 1.02, 0.355, g).rotation.x = -0.35; // 夾板夾子
    add(new THREE.TorusGeometry(0.05, 0.014, 6, 12), mat(0xb43a2a, { roughness: 0.6 }), broad + 0.02, 1.18, broad - 0.02, g);   // 右臂紅臂章(輔導意象)
  }
  // 雙腿 + 軍靴(連長站姿略寬、較穩重)
  const stance = isCmd ? 0.17 : 0.14;
  for (const s of [-1, 1]) { add(new THREE.CapsuleGeometry(0.12, 0.56, 4, 6), legs, s * stance, 0.5, 0, g); add(new THREE.BoxGeometry(0.21, 0.15, 0.36), boot, s * stance, 0.1, 0.06, g); }
  const glow = new THREE.PointLight(0xf2f6ff, 0, 6, 2); glow.position.set(0, 1.3, 0); g.add(glow);   // 柔白輝光(intensity 由動畫脈動)
  g.userData.glow = glow;
  return g;
}
const counselorObj = buildOfficer(COUNSELOR_POS, 0x4a5238, { commander: false });   // 輔導長(橄欖綠、夾板+臂章、親和)
const commanderObj = buildOfficer(COMMANDER_POS, 0x5a4632, { commander: true });    // 連長(深卡其、較高階較嚴肅)
counselorGlow = counselorObj.userData.glow; commanderGlow = commanderObj.userData.glow;
// #0c:兩位 NPC 腳下各加小 AABB(玩家不可穿過輔導長/連長);半徑小,仍可貼近觸發 nearCounselor/nearCommander
for (const p of [COUNSELOR_POS, COMMANDER_POS]) OBSTACLES.push([p.x - 0.45, p.x + 0.45, p.z - 0.45, p.z + 0.45]);

/* ───────── lived-in 軍營氛圍(散落物 + 風化,不動既有模組;沙包/補給當掩體) ───────── */
(function camplife() {
  const sand = mat(0x8a7c52, { roughness: 0.97 }), sand2 = mat(0x9a8a5e, { roughness: 0.97 }), drumR = mat(0x7a4030, { roughness: 0.5, metalness: 0.4 }), drumG = mat(0x4a6a3e, { roughness: 0.5, metalness: 0.4 }), wood = mat(0x7a5d38, { roughness: 0.9 }), metal = mat(0x4a4f46, { roughness: 0.5, metalness: 0.5 }), tarp = mat(0x3c4636, { roughness: 0.92 });
  const stain = (cx, cz, w, l, ang, col, op) => { const m = add(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: op, roughness: 1, depthWrite: false }), cx, 0.025, cz); m.rotation.x = -Math.PI / 2; m.rotation.z = ang; m.receiveShadow = false; };
  // 沙包掩體(三層磚砌交錯) + 加入 OBSTACLES 當掩體
  const sandbagWall = (cx, cz, ang, len) => {
    const dx = Math.cos(ang), dz = Math.sin(ang);
    for (let row = 0; row < 3; row++) { const n = len - (row % 2); for (let i = 0; i < n; i++) { const off = (i - n / 2 + 0.5) * 0.52 + (row % 2) * 0.26; const sb = add(new THREE.BoxGeometry(0.5, 0.27, 0.34), i % 2 ? sand : sand2, cx + dx * off, 0.16 + row * 0.25, cz + dz * off); sb.rotation.y = ang + (Math.random() - 0.5) * 0.12; sb.userData.surface = "sand"; } }
    const hw = len * 0.26; OBSTACLES.push([cx - Math.abs(dx) * hw - 0.2, cx + Math.abs(dx) * hw + 0.2, cz - Math.abs(dz) * hw - 0.2, cz + Math.abs(dz) * hw + 0.2]);
  };
  sandbagWall(26, 3, 0.35, 6); sandbagWall(8, 2, 1.25, 5);   // 第二垛移出放大後的用餐大廳(原 -4,26 已落在大廳內)
  // 油桶堆(直立 + 一個倒地)
  const drums = (cx, cz) => { add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumR, cx, 0.55, cz); add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumG, cx + 0.85, 0.55, cz + 0.15); add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumR, cx + 0.42, 0.55, cz + 0.78); const lay = add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumG, cx - 0.7, 0.4, cz + 0.6); lay.rotation.z = Math.PI / 2; stain(cx, cz + 0.4, 2.4, 2.4, 0.3, 0x14100a, 0.4); };
  drums(-17, 2); drums(17, -7);   // 油桶堆移出放大後的用餐大廳(原 -9,23 已落在大廳內)
  // 棧板 + 木箱補給堆 + 帆布(掩體)
  const supply = (cx, cz) => {
    add(new THREE.BoxGeometry(2.2, 0.14, 1.4), wood, cx, 0.07, cz);                                  // 棧板
    for (let i = 0; i < 5; i++) { const s = 0.7 + (i % 3) * 0.06; add(new THREE.BoxGeometry(s, s, s), matT(0x9b7a45, T.crate, 1, 1, { roughness: 0.85 }), cx - 0.5 + (i % 2) * 0.85 + (i > 3 ? 0.4 : 0), 0.14 + s / 2 + (i > 1 && i < 4 ? 0.7 : 0), cz - 0.35 + (i % 2) * 0.7); }
    const tp = add(new THREE.BoxGeometry(1.7, 0.5, 1.1), tarp, cx + 1.7, 0.45, cz); tp.rotation.y = 0.2;   // 帆布蓋的補給
    OBSTACLES.push([cx - 1.2, cx + 2.7, cz - 0.9, cz + 0.9]);
  };
  supply(18, 22);
  // 通訊天線桅杆(細桿 + 橫臂 + 拉線感)
  const antenna = (cx, cz) => { add(new THREE.CylinderGeometry(0.08, 0.12, 9, 8), metal, cx, 4.5, cz); for (const h of [3.5, 5.5, 7.2]) add(new THREE.BoxGeometry(1.4, 0.06, 0.06), metal, cx, h, cz); add(new THREE.SphereGeometry(0.12, 8, 6), mat(0xcc4030, { emissive: new THREE.Color(0x882010), emissiveIntensity: 0.6 }), cx, 9.1, cz); for (const a of [0, 2.1, 4.2]) { const gw = add(new THREE.CylinderGeometry(0.012, 0.012, 9.2, 4), metal, cx + Math.cos(a) * 1.4, 4.4, cz + Math.sin(a) * 1.4); gw.rotation.set(Math.sin(a) * 0.28, 0, -Math.cos(a) * 0.28); } };
  antenna(-28, 9);
  // 輪胎痕 + 油漬(地面 lived-in)
  stain(2, -2, 1.0, 22, 0.15, 0x1a150e, 0.32); stain(2.7, -2, 1.0, 22, 0.15, 0x1a150e, 0.32);   // 雙輪胎痕橫過操場
  stain(-18, 4, 0.9, 16, -0.7, 0x1a150e, 0.3); stain(-18.7, 4, 0.9, 16, -0.7, 0x1a150e, 0.3);
  stain(8, 9, 3, 3, 0, 0x120e08, 0.4); stain(20, 26, 2.5, 2.5, 0.5, 0x120e08, 0.35);
})();

/* ══════════════ 武器系統:鐵鎚 / 刺槍 / 小刀 / 槍械(每把含 moveMul 移速) ══════════════ */
const gunMetal = new THREE.MeshStandardMaterial({ color: 0x3b3f45, metalness: 0.78, roughness: 0.38, envMapIntensity: 0.85 });
const gunPoly = new THREE.MeshStandardMaterial({ color: 0x2f3127, metalness: 0.12, roughness: 0.66, envMapIntensity: 0.5 });
const gunMag = new THREE.MeshStandardMaterial({ color: 0x3a3629, metalness: 0.28, roughness: 0.58, envMapIntensity: 0.6 });
const skin = new THREE.MeshStandardMaterial({ color: 0xc39a6e, roughness: 0.72 });
const fistSkin = new THREE.MeshStandardMaterial({ color: 0x9c6b40, roughness: 0.8 }); // 近距大面積膚色(深一階,避免疊加層過曝)
const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe2e6ec, metalness: 0.45, roughness: 0.32, envMapIntensity: 0.9 }); // 刀刃白鋼(刺刀/小刀共用)
const broomWood = new THREE.MeshStandardMaterial({ color: 0xa9824a, roughness: 0.82, envMapIntensity: 0.5 });
const broomStraw = new THREE.MeshStandardMaterial({ color: 0xcea863, roughness: 0.95, flatShading: true });
const camoTex = tex((c, S) => { c.fillStyle = "#4a5236"; c.fillRect(0, 0, S, S); for (const col of ["#3a4029", "#6b6f48", "#2c3020"]) for (let i = 0; i < 26; i++) { c.fillStyle = col; c.beginPath(); c.ellipse(Math.random() * S, Math.random() * S, 8 + Math.random() * 16, 6 + Math.random() * 12, Math.random() * 3, 0, 7); c.fill(); } }, 128);
const camoMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.85 });
const flashMat = () => new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
function P(group, geo, m, x, y, z, rx, ry, rz) { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); if (rx || ry || rz) b.rotation.set(rx || 0, ry || 0, rz || 0); b.castShadow = b.receiveShadow = false; group.add(b); return b; }

// ── 步槍 ──
const gRifle = new THREE.Group();
P(gRifle, new THREE.BoxGeometry(0.12, 0.14, 0.64), gunMetal, 0, 0, -0.1);
P(gRifle, new THREE.BoxGeometry(0.12, 0.05, 0.22), gunMetal, 0, 0.04, 0.06);
P(gRifle, new THREE.BoxGeometry(0.06, 0.055, 0.46), gunPoly, 0, 0.10, -0.06);
P(gRifle, new THREE.BoxGeometry(0.075, 0.07, 0.10), gunMetal, 0, 0.155, -0.04);
P(gRifle, new THREE.CylinderGeometry(0.04, 0.045, 0.10, 14), gunMetal, 0, 0.18, -0.04, Math.PI / 2, 0, 0);
P(gRifle, new THREE.CylinderGeometry(0.028, 0.028, 0.52, 14), gunMetal, 0, 0.0, -0.52, Math.PI / 2, 0, 0);
P(gRifle, new THREE.CylinderGeometry(0.05, 0.05, 0.12, 14), gunMetal, 0, 0.0, -0.82, Math.PI / 2, 0, 0);
P(gRifle, new THREE.BoxGeometry(0.10, 0.10, 0.30), gunPoly, 0, -0.01, -0.34);
P(gRifle, new THREE.BoxGeometry(0.09, 0.26, 0.14), gunMag, 0, -0.18, 0.0, 0.1, 0, 0);     // T65K2/T91 近直 STANAG 彈匣(非 AK 香蕉彎匣;海陸老兵一眼看穿)
P(gRifle, new THREE.BoxGeometry(0.085, 0.16, 0.135), gunMag, 0, -0.33, 0.02, 0.16, 0, 0);  // 下段僅微彎
P(gRifle, new THREE.BoxGeometry(0.10, 0.13, 0.20), gunPoly, 0, 0.0, 0.30);
P(gRifle, new THREE.BoxGeometry(0.07, 0.15, 0.10), gunPoly, 0, -0.13, 0.14, -0.32, 0, 0);
P(gRifle, new THREE.BoxGeometry(0.025, 0.05, 0.02), gunMetal, 0, 0.13, -0.56);
P(gRifle, new THREE.CylinderGeometry(0.05, 0.055, 0.34, 12), camoMat, 0.0, -0.17, -0.2, 0.7, 0, 0.18);
P(gRifle, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.0, -0.06, -0.36);
P(gRifle, new THREE.CylinderGeometry(0.055, 0.06, 0.36, 12), camoMat, 0.13, -0.24, 0.24, 0.85, -0.3, 0.3);
P(gRifle, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.05, -0.12, 0.12);
const rifleMuzzle = P(gRifle, new THREE.SphereGeometry(0.13, 12, 10), flashMat(), 0, 0.0, -0.9);
gRifle.position.set(0.32, -0.31, -0.6); gRifle.rotation.set(0.055, -0.13, 0.03);

// ── 手槍 ──
const gPistol = new THREE.Group();
P(gPistol, new THREE.BoxGeometry(0.055, 0.075, 0.30), gunMetal, 0, 0.02, -0.12);  // 滑套
P(gPistol, new THREE.BoxGeometry(0.05, 0.06, 0.22), gunPoly, 0, -0.03, -0.06);    // 槍身
P(gPistol, new THREE.BoxGeometry(0.05, 0.17, 0.085), gunPoly, 0, -0.15, 0.04, -0.28, 0, 0); // 握把
P(gPistol, new THREE.BoxGeometry(0.02, 0.035, 0.02), gunMetal, 0, 0.065, -0.24);  // 準星
P(gPistol, new THREE.SphereGeometry(0.06, 14, 10), skin, 0.02, -0.16, 0.06);      // 持槍手
P(gPistol, new THREE.SphereGeometry(0.055, 14, 10), skin, -0.04, -0.13, 0.02);    // 輔助手
P(gPistol, new THREE.CylinderGeometry(0.05, 0.055, 0.26, 12), camoMat, 0.05, -0.26, 0.18, 0.9, -0.2, 0.2);
const pistolMuzzle = P(gPistol, new THREE.SphereGeometry(0.1, 12, 10), flashMat(), 0, 0.02, -0.3);
gPistol.position.set(0.25, -0.26, -0.46); gPistol.rotation.set(0.065, -0.08, 0.02);

// ── 刺槍(無彈藥的長槍 + 刺刀,近戰刺擊) ──
const gBayonet = new THREE.Group();
P(gBayonet, new THREE.BoxGeometry(0.1, 0.13, 0.52), gunMetal, 0, 0, -0.06);              // 機匣
P(gBayonet, new THREE.BoxGeometry(0.058, 0.05, 0.5), gunPoly, 0, 0.085, -0.12);          // 上護木
P(gBayonet, new THREE.CylinderGeometry(0.026, 0.026, 0.56, 12), gunMetal, 0, 0.0, -0.54, Math.PI / 2, 0, 0); // 槍管
P(gBayonet, new THREE.BoxGeometry(0.1, 0.14, 0.24), gunPoly, 0, -0.01, 0.28);            // 槍托
P(gBayonet, new THREE.BoxGeometry(0.07, 0.15, 0.1), gunPoly, 0, -0.14, 0.12, -0.32, 0, 0); // 握把
P(gBayonet, new THREE.BoxGeometry(0.025, 0.05, 0.02), gunMetal, 0, 0.13, -0.5);          // 準星
P(gBayonet, new THREE.CylinderGeometry(0.032, 0.032, 0.08, 10), gunMetal, 0, 0.0, -0.8, Math.PI / 2, 0, 0); // 刺刀座套管
P(gBayonet, new THREE.BoxGeometry(0.02, 0.052, 0.34), bladeMat, 0, 0.0, -1.0);           // 刺刀身
P(gBayonet, new THREE.ConeGeometry(0.028, 0.12, 4), bladeMat, 0, 0.0, -1.21, -Math.PI / 2, 0, Math.PI / 4); // 刀尖
P(gBayonet, new THREE.CylinderGeometry(0.05, 0.055, 0.34, 12), camoMat, 0.0, -0.18, -0.18, 0.7, 0, 0.16);
P(gBayonet, new THREE.SphereGeometry(0.062, 14, 10), skin, 0.0, -0.07, -0.34);           // 前手
P(gBayonet, new THREE.CylinderGeometry(0.052, 0.058, 0.34, 12), camoMat, 0.12, -0.23, 0.24, 0.85, -0.28, 0.28);
P(gBayonet, new THREE.SphereGeometry(0.062, 14, 10), skin, 0.05, -0.11, 0.14);           // 後手
gBayonet.position.set(0.27, -0.26, -0.52); gBayonet.rotation.set(0.04, -0.1, 0.02);

// ── 鐵鎚(雙手握柄,鋼鎚頭,重砸) ──
const gHammer = new THREE.Group();
const hammerWood = new THREE.MeshStandardMaterial({ color: 0x6f4a28, roughness: 0.82, envMapIntensity: 0.4 });
const hammerHead = new THREE.MeshStandardMaterial({ color: 0x3a3e44, metalness: 0.3, roughness: 0.66, envMapIntensity: 0.35 });  // 霧面鍛鐵:低金屬感少反射,去 aliasing 鋸齒兼像鐵不像鉻
P(gHammer, new THREE.CylinderGeometry(0.026, 0.03, 0.86, 16), hammerWood, 0, 0.0, -0.18, Math.PI / 2, 0, 0);  // 木柄(沿 -z)
P(gHammer, new THREE.BoxGeometry(0.12, 0.2, 0.14), hammerHead, 0, 0.0, -0.6);                                 // 鎚頭主體
P(gHammer, new THREE.CylinderGeometry(0.076, 0.076, 0.24, 28), hammerHead, 0, 0.0, -0.6, 0, 0, Math.PI / 2);  // 打擊圓面(28 段更圓)
P(gHammer, new THREE.CylinderGeometry(0.085, 0.076, 0.03, 28), hammerHead, 0, 0.0, -0.72, 0, 0, Math.PI / 2); // 打擊面倒角環(去硬邊)
P(gHammer, new THREE.BoxGeometry(0.07, 0.07, 0.04), hammerHead, 0, 0.0, -0.5);                                // 頸環
P(gHammer, new THREE.SphereGeometry(0.058, 14, 10), skin, 0.0, -0.02, -0.02);                                 // 前手
P(gHammer, new THREE.SphereGeometry(0.055, 14, 10), skin, 0.01, 0.0, 0.2);                                    // 後手
P(gHammer, new THREE.CylinderGeometry(0.05, 0.055, 0.3, 12), camoMat, 0.04, -0.05, 0.32, 0.7, -0.15, 0.2);    // 迷彩袖
gHammer.position.set(0.26, -0.22, -0.42); gHammer.rotation.set(-0.16, -0.06, 0.06);   // 微抬鎚頭備砸

// ── 小刀(戰術刀:纏繩柄 + 護手 + fuller 凹槽 + clip-point 刀尖) ──
const gKnife = new THREE.Group();
const knifeGrip = new THREE.MeshStandardMaterial({ color: 0x241c14, roughness: 0.88 });
const knifeWrap = new THREE.MeshStandardMaterial({ color: 0x12100b, roughness: 0.92 });
const fullerMat = new THREE.MeshStandardMaterial({ color: 0x8f969e, metalness: 0.5, roughness: 0.4 });
P(gKnife, new THREE.CylinderGeometry(0.023, 0.027, 0.18, 10), knifeGrip, 0, -0.11, 0.13);                     // 握把
for (let i = 0; i < 4; i++) P(gKnife, new THREE.TorusGeometry(0.027, 0.006, 6, 12), knifeWrap, 0, -0.055 - i * 0.035, 0.13, Math.PI / 2, 0, 0); // 纏繩
P(gKnife, new THREE.SphereGeometry(0.03, 12, 8), gunMetal, 0, -0.205, 0.13);                                  // 柄頭 pommel
P(gKnife, new THREE.BoxGeometry(0.1, 0.024, 0.05), gunMetal, 0, -0.015, 0.06);                                // 護手 crossguard
P(gKnife, new THREE.BoxGeometry(0.03, 0.052, 0.34), bladeMat, 0, 0.0, -0.18);                                 // 刀身
P(gKnife, new THREE.BoxGeometry(0.008, 0.014, 0.26), fullerMat, 0.013, 0.006, -0.16);                         // fuller 凹槽
P(gKnife, new THREE.ConeGeometry(0.03, 0.13, 4), bladeMat, 0, 0.0, -0.42, -Math.PI / 2, 0, Math.PI / 4);      // clip-point 刀尖
P(gKnife, new THREE.SphereGeometry(0.06, 14, 10), skin, 0.0, -0.12, 0.15);                                    // 手
P(gKnife, new THREE.CylinderGeometry(0.05, 0.055, 0.28, 12), camoMat, 0.05, -0.23, 0.27, 0.9, -0.2, 0.2);     // 袖
gKnife.position.set(0.23, -0.2, -0.4); gKnife.rotation.set(0.0, -0.1, 0.05);

// ── 機關槍 (LMG) ──
const gMG = new THREE.Group();
P(gMG, new THREE.BoxGeometry(0.16, 0.18, 0.8), gunMetal, 0, 0, -0.12);
P(gMG, new THREE.BoxGeometry(0.16, 0.06, 0.3), gunMetal, 0, 0.05, 0.1);
P(gMG, new THREE.BoxGeometry(0.07, 0.07, 0.5), gunPoly, 0, 0.13, -0.1);              // 提把
P(gMG, new THREE.CylinderGeometry(0.034, 0.034, 0.66, 14), gunMetal, 0, 0.0, -0.66, Math.PI / 2, 0, 0); // 長槍管
P(gMG, new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8), gunMetal, 0, 0.0, -1.02, Math.PI / 2, 0, 0);    // 槍口
P(gMG, new THREE.BoxGeometry(0.22, 0.22, 0.2), gunMag, 0.0, -0.16, 0.02);            // 大彈鼓
P(gMG, new THREE.BoxGeometry(0.12, 0.15, 0.22), gunPoly, 0, 0.0, 0.34);              // 槍托
P(gMG, new THREE.BoxGeometry(0.07, 0.16, 0.1), gunPoly, 0, -0.15, 0.16, -0.32, 0, 0);// 握把
for (const sx of [-1, 1]) { const leg = P(gMG, new THREE.CylinderGeometry(0.014, 0.014, 0.34, 6), gunMetal, sx * 0.08, -0.16, -0.5); leg.rotation.x = 0.4; leg.rotation.z = sx * 0.3; } // 兩腳架
P(gMG, new THREE.CylinderGeometry(0.05, 0.055, 0.34, 12), camoMat, 0.0, -0.2, -0.26, 0.7, 0, 0.18);
P(gMG, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.0, -0.09, -0.42);
P(gMG, new THREE.CylinderGeometry(0.055, 0.06, 0.36, 12), camoMat, 0.14, -0.26, 0.26, 0.85, -0.3, 0.3);
P(gMG, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.06, -0.14, 0.14);
const mgMuzzle = P(gMG, new THREE.SphereGeometry(0.15, 12, 10), flashMat(), 0, 0.0, -1.12);
gMG.position.set(0.34, -0.34, -0.62); gMG.rotation.set(0.05, -0.12, 0.03);

// ── 狙擊槍 ──
const gSniper = new THREE.Group();
P(gSniper, new THREE.BoxGeometry(0.1, 0.13, 0.7), gunMetal, 0, 0, -0.1);
P(gSniper, new THREE.CylinderGeometry(0.026, 0.026, 0.85, 14), gunMetal, 0, 0.01, -0.7, Math.PI / 2, 0, 0); // 長槍管
P(gSniper, new THREE.CylinderGeometry(0.06, 0.06, 0.32, 16), gunMetal, 0, 0.13, -0.12, Math.PI / 2, 0, 0);  // 瞄準鏡筒
P(gSniper, new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0x10141a, metalness: 0.4, roughness: 0.2, envMapIntensity: 1.5 }), 0, 0.13, -0.28, Math.PI / 2, 0, 0); // 鏡片
for (const z of [-0.04, 0.04]) P(gSniper, new THREE.BoxGeometry(0.02, 0.05, 0.02), gunMetal, 0, 0.075, z); // 鏡座
P(gSniper, new THREE.BoxGeometry(0.1, 0.14, 0.34), gunPoly, 0, -0.02, 0.3);          // 槍托
P(gSniper, new THREE.BoxGeometry(0.07, 0.15, 0.1), gunPoly, 0, -0.14, 0.12, -0.32, 0, 0); // 握把
P(gSniper, new THREE.BoxGeometry(0.08, 0.18, 0.12), gunMag, 0, -0.14, -0.02, 0.08, 0, 0); // 彈匣(近直,非香蕉彎)
P(gSniper, new THREE.CylinderGeometry(0.05, 0.055, 0.34, 12), camoMat, 0.0, -0.18, -0.3, 0.7, 0, 0.18);
P(gSniper, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.0, -0.07, -0.46);
P(gSniper, new THREE.CylinderGeometry(0.055, 0.06, 0.36, 12), camoMat, 0.13, -0.24, 0.24, 0.85, -0.3, 0.3);
P(gSniper, new THREE.SphereGeometry(0.065, 14, 10), skin, 0.05, -0.12, 0.12);
const sniperMuzzle = P(gSniper, new THREE.SphereGeometry(0.12, 12, 10), flashMat(), 0, 0.01, -1.12);
gSniper.position.set(0.31, -0.31, -0.6); gSniper.rotation.set(0.04, -0.12, 0.02);

// ── 手榴彈 (握在手中) ──
const gGrenade = new THREE.Group();
P(gGrenade, new THREE.SphereGeometry(0.12, 16, 14), new THREE.MeshStandardMaterial({ color: 0x3a4a2c, metalness: 0.3, roughness: 0.6, envMapIntensity: 1.0 }), 0.18, -0.26, -0.44);
P(gGrenade, new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10), gunMetal, 0.18, -0.14, -0.44);   // 頂蓋
P(gGrenade, new THREE.BoxGeometry(0.02, 0.13, 0.02), gunMetal, 0.24, -0.18, -0.44, 0, 0, -0.3);  // 保險桿
P(gGrenade, new THREE.SphereGeometry(0.075, 14, 10), skin, 0.18, -0.3, -0.4);                    // 握住的手
P(gGrenade, new THREE.CylinderGeometry(0.05, 0.055, 0.3, 12), camoMat, 0.24, -0.42, -0.24, 0.7, 0, 0.2);
const grenadeBall = gGrenade.children[0];
gGrenade.position.set(0, 0, 0); gGrenade.rotation.set(0, 0, 0);

// ── 火箭砲 ──
const gRocket = new THREE.Group();
P(gRocket, new THREE.CylinderGeometry(0.1, 0.1, 1.3, 18), new THREE.MeshStandardMaterial({ color: 0x3c4a30, metalness: 0.3, roughness: 0.6, envMapIntensity: 1.0 }), 0.05, -0.16, -0.3, Math.PI / 2, 0, 0); // 發射管
P(gRocket, new THREE.CylinderGeometry(0.14, 0.1, 0.2, 18), gunMetal, 0.05, -0.16, 0.34, Math.PI / 2, 0, 0); // 後噴口
P(gRocket, new THREE.ConeGeometry(0.08, 0.26, 14), new THREE.MeshStandardMaterial({ color: 0x8a3020, metalness: 0.4, roughness: 0.5 }), 0.05, -0.16, -0.98, -Math.PI / 2, 0, 0); // 彈頭
P(gRocket, new THREE.BoxGeometry(0.05, 0.06, 0.22), gunMetal, 0.05, -0.04, -0.12);   // 瞄具
P(gRocket, new THREE.BoxGeometry(0.07, 0.16, 0.1), gunPoly, 0.05, -0.3, 0.0, -0.3, 0, 0); // 握把
P(gRocket, new THREE.SphereGeometry(0.07, 14, 10), skin, 0.05, -0.32, 0.02);
P(gRocket, new THREE.CylinderGeometry(0.05, 0.055, 0.3, 12), camoMat, 0.1, -0.4, 0.16, 0.7, -0.2, 0.2);
const rocketMuzzle = P(gRocket, new THREE.SphereGeometry(0.14, 12, 10), flashMat(), 0.05, -0.16, -1.12);
gRocket.position.set(0.27, -0.24, -0.5); gRocket.rotation.set(0.03, -0.06, 0.0);

const WEAPON_GROUPS = [gHammer, gKnife, gMG, gSniper, gGrenade, gRocket, gRifle, gPistol, gBayonet];
WEAPON_GROUPS.forEach((g) => camera.add(g));

/* ── 武器專屬光照 rig:layer 1 隔離(只照武器,完全不碰世界 — FPS viewmodel 慣例) ── */
const VIEWMODEL_LAYER = 1;
// 武器只在 layer 1(離開 layer 0)→ 主世界 pass 不畫武器,改由 renderOnce 疊加層單獨畫(防穿牆)
WEAPON_GROUPS.forEach((g) => g.traverse((o) => o.layers.set(VIEWMODEL_LAYER)));
// 世界主光補照 layer 1,武器保留場景暖調(layer 隔離只改「渲染」,不抽掉世界光感)
sun.layers.enable(VIEWMODEL_LAYER); rim.layers.enable(VIEWMODEL_LAYER);
function vmLight(color, intensity, x, y, z) {
  const l = new THREE.PointLight(color, intensity, 6, 2);
  l.position.set(x, y, z); l.layers.set(VIEWMODEL_LAYER); camera.add(l); return l;
}
vmLight(0xfff4e6, 9, 0.55, 0.5, 0.25);    // 主光:暖白,右上前(打亮機匣/滑套上緣)
vmLight(0xc2d4f0, 4.5, -0.6, -0.15, 0.2); // 補光:冷藍,左下(填暗面,讓結構分離)
vmLight(0xffd2a0, 3.2, 0.15, -0.4, -0.7); // 緣光:暖,槍管下前(勾出槍管/刀刃輪廓)

const WEAPONS = [
  { name: "鐵鎚", group: gHammer, type: "melee", melee: "swing", swingDur: 0.42, reach: 2.0, rate: 0.55, moveMul: 0.9, base: gHammer.position.clone(), rot: gHammer.rotation.clone(), swingT: 0 },
  { name: "刺槍", group: gBayonet, type: "melee", melee: "stab", swingDur: 0.3, reach: 2.7, rate: 0.45, moveMul: 0.92, base: gBayonet.position.clone(), rot: gBayonet.rotation.clone(), swingT: 0 },
  { name: "小刀", group: gKnife, type: "melee", melee: "swing", swingDur: 0.26, reach: 1.8, rate: 0.32, moveMul: 1.15, base: gKnife.position.clone(), rot: gKnife.rotation.clone(), swingT: 0 },
  { name: "小槍", group: gPistol, type: "semi", mag: 12, ammo: 12, reserve: 48, rate: 0.17, adsFov: 70, moveMul: 1.05, base: gPistol.position.clone(), rot: gPistol.rotation.clone(), muzzle: pistolMuzzle, muzzleT: 0, tracerEvery: 0 },
  { name: "步槍", group: gRifle, type: "auto", mag: 30, ammo: 30, reserve: 90, rate: 0.1, adsFov: 66, moveMul: 0.95, base: gRifle.position.clone(), rot: gRifle.rotation.clone(), muzzle: rifleMuzzle, muzzleT: 0, tracerEvery: 4, tracerColor: 0xffe09a, tracerOp: 0.7 },
  { name: "機關槍", group: gMG, type: "auto", mag: 100, ammo: 100, reserve: 200, rate: 0.08, adsFov: 72, recoilMul: 1.7, moveMul: 0.82, base: gMG.position.clone(), rot: gMG.rotation.clone(), muzzle: mgMuzzle, muzzleT: 0, tracerEvery: 3, tracerColor: 0xffe6b0, tracerOp: 0.85 },
  { name: "狙擊槍", group: gSniper, type: "semi", mag: 5, ammo: 5, reserve: 30, rate: 0.9, adsFov: 22, scope: true, recoilMul: 2.0, moveMul: 0.9, base: gSniper.position.clone(), rot: gSniper.rotation.clone(), muzzle: sniperMuzzle, muzzleT: 0, tracerEvery: 1, tracerColor: 0xffb060, tracerOp: 0.95 },
  { name: "手榴彈", group: gGrenade, type: "throw", count: 3, rate: 0.85, moveMul: 1.0, base: gGrenade.position.clone(), rot: gGrenade.rotation.clone(), swingT: 0 },
  { name: "火箭砲", group: gRocket, type: "launcher", count: 4, rate: 1.2, adsFov: 62, moveMul: 0.7, base: gRocket.position.clone(), rot: gRocket.rotation.clone(), muzzle: rocketMuzzle, muzzleT: 0 },
];
WEAPONS.forEach((w) => { if (w.reserve != null) w.baseReserve = w.reserve; if (w.count != null) w.baseCount = w.count; w.owned = (w.type === "melee" || w.name === "小槍"); });   // 難度套彈藥倍率基準 + 購買系統:近戰+小槍預設擁有,其餘要買
{ const _h = WEAPONS.find((w) => w.name === "鐵鎚"); if (_h) { _h.hidden = true; _h.owned = false; } }   // toni #1:隱藏鐵鎚(不刪,設不可選/不入換槍循環)
{ const _k = WEAPONS.find((w) => w.name === "小刀"); if (_k) { _k.hidden = true; _k.owned = false; } }   // toni:隱藏小刀(同鐵鎚作法,不入換槍循環);預設改刺槍
/* ── 5 段難度(toni:劇情/新手/正常/困難/天堂路) ── */
const DIFF = {
  1: { name: "劇情", hp: 3, ammo: 3, enemyMul: 1, smart: false, loadoutMul: 1, diffIndex: 1 },
  2: { name: "新手", hp: 2, ammo: 2, enemyMul: 1, smart: false, loadoutMul: 1, diffIndex: 2 },
  3: { name: "正常", hp: 1, ammo: 1, enemyMul: 1, smart: false, loadoutMul: 2, diffIndex: 3 },
  4: { name: "困難", hp: 1, ammo: 1, enemyMul: 2, smart: false, loadoutMul: 4, diffIndex: 4 },
  5: { name: "天堂路", hp: 1, ammo: 1, enemyMul: 2, smart: true, loadoutMul: 8, diffIndex: 5 },
};   // loadoutMul:敵人特殊武器配額倍率(正常×2/困難×4/天堂路×8);diffIndex:蛙人波次判定用
function applyDifficulty() {   // 進實戰/重新部署時套:玩家 HP、彈藥、敵人倍率/AI(讀 curDiff)
  curDiff = DIFF[settings.difficulty] || DIFF[3];
  MAX_HP = Math.round(100 * curDiff.hp); playerHP = MAX_HP; if (hpEl) hpEl.textContent = MAX_HP;
  WEAPONS.forEach((w) => { if (w.baseReserve != null) { w.ammo = w.mag; w.reserve = Math.round(w.baseReserve * curDiff.ammo); } if (w.baseCount != null) w.count = Math.round(w.baseCount * curDiff.ammo); });
  updateHUD();
}
let wi = 1; // 預設刺槍(鐵鎚 / 小刀已隱藏,toni #1)
function updateHUD() {
  const w = WEAPONS[wi]; const am = document.getElementById("am"), ar = document.getElementById("amres"), nm = document.getElementById("wpn");
  if (nm) nm.textContent = w.name;
  const _melee = w.type === "melee";   // toni #3:近戰(小刀/刺槍)射擊鍵顯示「攻擊」;模式2 雙側鈕用單字「攻/射」配窄鈕
  const fb = document.getElementById("tb-fire"); if (fb) fb.textContent = _melee ? "攻擊" : "射擊";
  const fl = document.getElementById("tb-firel"), fr = document.getElementById("tb-firer"); if (fl) fl.textContent = _melee ? "攻" : "射"; if (fr) fr.textContent = _melee ? "攻" : "射";
  if (w.type === "melee") { if (am) am.textContent = "∞"; if (ar) ar.textContent = ""; }
  else if (w.type === "throw" || w.type === "launcher") { if (am) am.textContent = w.count; if (ar) ar.textContent = ""; }
  else { if (am) am.textContent = w.ammo; if (ar) ar.textContent = w.reserve; }
}
function showWeapon(i) {
  if (vehicle) return;   // 駕駛載具中切槍 no-op:避免把武器 mesh 在駕駛視角又顯示出來(enterVehicle 已隱藏)
  if (i < 0 || i >= WEAPONS.length) return;
  if (!WEAPONS[i].owned) { if (actx) tone(280, 200, 0.07, 0.06, "square"); return; }   // 購買系統:未擁有不可切(去軍械庫買)
  wi = i; WEAPONS.forEach((w, k) => (w.group.visible = k === i));
  ads = false; sprayCount = 0; sprayResetT = 0; reloadT = 0; reloadFilled = true;   // 切槍取消換彈
  const cur = WEAPONS[i];   // 拔槍動畫:步槍 520ms / 手槍 380ms / 近戰投擲快
  drawDur = drawT = cur.type === "melee" ? 0.3 : cur.type === "throw" ? 0.32 : cur.name === "小槍" ? 0.38 : 0.52;
  updateHUD(); sfxSwitch();
}
function reload() {
  const w = WEAPONS[wi];
  if (w.type !== "semi" && w.type !== "auto") return;
  if (w.ammo >= w.mag || w.reserve <= 0 || reloadT > 0 || drawT > 0) return;
  reloadDur = reloadT = w.name === "機關槍" ? 3.5 : w.name === "狙擊槍" ? 3.0 : w.name === "小槍" ? 2.0 : 2.4; // 換彈動畫時長(數值在 60% 補滿)
  reloadFilled = false; sfxReload(w.name, reloadDur);
  setTimeout(() => { if (reloadT > 0 && WEAPONS[wi] === w) dropMag(w.name); }, reloadDur * 0.22 * 1000);   // 退匣那一刻掉空彈匣
}
function reloadCurve(name, rp) {   // 回 [dipY, rotX, rotZ];每把槍換彈動作不同
  if (name === "機關槍") {   // 掀鏈蓋(往上)→鋪彈鏈(緩起伏)→拍合
    if (rp < 0.2) { const e = rp / 0.2; return [-0.06 * e, 0.55 * e, 0.08 * e]; }
    if (rp < 0.65) { const e = (rp - 0.2) / 0.45; return [-0.16 - Math.sin(e * Math.PI * 3) * 0.05, 0.55 - e * 0.1, 0.08]; }
    if (rp < 0.85) { const e = (rp - 0.65) / 0.2; return [-0.16 + e * 0.1, 0.45 - e * 0.6, 0.08 - e * 0.08]; }
    const e = (rp - 0.85) / 0.15, s = e * (2 - e); return [-0.06 * (1 - s), -0.15 * (1 - s), 0];
  }
  if (name === "狙擊槍") {   // 大傾斜 + 5 段鋸齒逐發 → 推栓回正
    if (rp < 0.8) { const k = (rp / 0.16) % 1, press = Math.sin(k * Math.PI); return [-0.2 - press * 0.05, 0.45 + press * 0.13, 0.2]; }
    const e = (rp - 0.8) / 0.2, s = e * (2 - e); return [-0.2 * (1 - s), 0.45 * (1 - s), 0.2 * (1 - s)];
  }
  const rack = name === "步槍";   // 小槍/步槍:下壓退匣→插匣→(步槍)拉槍栓→回正
  if (rp < 0.28) { const e = rp / 0.28; return [-0.22 * e, 0.08 * e, 0.55 * e]; }
  if (rp < 0.5) return [-0.22, 0.08, 0.55];
  if (rp < 0.6) { const e = (rp - 0.5) / 0.1; return [-0.22 + e * 0.04, 0.08, 0.55 - e * 0.42]; }
  if (rack && rp < 0.82) { const e = (rp - 0.6) / 0.22, j = Math.sin(e * Math.PI); return [-0.18, 0.08 + j * 0.55, 0.13]; }
  const start = rack ? 0.82 : 0.6, e = (rp - start) / (1 - start), s = e * (2 - e); return [-0.18 * (1 - s), 0.08 * (1 - s), 0.13 * (1 - s)];
}

/* ══════════════ Web Audio 音效 ══════════════ */
let actx = null, masterGain = null, gunBus = null;   // gunBus:玩家槍聲乾聲 + slap-back 回聲匯流排(大操場遠處彈回)
const settings = { sens: 1, vol: 0.8, chSize: 8, chGap: 4, chThick: 2, chColor: "#7dff8a", quality: 3, difficulty: 2, hicon: 0, haptic: 1, uiMode: 1, uiScale: 1, uiPos: {}, hintsOpen: 0 };   // 預設新手(toni #4)。uiMode 1=拖曳看視角/2=右下視角搖桿+雙側射擊鈕;uiScale=介面大小;uiPos=自訂按鈕位置(toni #2);hintsOpen=提示展開(預設 0 收合,toni r14 #2)
try { Object.assign(settings, JSON.parse(localStorage.getItem("tiantanglu_settings_v1") || "{}")); } catch (e) { }
(function sanitizeSettings() {   // 防 tampered localStorage:數值夾範圍 + chColor 必須 hex(擋 chColor → CSS 變數注入路徑)
  const num = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  settings.sens = num(settings.sens, 0.4, 2.5, 1); settings.vol = num(settings.vol, 0, 1, 0.8);
  settings.chSize = num(settings.chSize, 3, 18, 8); settings.chGap = num(settings.chGap, 0, 14, 4); settings.chThick = num(settings.chThick, 1, 6, 2);
  if (!/^#[0-9a-fA-F]{6}$/.test(settings.chColor)) settings.chColor = "#7dff8a";
  settings.quality = Math.max(1, Math.min(5, Math.round(+settings.quality) || 3));
  settings.difficulty = Math.max(1, Math.min(5, Math.round(+settings.difficulty) || 3));
  settings.hicon = settings.hicon ? 1 : 0; settings.haptic = settings.haptic === 0 ? 0 : 1;   // 0/1 旗標
  settings.uiMode = settings.uiMode === 2 ? 2 : 1; settings.uiScale = num(settings.uiScale, 0.8, 1.5, 1);   // toni #2
  settings.hintsOpen = settings.hintsOpen ? 1 : 0;   // toni r14 #2:提示收合旗標
  if (!settings.uiPos || typeof settings.uiPos !== "object" || Array.isArray(settings.uiPos)) settings.uiPos = {};
})();
function saveSettings() { try { localStorage.setItem("tiantanglu_settings_v1", JSON.stringify(settings)); } catch (e) { } }
let cleared = false;   // 破關旗標(走完天堂路→一眼瞬間):持久化
try { cleared = localStorage.getItem("tiantanglu_cleared_v1") === "1"; } catch (e) { }
let clearedHard = false;   // 走完「天堂路(最難 diff5)」旗標:破過最難後結局選單不再出現「再次挑戰」(toni #8)
try { clearedHard = localStorage.getItem("tiantanglu_cleared_hard_v1") === "1"; } catch (e) { }
// 劇情(1)解鎖:預設隱藏,完成 顧牛 + 翻日記 + 看反穿外套 三互動才解鎖(toni #4);各步驟旗標持久化(可跨 session 累積)
let storyUnlocked = false, seenCow = false, seenDiary = false, seenJacket = false;
try { storyUnlocked = localStorage.getItem("tiantanglu_story_unlocked_v1") === "1"; } catch (e) { }
try { seenCow = localStorage.getItem("tiantanglu_seen_cow_v1") === "1"; } catch (e) { }
try { seenDiary = localStorage.getItem("tiantanglu_seen_diary_v1") === "1"; } catch (e) { }
try { seenJacket = localStorage.getItem("tiantanglu_seen_jacket_v1") === "1"; } catch (e) { }
// 難度可選性(toni #4 Q2):劇情(1)需 storyUnlocked;新手(2)恆可選(破關後不再強制升正常,難度不再單向只能變難);普通/困難/天堂路(3-5)恆可選
function diffAllowed(d) { if (d === 1) return storyUnlocked; if (d === 2) return true; return d >= 3 && d <= 5; }
function clampDifficulty() { if (!diffAllowed(settings.difficulty)) { settings.difficulty = 3; saveSettings(); } }   // 目前難度不可選(僅剩:劇情未解鎖時停在劇情)→夾到普通(3);新手破關後不再被夾(diffAllowed(2) 恆 true)
clampDifficulty();
let refreshDiffSlider = null;   // 由 bindDifficulty 設定:解鎖/破關當下即時重繪難度鈕
function markCleared() { if (cleared) return; cleared = true; try { localStorage.setItem("tiantanglu_cleared_v1", "1"); } catch (e) { } clampDifficulty(); if (refreshDiffSlider) refreshDiffSlider(); }
function applyCrosshair() { const r = document.documentElement.style; r.setProperty("--ch-size", settings.chSize + "px"); r.setProperty("--ch-gap", settings.chGap + "px"); r.setProperty("--ch-thick", settings.chThick + "px"); r.setProperty("--ch-color", /^#[0-9a-fA-F]{6}$/.test(settings.chColor) ? settings.chColor : "#7dff8a"); }   // 消費點也守 hex(belt-and-suspenders,擋 chColor → CSS url() 外洩)
applyCrosshair();
function applyHicon() { document.body.classList.toggle("hicon", !!settings.hicon); }   // 高對比模式:全 UI 文字/面板/準星增強對比(報告無障礙建議,toni #8 選項3)
applyHicon();
const UI_MOVABLE = ["tj", "tj-look", "tb-fire", "tb-firel", "tb-firer", "tb-jump", "tb-aim", "tb-reload", "tb-wpn", "tb-act", "tb-shop", "tb-arty", "tb-crouch", "tb-walk"];   // toni #2:可自訂位置的觸控元件
function uiOri() { return (window.matchMedia && window.matchMedia("(orientation: landscape)").matches) ? "landscape" : "portrait"; }   // 自訂位置依直/橫向分桶,旋轉後各用各的座標
function applyUI() {   // toni #2:套用操作模式 / 全域大小 / 自訂位置
  document.body.classList.toggle("uimode2", settings.uiMode === 2);
  document.documentElement.style.setProperty("--uiscale", settings.uiScale || 1);
  document.body.classList.toggle("uiscaled", (settings.uiScale || 1) !== 1);
  let up = settings.uiPos || {};
  if (Object.keys(up).some((k) => k !== "portrait" && k !== "landscape")) { const mv = {}; for (const k in up) if (UI_MOVABLE.indexOf(k) >= 0) mv[k] = up[k]; up = {}; up[uiOri()] = mv; settings.uiPos = up; saveSettings(); }   // 遷移舊版扁平 uiPos→當前方向桶(另一方向回預設版位,修旋轉後按鈕落亂位且永久蓋掉另一方向)
  const pos = up[uiOri()] || {};
  UI_MOVABLE.forEach((id) => {
    const el = document.getElementById(id); if (!el) return;
    const p = pos[id];
    if (p && isFinite(p.l) && isFinite(p.t)) { const l = Math.max(0, Math.min(innerWidth - el.offsetWidth, p.l)), t = Math.max(0, Math.min(innerHeight - el.offsetHeight, p.t)); el.style.left = l + "px"; el.style.top = t + "px"; el.style.right = "auto"; el.style.bottom = "auto"; }   // 夾擠到當前視窗,旋轉/改尺寸後按鈕不跑出畫面外
    else { el.style.left = ""; el.style.top = ""; el.style.right = ""; el.style.bottom = ""; }
  });
}
applyUI();
function haptic(ms) { if (isTouch && settings.haptic && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }   // 手機被擊中震動回饋(toni #8 確認手機被擊中自動觸發;桌機無 vibrate→無作用)
if (settings.hintsOpen) document.body.classList.add("hints-on");   // toni r14 #2:提示預設收合(無 hints-on),記住玩家選擇
{ const _ht = document.getElementById("hint-toggle"); if (_ht) _ht.addEventListener("click", () => { settings.hintsOpen = document.body.classList.toggle("hints-on") ? 1 : 0; saveSettings(); }); }
function ensureAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); masterGain = actx.createGain(); masterGain.gain.value = settings.vol * 0.85; const comp = actx.createDynamicsCompressor(); comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.003; comp.release.value = 0.18; masterGain.connect(comp); comp.connect(actx.destination); buildGunBus(); } catch (e) { } } if (actx && actx.state === "suspended") actx.resume(); startAmbient(); }   // 加總限制器(密集槍聲+多敵+爆炸不再硬切削峰)+ 0.85 headroom
let masterMuted = false;   // toni #1:全域靜音(看故事時可關全部遊戲聲);reader in-iframe bar 的 🔊 鈕透過 postMessage 切換
function applyMasterVol() { if (masterGain) masterGain.gain.value = masterMuted ? 0 : settings.vol * 0.85; }   // 音量滑桿與靜音共用:靜音時鎖 0,否則套 0.85 headroom
function setMasterMute(b) {   // 一鍵靜音「所有」遊戲音訊:Web Audio(sfx/ambient/槍聲匯流排)+ 戰鬥/結局兩個 HTMLAudio
  masterMuted = !!b; applyMasterVol();
  try { if (music) music.muted = masterMuted; } catch (e) { }       // 戰鬥/實戰主題曲
  try { if (gazeMusic) gazeMusic.muted = masterMuted; } catch (e) { }   // 一眼瞬間(結局/看故事 loop)
}
function buildGunBus() {   // 槍聲 slap-back:乾聲直送 + 一路 send 進延遲回授(遠處建物彈回的空曠回聲)
  if (gunBus || !actx || !masterGain) return;
  gunBus = actx.createGain(); gunBus.gain.value = 1; gunBus.connect(masterGain);   // 乾聲
  const send = actx.createGain(); send.gain.value = 0.3; gunBus.connect(send);
  const delay = actx.createDelay(0.5); delay.delayTime.value = 0.17;
  const fb = actx.createGain(); fb.gain.value = 0.26;
  const lp = actx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700;
  send.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(masterGain);   // 延遲→低通→回授(數次遞減 repeats)→輸出
}
/* ── 音樂:進觸發點(sim 熔爐)才播,離開自動淡出停;聲音=相信「相信的力量」(EP40 韌性主題曲) ── */
const MUSIC_SIM = "../相信「相信的力量」.mp3";   // 同源 mp3(CSP media-src 'self')
let music = null, musicUrl = null, musicTarget = 0, musicCur = 0, moodSim = 0, skyDarkCur = 0;
function playMusic(url) {
  if (musicUrl !== url) { if (music) { try { music.pause(); } catch (e) { } } music = new Audio(url); music.loop = true; music.volume = 0; musicUrl = url; musicCur = 0; }
  musicTarget = 1; music.play().catch(() => { });   // autoplay 需 user gesture;enterSim 由 KeyE / 重新部署點擊觸發,符合
}
function stopMusic() { musicTarget = 0; }
function updateMusic(dt) {
  if (!music) return;
  musicCur += (musicTarget - musicCur) * Math.min(1, dt * 1.6);   // ~0.6s 淡入 / 淡出
  music.volume = Math.max(0, Math.min(1, musicCur)) * (settings.vol != null ? settings.vol : 0.8) * 0.5;   // 比 SFX 小聲,隨音量設定連動
  if (musicTarget === 0 && musicCur < 0.02 && !music.paused) { try { music.pause(); music.currentTime = 0; } catch (e) { } }
}
function audioOut(out) { return out || masterGain || (actx && actx.destination); }
function panner(pos, model) { const p = actx.createPanner(); p.panningModel = model || "HRTF"; p.distanceModel = "inverse"; p.refDistance = 6; p.maxDistance = 90; p.rolloffFactor = 1.1; if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z); p.connect(audioOut()); return p; }   // model='equalpower' 便宜很多(腳步等次要音用)
function updateListener() { if (!actx) return; const l = actx.listener, p = camera.position; camera.getWorldDirection(tmpD); if (l.positionX) { l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z; l.forwardX.value = tmpD.x; l.forwardY.value = tmpD.y; l.forwardZ.value = tmpD.z; l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0; } else { l.setPosition(p.x, p.y, p.z); l.setOrientation(tmpD.x, tmpD.y, tmpD.z, 0, 1, 0); } }
function noiseBuf(dur) { const n = Math.max(1, Math.floor(actx.sampleRate * dur)); const b = actx.createBuffer(1, n, actx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
function adsr(g, t0, a, peak, d) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
let _noise2s = null;   // 共用 2s 白噪 buffer:noiseHit 每秒被叫數十次,原本每次 new buffer + 填亂數 → GC churn,中低階手機爆音/掉拍。改成共用 + 隨機起點(順便每發自然變化)
function noiseBuf2s() { if (_noise2s) return _noise2s; const n = Math.floor(actx.sampleRate * 2); _noise2s = actx.createBuffer(1, n, actx.sampleRate); const d = _noise2s.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return _noise2s; }
function noiseHit(dur, f0, f1, peak, type, out) { if (!actx) return; const t0 = actx.currentTime; const s = actx.createBufferSource(); s.buffer = noiseBuf2s(); s.loop = true; const lp = actx.createBiquadFilter(); lp.type = type || "lowpass"; lp.frequency.setValueAtTime(f0, t0); lp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur); const g = actx.createGain(); adsr(g, t0, 0.002, peak, dur); s.connect(lp).connect(g).connect(audioOut(out)); s.start(t0, Math.random() * 1.8); s.stop(t0 + dur + 0.02); }   // 零 per-call 配置;隨機起點=每發微變
function tone(f0, f1, dur, peak, wave, out) { const t0 = actx.currentTime; const o = actx.createOscillator(); o.type = wave || "sine"; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); const g = actx.createGain(); adsr(g, t0, 0.003, peak, dur); o.connect(g).connect(audioOut(out)); o.start(t0); o.stop(t0 + dur + 0.02); }
function sfxShot(type) {
  if (!actx) return; const r = () => 1 + (Math.random() - 0.5) * 0.16;   // ±8% 每發抖動,連射不像影印機跳針
  noiseHit(0.04, (type === "auto" ? 5200 : 6000) * r(), 2200, type === "auto" ? 0.34 : 0.42, "highpass", gunBus);   // (1) 高頻爆裂 crack:短促亮響=「劈」的那一下
  noiseHit(0.14 * r(), (type === "auto" ? 2600 : 1800) * r(), 400, type === "auto" ? 0.46 : 0.55, undefined, gunBus);   // (2) 槍身 body(每發微變)
  tone(150 * r(), 52, 0.12, 0.4, undefined, gunBus);   // (3) 低頻 thump(微變音高,胸腔感)
}
function sfxStep(crouch) { if (!actx) return; noiseHit(0.07, crouch ? 460 : 820, crouch ? 200 : 320, crouch ? 0.1 : 0.18); }
function sfxSwoosh() { if (!actx) return; noiseHit(0.22, 300, 1600, 0.22, "bandpass"); }
function sfxExplode(pos) { if (!actx) return; const o = pos ? panner(pos) : null; noiseHit(0.7, 1200, 60, 0.85, "lowpass", o); tone(120, 28, 0.6, 0.7, "sine", o); tone(60, 20, 0.9, 0.5, "sine", o); }
function sfxReload(name, dur) {
  if (!actx) return; const D = (dur || 2.4) * 1000, at = (frac, fn) => setTimeout(fn, frac * D);
  const magOut = () => noiseHit(0.06, 1300, 600, 0.2), magIn = () => { noiseHit(0.05, 900, 420, 0.24); tone(150, 90, 0.05, 0.14, "square"); };
  if (name === "機關槍") { at(0.08, () => noiseHit(0.1, 700, 260, 0.26)); for (let i = 0; i < 6; i++) at(0.25 + i * 0.06, () => noiseHit(0.03, 1600, 900, 0.12)); at(0.8, () => { noiseHit(0.09, 600, 220, 0.26); tone(120, 70, 0.06, 0.16, "square"); }); }   // 掀蓋→鋪彈鏈→拍合
  else if (name === "狙擊槍") { for (let i = 0; i < 5; i++) at(0.12 + i * 0.13, () => { noiseHit(0.04, 1500, 800, 0.18); tone(200, 120, 0.04, 0.12, "square"); }); at(0.85, () => { noiseHit(0.06, 1100, 500, 0.22); tone(160, 90, 0.05, 0.15, "square"); }); }   // 逐發壓彈→推栓
  else if (name === "步槍") { at(0.1, magOut); at(0.5, magIn); at(0.66, () => { noiseHit(0.04, 2000, 1100, 0.22); setTimeout(() => noiseHit(0.04, 1300, 700, 0.2), 90); }); }   // 退匣→插匣→拉槍栓雙段
  else { at(0.08, magOut); at(0.5, magIn); at(0.82, () => noiseHit(0.04, 2100, 1200, 0.2)); }   // 小槍:退匣→插匣→滑套釋放
}
function sfxJump() { if (!actx) return; noiseHit(0.06, 700, 400, 0.12); }
function sfxLand() { if (!actx) return; noiseHit(0.1, 500, 150, 0.28); tone(90, 50, 0.08, 0.2); }
function sfxSwitch() { if (!actx) return; noiseHit(0.05, 1600, 900, 0.18); }
function sfxDry() { if (!actx) return; noiseHit(0.04, 2200, 1400, 0.12); }
function sfxBoltCatch() { if (!actx) return; noiseHit(0.03, 2400, 1400, 0.16, "bandpass"); tone(180, 110, 0.05, 0.13, "square"); }   // 空倉槍機後定
function sfxPing() { if (!actx) return; tone(2400, 1400, 0.12, 0.18, "triangle"); }
function sfxImpact() { if (!actx) return; noiseHit(0.08, 1400, 500, 0.2); }
function sfxThud() { if (!actx) return; noiseHit(0.12, 600, 180, 0.32); tone(120, 60, 0.1, 0.22); }
function sfxBolt() { if (!actx) return; setTimeout(() => noiseHit(0.05, 1800, 900, 0.18), 120); setTimeout(() => noiseHit(0.05, 1200, 600, 0.18), 280); }
function sfxThrow() { if (!actx) return; noiseHit(0.2, 500, 1800, 0.18, "bandpass"); }
function sfxRocketFire() { if (!actx) return; noiseHit(0.45, 900, 120, 0.7, undefined, gunBus); tone(220, 60, 0.4, 0.5, undefined, gunBus); }
function sfxPunch() { if (!actx) return; noiseHit(0.1, 700, 250, 0.22); }
function sfxKnife() { if (!actx) return; noiseHit(0.14, 2600, 900, 0.2, "bandpass"); }
function sfxEnemyShot(pos) { if (!actx) return; if (!pos) { noiseHit(0.14, 1600, 350, 0.28, "lowpass", null); return; } const d = camera.position.distanceTo(pos); noiseHit(0.14, Math.max(560, 1600 - d * 22), 320, 0.34 / (1 + d * 0.04), "lowpass", panner(pos)); }   // 距離空氣吸收:遠處敵人槍聲更悶更小聲,聽得出威脅遠近(公平可讀)
function sfxEnemyStep(pos) { if (!actx) return; noiseHit(0.06, 520, 200, 0.11, "lowpass", panner(pos, "equalpower")); }   // 敵人腳步(空間音,equalpower 便宜定位:16隻同時不卡 audio thread)
function sfxHurt() { if (!actx) return; noiseHit(0.16, 500, 120, 0.4); tone(160, 70, 0.14, 0.3); }

/* ── 環境音床(無配樂時的軍營黎明氛圍:風 + 遠處低鳴 + 國旗拍動 + 鳥鳴);全程序合成,零外部檔案 ── */
let ambStarted = false, ambGain = null, flagT = 4, birdT = 6, gustT = 0;
function startAmbient() {
  if (ambStarted || !actx || !masterGain) return; ambStarted = true;
  ambGain = actx.createGain(); ambGain.gain.value = 0.0001; ambGain.connect(masterGain);
  // 風:長 noise loop → bandpass,LFO 慢調變濾波頻率(陣風明暗)
  const wind = actx.createBufferSource(); wind.buffer = noiseBuf(3); wind.loop = true;
  const wf = actx.createBiquadFilter(); wf.type = "bandpass"; wf.frequency.value = 460; wf.Q.value = 0.7;
  const wg = actx.createGain(); wg.gain.value = 0.14;
  wind.connect(wf).connect(wg).connect(ambGain); wind.start();
  const lfo = actx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 0.08;
  const lg = actx.createGain(); lg.gain.value = 230; lfo.connect(lg).connect(wf.frequency); lfo.start();
  // 遠處低鳴(開闊地的空氣感)
  const drone = actx.createOscillator(); drone.type = "triangle"; drone.frequency.value = 52;
  const dg = actx.createGain(); dg.gain.value = 0.045; drone.connect(dg).connect(ambGain); drone.start();
  ambGain.gain.exponentialRampToValueAtTime(0.85, actx.currentTime + 2.6);   // 緩淡入
}
function sfxFlag() { if (!actx) return; const n = 3 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) setTimeout(() => noiseHit(0.05 + Math.random() * 0.05, 1300, 620, 0.045, "bandpass"), i * (60 + Math.random() * 70)); }   // 國旗在風裡拍動
function sfxBird() { if (!actx) return; const b = 1800 + Math.random() * 1500; tone(b, b * 1.35, 0.08, 0.038, "triangle"); setTimeout(() => tone(b * 1.18, b * 0.92, 0.1, 0.032, "triangle"), 105); }   // 黎明遠處鳥鳴
function updateAmbient(dt) {
  if (!ambStarted) return;
  flagT -= dt; if (flagT <= 0) { sfxFlag(); flagT = 5 + Math.random() * 7; }
  birdT -= dt; if (birdT <= 0) { sfxBird(); birdT = 9 + Math.random() * 15; }
}

/* ══════════════ 第一人稱控制 + 物理 ══════════════ */
const keys = {};
const enterEl = document.getElementById("enter");
let ads = false, mouseDown = false, lastShot = 0;
const isTouch = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || ("ontouchstart" in window) || navigator.maxTouchPoints > 0 || /[?&]touch\b/i.test(location.search || "");   // 手機觸控(可 ?touch 強制)
if (isTouch) document.body.classList.add("touch");   // r16:觸控裝置一載入就加 touch class→桌機專屬「TAB」鍵帽(#gear-tab)開場前就隱藏(原本只在首次點擊才加,手機開場會閃一下)
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) { let _swR = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (!_swR) { _swR = true; location.reload(); } }); }   // r16:SW 更新後自動重載拿新資產
if (isTouch && enterEl) { const _r = enterEl.querySelector(".ring"); if (_r) _r.textContent = "點一下開始"; const _s = enterEl.querySelector(".sub"); if (_s) _s.style.display = "none"; }   // 手機版不需要滑鼠/鍵盤提示(isTouch 宣告後才用,避免 TDZ)
function actHint(suffix, sep) { return (isTouch ? "按「使用」鈕" : "按 E") + (sep != null ? sep : (isTouch ? "" : " ")) + suffix; }   // 互動鍵提示:桌機 E 鍵帶空格、手機「使用」鈕貼齊(對齊改名後的 tb-act 鈕);sep 給 · 分隔的提示用
let touchActive = false, tjx = 0, tjz = 0, tCrouch = false, tWalk = false;   // tCrouch/tWalk:手機蹲下/慢走切換鍵狀態
let lookJX = 0, lookJY = 0;   // toni #2:模式2 右下視角搖桿的當前偏移(-1..1),每幀套到 yaw/pitch
let touchAimMul = 1;   // 手機輔助瞄準(a):開鏡且準星貼近螢幕上敵人時,視角靈敏度暫時放慢讓準星「微黏」(僅 isTouch 的觸控視角處理會乘上;桌機完全不碰)
function isActive() { return document.pointerLockElement === canvas || touchActive; }   // pointer lock(桌機)或 touchActive(手機)
// 任一全螢幕 overlay(設定/軍械/日記/教學)開啟時為 true。手機輕觸常帶微小位移,touchmove 的 preventDefault 會吞掉 overlay 按鈕的 click,
// 故 overlay 開時整組 touch-look/搖桿/遊戲鈕一律讓位,讓 overlay 自己的按鈕吃到原生 click(修「軍械庫關不掉」)。
function overlayOpen() { for (const id of ["settings", "shop", "diary", "tutorial", "story", "clear", "reader-embed", "dialog", "dreamwake"]) { const e = document.getElementById(id); if (e && e.classList.contains("on")) return true; } return false; }   // 含 dialog+dreamwake:對白/舉手/起床白屏開啟時觸控視角讓位,按鈕才吃得到 click(修敘事閘+起床白屏後鏡頭被轉)
const DIGIT = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8 };
addEventListener("keydown", (e) => { if (e.code === "Space" || e.code === "Tab") e.preventDefault(); if (MODE === "gaze") return; keys[e.code] = 1; if (e.code in DIGIT) showWeapon(DIGIT[e.code]); else if (e.code === "KeyQ") { let _n = wi; for (let _i = 0; _i < WEAPONS.length; _i++) { _n = (_n + 1) % WEAPONS.length; if (WEAPONS[_n].owned) { showWeapon(_n); break; } } } else if (e.code === "KeyR") reload(); else if (e.code === "KeyE") tryInteract(); else if (e.code === "KeyH") { if (!overlayOpen()) beginDisarm(); } else if (e.code === "KeyB") { if (shopEl && shopEl.classList.contains("on")) closeShop(); else openShop(); } else if (e.code === "KeyG") callArtillery(); });   // gaze 期間鎖鍵盤(腳步/換槍/移動 SFX 不蓋過一眼瞬間);H 放下槍需無浮層(與手機鈕一致);Q 跳過未擁有武器
addEventListener("keyup", (e) => { keys[e.code] = 0; });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  ensureAudio();
  if (dead || gameOver || MODE === "gaze") return;   // 死亡/結算/一眼瞬間時不重新鎖指針,游標釋放讓玩家點「重新部署」
  if (document.pointerLockElement !== canvas) { if (canvas.requestPointerLock) canvas.requestPointerLock(); return; }
  if (e.button === 0) { mouseDown = true; if (WEAPONS[wi].type !== "auto") fire(); }
  else if (e.button === 2) { if (WEAPONS[wi].adsFov) ads = true; }
});
addEventListener("mouseup", (e) => { if (e.button === 0) mouseDown = false; else if (e.button === 2) ads = false; });
document.addEventListener("pointerlockchange", () => { if (enterEl) enterEl.classList.toggle("hide", document.pointerLockElement === canvas); if (document.pointerLockElement !== canvas) { mouseDown = false; ads = false; } else if (MODE === "hub" && !firstHubShown) { firstHubShown = true; pupilT = 2.0; showNarr(NARR.hubEnter, 4.2); showHubFirstHint(); } });   // #1 首次進軍營:夢框建立句(教學改成玩家點 📖 才開,不自動彈)+ B7 方向指引(進中山室找輔導長)
addEventListener("mousemove", (e) => { if (document.pointerLockElement === canvas) { const sens = 0.0023 * settings.sens * (camera.fov / 80) * (disarmT > 0 ? 0.22 : 1); yaw -= e.movementX * sens; pitch -= e.movementY * sens; pitch = Math.max(-1.2, Math.min(1.2, pitch)); } });   // 放下槍那 0.85s 鈍化滑鼠,讓鏡頭順勢低頭看手(韓劇運鏡,不被亂晃打斷)
/* ── 手機觸控:進場 + 左搖桿移動 + 右側拖曳視角 + 按鈕 ── */
const tbDisarmEl = document.getElementById("tb-disarm"), tbArtyEl = document.getElementById("tb-arty");
if (isTouch) {
  const touchUI = document.getElementById("touch"), tjEl = document.getElementById("tj"), tjKnob = document.getElementById("tj-knob");
  // 進場:第一次點畫面 → touchActive(取代 pointer lock)
  canvas.addEventListener("touchstart", (e) => {
    if (!touchActive && MODE !== "gaze") { touchActive = true; document.body.classList.add("touch"); if (enterEl) enterEl.classList.add("hide"); if (touchUI) touchUI.classList.add("on"); ensureAudio(); if (maskOwned && maskEl) maskEl.classList.add("on"); if (MODE === "hub" && !firstHubShown) { firstHubShown = true; pupilT = 2.0; showNarr(NARR.hubEnter, 4.2); showHubFirstHint(); } e.preventDefault(); }
  }, { passive: false });
  // 左搖桿:類比移動
  let tjId = null;
  function tjUpd(t) { const r = tjEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width / 2; let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy) || 1; if (d > max) { dx = dx / d * max; dy = dy / d * max; } tjKnob.style.transform = "translate(" + dx + "px," + dy + "px)"; tjx = dx / max; tjz = -dy / max; }
  tjEl.addEventListener("touchstart", (e) => { if (overlayOpen()) return; tjId = e.changedTouches[0].identifier; tjUpd(e.changedTouches[0]); e.preventDefault(); e.stopPropagation(); }, { passive: false });
  tjEl.addEventListener("touchmove", (e) => { for (const t of e.changedTouches) if (t.identifier === tjId) { tjUpd(t); e.preventDefault(); } }, { passive: false });
  const tjEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === tjId) { tjId = null; tjx = 0; tjz = 0; tjKnob.style.transform = ""; } };
  tjEl.addEventListener("touchend", tjEnd); tjEl.addEventListener("touchcancel", tjEnd);
  // 右側拖曳:視角(略過按鈕/搖桿/上方齒輪)
  let lookId = null, lpx = 0, lpy = 0;
  addEventListener("touchstart", (e) => { if (!touchActive || lookId !== null || overlayOpen() || document.body.classList.contains("ui-edit")) return; for (const t of e.changedTouches) { const el = document.elementFromPoint(t.clientX, t.clientY); if (el && (el.classList.contains("tbtn") || el.id === "tj" || el.id === "tj-knob" || el.id === "gear" || el.id === "hint-toggle")) continue; lookId = t.identifier; lpx = t.clientX; lpy = t.clientY; break; } }, { passive: true });
  addEventListener("touchmove", (e) => { if (lookId === null || overlayOpen() || document.body.classList.contains("ui-edit")) return; for (const t of e.changedTouches) if (t.identifier === lookId) { const s = 0.0052 * settings.sens * touchAimMul; yaw -= (t.clientX - lpx) * s; pitch -= (t.clientY - lpy) * s; pitch = Math.max(-1.2, Math.min(1.2, pitch)); lpx = t.clientX; lpy = t.clientY; e.preventDefault(); } }, { passive: false });   // 編輯模式(ui-edit)不轉鏡頭;? 提示鈕也排除,避免在其上滑動帶轉鏡頭;touchAimMul=開鏡微黏
  const lookEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; };
  addEventListener("touchend", lookEnd); addEventListener("touchcancel", lookEnd);
  // 按鈕
  const tbtn = (id, down, up) => { const el = document.getElementById(id); if (!el) return; el.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); if (overlayOpen()) return; if (down) down(); }, { passive: false }); if (up) { el.addEventListener("touchend", (e) => { e.preventDefault(); up(); }); el.addEventListener("touchcancel", up); } };
  let _fireHold = 0;   // 計數同時按住的射擊鈕(模式2 雙側鈕):放開一顆只在沒有其他鈕按住時才停火
  const fireDown = () => { _fireHold++; mouseDown = true; if (WEAPONS[wi].type !== "auto") fire(); };
  const fireUp = () => { _fireHold = Math.max(0, _fireHold - 1); if (_fireHold === 0) mouseDown = false; };
  tbtn("tb-fire", fireDown, fireUp);
  tbtn("tb-jump", () => { keys.Space = 1; setTimeout(() => { keys.Space = 0; }, 60); });
  tbtn("tb-aim", () => { ads = !ads; });
  tbtn("tb-reload", () => reload());
  tbtn("tb-wpn", () => { let n = wi; for (let i = 0; i < WEAPONS.length; i++) { n = (n + 1) % WEAPONS.length; if (WEAPONS[n].owned) { showWeapon(n); break; } } });
  tbtn("tb-act", () => { tryInteract(); });
  tbtn("tb-shop", () => { if (shopEl && shopEl.classList.contains("on")) closeShop(); else openShop(); });
  tbtn("tb-disarm", () => { beginDisarm(); });
  tbtn("tb-arty", () => { callArtillery(); });
  tbtn("tb-crouch", () => { tCrouch = !tCrouch; const e = document.getElementById("tb-crouch"); if (e) e.classList.toggle("act", tCrouch); });   // 蹲下切換(再按起身)
  tbtn("tb-walk", () => { tWalk = !tWalk; const e = document.getElementById("tb-walk"); if (e) e.classList.toggle("act", tWalk); });   // 慢走/靜步切換
  // toni #2:模式2 右下視角搖桿(右手大拇指控視角)
  const tjLookEl = document.getElementById("tj-look"), tjLookKnob = document.getElementById("tj-look-knob");
  if (tjLookEl && tjLookKnob) {
    let tjLookId = null;
    const luUpd = (t) => { const r = tjLookEl.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, max = r.width / 2 || 1; let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy) || 1; if (d > max) { dx = dx / d * max; dy = dy / d * max; } tjLookKnob.style.transform = "translate(" + dx + "px," + dy + "px)"; lookJX = dx / max; lookJY = dy / max; };
    tjLookEl.addEventListener("touchstart", (e) => { if (overlayOpen() || document.body.classList.contains("ui-edit")) return; tjLookId = e.changedTouches[0].identifier; luUpd(e.changedTouches[0]); e.preventDefault(); e.stopPropagation(); }, { passive: false });
    tjLookEl.addEventListener("touchmove", (e) => { for (const t of e.changedTouches) if (t.identifier === tjLookId) { luUpd(t); e.preventDefault(); } }, { passive: false });
    const luEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === tjLookId) { tjLookId = null; lookJX = 0; lookJY = 0; tjLookKnob.style.transform = ""; } };
    tjLookEl.addEventListener("touchend", luEnd); tjLookEl.addEventListener("touchcancel", luEnd);
  }
  // toni #2:模式2 螢幕中段雙側射擊鈕(左/右食指可點);共用 fireHold 計數避免放開一顆中斷另一顆連發
  tbtn("tb-firel", fireDown, fireUp);
  tbtn("tb-firer", fireDown, fireUp);
}

/* ── 設定選單 + 可調準星 + 結算重啟 ── */
const settingsEl = document.getElementById("settings"), gearEl = document.getElementById("gear");
let lockBeforeSettings = false;
function openSettings() { if (settingsEl) settingsEl.classList.add("on"); lockBeforeSettings = document.pointerLockElement === canvas; if (lockBeforeSettings && document.exitPointerLock) document.exitPointerLock(); }
function closeSettings() { if (settingsEl) settingsEl.classList.remove("on"); if (lockBeforeSettings && !dead && !gameOver && !isTouch && document.pointerLockElement !== canvas && canvas.requestPointerLock) canvas.requestPointerLock(); }   // 關閉時若原本在控視角則重鎖
if (gearEl) gearEl.addEventListener("click", openSettings);
const gearTabEl = document.getElementById("gear-tab"); if (gearTabEl) gearTabEl.addEventListener("click", openSettings);   // #3:齒輪下「TAB」鍵帽也可點開設定(PC 提示按 TAB)
const setCloseEl = document.getElementById("set-close"); if (setCloseEl) setCloseEl.addEventListener("click", closeSettings);
addEventListener("keydown", (e) => { if (e.code === "Tab") { e.preventDefault(); if (settingsEl && settingsEl.classList.contains("on")) closeSettings(); else openSettings(); } });   // 系統設定 TAB 開關
addEventListener("keydown", (e) => { if (e.code === "F1" || e.code === "KeyP" || e.code === "Backquote") { if (document.pointerLockElement === canvas) { e.preventDefault(); e.stopPropagation(); if (document.exitPointerLock) document.exitPointerLock(); } } }, { capture: true });   // #13:放開滑鼠 = F1 / P / ` (Mac 的 F1 預設是亮度媒體鍵,網頁收不到 keydown,故補 P 與 ` 兩個跨平台可靠鍵)。只在「指針鎖定中」才 preventDefault+stopPropagation+exit(否則未鎖定時按 P/` 不該被吃掉,也不污染移動 keys map)。注:真正按 Esc 瀏覽器仍會在底層自動解除 pointer-lock,無法攔截
function bindSetting(id, key, isColor, fn) { const el = document.getElementById(id); if (!el) return; el.value = settings[key]; el.addEventListener("input", () => { settings[key] = isColor ? el.value : parseFloat(el.value); saveSettings(); if (fn) fn(); }); }
bindSetting("set-sens", "sens", false);
bindSetting("set-vol", "vol", false, () => { applyMasterVol(); });   // 與 ensureAudio 一致的 0.85 headroom(配合限制器避免削峰);靜音時 applyMasterVol 自動鎖 0
bindSetting("set-chsize", "chSize", false, applyCrosshair);
bindSetting("set-chgap", "chGap", false, applyCrosshair);
bindSetting("set-chthick", "chThick", false, applyCrosshair);
bindSetting("set-chcolor", "chColor", true, applyCrosshair);
function bindToggle(id, key, fn) { const el = document.getElementById(id); if (!el) return; el.checked = !!settings[key]; el.addEventListener("change", () => { settings[key] = el.checked ? 1 : 0; saveSettings(); if (fn) fn(); }); }
bindToggle("set-hicon", "hicon", applyHicon);   // 高對比模式即時套用
bindToggle("set-haptic", "haptic");             // 手機震動回饋
(function bindQuality() {   // 畫質 5 級:即時套用 + 中文檔位名
  const QNAMES = { 1: "低", 2: "中低", 3: "中", 4: "中高", 5: "高" };
  const el = document.getElementById("set-quality"), val = document.getElementById("set-quality-val");
  if (!el) return; const upd = () => { if (val) val.textContent = QNAMES[settings.quality] || "中"; };
  el.value = settings.quality; upd();
  el.addEventListener("input", () => { settings.quality = Math.max(1, Math.min(5, Math.round(parseFloat(el.value)) || 3)); saveSettings(); applyQuality(settings.quality); upd(); });
})();
(function bindDifficulty() {   // toni #4:難度改「可選性」按鈕列(劇情需解鎖、新手恆可選、普通/困難/天堂路恆可);存設定,下次進實戰生效
  const DNAMES = { 1: "劇情", 2: "新手", 3: "正常", 4: "困難", 5: "天堂路" };
  const DDESC = { 1: "最寬裕 · 3 關", 2: "寬裕 · 5 關", 3: "正常 · 8 關", 4: "更準更痛 · 10 關", 5: "蛙人地獄 · 10 關" };
  const box = document.getElementById("set-diff-btns");
  if (!box) return;
  function render() {
    while (box.firstChild) box.removeChild(box.firstChild);
    for (let d = 1; d <= 5; d++) {
      if (!diffAllowed(d)) continue;
      const b = document.createElement("button"); b.type = "button";
      b.className = "diff-btn" + (settings.difficulty === d ? " on" : "") + (d === 1 ? " story" : "");
      const nm = document.createElement("span"); nm.className = "db-n"; nm.textContent = DNAMES[d];
      const ds = document.createElement("span"); ds.className = "db-d"; ds.textContent = DDESC[d];
      b.appendChild(nm); b.appendChild(ds);
      b.addEventListener("click", () => {
        if (dreamLock) { showNarr("這是夢中夢 · 你還沒醒來", 2.6); return; }   // 夢醒落入天堂路那輪:難度鎖死,不可改
        settings.difficulty = d; saveSettings();
        if (MODE === "hub") { money = startingMoney(); updateMoneyHUD(); }   // 在軍營(尚未開打)選難度→自動套該難度初始軍餉(劇情 2000)
        render();
      });
      box.appendChild(b);
    }
  }
  render();
  refreshDiffSlider = render;   // 解鎖劇情當下即時重繪可選難度(新手不再因破關被鎖)
})();
const restartBtnEl = document.getElementById("restart-btn"); if (restartBtnEl) restartBtnEl.addEventListener("click", () => { restartGame(); if (canvas.requestPointerLock) canvas.requestPointerLock(); });
(function bindTutorial() {   // 新手教學:cold-open 後進場畫面的友善教學(stopPropagation 不觸發進場)
  const btn = document.getElementById("tut-btn"), ov = document.getElementById("tutorial"), close = document.getElementById("tut-close");
  if (btn && ov) btn.addEventListener("click", (e) => { e.stopPropagation(); ov.classList.add("on"); });
  if (close && ov) close.addEventListener("click", (e) => { e.stopPropagation(); ov.classList.remove("on"); });
  // 「我只想讀大兵日記」零技巧入口:非玩家也能直達 EP40 大兵日記(不進戰鬥);stopPropagation 不觸發進場 pointerLock/touch
  const dbtn = document.getElementById("diary-btn");
  if (dbtn) dbtn.addEventListener("click", (e) => { e.stopPropagation(); openDiary(); });
})();

/* ── 軍械庫(購買裝備系統):軍餉 1000 起 / 近戰+小槍免費 / 撐過每波 +150 / 軍營或波間按 B ── */
const shopEl = document.getElementById("shop"), moneyEl = document.getElementById("money"), arEl = document.getElementById("ar"), maskEl = document.getElementById("mask");
const SHOP_ITEMS = [
  { id: "vest", nm: "防彈背心", ds: "+100 ARMOR，吸收一半傷害", price: 650, has: () => armor >= 100, buy: () => { armor = 100; updateArmorHUD(); } },
  { id: "mask", nm: "防護面罩", ds: "純氣氛特效，視野邊緣收窄（不影響戰力）", price: 350, has: () => maskOwned, buy: () => { maskOwned = true; if (maskEl) maskEl.classList.add("on"); } },
  { id: "ammo", nm: "彈藥補給", ds: "把已買的槍全部補滿備彈", price: 200, has: () => false, buy: () => { WEAPONS.forEach((w) => { if (!w.owned) return; if (w.baseReserve != null) w.reserve = Math.round(w.baseReserve * (curDiff ? curDiff.ammo : 1)); if (w.baseCount != null) w.count = Math.round(w.baseCount * (curDiff ? curDiff.ammo : 1)); }); updateHUD(); } },
  { id: "rifle", nm: "步槍", ds: "全自動 · 30 發", price: 600, wpn: "步槍" },
  { id: "mg", nm: "機關槍", ds: "100 發壓制火力", price: 900, wpn: "機關槍" },
  { id: "sniper", nm: "狙擊槍", ds: "開鏡一槍重擊", price: 750, wpn: "狙擊槍" },
  { id: "nade", nm: "手榴彈", ds: "x3 投擲爆炸", price: 300, wpn: "手榴彈" },
  { id: "rocket", nm: "火箭砲", ds: "範圍爆炸", price: 1100, wpn: "火箭砲" },
  { id: "veh_humvee", nm: "悍馬車使用權", ds: "撞擊殲敵 · 油料限制 · 車況=玩家×5", price: () => VEH_CFG.humvee.basePrice * vehPriceMul(), has: () => vehUnlocked("humvee"), hide: () => vehFreeUse(), buy: () => vehUnlock("humvee") },
  { id: "veh_howitzer", nm: "大砲使用權", ds: "站位榴彈砲 · 砲彈10發 · 車況=玩家×2", price: () => VEH_CFG.howitzer.basePrice * vehPriceMul(), has: () => vehUnlocked("howitzer"), hide: () => vehFreeUse(), buy: () => vehUnlock("howitzer") },
  { id: "veh_tank", nm: "坦克車使用權", ds: "碾過即殲 · 砲彈20發 · 車況=玩家×10", price: () => VEH_CFG.tank.basePrice * vehPriceMul(), has: () => vehUnlocked("tank"), hide: () => vehFreeUse(), buy: () => vehUnlock("tank") },
  { id: "veh_fuel", nm: "油桶", ds: "悍馬／坦克各補 +50 油料", price: 250, consumable: true, has: () => false, buy: () => vehRefuel(50) },
  { id: "veh_shell", nm: "砲彈補給", ds: "坦克 +10 · 大砲 +5 砲彈", price: 300, consumable: true, has: () => false, buy: () => vehRearm() },
  { id: "radar_map", nm: "戰術地圖", ds: "右上角雷達顯示地形與你的位置", price: () => 400 * radarPriceMul(), has: () => radarMap, hide: () => radarMapFree(), buy: () => { radarMap = true; } },
  { id: "radar_sat", nm: "衛星偵測系統", ds: "雷達上顯示敵人紅點位置", price: () => 600 * radarPriceMul(), has: () => radarSat, hide: () => radarSatFree(), buy: () => { radarSat = true; } },
];
function updateMoneyHUD() { if (moneyEl) moneyEl.textContent = money; const sm = document.getElementById("shop-money"); if (sm) sm.textContent = money; }
function updateArmorHUD() { if (arEl) arEl.textContent = Math.round(armor); }
function itemOwned(it) { if (it.wpn) { const w = WEAPONS.find((x) => x.name === it.wpn); return !!(w && w.owned); } return it.has ? it.has() : false; }
function itemPrice(it) { return typeof it.price === "function" ? it.price() : it.price; }   // 價格可為函式(載具使用權隨模式變動)
function itemConsumable(it) { return it.consumable || it.id === "ammo"; }   // 補給類(彈藥/油桶/砲彈)可重複買,不算「已擁有」
function buyItem(it) {
  const price = itemPrice(it);
  if (money < price || (!itemConsumable(it) && itemOwned(it))) return;
  money -= price;
  if (it.wpn) { const w = WEAPONS.find((x) => x.name === it.wpn); if (w) { w.owned = true; if (w.baseReserve != null) w.reserve = Math.round(w.baseReserve * (curDiff ? curDiff.ammo : 1)); if (w.baseCount != null) w.count = Math.round(w.baseCount * (curDiff ? curDiff.ammo : 1)); } }
  else if (it.buy) it.buy();
  if (actx) tone(620, 880, 0.09, 0.12, "sine"); updateMoneyHUD(); renderShop();
}
function renderShop() {
  const list = document.getElementById("shop-list"); if (!list) return; updateMoneyHUD();
  while (list.firstChild) list.removeChild(list.firstChild);
  for (const it of SHOP_ITEMS) {
    if (it.hide && it.hide()) continue;   // 隱藏不適用商品(載具使用權在劇情/新手免費→不顯示)
    const price = itemPrice(it);
    const owned = !itemConsumable(it) && itemOwned(it);
    const row = document.createElement("div"); row.className = "item" + (owned ? " owned" : "");
    const info = document.createElement("div"); info.className = "nm"; info.textContent = it.nm;
    const ds = document.createElement("div"); ds.className = "ds"; ds.textContent = it.ds; info.appendChild(ds); row.appendChild(info);
    const pr = document.createElement("div"); pr.className = "pr"; pr.textContent = "$" + price; row.appendChild(pr);
    const btn = document.createElement("button"); btn.type = "button"; btn.textContent = owned ? "已擁有" : "購買"; btn.disabled = owned || money < price;
    btn.addEventListener("click", () => buyItem(it)); row.appendChild(btn);
    list.appendChild(row);
  }
}
function shopOpenable() { return !dead && !gameOver && (MODE === "hub" || (MODE === "sim" && inBreak)); }
function openShop() { if (!shopEl || !shopOpenable()) return; shopEl.classList.add("on"); renderShop(); if (MODE === "sim" && inBreak) shopPause = true; if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }   // 波間開軍械庫:暫停倒數(玩家慢慢買)
function openShopPause() { if (MODE !== "sim") return; betweenT = 8; }   // 波間/重啟:給~8秒倒數休息(不自動彈購買,改提示按B;item 1 防誤觸),按B才開購買並暫停
function closeShop() { if (shopEl) shopEl.classList.remove("on"); if (shopPause) { shopPause = false; betweenT = 1.5; if (!dead && !gameOver && MODE === "sim" && !isTouch && document.pointerLockElement !== canvas && canvas.requestPointerLock) canvas.requestPointerLock(); } }   // 關閉軍械庫=續倒數 1.5s 開下一波,桌機重鎖指針
if (document.getElementById("shop-close")) document.getElementById("shop-close").addEventListener("click", closeShop);
// 點 overlay 背景空白(非 .panel 內)即關閉 — 手機多一條保險出口,避免卡在介面裡
function backdropClose(overlayId, closeFn) { const ov = document.getElementById(overlayId); if (!ov) return; ov.addEventListener("click", (e) => { if (e.target === ov) closeFn(); }); }
backdropClose("shop", closeShop);
backdropClose("settings", closeSettings);
backdropClose("diary", () => { if (diaryEl) diaryEl.classList.remove("on"); });
backdropClose("tutorial", () => { const t = document.getElementById("tutorial"); if (t) t.classList.remove("on"); });

/* ── 特效資源 ── */
const fireTex = tex((c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, "rgba(255,250,235,1)"); g.addColorStop(0.25, "rgba(255,212,120,1)"); g.addColorStop(0.55, "rgba(240,120,40,0.9)"); g.addColorStop(1, "rgba(120,30,10,0)"); c.fillStyle = g; c.fillRect(0, 0, S, S); }, 128);
const smokeTex = tex((c, S) => { for (let i = 0; i < 14; i++) { const x = S / 2 + (Math.random() - 0.5) * S * 0.5, y = S / 2 + (Math.random() - 0.5) * S * 0.5, r = S * 0.18 + Math.random() * S * 0.18; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }, 128);
const decalTex = tex((c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, "rgba(18,14,10,0.92)"); g.addColorStop(0.55, "rgba(18,14,10,0.5)"); g.addColorStop(1, "rgba(18,14,10,0)"); c.fillStyle = g; c.fillRect(0, 0, S, S); }, 64);
const debrisMat = new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.8, metalness: 0.3 });
const effects = [];
let shake = 0;
// 彈孔貼花池
const decals = []; let decalI = 0;
for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: decalTex, transparent: true, depthWrite: false, opacity: 0.85, fog: false })); s.scale.setScalar(0.16); s.visible = false; s.raycast = RC_NOOP; scene.add(s); decals.push(s); }
function putDecal(p) { const s = decals[decalI = (decalI + 1) % decals.length]; s.position.copy(p); s.visible = true; }
// 池化高頻特效(火花/灰塵/火箭尾煙)— 每槽自帶 material,只重用不 new
function makeFxPool(n, makeMat) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(makeMat()); s.visible = false; s.raycast = RC_NOOP; scene.add(s); a.push({ s, on: false, t: 0, life: 0, base: 0, grow: 0, add: false }); } a._i = 0; return a; }
const sparkPool = makeFxPool(24, () => new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
const dustPool = makeFxPool(24, () => new THREE.SpriteMaterial({ map: smokeTex, color: 0x9a8d70, transparent: true, depthWrite: false, fog: false }));
const trailPool = makeFxPool(48, () => new THREE.SpriteMaterial({ map: smokeTex, color: 0x8a8276, transparent: true, depthWrite: false, fog: false }));
function emitFx(pool, pos, life, base, grow, add) { const e = pool[pool._i = (pool._i + 1) % pool.length]; e.s.position.copy(pos); e.s.scale.setScalar(base); e.s.material.opacity = add ? 0.9 : 0.6; e.s.visible = true; e.on = true; e.t = 0; e.life = life; e.base = base; e.grow = grow; e.add = add; }
function updateFxPool(pool, dt) { for (const e of pool) { if (!e.on) continue; e.t += dt; const k = e.t / e.life; if (k >= 1) { e.on = false; e.s.visible = false; continue; } e.s.material.opacity = (e.add ? 0.9 : 0.6) * (1 - k); e.s.scale.setScalar(e.base + e.grow * k); } }
function spark(pos) { emitFx(sparkPool, pos, 0.16, 0.32, 0.4, true); }
function dust(pos) { emitFx(dustPool, pos, 0.5, 0.3, 1.0, false); }
function sfxRicochet() { if (!actx) return; noiseHit(0.05, 3200, 1400, 0.16, "bandpass"); tone(2600, 900, 0.12, 0.14, "triangle"); }   // 金屬跳彈 ping
function sfxWoodHit() { if (!actx) return; noiseHit(0.08, 900, 300, 0.22); tone(180, 90, 0.07, 0.16, "square"); }            // 木頭悶響
function sfxDirtHit() { if (!actx) return; noiseHit(0.12, 420, 130, 0.24, "lowpass"); }                                       // 泥土噗
// 表面判定:物件標記 surface 優先,油桶=金屬,低處=泥土,其餘=混凝土
function surfaceOf(hitObj, point) { let p = hitObj; while (p) { const u = p.userData; if (u && u.surface) return u.surface; if (u && u.kind === "barrel") return "metal"; p = p.parent; } return point.y < 0.3 ? "dirt" : "concrete"; }
const _imp = new THREE.Vector3();
const _projStep = new THREE.Vector3(), _projDir = new THREE.Vector3(), _projLook = new THREE.Vector3(), _shellNp = new THREE.Vector3(), _shellDir = new THREE.Vector3();   // 投射物/砲彈熱迴圈 scratch:免每幀 clone(對齊既有 tmpO/_ejP 慣例)
// 分材質彈著:金屬跳彈火花 / 木屑 / 泥土揚塵 / 混凝土灰 / 沙包悶噗
function impact(point, surf, pw) {
  pw = pw || 1;   // 彈種威力:小槍輕一抹,狙擊槍重一炸(火花/揚塵量隨之,pw=1=步槍基準)
  const p = point.clone().addScaledVector(tmpD, -0.03);
  surf = surf || "dirt";
  if (surf === "metal") { const n = Math.round(3 * pw); for (let i = 0; i < n; i++) { _imp.copy(p); _imp.x += (Math.random() - 0.5) * 0.16; _imp.y += (Math.random() - 0.5) * 0.16; spark(_imp); } putDecal(p); sfxRicochet(); }   // 鐵桶:火花四濺 + 跳彈,無揚塵
  else if (surf === "wood") { dust(p); const n = Math.round(2 * pw); for (let i = 0; i < n; i++) { _imp.copy(p); _imp.y += 0.1 * i; spark(_imp); } putDecal(p); sfxWoodHit(); }   // 木箱:木屑 + 悶響
  else if (surf === "sand") { const n = Math.round(2 * pw); for (let i = 0; i < n; i++) dust(p); sfxDirtHit(); }   // 沙包:多揚塵悶噗,無火花無彈孔
  else if (surf === "concrete") { dust(p); const n = Math.max(1, Math.round(pw)); for (let i = 0; i < n; i++) spark(p); putDecal(p); sfxImpact(); }   // 混凝土:灰粉 + 小火花 + 彈孔
  else { const n = Math.round(2 * pw); for (let i = 0; i < n; i++) dust(p); putDecal(p); sfxDirtHit(); }   // 泥土:大揚塵,無火花
}

/* ── 命中判定 ── */
const ray = new THREE.Raycaster(); const tmpO = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpO2 = new THREE.Vector3();
let mvMoving = false, mvCrouch = false, grounded = true, sprayCount = 0;
function spreadOf(w) {
  const still = grounded && !mvMoving && !mvCrouch;
  if (w.scope && ads && still) return 0;                          // 開鏡狙擊站定:所見即所中(呼應計算手→一發精算)
  if (still && sprayCount === 0 && w.type !== "auto") return 0.0006;   // 站定第一發近乎必中準星中心(CS first-shot accuracy:點射/單發可信)
  let s = w.type === "auto" ? 0.006 : 0.003; if (w.recoilMul) s *= w.recoilMul * 0.7;
  if (!grounded) s += 0.06; else if (mvMoving) s += 0.022; else if (mvCrouch) s *= 0.4;
  s += sprayCount * (w.type === "auto" ? 0.0013 : 0.004);        // 全自動連射的亂數抖動降到 1/3,讓垂直爬升(sprayPitch)主導=可背可壓的噴口型;半自動維持原樣
  return s;
}
function findHit(o) { let p = o; while (p) { if (p.userData && p.userData.kind) return p; p = p.parent; } return null; }
/* 手機輔助瞄準:回傳最靠準星(前方小角錐內)且未被掩體擋住的存活敵人 + 偏角(rad)。maxCos=cos(角錐半角);僅 isTouch 呼叫,桌機行為不變 */
const _aaDir = new THREE.Vector3(), _aaTo = new THREE.Vector3();
function nearestEnemyInCone(maxCos) {
  camera.getWorldPosition(tmpO); camera.getWorldDirection(_aaDir);
  let best = null, bestCos = maxCos, bestAng = 0;
  for (const g of enemies) {
    if (g.userData.dead || g.userData.apparition) continue;   // 已死/蛙人幻影不輔助
    _aaTo.copy(g.position).setY(1.2).sub(tmpO); const d = _aaTo.length(); if (d < 1.2 || d > 70) continue; _aaTo.multiplyScalar(1 / d);
    const cos = _aaDir.dot(_aaTo); if (cos <= bestCos) continue;
    if (coverBlocked(tmpO.x, tmpO.z, g.position.x, g.position.z)) continue;   // 隔牆/木箱不黏不命中
    bestCos = cos; best = g; bestAng = Math.acos(Math.min(1, cos));
  }
  return best ? { enemy: best, ang: bestAng } : null;
}
function killBarrel(o) { o.userData.dead = true; o.visible = false; const i = explosives.indexOf(o); if (i >= 0) explosives.splice(i, 1); }
/* ── 退殼系統:黃銅彈殼從拋殼口飛出,受重力 + 地面彈跳;每把槍殼大小不同(小槍小殼 / 狙擊大殼) ── */
const casingMat = new THREE.MeshStandardMaterial({ color: 0xc7a23c, metalness: 0.85, roughness: 0.33, envMapIntensity: 1.2 });
const casings = []; let casingI = 0;
for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.024, 0.085, 6), casingMat); m.visible = false; scene.add(m); casings.push({ m, on: false, v: new THREE.Vector3(), spin: new THREE.Vector3(), t: 0, life: 0 }); }
const _ejP = new THREE.Vector3(), _ejF = new THREE.Vector3(), _ejR = new THREE.Vector3();
function ejectCasing(scale) {
  const c = casings[casingI = (casingI + 1) % casings.length];
  camera.getWorldPosition(_ejP); camera.getWorldDirection(_ejF); _ejR.crossVectors(_ejF, UP).normalize();
  c.m.position.copy(_ejP).addScaledVector(_ejF, 0.5).addScaledVector(_ejR, 0.26); c.m.position.y -= 0.2;   // 拋殼口大致位置(右前下)
  c.m.scale.setScalar(scale);
  c.v.copy(_ejR).multiplyScalar(2.6 + Math.random() * 1.3); c.v.y = 2.0 + Math.random(); c.v.addScaledVector(_ejF, -0.5 - Math.random() * 0.5);   // 往右上後彈出
  c.spin.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26);
  c.on = true; c.t = 0; c.life = 2.0; c.m.visible = true;
}
function updateCasings(dt) {
  for (const c of casings) {
    if (!c.on) continue; c.t += dt; c.v.y -= GRAV_DEBRIS * dt;
    c.m.position.addScaledVector(c.v, dt);
    c.m.rotation.x += c.spin.x * dt; c.m.rotation.y += c.spin.y * dt; c.m.rotation.z += c.spin.z * dt;
    if (c.m.position.y < 0.04) { c.m.position.y = 0.04; c.v.y *= -0.32; c.v.x *= 0.55; c.v.z *= 0.55; c.spin.multiplyScalar(0.4); }   // 落地彈跳 + 滾動衰減
    if (c.t >= c.life) { c.on = false; c.m.visible = false; }
  }
}
/* ── 換彈空彈匣掉落:退匣那一刻從槍下方掉一個空彈匣,受重力落地(每把槍尺寸不同) ── */
const magMat = new THREE.MeshStandardMaterial({ color: 0x2a2824, metalness: 0.35, roughness: 0.6 });
const mags = []; let magI = 0;
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.08), magMat); m.visible = false; m.castShadow = true; scene.add(m); mags.push({ m, on: false, v: new THREE.Vector3(), spin: new THREE.Vector3(), t: 0, life: 0 }); }
const MAGSCALE = { "小槍": 0.8, "步槍": 1.0, "機關槍": 1.3, "狙擊槍": 0.7 };
function dropMag(name) {
  const sc = MAGSCALE[name]; if (sc == null) return;
  const c = mags[magI = (magI + 1) % mags.length];
  camera.getWorldPosition(_ejP); camera.getWorldDirection(_ejF); _ejR.crossVectors(_ejF, UP).normalize();
  c.m.position.copy(_ejP).addScaledVector(_ejF, 0.45).addScaledVector(_ejR, 0.12); c.m.position.y -= 0.32;   // 彈匣井下方
  c.m.scale.setScalar(sc);
  c.v.copy(_ejF).multiplyScalar(0.3).addScaledVector(_ejR, (Math.random() - 0.5) * 0.4); c.v.y = -0.6;   // 主要往下掉
  c.spin.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6);
  c.on = true; c.t = 0; c.life = 3.0; c.m.visible = true;
}
function updateMags(dt) {
  for (const c of mags) {
    if (!c.on) continue; c.t += dt; c.v.y -= GRAV_DEBRIS * dt;
    c.m.position.addScaledVector(c.v, dt);
    c.m.rotation.x += c.spin.x * dt; c.m.rotation.y += c.spin.y * dt; c.m.rotation.z += c.spin.z * dt;
    const floor = 0.06 * c.m.scale.x; if (c.m.position.y < floor) { c.m.position.y = floor; c.v.y *= -0.25; c.v.x *= 0.5; c.v.z *= 0.5; c.spin.multiplyScalar(0.3); }
    if (c.t >= c.life) { c.on = false; c.m.visible = false; }
  }
}
// 每把槍擊發的物理差異:cas=彈殼大小 / sm=槍口煙[life,base,grow]
const WMUZZLE = {
  "小槍": { cas: 0.72, sm: [0.22, 0.08, 0.32] },
  "步槍": { cas: 1.0, sm: [0.3, 0.13, 0.48] },
  "機關槍": { cas: 1.0, sm: [0.38, 0.16, 0.66] },
  "狙擊槍": { cas: 1.55, sm: [0.6, 0.22, 1.05] },
};
function fire() {
  if (!isActive() || dead || vehicle || disarmT > 0) return;   // 駕駛中左鍵=戰車開炮(updateVehicle 處理),不開手持武器;放下槍動作期間不開火
  if (drawT > 0 || reloadT > 0) return;   // 拔槍/換彈動畫期間不能開火
  const w = WEAPONS[wi];
  if (w.type === "melee") { if (w.swingT <= 0) { w.swingT = w.swingDur || 0.3; (w.name === "鐵鎚" ? sfxThud : w.name === "小刀" ? sfxKnife : sfxSwoosh)(); meleeHit(w); } return; }
  if (w.type === "throw") { if (w.swingT <= 0) { w.swingT = 0.45; throwGrenade(w); } return; }
  if (w.type === "launcher") { if (realT - lastShot < w.rate) return; lastShot = realT; fireRocket(w); return; }
  if (realT - lastShot < w.rate) return; lastShot = realT;   // 半自動/全自動統一射速節流:狂點滑鼠/連點觸控不再超出設計 RPM(auto 由 update loop 也擋,semi 全靠這裡;含空槍乾擊也照節奏)
  if (w.ammo <= 0) { sfxBoltCatch(); return; }   // 空槍扣扳機:槍機已後定的金屬扣響(非近戰乾擊)
  w.ammo--; updateHUD(); if (w.ammo === 0) setTimeout(sfxBoltCatch, 70);   // 打掉最後一發:槍機後定
  chSpread = Math.min(30, chSpread + (w.type === "auto" ? 5 : 9)); recoilKick = Math.min(0.22, recoilKick + (w.type === "auto" ? 0.02 : 0.05) * (w.recoilMul || 1));
  const spr = WSPRAY[w.name] || 0; sprayPitch = Math.min(0.17, sprayPitch + spr); sprayYaw += Math.sin(sprayCount * 0.8) * spr * 0.6;
  sprayCount++; sprayResetT = 0.35; w.muzzleT = 0.05; sfxShot(w.type); if (w.scope) sfxBolt();
  flashMuzzleLight(w); addKick(w.name);
  if (w.muzzle) { w.muzzle.getWorldPosition(tmpO); const fx = WMUZZLE[w.name]; if (fx) { emitFx(dustPool, tmpO, fx.sm[0], fx.sm[1], fx.sm[2], false); ejectCasing(fx.cas); } else emitFx(dustPool, tmpO, 0.3, 0.14, 0.45, false); }
  shootHit(w);
}
function shootHit(w) {
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD);
  let s = spreadOf(w); if (ads) s *= 0.45;
  tmpD.x += (Math.random() - 0.5) * s; tmpD.y += (Math.random() - 0.5) * s; tmpD.z += (Math.random() - 0.5) * s; tmpD.normalize();
  ray.set(tmpO, tmpD); ray.far = 300; const h = ray.intersectObject(ROOT, true);
  if (w.muzzle && w.tracerEvery) { w.muzzle.getWorldPosition(tmpO2); const ex = h.length ? h[0].point.x : tmpO.x + tmpD.x * 140, ey = h.length ? h[0].point.y : tmpO.y + tmpD.y * 140, ez = h.length ? h[0].point.z : tmpO.z + tmpD.z * 140; w._shotN = (w._shotN || 0) + 1; const td = Math.hypot(ex - tmpO2.x, ey - tmpO2.y, ez - tmpO2.z); if (w._shotN % w.tracerEvery === 0 && td > 8) tracer(tmpO2.x, tmpO2.y, tmpO2.z, ex, ey, ez, w.tracerColor, w.tracerOp); }   // 曳光彈:每把槍頻率/顏色不同,貼臉(<8m)不畫,小槍不發
  if (!h.length) { touchAimRescue(w); return; }   // 完全打空:手機補一個小角錐近失救援(桌機不觸發)
  if (h[0].object.userData && h[0].object.userData.glass && !h[0].object.userData.broken) { breakGlass(h[0].object, h[0].point); return; }   // 可破窗:擊中→碎(在 findHit 前判,玻璃無 kind)
  const o = findHit(h[0].object);
  if (o && o.userData.kind === "barrel") { if (o.userData.boom) { const p = o.position.clone(); killBarrel(o); explode(p, 0, false); } else impact(h[0].point, "metal", WIMPACT[w.name] || 1); }
  else if (o && o.userData.kind === "enemy") { const hs = !!(h[0].object.userData && h[0].object.userData.head); hitEnemy(o, (WDMG[w.name] || 30) * (hs ? 2.6 : 1), hs, h[0].point); }
  else if (o && o.userData.kind === "target") targetHit(o);
  else { if (!touchAimRescue(w)) impact(h[0].point, surfaceOf(h[0].object, h[0].point), WIMPACT[w.name] || 1); }   // 打中地面/牆但近失敵人:手機讓最接近準星的敵人仍受擊(桌機照舊只留彈著)
}
/* 手機輔助瞄準(b):打空/近失時,讓最靠準星(~2.2°小角錐)的存活敵人仍受擊。溫和,非鎖頭/非自動開火/不加分;桌機不觸發 */
function touchAimRescue(w) {
  if (!isTouch) return false;
  const r = nearestEnemyInCone(0.99925);   // cos(~2.2°);角錐很窄,只救「明明對準卻擦過」的近失
  if (!r) return false;
  hitEnemy(r.enemy, WDMG[w.name] || 30, false, r.enemy.position.clone().setY(1.2)); return true;   // 不算爆頭(輔助不該送爆頭加成)
}
function meleeHit(w) {
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD); ray.set(tmpO, tmpD); ray.far = w.reach;
  const h = ray.intersectObject(ROOT, true); if (!h.length || h[0].distance > w.reach) return;
  if (h[0].object.userData && h[0].object.userData.glass && !h[0].object.userData.broken) { breakGlass(h[0].object, h[0].point); return; }   // 近戰也能敲破窗
  const o = findHit(h[0].object);
  if (o && o.userData.kind === "barrel") { if (o.userData.boom) { const p = o.position.clone(); killBarrel(o); explode(p, 0, false); } else impact(h[0].point, "metal", WIMPACT[w.name] || 1); }
  else if (o && o.userData.kind === "enemy") hitEnemy(o, WDMG[w.name] || 30, false, h[0].point);
  else if (o && o.userData.kind === "target") targetHit(o);
  else impact(h[0].point, surfaceOf(h[0].object, h[0].point), WIMPACT[w.name] || 1);
}
function breakGlass(gp, point) {   // 玻璃破:藏玻璃 + 噴幾片碎屑 + 玻璃碎裂音(沿用 sfxImpact 高頻金屬感,無專屬音則略)
  gp.userData.broken = true; gp.visible = false;
  const wp = point || gp.userData.shardPos || gp.getWorldPosition(new THREE.Vector3());
  for (let i = 0; i < 7; i++) emitFx(sparkPool, wp.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.3)), 0.18 + Math.random() * 0.12, 0.22, 0.7, false);   // 碎片亮閃(沿用 sparkPool)
  try { sfxImpact(); if (typeof sfxPing === "function") sfxPing(); } catch (e) { }   // 玻璃碎:沿用既有 impact + 高頻 ping 當碎裂感
}

/* ── 爆炸 ── */
const SHOCK_GEO = new THREE.RingGeometry(0.8, 1.0, 48);   // 衝擊波環幾何(共享,各爆炸 scale 撐大)
function explode(pos, depth, big) {
  sfxExplode(pos); shake = Math.max(shake, big ? 1.0 : 0.7);
  const fl = new THREE.PointLight(0xffb060, big ? 70 : 45, big ? 46 : 34, 2); fl.position.copy(pos); fl.position.y = Math.max(1.2, pos.y); scene.add(fl);
  const fb = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fb.position.copy(pos); fb.position.y += 0.8; fb.scale.setScalar(big ? 2.6 : 1.5); fb.raycast = RC_NOOP; scene.add(fb);
  const sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x29251f, transparent: true, opacity: 0, depthWrite: false, fog: false })); sm.position.copy(pos); sm.position.y += 1; sm.scale.setScalar(big ? 3 : 2); sm.raycast = RC_NOOP; scene.add(sm);
  const N = big ? 26 : 16, deb = []; for (let i = 0; i < N; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), debrisMat); d.position.copy(pos); d.position.y += 0.8; d.userData.v = new THREE.Vector3((Math.random() - 0.5) * (big ? 13 : 9), 4 + Math.random() * (big ? 10 : 7), (Math.random() - 0.5) * (big ? 13 : 9)); scene.add(d); deb.push(d); }
  const ring = new THREE.Mesh(SHOCK_GEO, new THREE.MeshBasicMaterial({ color: 0xffd9a0, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(pos.x, 0.14, pos.z); ring.raycast = RC_NOOP; scene.add(ring);   // 衝擊波亮環:爆炸把空氣/塵往外推,地面平鋪快速擴張淡出
  effects.push({ t: 0, life: big ? 3.0 : 2.6, fb, sm, fl, deb, ring, ringMax: big ? 17 : 11, big: !!big });
  for (let i = 0; i < (big ? 14 : 8); i++) emitFx(sparkPool, pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.5, Math.random() * 1.6, (Math.random() - 0.5) * 2.5)), 0.3 + Math.random() * 0.3, 0.3, 1.2, true);
  const R = big ? 7 : 5;
  for (const g of targets) if (!g.userData.down && g.position.distanceTo(pos) < R) targetHit(g);
  for (const g of enemies) if (!g.userData.dead && g.position.distanceTo(pos) < R && !coverBlocked(pos.x, pos.z, g.position.x, g.position.z)) hitEnemy(g, 200);   // 隔掩體(牆/木箱/載具)不吃爆炸傷害
  if (!dead && !gameOver) { const pd = camera.position.distanceTo(pos); if (pd < R && !coverBlocked(pos.x, pos.z, camera.position.x, camera.position.z)) hurtPlayer(Math.round((big ? 60 : 38) * (1 - pd / R)), pos); }   // 躲掩體(牆/木箱/坦克)後不被隔物雷炸死(帶爆點→受擊方向弧)
  if (depth < 3) for (const m of explosives.slice()) { if (m.userData.boom && !m.userData.dead && m.position.distanceTo(pos) < (big ? 6.5 : 4.8)) { const pp = m.position.clone(); killBarrel(m); setTimeout(() => explode(pp, depth + 1, false), 90); } }
}
/* ── 天降砲擊(計算手呼叫火力:瞄地面標座標 → 呼嘯延遲 → 6 發叢集砲彈天降;28s 冷卻) ── */
const artyMarker = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.4, 28), new THREE.MeshBasicMaterial({ color: 0xff5232, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, fog: false }));
artyMarker.rotation.x = -Math.PI / 2; artyMarker.visible = false; scene.add(artyMarker);
let artyCD = 0; const ARTY_CD = 28;
let firstHeavyShown = false;   // 首次重火力(砲擊/載具)旁白:稀缺觸發一次
let _b1Said = false, _b2Said = false, _b3Said = false, _b4Said = false;   // 學長視角 4 拍:每場最多一次(進實戰重置),戰鬥中稀缺不擾人
function callArtillery() {
  if (MODE !== "sim" || dead || gameOver || awaitDisarm) return;
  if (artyCD > 0) { if (actx) tone(280, 200, 0.07, 0.06, "square"); showNarr("再 " + Math.ceil(artyCD) + " 秒才能算下一發", 1.2); return; }
  const o = camera.getWorldPosition(new THREE.Vector3()), d = camera.getWorldDirection(new THREE.Vector3());
  if (d.y > -0.05) { showNarr("準星先對準地面，再呼叫砲擊", 1.4); return; }
  const t = -o.y / d.y, tx = o.x + d.x * t, tz = o.z + d.z * t;
  if (Math.hypot(tx, tz + 20) > 76) { showNarr("座標超出射界", 1.4); return; }
  if (Math.hypot(tx - o.x, tz - o.z) < 15) { showNarr("太近了 · 會炸到自己，瞄遠一點", 1.6); return; }   // 防誤炸自己(danger close)
  artyCD = ARTY_CD;
  artyMarker.position.set(tx, 0.06, tz); artyMarker.visible = true;
  // 計算手諸元(功能風味,非 sacred 旁白):把拔靈魂 MOS=全連算彈著點最快的計算手,呼叫砲擊=他最強的時刻
  const bearing = ((Math.round(Math.atan2(tx - o.x, -(tz - o.z)) * 180 / Math.PI) % 360) + 360) % 360;
  const rng = Math.round(Math.hypot(tx - o.x, tz - o.z)), elev = Math.max(220, Math.round(820 - rng * 4));
  showNarr("計算中…", 0.8);
  setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr("方位 " + bearing + "　仰角 " + elev + " 密位　首發效力射", 2.0); }, 720);
  if (!firstHeavyShown) { firstHeavyShown = true; setTimeout(() => showNarr(NARR.heavyFire, 5.5), 2900); }   // 首次:砲彈落地後浮現韌性旁白(NARR.heavyFire=toni 親寫,Claude 不代筆;hook 已留好)
  // B1:首次砲擊命中後一次 — 全連算彈著點最快的計算手(顧牛 cowSetup 已述),卻算不出她的那一天(EP41 verbatim);稀缺,每場一次,落在砲彈打完的安靜處
  if (!_b1Said) { _b1Said = true; setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr(NARR.artySetup, 3.0); }, 4100); setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr(NARR.artyDay, 5.5); }, 4400); }
  if (actx) { tone(520, 680, 0.12, 0.1, "square"); setTimeout(() => { if (actx) tone(430, 580, 0.1, 0.08, "square"); }, 150); }
  const N = 6;
  for (let i = 0; i < N; i++) setTimeout(() => {
    if (MODE !== "sim") return;
    if (actx) tone(1900, 160, 0.55, 0.1, "sawtooth");   // 呼嘯下墜
    setTimeout(() => { if (MODE === "sim") explode(new THREE.Vector3(tx + (Math.random() - 0.5) * 5.5, 0.3, tz + (Math.random() - 0.5) * 5.5), 0, true); }, 470);
  }, 2500 + i * 230);
  setTimeout(() => { artyMarker.visible = false; }, 2500 + N * 230 + 700);
}
/* ── 載具:悍馬車 + 戰車(走近按 E 上車,WASD/搖桿駕駛,戰車左鍵開炮,E 下車) ── */
const VEHICLES = [];
// 載具設定(item 3):maxFuel 油量(悍馬100繞營一圈/坦克50半圈,榴彈砲不耗油)/ maxShells 砲彈(坦克20/榴彈砲10)/ hpMul 車況=玩家HP×倍率(榴彈2/悍馬5/坦克10)/ basePrice 普通模式使用權底價(困難×2/天堂路×5)
const VEH_CFG = { humvee: { maxFuel: 100, maxShells: 0, hpMul: 5, basePrice: 800 }, howitzer: { maxFuel: 0, maxShells: 10, hpMul: 2, basePrice: 1200 }, tank: { maxFuel: 50, maxShells: 20, hpMul: 10, basePrice: 1800 } };
const vOlive = mat(0x4a5034, { roughness: 0.82, metalness: 0.12, envMapIntensity: 0.7 }), vDark = mat(0x32371f, { roughness: 0.86 }), vTire = mat(0x16161a, { roughness: 0.92 });
const vHub = mat(0x8e8e84, { metalness: 0.5, roughness: 0.45, envMapIntensity: 0.8 }), vMuzz = mat(0x23231f, { metalness: 0.6, roughness: 0.4 });   // 輪轂 / 砲口制退器(金屬細節讓載具不像玩具)
const vGlass = new THREE.MeshPhysicalMaterial({ color: 0x141c2a, roughness: 0.1, metalness: 0, envMapIntensity: 1.5, clearcoat: 0.5 });
function makeVehicle(type, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; ROOT.add(g);
  let turret = null;
  if (type === "humvee") {
    add(new THREE.BoxGeometry(2.7, 0.6, 4.6), vOlive, 0, 0.92, 0, g);                                       // 底盤(寬扁)
    add(new THREE.BoxGeometry(2.5, 0.5, 1.5), vOlive, 0, 1.12, -1.85, g);                                   // 引擎蓋(前低)
    const grille = add(new THREE.BoxGeometry(2.2, 0.42, 0.12), mat(0x20231a, { metalness: 0.3 }), 0, 1.18, -2.6, g); grille.castShadow = false;   // 水箱護罩
    add(new THREE.BoxGeometry(2.6, 0.22, 0.45), vDark, 0, 0.92, -2.42, g);                                  // 前保險桿
    for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 10), mat(0xfff0c0, { emissive: new THREE.Color(0xffe8a0), emissiveIntensity: 0.7 }), sx * 0.85, 1.12, -2.62, g).rotation.x = Math.PI / 2;   // 頭燈
    add(new THREE.BoxGeometry(2.42, 0.95, 2.0), vOlive, 0, 1.58, 0.35, g);                                  // 駕駛艙(方正寬)
    const ws = add(new THREE.BoxGeometry(2.15, 0.66, 0.08), vGlass, 0, 1.74, -0.62, g); ws.rotation.x = -0.2;   // 擋風(前傾)
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.5, 1.3), vGlass, sx * 1.2, 1.66, 0.4, g);   // 側窗
    add(new THREE.BoxGeometry(2.5, 0.12, 2.1), vDark, 0, 2.1, 0.35, g);                                     // 車頂
    add(new THREE.BoxGeometry(2.4, 0.66, 1.4), vOlive, 0, 1.28, 1.78, g);                                   // 後車斗
    add(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 14), vTire, -0.55, 1.78, 2.42, g);                        // 後備胎(立)
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 10), vHub, -0.55, 1.78, 2.43, g);                      // 備胎輪轂
    add(new THREE.BoxGeometry(0.32, 0.44, 0.24), mat(0x39482c, { roughness: 0.72 }), 0.6, 1.64, 2.4, g);    // 油桶/補給箱
    add(new THREE.CylinderGeometry(0.4, 0.46, 0.22, 12), vDark, 0, 2.27, 0.35, g);                          // 車頂槍架環(空)
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.06, 0.06, 0.34), vDark, sx * 1.28, 1.8, -0.5, g); add(new THREE.BoxGeometry(0.22, 0.16, 0.05), vDark, sx * 1.46, 1.8, -0.66, g); }   // 後視鏡
    for (const sx of [-1, 1]) for (const sz of [-1.5, 1.5]) {
      const wh = add(new THREE.CylinderGeometry(0.62, 0.62, 0.5, 16), vTire, sx * 1.3, 0.6, sz, g); wh.rotation.z = Math.PI / 2;
      add(new THREE.CylinderGeometry(0.27, 0.27, 0.52, 10), vHub, sx * 1.3, 0.6, sz, g).rotation.z = Math.PI / 2;   // 輪轂
      add(new THREE.BoxGeometry(0.16, 0.5, 1.05), vDark, sx * 1.36, 1.04, sz, g);                           // 輪拱
    }
  } else if (type === "tank") {
    add(new THREE.BoxGeometry(3.0, 0.55, 5.6), vOlive, 0, 0.82, 0, g);                                      // 車體
    const gl = add(new THREE.BoxGeometry(3.0, 0.78, 1.5), vOlive, 0, 0.98, -2.35, g); gl.rotation.x = -0.55;   // 前傾斜甲(glacis)
    for (const sx of [-1, 1]) {
      add(new THREE.BoxGeometry(0.72, 0.66, 5.7), vDark, sx * 1.58, 0.5, 0, g);                             // 履帶側
      add(new THREE.BoxGeometry(0.82, 0.1, 6.0), vDark, sx * 1.58, 1.0, 0, g);                              // 擋泥板
      for (let i = -2.4; i <= 2.4; i += 0.96) { const rl = add(new THREE.CylinderGeometry(0.34, 0.34, 0.72, 12), vTire, sx * 1.58, 0.5, i, g); rl.rotation.z = Math.PI / 2; }
      add(new THREE.CylinderGeometry(0.26, 0.26, 0.74, 10), vHub, sx * 1.58, 0.95, -2.8, g).rotation.z = Math.PI / 2;   // 前主動輪
    }
    turret = new THREE.Group(); turret.position.set(0, 1.32, 0.2); g.add(turret);
    add(new THREE.BoxGeometry(2.2, 0.62, 2.5), vOlive, 0, 0.3, 0, turret);                                  // 砲塔
    const tf = add(new THREE.BoxGeometry(2.1, 0.55, 1.0), vOlive, 0, 0.26, -1.5, turret); tf.rotation.x = -0.22;   // 砲塔前傾甲
    add(new THREE.BoxGeometry(0.62, 0.46, 0.7), gunMetal, 0, 0.3, -1.75, turret);                           // 砲盾(mantlet)
    const bar = add(new THREE.CylinderGeometry(0.13, 0.16, 3.7, 14), gunMetal, 0, 0.32, -3.1, turret); bar.rotation.x = Math.PI / 2;   // 砲管
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 12), vMuzz, 0, 0.32, -4.7, turret).rotation.x = Math.PI / 2;   // 砲口制退器
    add(new THREE.CylinderGeometry(0.32, 0.34, 0.3, 12), vOlive, 0.5, 0.62, 0.65, turret);                  // 車長指揮塔
    add(new THREE.BoxGeometry(0.5, 0.16, 0.7), vDark, -0.55, 0.5, 0.85, turret);                            // 後置工具箱
    add(new THREE.CylinderGeometry(0.018, 0.018, 1.4, 5), vDark, -0.85, 1.2, 0.7, turret);                  // 天線
    add(new THREE.BoxGeometry(0.62, 0.4, 0.5), vDark, -0.85, 1.18, 2.5, g);                                 // 後甲板補給箱
    add(new THREE.CylinderGeometry(0.22, 0.22, 0.56, 10), mat(0x39482c, { roughness: 0.72 }), 0.9, 1.22, 2.5, g).rotation.z = Math.PI / 2;   // 綁在後甲板的油桶
  } else {   // howitzer 榴彈砲(站位手動瞄發)
    add(new THREE.BoxGeometry(1.4, 0.42, 1.2), vOlive, 0, 0.7, 0.4, g);                                     // 砲架體
    for (const sx of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.64, 0.64, 0.26, 16), vTire, sx * 1.05, 0.64, 0.4, g).rotation.z = Math.PI / 2;   // 大輪
      add(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 10), vHub, sx * 1.05, 0.64, 0.4, g).rotation.z = Math.PI / 2;    // 輪轂
    }
    for (const sx of [-1, 1]) { const tr = add(new THREE.BoxGeometry(0.18, 0.2, 2.4), vOlive, sx * 0.5, 0.42, 1.6, g); tr.rotation.y = sx * 0.2; }   // 分開式駐鋤
    add(new THREE.BoxGeometry(2.0, 1.1, 0.1), vDark, 0, 1.2, -0.25, g);                                     // 大防盾
    turret = new THREE.Group(); turret.position.set(0, 1.18, 0); g.add(turret);                             // 俯仰組
    add(new THREE.BoxGeometry(0.5, 0.5, 0.92), gunMetal, 0, 0, 0.32, turret);                               // 後膛
    add(new THREE.CylinderGeometry(0.16, 0.16, 0.72, 12), vMuzz, 0, 0.06, -0.6, turret).rotation.x = Math.PI / 2;   // 反後座筒
    const bar = add(new THREE.CylinderGeometry(0.11, 0.15, 4.0, 14), gunMetal, 0, 0, -2.0, turret); bar.rotation.x = Math.PI / 2;   // 長砲管
    add(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12), vMuzz, 0, 0, -3.95, turret).rotation.x = Math.PI / 2;   // 砲口制退器
    turret.rotation.x = 0.3;
  }
  const cfg = VEH_CFG[type]; const v = { type, group: g, turret, heading: ry, baseHeading: ry, basePos: g.position.clone(), speed: 0, fireT: 0, cfg, unlocked: true, fuel: cfg.maxFuel, shells: cfg.maxShells, hp: 100 * cfg.hpMul, maxHp: 100 * cfg.hpMul, destroyed: false }; VEHICLES.push(v); return v;
}
makeVehicle("humvee", 22, 32, 0.5);
makeVehicle("tank", 31, 25, 0.2);
makeVehicle("howitzer", 30, 13, 0);
let vehicle = null;
function vehPriceMul() { const d = (curDiff && curDiff.diffIndex) || 3; return d >= 5 ? 5 : d >= 4 ? 2 : 1; }   // 使用權價格:普通×1/困難×2/天堂路×5
function resetVehicles() {   // 進實戰時重置:車況=玩家HP×倍率、油量/砲彈滿、使用權(劇情/新手免費已解;普通以上要買)、復原殘骸與位置
  const freeUse = ((curDiff && curDiff.diffIndex) || 3) <= 2;
  for (const v of VEHICLES) { v.fuel = v.cfg.maxFuel; v.shells = v.cfg.maxShells; v.maxHp = Math.round(MAX_HP * v.cfg.hpMul); v.hp = v.maxHp; v.unlocked = freeUse; v.destroyed = false; v.speed = 0; v.heading = v.baseHeading; v.group.position.copy(v.basePos); v.group.rotation.set(0, v.baseHeading, 0); }
  const d = (curDiff && curDiff.diffIndex) || 3; radarMap = d <= 3; radarSat = d <= 2;   // item3 雷達:劇情/新手地圖+敵人全開;普通有地圖要買偵測;困難/天堂路都要買
}
let radarMap = true, radarSat = true; const _radarDir = new THREE.Vector3();   // radarMap=戰術地圖 / radarSat=衛星偵測(敵人位置)
const radarEl = document.getElementById("radar"); let radarCtx = null;
function radarMapFree() { return ((curDiff && curDiff.diffIndex) || 3) <= 2; }     // 劇情/新手:地圖免費,商品隱藏
function radarSatFree() { return ((curDiff && curDiff.diffIndex) || 3) <= 2; }     // 劇情/新手:偵測免費,商品隱藏
function radarPriceMul() { return ((curDiff && curDiff.diffIndex) || 3) >= 5 ? 2 : 1; }   // 天堂路 ×2
function updateRadar() {
  if (!radarEl) return;
  if (!(MODE === "sim" && radarMap)) { radarEl.classList.remove("on"); return; }
  radarEl.classList.add("on");
  if (!radarCtx) radarCtx = radarEl.getContext("2d");
  const ctx = radarCtx, S = radarEl.width, R = S / 2, scale = R / 58;   // 58 世界單位半徑
  ctx.clearRect(0, 0, S, S);
  ctx.save(); ctx.beginPath(); ctx.arc(R, R, R - 3, 0, 6.2832); ctx.clip();
  ctx.fillStyle = "rgba(10,16,13,0.42)"; ctx.fillRect(0, 0, S, S);
  const px = camera.position.x, pz = camera.position.z;
  const wx = (x) => R + (x - px) * scale, wz = (z) => R + (z - pz) * scale;   // 北上:world +x→右, +z→下
  ctx.strokeStyle = "rgba(150,172,150,0.4)"; ctx.lineWidth = 2;
  for (const c of COLLIDERS) { const ax = wx(c[0]), ay = wz(c[2]), bx = wx(c[1]), by = wz(c[3]); ctx.strokeRect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax), Math.abs(by - ay)); }
  if (radarSat) { ctx.fillStyle = "rgba(255,72,60,0.95)"; for (const g of enemies) { const u = g.userData; if (u.dead || u.apparition) continue; const x = wx(g.position.x), y = wz(g.position.z), dx = x - R, dy = y - R; if (dx * dx + dy * dy > (R - 5) * (R - 5)) continue; ctx.beginPath(); ctx.arc(x, y, S > 200 ? 5 : 4, 0, 6.2832); ctx.fill(); } }
  ctx.restore();
  camera.getWorldDirection(_radarDir);
  ctx.save(); ctx.translate(R, R); ctx.rotate(Math.atan2(_radarDir.x, -_radarDir.z));
  ctx.fillStyle = "rgba(125,255,138,0.96)"; ctx.beginPath(); ctx.moveTo(0, -R * 0.13); ctx.lineTo(R * 0.09, R * 0.1); ctx.lineTo(0, R * 0.05); ctx.lineTo(-R * 0.09, R * 0.1); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(255,220,170,0.22)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(R, R, R - 3, 0, 6.2832); ctx.stroke();
}
function vehFreeUse() { return ((curDiff && curDiff.diffIndex) || 3) <= 2; }   // 劇情/新手:載具免費,使用權商品隱藏
function vehUnlocked(type) { const v = VEHICLES.find((x) => x.type === type); return !!(v && v.unlocked); }
function vehUnlock(type) { const v = VEHICLES.find((x) => x.type === type); if (v) v.unlocked = true; }
function vehRefuel(amt) { for (const v of VEHICLES) if (v.cfg.maxFuel > 0) v.fuel = Math.min(v.cfg.maxFuel, v.fuel + amt); }   // 油桶:悍馬/坦克各補油
function vehRearm() { for (const v of VEHICLES) { if (v.type === "tank") v.shells = Math.min(v.cfg.maxShells, v.shells + 10); if (v.type === "howitzer") v.shells = Math.min(v.cfg.maxShells, v.shells + 5); } }   // 砲彈補給:坦克+10/大砲+5
function nearVehicle() { for (const v of VEHICLES) { if (v.destroyed) continue; const dx = camera.position.x - v.group.position.x, dz = camera.position.z - v.group.position.z; if (dx * dx + dz * dz < 18) return v; } return null; }
function enterVehicle(v) { vehicle = v; v.speed = 0; if (WEAPONS[wi]) WEAPONS[wi].group.visible = false; const fire = isTouch ? "射擊鈕" : "左鍵"; showNarr(v.type === "tank" ? "戰車 · WASD／搖桿駕駛 · " + fire + "開炮 · " + actHint("下車") : v.type === "howitzer" ? "榴彈砲 · 看高一點增加射程 · " + fire + "發射 · " + actHint("離開砲位") : "悍馬車 · WASD／搖桿駕駛 · " + actHint("下車"), 3.4); if (!firstHeavyShown) { firstHeavyShown = true; setTimeout(() => showNarr(NARR.heavyFire, 5.5), 3800); } }   // 首次上載具:重火力韌性旁白(toni 填)
function exitVehicle() { if (!vehicle) return; const v = vehicle; camera.position.set(v.group.position.x + Math.cos(v.heading) * 3, EYE, v.group.position.z + Math.sin(v.heading) * 3); yaw = v.heading + Math.PI / 2; pitch = 0; vehicle = null; resolveCollision(); resolveVehiclePush(); clampBound(camera.position); camera.position.y = EYE; if (WEAPONS[wi]) WEAPONS[wi].group.visible = true; if (vehhudEl) vehhudEl.classList.remove("on"); }   // 下車立刻合法化落點(推出牆/載具碰撞體+夾回圍籬),不必按移動鍵才彈出;收起載具儀表
function fireTankShell(v) {
  // 砲彈朝「砲塔可見砲管」的實際指向發射(含方位+仰角),不再只朝車身正前=瞄哪打哪。
  // 砲管在 turret 本地 -z(geometry 在 z<0),取砲管上兩點轉世界算方向,避開 getWorldDirection 的 ±z 慣例陷阱。
  const a = new THREE.Vector3(0, 0.32, 0), m = new THREE.Vector3(0, 0.32, -4.8);
  v.turret.localToWorld(a); v.turret.localToWorld(m);
  const d = m.clone().sub(a).normalize();   // 世界空間砲口指向
  shake = Math.max(shake, 0.85); sfxExplode(m); emitFx(sparkPool, m, 0.35, 0.35, 1.1, true);
  spawnShell(m, d.clone().multiplyScalar(120));   // 高初速平直直射(spawnShell+updateShells 走 GRAV 自然微落)
  tracer(m.x, m.y, m.z, m.x + d.x * 16, m.y + d.y * 16, m.z + d.z * 16, 0xffd060, 0.9);   // 砲口曳光指出彈道方向
}
const shells = [];
function spawnShell(pos, vel) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), gunMetal); m.position.copy(pos); m.castShadow = true; scene.add(m); shells.push({ m, vel: vel.clone(), prev: pos.clone(), life: 9 }); }
function updateShells(dt) {
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.vel.y -= GRAV * dt; s.prev.copy(s.m.position);
    const np = _shellNp.copy(s.m.position).addScaledVector(s.vel, dt);
    let hit = null;
    if (np.y <= 0.25) hit = new THREE.Vector3(np.x, 0.3, np.z);
    else { ray.set(s.prev, _shellDir.copy(s.vel).normalize()); ray.far = s.prev.distanceTo(np) + 0.3; const h = ray.intersectObject(ROOT, true); if (h.length) hit = h[0].point.clone(); }
    if (hit) { explode(hit, 0, true); scene.remove(s.m); shells.splice(i, 1); continue; }
    s.m.position.copy(np); s.life -= dt; if (s.life <= 0) { scene.remove(s.m); shells.splice(i, 1); }
  }
}
function fireHowitzer(v) {
  shake = Math.max(shake, 0.7); sfxExplode(v.group.position);
  const d = new THREE.Vector3(); camera.getWorldDirection(d);
  const muzz = camera.position.clone().addScaledVector(d, 2.2); muzz.y += 0.3;
  spawnShell(muzz, d.multiplyScalar(42)); emitFx(sparkPool, muzz, 0.4, 0.45, 1.3, true);
}
function vehResHint(v) {   // 駕駛載具資源讀數(只 sim 顯示油量/砲彈/車況;hub 沙盒無限制不顯示)
  if (MODE !== "sim") return "";
  const parts = [];
  if (v.cfg.maxFuel > 0) parts.push("油 " + Math.round(v.fuel));
  if (v.cfg.maxShells > 0) parts.push("砲彈 " + v.shells);
  parts.push("車況 " + Math.round(v.hp));
  return parts.join("　·　");   // 給 #vehhud 用的乾淨儀表字串(全形間隔,清楚)
}
const vehhudEl = document.getElementById("vehhud");
function updateVehHud(v) { if (!vehhudEl) return; if (v && MODE === "sim") { const nm = v.type === "tank" ? "戰車" : v.type === "howitzer" ? "榴彈砲" : "悍馬車"; vehhudEl.textContent = nm + "　" + vehResHint(v); vehhudEl.classList.add("on"); } else vehhudEl.classList.remove("on"); }
function explodeVehicle(v) {   // 車況歸零→爆炸:駕駛被彈出受傷,殘骸本回合不可再用(item 3)
  const pos = v.group.position.clone().setY(0.5);
  v.destroyed = true; v.hp = 0;
  exitVehicle();   // 先下車(vehicle=null,後續 hurtPlayer 正常扣玩家血)
  shake = Math.max(shake, 1.1); sfxExplode(pos); try { sfxThud(); } catch (e) { } emitFx(sparkPool, pos.clone().setY(1.4), 0.7, 0.6, 2.2, true);
  for (const g of enemies) if (!g.userData.dead && g.position.distanceTo(pos) < 6 && !coverBlocked(pos.x, pos.z, g.position.x, g.position.z)) hitEnemy(g, 200);   // 爆炸波及周圍敵人
  v.group.rotation.z = 0.18;   // 殘骸微傾
  hurtPlayer(35);   // 駕駛被炸傷(若 HP 不足仍會 endRun)
}
function updateVehicle(dt) {
  const v = vehicle, sim = MODE === "sim";
  updateVehHud(v);   // 駕駛中:波數下方常駐顯示油料/砲彈/車況儀表(桌機手機一致,不再埋進提示尾巴)
  if (v.type === "howitzer") {   // 站位榴彈砲:自由瞄準 + 砲管俯仰 + 彈道發射
    camera.rotation.set(pitch, yaw, 0);
    const hfx = -Math.sin(v.heading), hfz = -Math.cos(v.heading);
    camera.position.set(v.group.position.x - hfx * 0.7, 1.78, v.group.position.z - hfz * 0.7);
    let trav = yaw - v.heading; while (trav > Math.PI) trav -= 2 * Math.PI; while (trav < -Math.PI) trav += 2 * Math.PI;
    v.turret.rotation.y = Math.max(-1.0, Math.min(1.0, trav)); v.turret.rotation.x = Math.max(0.05, Math.min(1.1, pitch));   // 方位±57°/仰角
    if (v.fireT > 0) v.fireT -= dt;
    if (mouseDown && v.fireT <= 0) { if (!sim || v.shells > 0) { v.fireT = ((curDiff && curDiff.diffIndex) || 3) >= 4 ? 4.0 : 2.2; if (sim) v.shells--; fireHowitzer(v); } else { v.fireT = 0.4; sfxDry(); } }   // 砲彈有限,空了乾擊;困難/天堂路放慢到接近真實 155 榴射速(老兵不會覺得像機砲),易模式維持原爽度
    if (hintEl) { hintEl.style.opacity = "1"; hintEl.textContent = (isTouch ? "榴彈砲 · 鏡頭抬高增加射程 · 射擊鈕發射 · 按「使用」鈕離開" : "榴彈砲 · 看高一點增加射程 · 左鍵發射 · 按 E 離開"); }   // 油彈車況移到 #vehhud 常駐儀表
    return;
  }
  let thr = 0, steer = 0;
  if (keys.KeyW) thr += 1; if (keys.KeyS) thr -= 1; if (keys.KeyA) steer -= 1; if (keys.KeyD) steer += 1;
  thr += tjz; steer += tjx;
  const dry = sim && v.cfg.maxFuel > 0 && v.fuel <= 0;   // 油料耗盡:引擎熄火不能再加速
  if (dry) thr = 0;
  const maxSpd = v.type === "tank" ? 8 : 14, accel = v.type === "tank" ? 7 : 12, turnRate = v.type === "tank" ? 1.2 : 1.9;
  v.speed += thr * accel * dt; v.speed *= Math.max(0, 1 - dt * (dry ? 3 : 1.5)); v.speed = Math.max(-maxSpd * 0.45, Math.min(maxSpd, v.speed));
  if (Math.abs(v.speed) > 0.25) v.heading -= steer * turnRate * dt * Math.sign(v.speed) * Math.min(1, Math.abs(v.speed) / 2.5);
  v.group.rotation.y = v.heading;
  const fx = -Math.sin(v.heading), fz = -Math.cos(v.heading), moved = Math.abs(v.speed) * dt;
  v.group.position.x += fx * v.speed * dt; v.group.position.z += fz * v.speed * dt;
  resolveCollisionFor(v.group.position, 1.9); clampBound(v.group.position);
  if (sim && v.cfg.maxFuel > 0) v.fuel = Math.max(0, v.fuel - moved * 0.5);   // 油耗隨行駛距離(100油≈繞營一圈,坦克50≈半圈)
  if (sim && (v.type === "tank" || v.type === "humvee")) {   // 撞擊殲敵:坦克碾過即死,悍馬撞=血量減半(再撞陣亡)
    const rr = v.type === "tank" ? 2.8 : 2.2;
    for (const g of enemies) { const u = g.userData; if (u.dead || u.ramCD > 0) continue; const ddx = g.position.x - v.group.position.x, ddz = g.position.z - v.group.position.z; if (ddx * ddx + ddz * ddz < rr * rr) { u.ramCD = 0.6; if (v.type === "tank") hitEnemy(g, u.hp + 999); else if (u.rammedHalf) hitEnemy(g, u.hp + 999); else { hitEnemy(g, Math.max(1, Math.ceil(u.hp / 2))); u.rammedHalf = true; } } }
  }
  const cd = v.type === "tank" ? 9.5 : 8.5;
  camera.position.set(v.group.position.x - fx * cd, 4.7, v.group.position.z - fz * cd);
  camera.lookAt(v.group.position.x + fx * 3, 1.5, v.group.position.z + fz * 3);
  if (v.fireT > 0) v.fireT -= dt;
  if (v.type === "tank" && mouseDown && v.fireT <= 0) { if (!sim || v.shells > 0) { v.fireT = ((curDiff && curDiff.diffIndex) || 3) >= 4 ? 2.8 : 1.5; if (sim) v.shells--; fireTankShell(v); } else { v.fireT = 0.4; sfxDry(); } }   // 困難/天堂路:戰車主砲放慢到接近真實裝填節奏,易模式維持原爽度
  if (hintEl) { const fireVerb = isTouch ? "射擊鈕開炮" : "左鍵開炮"; hintEl.textContent = (v.type === "tank" ? "戰車 · " + fireVerb + " · " + actHint("下車") : (dry ? "悍馬車 · 油料耗盡 · " + actHint("下車") : "悍馬車 · 撞擊殲敵 · " + actHint("下車"))); }   // 油彈車況移到 #vehhud 常駐儀表
}
function updateEffects(dt) {
  if (MODE === "sim" && artyCD > 0) artyCD = Math.max(0, artyCD - dt);
  if (artyMarker.visible) artyMarker.material.opacity = 0.45 + Math.abs(Math.sin(realT * 5)) * 0.4;
  if (tbArtyEl) tbArtyEl.textContent = artyCD > 0 ? Math.ceil(artyCD) : "砲擊";   // 手機鈕顯冷卻
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.t += dt;
    if (e.fb) { const k = Math.min(1, e.t / 0.5); e.fb.scale.setScalar((e.big ? 2.6 : 1.5) + k * 6); e.fb.material.opacity = Math.max(0, 1 - k); }
    if (e.sm) { const k = Math.min(1, e.t / 2.4); e.sm.scale.setScalar(2 + k * 9); e.sm.position.y += dt * 1.3; e.sm.material.opacity = Math.max(0, 0.6 * Math.sin(k * Math.PI)); }
    if (e.fl) e.fl.intensity = Math.max(0, e.fl.intensity - dt * 140);
    if (e.ring) { const k = Math.min(1, e.t / 0.45); e.ring.scale.setScalar(0.4 + k * (e.ringMax || 11)); e.ring.material.opacity = Math.max(0, 0.85 * (1 - k)); }   // 衝擊波環:0.45s 內擴張+淡出
    if (e.deb) for (const d of e.deb) { d.userData.v.y -= 18 * dt; d.position.addScaledVector(d.userData.v, dt); if (d.position.y < 0.12) { d.position.y = 0.12; d.userData.v.multiplyScalar(0); } d.rotation.x += dt * 5; d.rotation.y += dt * 4; }
    if (e.t >= e.life) { if (e.fb) { scene.remove(e.fb); e.fb.material.dispose(); } if (e.sm) { scene.remove(e.sm); e.sm.material.dispose(); } if (e.fl) scene.remove(e.fl); if (e.ring) { scene.remove(e.ring); e.ring.material.dispose(); } if (e.deb) for (const d of e.deb) { scene.remove(d); d.geometry.dispose(); } effects.splice(i, 1); }   // SHOCK_GEO 共享不 dispose
  }
}

/* ── 彈出靶(命中倒下,4 秒後復位) ── */
const targets = []; let kills = 0;
const tgtMat = new THREE.MeshStandardMaterial({ color: 0x4a5436, roughness: 0.85, envMapIntensity: 0.8 });
const ringMat = new THREE.MeshStandardMaterial({ color: 0xe8e2cf, roughness: 0.8, side: THREE.DoubleSide });
function spawnTarget(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.15, 0.26), tgtMat); body.position.y = 0.95;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), tgtMat); head.position.y = 1.72;
  const ring = new THREE.Mesh(new THREE.CircleGeometry(0.17, 18), ringMat); ring.position.set(0, 1.05, 0.14);
  [body, head, ring].forEach((m) => { m.castShadow = true; g.add(m); });
  g.userData.kind = "target"; g.userData.down = false; g.userData.downT = 0; ROOT.add(g); targets.push(g);
}
[[34, -13], [31, -14], [37, -12], [-10, -22], [2, -22], [15, -23], [-22, 2]].forEach(([x, z]) => spawnTarget(x, z));
const hitmarkEl = document.getElementById("hitmark"), killsEl = document.getElementById("kills");
function targetHit(g) { if (g.userData.down) return; g.userData.down = true; g.userData.downT = 0; kills++; if (killsEl) killsEl.textContent = kills; hitmark("hit"); sfxThud(); }

/* ══════ 現代 gunplay:爆頭/傷害數字/連殺/槍口燈/spray pattern/spring sway ══════ */
const muzzleLight = new THREE.PointLight(0xffd9a0, 0, 16, 2); scene.add(muzzleLight); muzzleLight.layers.enable(1);
const WSPRAY = { 小槍: 0.009, 步槍: 0.013, 機關槍: 0.02, 狙擊槍: 0.02 };
let sprayPitch = 0, sprayYaw = 0, swayX = 0, swayY = 0, prevYaw = yaw, prevPitch = pitch;
function sfxHead() { if (actx) tone(2200, 2700, 0.09, 0.22, "square"); }
function hitmark(tier) {   // 只剩靶場練習 target 用(去爽:敵人不給十字)
  if (!hitmarkEl) return;
  hitmarkEl.textContent = tier === "kill" ? "✖" : "✕";
  hitmarkEl.style.color = tier === "kill" ? "#ff4d4d" : tier === "head" ? "#ffd23f" : "#fff";
  hitmarkEl.style.fontSize = tier === "hit" ? "22px" : "30px";
  hitmarkEl.style.opacity = "1"; clearTimeout(hitmarkEl._t); hitmarkEl._t = setTimeout(() => (hitmarkEl.style.opacity = "0"), tier === "hit" ? 90 : 150);
}
const MUZBASE = { "小槍": 8, "步槍": 12, "機關槍": 14, "狙擊槍": 22, "火箭砲": 30 };
const _muz0 = new THREE.Color(0xffd9a0), _muz1 = new THREE.Color(0xffb060);
function flashMuzzleLight(w) { if (!w.muzzle) return; w.muzzle.getWorldPosition(tmpO); muzzleLight.position.copy(tmpO); muzzleLight.intensity = (MUZBASE[w.name] || 12) * (0.8 + Math.random() * 0.5); muzzleLight.color.lerpColors(_muz0, _muz1, Math.random()); }   // 槍口火光:每把基準不同 + 強度/色抖動(連射忽明忽暗)
function updateTargets(dt) { for (const g of targets) { const u = g.userData; if (u.down) { u.downT += dt; if (u.downT < 4) g.rotation.x = Math.max(-1.45, g.rotation.x - dt * 6); else { g.rotation.x = Math.min(0, g.rotation.x + dt * 3); if (g.rotation.x >= -0.001) { g.rotation.x = 0; u.down = false; u.downT = 0; } } } } }

/* ── 敵兵 AI(接近 / 開火 / 中彈流血 / 陣亡復活) ── */
const enemies = [];
const bloodPool = makeFxPool(18, () => new THREE.SpriteMaterial({ map: smokeTex, color: 0x8a1414, transparent: true, depthWrite: false, fog: false }));
/* ── 記憶光點(夢敵人擊倒碎成的話語光,取代血池;極簡血+碎成記憶) ── */
const memDotTex = tex((c, S) => { const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, "rgba(255,238,205,1)"); g.addColorStop(0.45, "rgba(255,214,156,.55)"); g.addColorStop(1, "rgba(255,206,148,0)"); c.fillStyle = g; c.fillRect(0, 0, S, S); }, 32);
const memShards = [];
for (let i = 0; i < 56; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: memDotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); s.visible = false; s.raycast = RC_NOOP; scene.add(s); memShards.push({ s, on: false, t: 0, life: 0, vx: 0, vy: 0, vz: 0 }); }
let msI = 0;
function memoryShatter(pos, escale) {   // 擊倒→記憶光點上升消散(碎成她的話語光,不留屍/血);兵種越大,碎成的光越多越散(重裝厚實一綻/突擊兵稀疏一閃)
  const es = escale || 1;
  const n = Math.round((11 + Math.floor(Math.random() * 5)) * es);
  for (let i = 0; i < n; i++) {
    const sh = memShards[msI = (msI + 1) % memShards.length];
    sh.s.position.set(pos.x + (Math.random() - 0.5) * 0.9 * es, 0.85 + Math.random() * 1.1, pos.z + (Math.random() - 0.5) * 0.9 * es);
    sh.s.scale.setScalar((0.16 + Math.random() * 0.14) * es); sh.s.material.opacity = 0.95; sh.s.visible = true;
    sh.on = true; sh.t = 0; sh.life = 0.9 + Math.random() * 0.7; sh.vx = (Math.random() - 0.5) * 0.7; sh.vy = 0.9 + Math.random() * 0.9; sh.vz = (Math.random() - 0.5) * 0.7;
  }
}
function updateMemShards(dt) { for (const sh of memShards) { if (!sh.on) continue; sh.t += dt; const k = sh.t / sh.life; if (k >= 1) { sh.on = false; sh.s.visible = false; continue; } sh.s.position.x += sh.vx * dt; sh.s.position.y += sh.vy * dt; sh.s.position.z += sh.vz * dt; sh.vy -= 0.45 * dt; sh.s.material.opacity = 0.95 * (1 - k * k); sh.s.scale.setScalar(0.16 + k * 0.22); } }
/* ── CS 級曳光彈(扎實射擊手感,只在遠程開火) ── */
const tracers = [];
for (let i = 0; i < 16; i++) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const m = new THREE.LineBasicMaterial({ color: 0xffe09a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); const ln = new THREE.Line(geo, m); ln.visible = false; ln.frustumCulled = false; scene.add(ln); tracers.push({ ln, t: 0, on: false, op: 0.8 }); }
let trI = 0;
function tracer(fx, fy, fz, tx, ty, tz, color, opacity) { const tr = tracers[trI = (trI + 1) % tracers.length]; const p = tr.ln.geometry.attributes.position; p.setXYZ(0, fx, fy, fz); p.setXYZ(1, tx, ty, tz); p.needsUpdate = true; if (color != null) tr.ln.material.color.setHex(color); tr.op = opacity != null ? opacity : 0.8; tr.ln.material.opacity = tr.op; tr.ln.visible = true; tr.on = true; tr.t = 0; }
function updateTracers(dt) { for (const tr of tracers) { if (!tr.on) continue; tr.t += dt; if (tr.t > 0.08) { tr.on = false; tr.ln.visible = false; continue; } tr.ln.material.opacity = tr.op * (1 - tr.t / 0.08); } }   // 曳光彈拖尾稍長更可見
const eBody = new THREE.MeshStandardMaterial({ color: 0x55502f, roughness: 0.72, envMapIntensity: 0.6 });   // 軍服布料微 sheen 接夢中天光,不再撞球扁平
const eGear = new THREE.MeshStandardMaterial({ color: 0x35351f, roughness: 0.78, envMapIntensity: 0.5 });
const eSkin = new THREE.MeshStandardMaterial({ color: 0xbf926a, roughness: 0.6, envMapIntensity: 0.45 });   // 膚色暖一點、柔一點
const WDMG = { 鐵鎚: 75, 刺槍: 60, 小刀: 58, 小槍: 34, 步槍: 36, 機關槍: 32, 狙擊槍: 120 };
const WIMPACT = { 小槍: 0.7, 步槍: 1.0, 機關槍: 1.0, 狙擊槍: 1.9, 刺槍: 1.2, 小刀: 0.9, 鐵鎚: 1.5 };   // 命中點火花/揚塵量倍率:狙擊一炸 / 小槍一抹
const eBoot = new THREE.MeshStandardMaterial({ color: 0x1c1a16, roughness: 0.7 });
// 夢中天堂路的對手:三兵種(標準步兵 / 重裝 / 突擊),體型 + 血量 + 移速 + 頭盔各異
const ENEMY_TYPES = [
  { key: "rifleman", weight: 5, scale: 1.0, hpMul: 1.0, speedMul: 1.0, cap: false, pack: false },
  { key: "heavy", weight: 2, scale: 1.18, hpMul: 1.9, speedMul: 0.78, cap: false, pack: true },
  { key: "scout", weight: 3, scale: 0.86, hpMul: 0.6, speedMul: 1.35, cap: true, pack: false },
];
function pickEnemyType() { let tot = 0; for (const t of ENEMY_TYPES) tot += t.weight; let r = Math.random() * tot; for (const t of ENEMY_TYPES) { r -= t.weight; if (r <= 0) return t; } return ENEMY_TYPES[0]; }
const FROG_TRUNK = new THREE.MeshStandardMaterial({ color: 0xc01818, roughness: 0.62 });   // 兩棲蛙人紅短褲 ⛔CANON-LOCK:紅短褲/無頭盔無步槍是刻意的(蛙人=把拔沒走的那條路,EP12 不會游泳沒舉手)。未來軍事擬真審查「絕對不可」幫蛙人加頭盔/步槍/裝具,那會毀掉夢框符號
// 敵人武器(彈藥有限,耗盡→換刺刀近戰):dmg 命中傷害區間 / rateMin+rateMax 射擊間隔 / hitMul 命中率倍率 / ammo 子彈上限 / vis 視覺尺寸
const ENEMY_WEAPONS = {
  pistol: { dmg: [5, 10], rateMin: 1.3, rateRnd: 1.4, hitMul: 0.85, ammo: 30, vis: { w: 0.08, h: 0.1, l: 0.34 } },
  rifle: { dmg: [7, 13], rateMin: 0.9, rateRnd: 1.1, hitMul: 1.0, ammo: 45, vis: { w: 0.1, h: 0.1, l: 0.62 } },
  mg: { dmg: [5, 9], rateMin: 0.4, rateRnd: 0.4, hitMul: 0.8, ammo: 120, vis: { w: 0.12, h: 0.13, l: 0.8, mag: true } },
  sniper: { dmg: [26, 40], rateMin: 2.2, rateRnd: 1.8, hitMul: 1.4, ammo: 12, vis: { w: 0.09, h: 0.09, l: 0.98, scope: true } },
  rocket: { dmg: [0, 0], rateMin: 3.6, rateRnd: 2.4, hitMul: 1, ammo: 6, rocket: true, vis: { w: 0.17, h: 0.17, l: 0.9 } },
  knife: { melee: true, range: 2.3, dmg: [12, 20], rateMin: 0.8, rateRnd: 0.5, ammo: 0 },
};
// 每波特殊武器配額(劇情/新手基準;乘 loadoutMul=正常×2/困難×4/天堂路×8);gren=該波敵人帶手榴彈(只第五關)
const LOADOUT_CAPS = {
  1: { rifle: 0, mg: 0, sniper: 0, rocket: 0, gren: false },
  2: { rifle: 1, mg: 0, sniper: 0, rocket: 0, gren: false },
  3: { rifle: 1, mg: 1, sniper: 0, rocket: 0, gren: false },
  4: { rifle: 1, mg: 1, sniper: 1, rocket: 1, gren: false },
  5: { rifle: 1, mg: 1, sniper: 1, rocket: 1, gren: true },
};
function buildWaveWeapons(waveNum, n) {   // 配置本波 n 隻敵人的武器(特殊武器隨模式倍率,其餘小槍),洗牌讓特殊兵不總是先出
  const mult = (curDiff && curDiff.loadoutMul) || 1;
  const caps = LOADOUT_CAPS[Math.min(waveNum, 5)] || LOADOUT_CAPS[5];
  const pool = [];
  const maxSpecial = Math.max(0, Math.floor(n * 0.8));   // 至少留 ~20% 小槍兵:天堂路 ×8 不會塞成「0 把小槍、全狙擊/火箭」斷崖牆(仍極硬,但是曲線不是不可能)
  for (const k of ["rocket", "sniper", "mg", "rifle"]) { const c = Math.round((caps[k] || 0) * mult); for (let i = 0; i < c && pool.length < maxSpecial; i++) pool.push(k); }
  while (pool.length < n) pool.push("pistol");
  for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  const gmax = caps.gren ? Math.min(8, Math.round(3 * mult)) : 0;   // 第五關敵人帶 0~3 顆手榴彈(隨模式上限放大,封頂 8)
  return pool.map((w) => ({ weapon: w, grenades: gmax ? (Math.random() * (gmax + 1)) | 0 : 0 }));
}
function frogmenSquads(waveNum) {   // 兩棲蛙人部隊隊數(每隊6人):劇情/新手/正常只最後一關1隊;困難每關w1-2:1/w3-4:2/w5:3;天堂路每關3隊
  const d = (curDiff && curDiff.diffIndex) || 3;
  if (d <= 3) return waveNum >= goalWave() ? 1 : 0;
  if (d === 4) return waveNum >= goalWave() ? 3 : (waveNum >= 3 ? 2 : 1);
  return 3;
}
function jitterMat(base, dh, ds, dl) { const m = base.clone(); const hsl = {}; m.color.getHSL(hsl); m.color.setHSL((hsl.h + dh + 1) % 1, Math.max(0, Math.min(1, hsl.s + ds)), Math.max(0.04, Math.min(0.96, hsl.l + dl))); return m; }
function spawnEnemy(x, z, hp, opts) {
  opts = opts || {};
  const frog = !!opts.frogman;                                   // 兩棲蛙人:紅短褲裸身 + 只有刺刀 + 3 倍速(item 6)
  const weapon = opts.weapon || (frog ? "knife" : "pistol");
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const type = frog ? { key: "frogman", scale: 1.0, hpMul: 0.55, speedMul: 3.0, cap: false, pack: false } : pickEnemyType();
  const body = frog ? jitterMat(eSkin, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.18) : jitterMat(eBody, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.16, (Math.random() - 0.5) * 0.24);   // 加大色差:16 個敵兵不再像複製人(toni 拍板)
  const skin = jitterMat(eSkin, (Math.random() - 0.5) * 0.04, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.22);
  const ms = [];
  const eb = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); ms.push(b); return b; };
  eb(0.5, 0.74, 0.3, frog ? skin : body, 0, 1.16, 0);                  // 軀幹(蛙人裸膚)
  if (!frog) { eb(0.56, 0.5, 0.36, eGear, 0, 1.2, 0.01); eb(0.2, 0.16, 0.1, eGear, 0, 1.32, 0.19); eb(0.09, 0.52, 0.08, eBoot, -0.16, 1.2, 0.19); eb(0.09, 0.52, 0.08, eBoot, 0.16, 1.2, 0.19); eb(0.18, 0.15, 0.1, eBoot, -0.2, 1.04, 0.21); eb(0.14, 0.13, 0.1, eBoot, 0.21, 1.06, 0.21); }   // 防彈背心 + 彈匣袋 + 胸前背帶×2 + 側掛彈袋(寫實裝具,蛙人沒有)
  eb(0.46, 0.36, 0.3, frog ? FROG_TRUNK : eGear, 0, 0.68, 0);          // 臀 / 蛙人紅短褲
  eb(0.12, 0.12, 0.12, skin, 0, 1.57, 0);                              // 頸
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skin); head.position.y = 1.68; head.userData.head = true; ms.push(head);
  if (frog) eb(0.32, 0.07, 0.32, eBoot, 0, 1.78, 0).userData.head = true;   // 蛙人:平頭短髮(深色),無鋼盔
  else if (type.cap) { eb(0.34, 0.12, 0.34, eGear, 0, 1.79, 0).userData.head = true; eb(0.42, 0.04, 0.16, eGear, 0, 1.75, 0.18); }   // 突擊兵:軟帽 + 帽簷
  else { const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, 6.3, 0, 1.6), eGear); helmet.position.y = 1.72; helmet.userData.head = true; ms.push(helmet); eb(0.4, 0.05, 0.4, eGear, 0, 1.64, 0); }   // 鋼盔 + 盔簷
  if (!frog && type.pack) eb(0.42, 0.5, 0.22, eGear, 0, 1.2, -0.24);   // 重裝:背包
  const legs = [];
  for (const sx of [-1, 1]) {
    const legG = new THREE.Group(); legG.position.set(sx * 0.13, 0.71, 0);                                                                            // 髖關節樞紐:腿從髖擺,不繞中點
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.22), frog ? skin : eGear); thigh.position.set(0, -0.31, 0); thigh.castShadow = true; legG.add(thigh);   // 腿(蛙人裸膚)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), frog ? skin : eBoot); boot.position.set(0, -0.65, 0.04); boot.castShadow = true; legG.add(boot);        // 靴(蛙人赤腳)
    g.add(legG); legs.push(legG);
    eb(0.14, 0.5, 0.16, frog ? skin : body, sx * 0.27, 1.18, 0.02);    // 上臂(蛙人裸膚;持槍備姿,不擺)
  }
  // 武器(胸前) + 前臂 + 握把手
  const gunPivot = new THREE.Group(); gunPivot.position.set(0.1, weapon === "knife" ? 1.12 : 1.16, 0.03);   // 槍托樞紐:後座只抬槍口(不繞中點 see-saw)
  if (weapon === "knife") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.025, 0.4), gunMetal); blade.position.set(0, 0, -0.24); blade.castShadow = true; gunPivot.add(blade);   // 刺刀/小刀
  } else {
    const gv = (ENEMY_WEAPONS[weapon] && ENEMY_WEAPONS[weapon].vis) || ENEMY_WEAPONS.pistol.vis;
    const gun = new THREE.Mesh(new THREE.BoxGeometry(gv.w, gv.h, gv.l), gunMetal); gun.position.set(0, 0, -gv.l / 2); gun.castShadow = true; gunPivot.add(gun);   // 槍身(尺寸隨武器:小槍短/狙擊長/火箭粗)
    if (gv.scope) { const sc = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), gunMetal); sc.position.set(0, 0.09, -gv.l * 0.32); gunPivot.add(sc); }   // 狙擊鏡
    eb(gv.mag ? 0.09 : 0.07, gv.mag ? 0.22 : 0.16, gv.mag ? 0.13 : 0.12, gunMag, 0.1, gv.mag ? 0.98 : 1.04, -0.12);   // 彈匣(機槍更大)
  }
  ms.push(gunPivot);
  eb(0.14, 0.34, 0.14, frog ? skin : body, 0.18, 1.0, -0.18);               // 前臂(蛙人裸膚)
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skin); hand.position.set(0.1, 1.12, -0.08); ms.push(hand);   // 握把手:膚色球,槍是握著不是浮空
  const upper = new THREE.Group(); ms.forEach((m) => { m.castShadow = true; upper.add(m); }); g.add(upper);   // 上半身容器:走路起伏/側擺驅動在這(不動 g,g 被 yaw/flinch/death 佔用)
  g.scale.setScalar(type.scale);
  const ew = ENEMY_WEAPONS[weapon] || ENEMY_WEAPONS.pistol;
  g.userData.kind = "enemy"; g.userData.hp = Math.round((hp || 100) * type.hpMul); g.userData.speedMul = type.speedMul; g.userData.etype = type.key; g.userData.dead = false; g.userData.deadT = 0; g.userData.fireT = 1 + Math.random() * 2; g.userData.flinch = 0; g.userData.strafe = Math.random() < 0.5 ? 1 : -1; g.userData.strafeT = 1 + Math.random() * 2; g.userData.state = "chase"; g.userData.grenadeT = 6 + Math.random() * 8; g.userData.spawn = new THREE.Vector3(x, 0, z); g.userData.stepT = Math.random() * 0.4; g.userData.alertT = 0; g.userData.sawPlayer = false; g.userData.body = body; g.userData.skin = skin; g.userData.lastSeen = new THREE.Vector3(0, 0, -6); g.userData.everSeen = false;   // 存克隆材質供死亡回收(防記憶體洩漏);lastSeen=最後已知玩家位置(預設操場中心當推進目標,看不到玩家時朝這走,不偷看即時座標)
  g.userData.weapon = weapon; g.userData.ammo = ew.ammo || 0; g.userData.grenadesLeft = opts.grenades || 0; g.userData.frog = frog; g.userData.meleeT = 0; g.userData.ramCD = 0; g.userData.rammedHalf = false;   // item5:武器/有限彈藥(耗盡換刺刀)/手榴彈數;item6:蛙人;item3:被載具撞擊冷卻/悍馬撞過半血標記
  g.userData.legs = legs; g.userData.gun = gunPivot; g.userData.upper = upper; g.userData.escale = type.scale; g.userData.walkPh = Math.random() * 6.28; g.userData.gunKick = 0; g.userData.bearing = Math.random() * 6.2832;   // 腿擺 / 槍托後座 / 上半身起伏 / 死亡縮放 / 圍攻方位
  ROOT.add(g); enemies.push(g);
  return g;
}
/* ── 波次 horde + 計分 ── */
const SPAWN_PTS = [[-18, -34], [10, -38], [26, -30], [-30, -26], [38, -20], [-38, -10], [44, 2], [0, -42], [-44, -28], [34, -38]];
const COVER_PTS = [[4, 4], [5.4, 2.6], [-8, -12], [13, -14], [14.5, -13.2], [10, 6], [-14, -6], [22, 8]].map(([x, z]) => new THREE.Vector3(x, 0, z));
let wave = 0, score = 0, waveAlive = 0, spawnQueue = 0, spawnTimer = 0, betweenT = 2.5, inBreak = true, gameOver = false, shopPause = false;   // shopPause:波間/重啟自動開軍械庫時暫停時間
let warmupActive = false, warmupT = 0;   // 劇情/新手首波前的「無敵人試打」暖身:可走/瞄/打靶,不生敵;倒數結束或玩家按使用鍵(E/使用)略過後才開打。困難以上無暖身(直接進)
let waveWeapons = [], frogmenSpawned = false;   // 本波每隻敵人武器配置(逐隻 pop) / 本波蛙人幻影是否已生成(普通敵清完才生)
let frogmenActive = false, frogmenGhostCount = 0, frogmenDeadline = 0;   // 蛙人=非戰鬥幻影(item 6 canon:他沒走的那條路):狂奔穿過場景朝海,跑過/消失才算過關(非擊殺);deadline=保險,逾時強制清空不卡關
let MODE = "hub";   // hub(自由走軍營,不生敵) | sim(實戰模擬練習,波次戰鬥) — 把拔的夢:走到靶場才回到天堂路
const RANGE_ENTRY = new THREE.Vector3(32, 0, 6.5);   // 靶場射擊位(進入實戰模擬的觸發點)
const COW_POS = new THREE.Vector3(-14, 0, 18);       // 顧牛互動點
const JACKET_POS = new THREE.Vector3(12, 0, 16);     // 反穿外套互動點(#3 夢中違和)
const DIARY_POS = new THREE.Vector3(6, 0, 8);        // 大兵日記互動點(#4-④ 雋永連結)
const PHONE_POS = new THREE.Vector3(3, 0, -23.6);    // A1 奪命連環 call(#4a:壁掛公共電話移到寢室前門外;門在 0,-25.5)
const MOTORBIKE_POS = new THREE.Vector3(20, 0, -4);  // A2 機車紙條互動點(EP40 妳在我機車上夾紙條;操場東側空地)
const CORNER_POS = new THREE.Vector3(10.8, 0, 28);   // A3 伯達樓轉角(#4b:錨在中山室前左外牆角 11.5,27.5)
const TERMINAL_POS = new THREE.Vector3(-10.5, 0, -32.4); // A4 登登登的 7 秒(#4a:舊電腦移進寢室遠端「班長室」內)
const SHRIMP_POS = new THREE.Vector3(1.3, 0, 27.2);  // C2 剝好的牡丹蝦互動點(EP28 用餐大廳右側餐桌那盤蝦)
const WASH_POS = new THREE.Vector3(-26.5, 0, -10);   // C3 鏡子·純白的紙(#4a:盥洗台+鏡子移到澡堂入口;入口在 +X 側 x≈-25.5)
// 雋永鈎子低調信標:每個探索點上方暖光暈輕脈動,引玩家遇見那頭牛/那件外套/那本日記/電話/機車/轉角/終端機(不強迫,只在 hub)
const beacons = [];
const beaconRingGeo = new THREE.RingGeometry(0.7, 1.35, 40);   // 地面光暈環(共用幾何,便宜):告訴玩家「站到這個圈裡按 E」(蝦那種桌邊遮擋特別需要)
for (const p of [COW_POS, JACKET_POS, DIARY_POS, RANGE_ENTRY, COUNSELOR_POS, COMMANDER_POS, PHONE_POS, MOTORBIKE_POS, CORNER_POS, TERMINAL_POS, SHRIMP_POS, WASH_POS]) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, color: 0xff3650, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.position.set(p.x, 1.85, p.z); s.scale.set(0.55, 3.6, 1); s.raycast = () => { }; s.userData.anchor = p.clone(); ROOT.add(s); beacons.push(s);   // toni #2:紅線特效——可互動點(牛/外套/日記/靶場/輔導長/連長/電話/機車/牆角/終端/蝦/鏡)立一道脈動紅光柱;raycast no-op(不是射擊目標,且 Sprite.raycast 需 raycaster.camera→會 crash)。anchor:存錨點供 #5 近距增強。WASH 鏡子 C3 已由 toni 填學長視角句,nearWash() isReal(mirrorA) 自動啟用
  const ring = new THREE.Mesh(beaconRingGeo, new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide })); ring.position.set(p.x, 0.04, p.z); ring.rotation.x = -Math.PI / 2; ring.raycast = () => { }; ROOT.add(ring); s.userData.ring = ring;   // 站位光暈環(平貼地面,微抬避 z-fighting);脈動/近距增亮在 update 處理
}
const waveEl = document.getElementById("wave"), scoreEl = document.getElementById("scoreval");
function updateWaveHUD() { if (MODE !== "sim") { if (waveEl) waveEl.textContent = "軍營"; return; } const gw = goalWave(); if (waveEl) waveEl.textContent = inBreak ? (wave < 1 ? "站上起點" : "第 " + wave + " / " + gw + " 波" + (isTouch ? "" : " · 清空")) : "第 " + wave + " / " + gw + " 波"; if (scoreEl) scoreEl.textContent = score; }   // 顯示「第 N / 目標 波」讓撐到第幾波會停下變可見(目標感);手機省「· 清空」尾綴避免疊雷達
function startWave() { wave++; inBreak = false; frogmenSpawned = false; frogmenActive = false; frogmenGhostCount = 0; const em = (curDiff ? curDiff.enemyMul : 1) * qEnemyCap; const n = Math.max(1, Math.min(Math.round(13 * em), Math.round((3 + wave * 1.7) * em))); spawnQueue = n; waveAlive = n; spawnTimer = 0; waveWeapons = buildWaveWeapons(wave, n); updateWaveHUD();
  // B3:硬關(困難/天堂路 或 接近目標波)生成一張光碟,每場最多一次;進新一波先清掉上一波殘留的光碟
  clearDisc();
  if (!_b3Said) { const dIdx = (curDiff && curDiff.diffIndex) || 3; if (dIdx >= 4 || wave >= goalWave() - 2) spawnDisc(); }
}   // 困難/天堂路:每波敵人 ×2;低畫質 enemyCap 砍半救手機;依模式+波次配置敵人武器池
const FROG_ESCAPE = new THREE.Vector3(0, 0, 94);   // 蛙人狂奔的方向:朝場外遠方(海)消失
function spawnFrogmen(squads) {   // 兩棲蛙人=非戰鬥幻影(item 6 canon:他沒走的那條路):從邊緣狂奔穿過場景朝海,打不到也擋不住,不計 waveAlive
  const total = squads * 6;
  frogmenActive = true; frogmenGhostCount = total; frogmenDeadline = realT + 12;   // 保險:12s 內若沒全跑完強制清,避免任何情況卡關
  for (let i = 0; i < total; i++) {
    const p = SPAWN_PTS[(Math.random() * SPAWN_PTS.length) | 0];
    const g = spawnEnemy(p[0] + (Math.random() - 0.5) * 7, p[1] + (Math.random() - 0.5) * 7, 70, { frogman: true });
    const u = g.userData; u.apparition = true; u.appT = 0; u.fadeT = 0;   // ⛔CANON-LOCK:蛙人=非戰鬥幻影(他沒走的天堂路),打不到/3倍速狂奔朝海/淡出。未來「絕對不可」改成可擊殺敵人,殺他們該覺得不對=去爽
    u.escape = new THREE.Vector3(FROG_ESCAPE.x + (Math.random() - 0.5) * 24, 0, FROG_ESCAPE.z);
    g.traverse((m) => { if (m.isMesh) m.raycast = () => { }; });   // 子彈穿過(打不到)
  }
  updateWaveHUD();
}
function updateApparition(g, u, dt, i) {   // 幻影蛙人:朝海狂奔穿過一切(不碰撞/不攻擊/打不到),跑到/逾時即淡出消失
  u.appT += dt;
  const dx = u.escape.x - g.position.x, dz = u.escape.z - g.position.z, d = Math.hypot(dx, dz) || 1;
  const tgtY = Math.atan2(dx, dz); let dY = tgtY - g.rotation.y; while (dY > Math.PI) dY -= 6.2832; while (dY < -Math.PI) dY += 6.2832; g.rotation.y += dY * Math.min(1, dt * 8);
  const sp = 9 * dt; g.position.x += (dx / d) * sp; g.position.z += (dz / d) * sp;   // 3 倍狂奔
  if (u.legs) { u.walkPh += dt * 17; u.legs[0].rotation.x = Math.sin(u.walkPh) * 0.75; u.legs[1].rotation.x = -Math.sin(u.walkPh) * 0.75; }
  if (u.upper) u.upper.position.y = Math.abs(Math.sin(u.walkPh)) * 0.05;
  if (d < 5 || u.appT > 9 || g.position.z > 90) {   // 跑到海邊/逾時 → 淡出
    u.fadeT += dt; g.scale.multiplyScalar(Math.max(0.02, 1 - dt * 3.2));
    if (u.fadeT > 0.45) { ROOT.remove(g); if (u.body) u.body.dispose(); if (u.skin) u.skin.dispose(); enemies.splice(i, 1); frogmenGhostCount = Math.max(0, frogmenGhostCount - 1); if (frogmenGhostCount <= 0) frogmenActive = false; }
  }
}
function endWarmup() { if (warmupActive) { warmupActive = false; warmupT = 0; betweenT = Math.min(betweenT, 1.2); if (hintEl) hintEl.style.opacity = "0"; } }   // 暖身結束(倒數到 or 玩家略過):接回正常波間倒數,很快開打
function updateWaves(dt) {
  if (gameOver || MODE !== "sim" || awaitDisarm) return;
  if (warmupActive) {   // 試打暖身:不生敵、不倒數開打;打靶/走動熟悉手感。倒數結束自動開打
    if (shopPause) return;   // 暖身時開軍械庫也暫停倒數
    warmupT -= dt; if (warmupT <= 0) endWarmup();
    return;
  }
  if (inBreak) { if (shopPause) return; betweenT -= dt; if (betweenT <= 0) startWave(); return; }   // 軍械庫開著=時間暫停,不倒數
  if (spawnQueue > 0) { spawnTimer -= dt; if (spawnTimer <= 0) { const p = SPAWN_PTS[(Math.random() * SPAWN_PTS.length) | 0]; spawnEnemy(p[0], p[1], Math.min(180, 90 + wave * 9), waveWeapons.length ? waveWeapons.pop() : { weapon: "pistol" }); spawnQueue--; spawnTimer = 0.5 + Math.random() * 0.6; } }   // 血量成長壓平+封頂 180(維持步槍 ~3 發撂倒,不做海綿怪);難度靠敵人更準更痛(見 hcDiffMul),不堆血

  if (waveAlive <= 0 && spawnQueue <= 0) {
    if (!frogmenSpawned) { frogmenSpawned = true; const sq = frogmenSquads(wave); if (sq > 0) { spawnFrogmen(sq); showNarr("兩棲蛙人部隊朝海的方向狂奔而過 · 打不到也不必打", 4.2); return; } }   // item6:普通敵清完→蛙人幻影狂奔穿過(非戰鬥,功能描述不代筆 canon),跑過/消失才算過關
    if (frogmenActive) { if (realT >= frogmenDeadline) { for (let k = enemies.length - 1; k >= 0; k--) { const e = enemies[k]; if (e.userData.apparition) { ROOT.remove(e); if (e.userData.body) e.userData.body.dispose(); if (e.userData.skin) e.userData.skin.dispose(); enemies.splice(k, 1); } } frogmenActive = false; frogmenGhostCount = 0; } else return; }   // 幻影還在穿越,等跑過/淡出;逾時保險強制清空不卡關
    if (wave >= goalWave()) { awaitDisarm = true; survivedAt = realT; inBreak = true; if (vehicle) exitVehicle(); stopMusic(); for (const e of enemies) ROOT.remove(e); enemies.length = 0; if (waveEl) waveEl.textContent = "撐過了"; showNarr(NARR.survived, 5.5); }   // survivedAt:讓「撐過了」旁白先獨處,放下槍提示稍後才浮現(不稀釋轉折)   // B1:撐過 GOAL_WAVE → 停波+清殘敵 + 強制下車(放下槍是徒手身體動作,不能在車上) + 戰鬥曲淡出 + 放下槍旁白;保護高潮
    else { inBreak = true; money += Math.round((200 + wave * 80) * (curDiff ? curDiff.enemyMul : 1)); updateMoneyHUD(); updateWaveHUD(); if (wave === 1 || wave % 5 === 0) showNarr(NARR.wave, 3.4); openShopPause();
      // B4:波間的安靜(第2波後)一次 — 等待也算在約會的時間裡(EP6 verbatim)。延後一拍,不和 NARR.wave 撞;每場一次
      if (!_b4Said && wave >= 2) { _b4Said = true; setTimeout(() => { if (MODE === "sim" && inBreak && !dead && !gameOver) { showNarr(NARR.waitDate, 4.5); setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr(NARR.waitOpen, 5.0); }, 4700); } }, 1600); }
    }   // 撐過一波:獎賞隨波升 × 模式 enemyMul(困難/天堂路 ×2,讓貴兩倍/五倍的載具使用權買得起=不是死內容);時間暫停自動開軍械庫;金句稀缺
  }
}
updateWaveHUD();
function bloodAt(p) { emitFx(bloodPool, p, 0.32, 0.14, 0.28, false); }   // 極簡血:中彈只輕微暗紅一抹,不渲染暴力(夢框揭心非軍武)
function hitConfirm() { if (!SHOW_HIT_CONFIRM || !crossEl) return; crossEl.classList.add("confirm"); clearTimeout(crossEl._cf); crossEl._cf = setTimeout(() => crossEl.classList.remove("confirm"), 70); }   // 命中那拍準星微縮一亮 70ms(中性,非✕/分數;遠距離也知道打中)
function hitEnemy(g, dmg, head, point) {
  const u = g.userData; if (u.dead || u.apparition) return;   // 幻影蛙人打不到(子彈/爆炸都無效),殺他們該覺得不對=去爽
  dmg = Math.round(dmg);
  bloodAt(g.position.clone().setY(head ? 1.66 : 1.2)); u.hp -= dmg; u.coverT = 1.4;
  // 方向化中彈:依命中部位(頭/軀幹/腿)與左右側施力,不再永遠同方向點頭
  const leg = !!(point && point.y < 0.78);
  u.flinch = head ? 0.26 : leg ? 0.14 : 0.18; u.flinchMax = u.flinch;
  let side = 0; if (point) { const rxv = Math.cos(g.rotation.y), rzv = -Math.sin(g.rotation.y); side = (point.x - g.position.x) * rxv + (point.z - g.position.z) * rzv; }
  u.flinchSide = Math.max(-1, Math.min(1, side * 3)) * (head ? 0.5 : 0.32);   // 中彈往該側扭肩/歪頭
  if (leg) u.stagger = 0.45;   // 腿中彈:踉蹌減速
  // 武器去爽(W5-A):無傷害數字 / 無連殺 / 無分數,殺只是消耗不是獎勵(夢裡改不了的徒勞,非 power fantasy)
  if (u.hp <= 0) {
    u.dead = true; u.deadT = 0; kills++; u.deathLean = Math.max(-0.9, Math.min(0.9, (u.flinchSide || 0) * 2.6));   // 往中彈側倒,每隻死法不同
    { let fb = 0; if (point) { const fwx = Math.sin(g.rotation.y), fwz = Math.cos(g.rotation.y); fb = (point.x - g.position.x) * fwx + (point.z - g.position.z) * fwz; } u.deathFwd = fb <= 0; u.deathYaw = g.rotation.y + (Math.random() - 0.5) * 0.7; }   // 中彈前側→被擊退後仰,後側→前撲;加隨機側轉避免雷同
    sfxThud(); if (SHOW_HIT_CONFIRM) { try { tone(120, 60, 0.16, 0.18, "sine"); } catch (e) { } }   // 擊倒:多一記低悶的「倒下」尾音(讓「死了」有句點,非爽度)
    memoryShatter(g.position, u.escale * (SHOW_HIT_CONFIRM ? 1.22 : 1)); waveAlive--; updateWaveHUD();   // 夢敵人擊倒:碎成記憶光點(非血池/屍體);命中確認開→碎光亮一級,讓遠距離也看得出「倒下了」
  } else { if (head) sfxHead(); else sfxImpact(); hitConfirm(); }   // 去爽 W2:不給✕/數字/分數;只用極克制的中性準星微縮一亮確認「打中了」(toni 選)
}
function enemyShoot(g, dist) {
  const u = g.userData, ew = ENEMY_WEAPONS[u.weapon] || ENEMY_WEAPONS.pistol;
  if (ew.rocket) { if (u.ammo > 0) { u.ammo--; enemyRocket(g); } else u.weapon = "knife"; return; }   // 火箭兵:有限火箭,耗盡換刺刀
  if (u.ammo <= 0) { u.weapon = "knife"; return; }   // 彈藥耗盡 → 換刺刀近戰(item5;updateEnemies 處理突刺)
  u.ammo--;
  u.gunKick = 0.16;   // 開火後座 tell:槍口上揚
  const dir = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
  const mp = g.position.clone().setY(1.25).addScaledVector(dir, 0.6);
  emitFx(sparkPool, mp, 0.1, 0.28, 0.3, true); sfxEnemyShot(mp);
  const dIdx = (curDiff && curDiff.diffIndex) || 3, accMul = dIdx >= 5 ? 1.3 : dIdx >= 4 ? 1.15 : 1;   // 困難/天堂路:敵人更準(用準度變難,不堆血量;劇情/新手/普通維持原樣)
  const hcBase = (u.etype === "heavy" ? 0.5 : u.etype === "scout" ? 0.4 : 0.46) * (ew.hitMul || 1) * accMul;   // 兵種準度 × 武器準度 × 難度準度
  let hitChance = Math.max(0.08, hcBase - dist * 0.009); if (curSpeed > 3.5) hitChance *= 0.62; const hit = Math.random() < hitChance;   // 玩家高速走位更難命中(溫和,非 twitch)
  camera.getWorldPosition(tmpO2);   // 朝玩家飛來的曳光:命中=直指頭胸,未命中=擦身偏移
  const ox = hit ? 0 : (Math.random() - 0.5) * 1.3, oy = hit ? 0.05 : (Math.random() - 0.5) * 1.0, oz = hit ? 0 : (Math.random() - 0.5) * 1.3;
  const tcol = u.weapon === "sniper" ? 0xff5030 : 0xff7040;
  tracer(mp.x, mp.y, mp.z, tmpO2.x + ox, tmpO2.y - 0.15 + oy, tmpO2.z + oz, tcol, u.weapon === "sniper" ? 0.95 : 0.7);
  if (hit) { const dm = ew.dmg; hurtPlayer((dm[0] + Math.random() * (dm[1] - dm[0])) * (dIdx >= 4 ? 1.2 : 1), g.position); }   // 困難/天堂路:命中更痛(帶來源位置→受擊方向弧)
}
function enemyRocket(g) {   // 敵方火箭:較平直快速拋射,落點範圍爆炸(掩體在 explode 內用 coverBlocked 擋)
  camera.getWorldPosition(tmpO2); const from = g.position.clone().setY(1.2);
  const vel = tmpO2.clone().sub(from); vel.y = 0; const d = vel.length() || 1; vel.normalize().multiplyScalar(Math.min(34, 16 + d * 0.6)); vel.y = 1.4 + d * 0.02;
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 8), rocketHeadMat); m.position.copy(from); scene.add(m);
  projectiles.push({ m, vel, type: "grenade", t: 0, fuse: Math.min(2.4, 0.6 + d * 0.045), big: true }); sfxThrow(); g.userData.gunKick = 0.22;
}
function enemyGrenade(g) {
  camera.getWorldPosition(tmpO2); const from = g.position.clone().setY(1.2);
  const vel = tmpO2.clone().sub(from); vel.y = 0; const d = vel.length() || 1; vel.normalize().multiplyScalar(Math.min(22, d * 1.05)); vel.y = 4 + d * 0.06;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), grenadeProjMat); m.position.copy(from); scene.add(m);
  projectiles.push({ m, vel, type: "grenade", t: 0, fuse: 1.6 }); sfxThrow();
}
const losRay = new THREE.Raycaster();
function enemySeesPlayer(g, dist) {   // 真實掩體遮蔽:建築+木箱油桶+載具都擋(coverBlocked);躲坦克/掩體後敵人看不到你=不會開火
  if (dist > 72) return false;
  return !coverBlocked(g.position.x, g.position.z, camera.position.x, camera.position.z);
}
function updateEnemies(dt) {
  if (awaitDisarm) return;   // B1:放下槍窗口不更新敵人(殘敵已清,雙保險)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const g = enemies[i], u = g.userData;
    if (u.apparition) { updateApparition(g, u, dt, i); continue; }   // 幻影蛙人:獨立路徑(狂奔穿過→淡出),不參與戰鬥
    if (u.dead) {
      u.deadT += dt;
      const fwd = u.deathFwd === false ? 1 : -1;   // 命中身體前側被擊退→後仰;後側→前撲
      g.rotation.x = fwd < 0 ? Math.max(-1.55, g.rotation.x - dt * 4.5) : Math.min(1.4, g.rotation.x + dt * 4.5);
      g.rotation.z += ((u.deathLean || 0) - g.rotation.z) * Math.min(1, dt * 5);
      g.rotation.y += ((u.deathYaw || g.rotation.y) - g.rotation.y) * Math.min(1, dt * 4);   // 輕微側轉,死法不雷同
      if (u.deadT > 0.8) { const k = Math.min(1, (u.deadT - 0.8) / 1.0); g.scale.setScalar(Math.max(0.0001, (u.escale || 1) * (1 - k * 0.85))); g.position.y = -k * 0.5; }   // 0.8s 後沉地+縮小,化成上升的記憶光(碎成她的話語,不留屍)
      if (u.deadT > 1.8) { ROOT.remove(g); if (u.body) u.body.dispose(); if (u.skin) u.skin.dispose(); enemies.splice(i, 1); }   // 敵人掛在 ROOT(非 scene),用 ROOT.remove 才真的移除;移除時 dispose 每隻 clone 的軍服/膚色材質(共享幾何不動)
      continue;
    }
    const dx = camera.position.x - g.position.x, dz = camera.position.z - g.position.z, dist = Math.hypot(dx, dz) || 1;
    { const ls = u.lastSeen || camera.position; const fX = u.losSees ? camera.position.x : ls.x, fZ = u.losSees ? camera.position.z : ls.z; const tgtY = Math.atan2(fX - g.position.x, fZ - g.position.z); let dY = tgtY - g.rotation.y; while (dY > Math.PI) dY -= 6.2832; while (dY < -Math.PI) dY += 6.2832; g.rotation.y += dY * Math.min(1, dt * (u.alertT > 0 ? 3.5 : 14)); }   // 看到玩家才面向玩家(反應延遲慢轉);看不到則面向最後已知位置,不隔牆鎖頭追視
    if (u.flinch > 0) { const f = u.flinch / (u.flinchMax || 0.18); g.rotation.x = -0.18 * f; g.rotation.z = (u.flinchSide || 0) * f; u.flinch -= dt; } else { g.rotation.x = 0; g.rotation.z = 0; }   // 方向化中彈:後仰 + 往中彈側扭
    if (u.stagger > 0) u.stagger -= dt;   // 腿傷踉蹌計時
    if (u.coverT > 0) u.coverT -= dt;
    if (u.ramCD > 0) u.ramCD -= dt;   // 被載具撞擊冷卻(避免一次碾過多次扣)
    u.losT = (u.losT || 0) - dt; if (u.losT <= 0) { u.losSees = enemySeesPlayer(g, dist); u.losT = (0.1 + Math.random() * 0.06) * qLosMul; }   // 視線每 ~0.12s 重算快取(節流);低畫質 losMul 再拉長救 CPU
    const sees = u.losSees;
    if (sees) { if (!u.sawPlayer) { u.sawPlayer = true; u.alertT = 0.35 + Math.random() * 0.35; } u.everSeen = true; u.lastSeen.set(camera.position.x, 0, camera.position.z); } else u.sawPlayer = false;   // 只有真看到才更新最後已知位置;看不到時朝記憶位置搜索,不偷看玩家即時座標
    if (u.alertT > 0) u.alertT -= dt;
    const smart = !!(curDiff && curDiff.smart);   // 天堂路模式:團隊圍攻
    let aimX = sees ? camera.position.x : u.lastSeen.x, aimZ = sees ? camera.position.z : u.lastSeen.z;   // 看到=瞄玩家,看不到=朝最後已知位置推進搜索
    if (smart && sees) { aimX += Math.cos(u.bearing || 0) * 7; aimZ += Math.sin(u.bearing || 0) * 7; }   // 圍攻:各佔一個環繞方位(只在看到玩家時)
    const adx = aimX - g.position.x, adz = aimZ - g.position.z, adist = Math.hypot(adx, adz) || 1;
    const fx = adx / adist, fz = adz / adist, rx = -fz, rz = fx; let mvx = 0, mvz = 0, sp = 2.0;
    const melee = u.weapon === "knife" || u.frog;   // 刺刀/蛙人:衝鋒近戰,不躲不退,逼近到捅刀範圍(速度由 speedMul 決定,蛙人 3 倍)
    if (melee) { if (sees ? dist > 2.0 : adist > 2.2) { mvx = fx; mvz = fz; sp = 2.6; } }
    else if ((u.coverT > 0 || u.hp < 40) && sees && !smart && u.etype === "rifleman") { // 只步兵找掩體;突擊兵裸衝/重裝是活掩體,都不躲(天堂路模式全主動圍攻)
      let best = null, bd = 1e9; for (const c of COVER_PTS) { const d = c.distanceTo(g.position); if (d < bd) { bd = d; best = c; } }
      if (best && bd > 1.8) { const cdx = best.x - g.position.x, cdz = best.z - g.position.z, cl = Math.hypot(cdx, cdz) || 1; mvx = cdx / cl; mvz = cdz / cl; sp = 2.7; }
    } else if (!sees) { if (adist > 2.2) { mvx = fx; mvz = fz; sp = 2.4; } }   // 看不到玩家 → 走向最後已知位置搜索(到了還看不到就停步觀望,不再 GPS 直奔玩家)
    else if (dist > (smart ? 12 : u.etype === "scout" ? 11 : 17)) { mvx = fx; mvz = fz; } else if (dist < 9) { mvx = -fx; mvz = -fz; }   // 突擊兵壓更近
    if (!smart && Math.random() < 0.4 * dt) u.strafe *= -1;   // 低機率隨機翻轉,破除整群同步左右平移
    if (sees && dist < 42 && !melee) { const sw = smart ? 1.3 : u.etype === "heavy" ? 0 : u.etype === "scout" ? 1.15 : 0.8; mvx += rx * u.strafe * sw; mvz += rz * u.strafe * sw; }   // 重裝直線壓上不平移,突擊兵繞側更多;近戰直衝不平移
    const ml = Math.hypot(mvx, mvz);
    if (u.legs) {   // 走路腿擺(髖樞紐 sin,破除滑行雕像);停步腿回正
      if (ml > 0.01) { u.walkPh += dt * sp * (u.speedMul || 1) * 4.2; u.legs[0].rotation.x = Math.sin(u.walkPh) * 0.5; u.legs[1].rotation.x = -Math.sin(u.walkPh) * 0.5; }   // 步頻隨實際地速(含 speedMul):重裝慢踏/突擊兵快跑,腳不打滑
      else { const k = Math.min(1, dt * 8); u.legs[0].rotation.x *= 1 - k; u.legs[1].rotation.x *= 1 - k; }
    }
    if (u.upper) {   // 上半身隨步伐起伏 + 微側擺(破除「人偶」感:腿擺但軀幹凍結);停步回正
      if (ml > 0.01) { u.upper.position.y = Math.abs(Math.sin(u.walkPh)) * 0.025; u.upper.rotation.z = Math.sin(u.walkPh) * 0.03; }
      else { const k = Math.min(1, dt * 8); u.upper.position.y *= 1 - k; u.upper.rotation.z *= 1 - k; }
    }
    if (u.gun) { u.gunKick *= 1 - Math.min(1, dt * 9); u.gun.rotation.x = u.gunKick; }   // 開火後座衰減:槍托樞紐抬槍口彈回(+gunKick=槍口上揚,因樞紐在槍托、槍口在 -z)
    if (ml > 0.01) {
      const s = (u.flinch > 0 ? 0.4 : sp) * (u.speedMul || 1) * (u.stagger > 0 ? 0.35 : 1) * dt;   // 兵種移速:重裝慢 / 突擊快;腿傷踉蹌減速
      let ndx = mvx / ml, ndz = mvz / ml;
      // 繞行:直線下一步若撞建築/木箱,左右交替偏轉找空檔(非 A*,單檔輕量探路)
      if (blockedAt(g.position.x + ndx * 0.9, g.position.z + ndz * 0.9, 0.5)) {
        for (const a of [0.7, -0.7, 1.4, -1.4, 2.2, -2.2]) {
          const cs = Math.cos(a), sn = Math.sin(a), nx = ndx * cs - ndz * sn, nz = ndx * sn + ndz * cs;
          if (!blockedAt(g.position.x + nx * 0.9, g.position.z + nz * 0.9, 0.5)) { ndx = nx; ndz = nz; break; }
        }
      }
      g.position.x += ndx * s; g.position.z += ndz * s;
      resolveCollisionFor(g.position, 0.5);   // 兜底推出:敵人不穿建築/木箱(全擋)
      clampBound(g.position);                 // 圓形邊界
      if (dist < 40) { u.stepT -= dt; if (u.stepT <= 0) { sfxEnemyStep(g.position); u.stepT = 0.34 / (u.speedMul || 1); } }   // 腳步聲(步頻隨速度,>40m cull)
    }
    const ewp = ENEMY_WEAPONS[u.weapon] || ENEMY_WEAPONS.pistol;
    if (!dead && melee) {   // 近戰(刺刀/蛙人):衝到刺刀範圍才捅,冷卻 = 武器揮擊節奏
      u.meleeT -= dt;
      if (dist < (ewp.range || 2.3) && u.meleeT <= 0) { u.meleeT = (ewp.rateMin || 0.8) + Math.random() * (ewp.rateRnd || 0.4); u.gunKick = 0.3; const dm = ewp.dmg || [12, 20]; hurtPlayer(dm[0] + Math.random() * (dm[1] - dm[0]), g.position); sfxEnemyShot(g.position.clone().setY(1.2)); }
    } else if (!dead && sees && u.flinch <= 0 && u.alertT <= 0 && dist < 56) {   // 反應延遲內不開火(發現→舉槍→開火)
      u.fireT -= dt; if (u.fireT <= 0) { u.fireT = (ewp.rateMin || 1.1) + Math.random() * (ewp.rateRnd || 1.4); enemyShoot(g, dist); }   // 射速隨武器(機槍密集/狙擊慢)
      u.grenadeT -= dt; if (u.grenadeT <= 0 && dist > 12 && dist < 40 && u.grenadesLeft > 0) { u.grenadeT = 9 + Math.random() * 8; u.grenadesLeft--; enemyGrenade(g); }   // 只第五關帶手榴彈的敵人丟(有限顆數)
    } else u.grenadeT -= dt * 0.3;
  }
}

/* ── 玩家生命 + 結算 ── */
const hpEl = document.getElementById("hp"), dmgEl = document.getElementById("dmg"), deadEl = document.getElementById("dead"), deadStatsEl = document.getElementById("dead-stats");
const scarEl = document.getElementById("scar"), narrEl = document.getElementById("narr"), mendEl = document.getElementById("mend-line"), hintEl = document.getElementById("hint");
let playerHP = 100, MAX_HP = 100, curDiff = null, dead = false, deaths = 0, bestWave = 0, scarFloor = 0, scarFlash = 0;
let rareDeathDone = false;   // EP41 稀有死亡變奏:每場 session 最多一次(低頻),避免「被同一句打中兩次」這麼重的句子被高頻死亡稀釋
let _reviveShowAunt = false;   // 旗標:這次重生要不要放 EP21 阿姨回來那句(由 endRun 在莊重死亡時設,restartGame 消費)
function startingMoney() { return settings.difficulty === 1 ? 2000 : 1000; }   // toni #5:劇情模式初始軍餉 2000,其他 1000
let money = startingMoney(), armor = 0, maskOwned = false;   // 購買系統:軍餉 / 防彈背心 ARMOR / 防護面罩
/* ── toni 連接句留白(只有 toni 可改;Claude 一字不寫,僅留 placeholder 標位置;聲音=把拔夢中第一人稱) ── */
const NARR = {
  // #1 進軍營(夢框建立)— toni 選 EP40 verbatim:首次鎖入軍營顯示一次,痛與迷惘的夢框底色
  hubEnter: "有時候腦袋很亂。痛。痛到不知道未來在哪裡。",
  // #3 夢中違和(反穿的學校外套/名字藏起來)— toni 選 EP33 verbatim:走近夢中反穿外套觸發
  dream3: "原來長大，有時是把名字藏起來的練習。",
  // 顧牛(EP40 夢中違和物件)— toni 親寫 verbatim canon(連長叫砲兵連算彈最快的計算手去顧牛;忠誠不亂跑)
  cow: "連長叫我去顧一頭牛。我就負責顧著這頭牛不要亂跑，我也不要亂跑。",
  // 顧牛反差前置(EP40 verbatim):最強的計算手被派去顧牛 — 反英雄、反「變強才通關」
  cowSetup: "有次跟新加坡聯合作戰演習，我是砲兵連算彈著點最快的計算手。",
  // 顧牛站滿約 8 秒解鎖的收尾(EP40 verbatim):沒有大道理,就是日子往前
  cowFull: "生活沒有什麼大道理，就是日子往前。",
  // #4 死亡「修補」拍 — toni 選「炸裂修補」方向 → 用 EP8 原句(toni 親寫,非 Claude 代筆;要換成新句隨時說)
  mend: "炸裂！修補。再炸裂！再修補。",
  // #4b 撐出新高波時的變奏(W6:綁 bestWave 突破才換)— toni 選 EP34 verbatim:結痂仍留疤的更深修補
  mendRecord: "我知道傷口結痂後，傷口還是會存在。",
  // #4c 稀有死亡變奏(每場最多一次,低頻)— EP41 verbatim:被同一句話打中兩次(阿姨的氣話 + 很久很久以前的那句)
  mendTwiceA: "你對我又沒什麼幫助，我一直都覺得是一個人。",   // EP41 阿姨的氣話 verbatim
  mendTwiceB: "你對家裡已經沒什麼貢獻了，可以不要再鬧事了嗎？",   // EP41 很久以前的那句 verbatim(長相好像,被同一句打中兩次)
  // 稀有死亡變奏收尾 — EP41 verbatim:縱使淡去也只是變淡(把時空耳機開到最大聲那一段)
  mendFade: "時間會過去，有些話永遠不會被忘記，但時間再久一點，這些話終究會淡去，但縱使淡去，也只是變淡。",
  // 重新部署(夢把他帶回來)— EP21 verbatim:阿姨每次都會馬上再回來一次,再找一次把拔
  reviveAunt: "阿姨每次都會馬上再回來一次，再找一次把拔。",
  // #5 撐過一波 — toni 選「撐≠強,是相信」方向 → 用 EP40 原句
  wave: "所以我撐，跟我強不強沒關係，是因為未來還沒到。",
  // #2 進實戰模擬前 — toni 選「熔爐不是軍隊是她」→ EP8 原句(鋼鐵人是她要的)
  enter: "妳要我成為鋼鐵人，有打不倒的自信，也有敲不碎的心。",
  // #6 一眼瞬間收束 — toni 選「妳一直都在」→ EP29 原句(放下槍才看見她一直都在)
  gaze: "妳一直都在。",
  // EP35 verbatim:一眼瞬間 reveal 那拍的回聲 — 那光的年紀是十八歲(她站在後門的光)
  lightAge: "那光的年紀，是十八歲。",
  // ── 以下 audit 標「需 toni 親寫」的槽位:placeholder([…])不顯示,toni 填真句自動生效 ──
  // 放下槍那一秒(撐過 GOAL_WAVE→awaitDisarm):情緒=不是打贏了,是不必再打了。承接「撐≠強」→「可以放下了」
  survived: "我會走到我變強的那個未來。",
  // 一眼瞬間收束第二拍(首尾合龍):放下槍=字面上閉眼→看見她,回扣開場「每當我閉上眼睛，我就可以看見妳」。低亮度回返一次
  gazeEcho: "每當我閉上眼睛，我就可以看見妳。",
  // A1 前門→後門 運鏡那拍的連接句(placeholder→不顯示,toni 填真句才生效):你走到後門那拍(前門探看沒人→繞到後門→她抬頭)
  backDoorSweep: "［待 toni 寫：你走到後門那拍］",
  // 首次呼叫砲擊/上載具:把毀滅性火力翻回韌性/這是夢不是真打(稀缺觸發一次)
  heavyFire: "先讓自己變好。",
  // ── A1 奪命連環 call(EP29 斷聯期 verbatim,逐字 canon)──
  phoneA: "我一再祭出「奪命連環 call」，",
  phoneB: "直到某天才明白：",
  phoneC: "我已被妳封鎖，",
  phoneD: "所有訊號都掉進了時間的黑洞。",
  // A1 撥號時的 scaffold 連接句(placeholder,toni 填真句才顯示)
  phoneDial: "［撥號連接句待填］",
  // ── A2 機車紙條(EP40 verbatim,逐字 canon)──
  noteText: "「我走了，你要好好照顧自己。」",
  noteAfterA: "那天之後，",
  noteAfterB: "我等了一天、又一天。",
  noteAfterC: "後來我不算了。",
  // ── A3 伯達樓轉角(EP13 verbatim,逐字 canon)──
  cornerA: "傍晚，我站在伯達樓的轉角，",
  cornerB: "天色昏暗，我的眼睛早已泛紅，遇到同學，他卻沒有注意到。",
  cornerC: "我站著，就站著，站了好久。",
  // ── A4 登登登的 7 秒(EP7 verbatim,逐字 canon)──
  ddA: "我都會等妳上線7秒後，",
  ddB: "我再「現身」。",
  ddC: "我要當妳每天上線後，",
  ddD: "會收到的第一個「登登登～」",
  // A4 七秒等待的 scaffold 連接句(placeholder,toni 填真句才顯示)
  ddWait: "［七秒等待連接句待填］",
  // ── B1 算彈著點最快,卻算不出哪一天:首次呼叫砲擊命中時一次 ──
  // setup scaffold(placeholder→不顯示,toni 填真句才生效;EP40 計算手那句已用在顧牛 cowSetup,B1 不重複,只留連接句槽位)
  artySetup: "［砲擊反差連接句待填］",
  // B1 payload(EP41 verbatim,逐字 canon):全知計算的精準 vs 算不出她的那一天的失語
  artyDay: "「我不知道是哪一天，我真的不知道。」",
  // ── B2 3 秒看穿世界,卻看不穿她:首次開鏡(ADS)時一次 ──
  // B2 setup(EP2 verbatim,逐字 canon):20年訓練看穿人類的眼睛只要3秒
  adsSee: "經由20年的訓練，「看穿人類的眼睛」只需要3秒就可以看進最深處",
  // B2 payload(EP9 verbatim,逐字 canon):全知之眼唯一盲點=她轉身那刻
  adsTurn: "妳轉身就走，妳怎麼捨得？",
  // ── B3 那張光碟·信念補給:硬關走過光碟拾取時一次 ──
  // B3 setup(EP40 verbatim,逐字 canon):2007 當兵前給的那張光碟上寫的字
  discSetup: "「三年後，五年後，我們一定會有最完美的相遇。」",
  // B3 payload(EP40 verbatim,逐字 canon):相信那個寫下三年五年的自己
  discBelief: "但我相信，我相信那個寫下三年、五年的自己。",
  // ── B4 等待,也算在約會的時間裡:波間 lull(第2波後)時一次 ──
  // B4 setup(EP6 verbatim,逐字 canon)
  waitDate: "「等待的時候，也算在約會的時間裡。」",
  // B4 payload(EP6 verbatim,逐字 canon):這句話的開端,是妳先等我
  waitOpen: "原來，這句話的開端，是從妳先等我開始。",
  // ── C2 剝好的牡丹蝦(EP28 verbatim,逐字 canon):年夜飯整盤蝦都剝好,最後全進自己肚子裡 ──
  shrimpA: "全家人圍坐在餐廳大圓桌，我把整盤牡丹蝦都剝好，最後全進了自己的肚子裡。",
  // C2 對面那個空座的連接句(scaffold,placeholder→不顯示,toni 填真句才生效;那份缺=空著的位子)
  shrimpEmpty: "［空座那份缺的連接句待填］",
  // ── C3 鏡子·純白的紙:EP11 白紙意象原句是「學妹口吻」(救贖我／學長＝他),與 toni #4「全學長視角」鐵則衝突 → 暫 ［-gate 不顯示,待 toni 寫成學長對鏡自照口吻(他想起她曾如此定義他)。EP11 原句供參:「但就是像一張白紙的他，才有機會成為『無數個七生七世』都可以救贖我的那個他。」／「學長那時不只一捏就爛，其實也是一碰就碎！」
  mirrorA: "當我成為那個我的時候，妳才會變成那個妳，妳才是妳，我才是我。",   // toni 親寫(學長對鏡自照,他的口吻)
  mirrorB: "",
  // ── C1 華江橋下的告白(EP9 verbatim,逐字 canon):放下槍→reveal 前的那拍 payload ──
  bridgeFear: "「我不怕妳，我只是害怕失去妳！」",
  // C1 你22我21 的對白 scaffold(placeholder→不顯示,toni 填真句才生效)
  bridgeAge: "［你22我21 連接句待填］",
  // ── C4 夢中夢的清醒(EP40 verbatim,逐字 canon):reveal 前最後一拍,明知是夢仍相信 ──
  dreamAwake: "現在回頭看，真的有點天真。",
  // C4 夢中夢/不能穿越的 framing 連接句(scaffold,placeholder→不顯示,toni 填真句才生效)
  // 前因後果(給 toni 寫清楚):EP37 夢裡改不了結局 + 不舉手 framing → 明知這條路改不了、也醒不來,仍走下去那拍的情緒落點(夢的死/夢的 framing 拍)
  dreamCantCross: "［夢中夢不能穿越的連接句待填］",
  // 不舉手→夢醒→起床後、掉進難度5之前那拍的「知情同意」:告訴玩家這是夢中夢,這條路改不了(被碾壓正常、改不了也醒不來)。toni 填真句才顯示
  // framing intent:不舉手不是真實事件→所以進入夢中夢→被碾壓是正常→改不了也醒不來
  dreamConsent: "入伍前，我理了一個大光頭，打定主意，我要加入兩棲蛙人。",   // toni 親寫(不舉手→夢中夢前的學長口吻)
  // 不舉手→天堂路那輪陣亡的釋放句(EP41 verbatim,逐字 canon):夠努力了,不說加油。單一來源(原硬寫在兩處,抽常數去重)
  dreamMend: "妳已經夠努力了，所以我不會對妳說加油。",
};
if (mendEl) mendEl.textContent = NARR.mend;
function isReal(s) { return !!s && s[0] !== "［"; }   // 連接句守門:placeholder([…])不顯示,toni 填真句後自動生效
let firstHubShown = false, pupilT = 0;   // pupilT>0:黑序幕→軍營瞳孔適應(曝光從低升、暗角從重退,約2s),從黑暗夢境出來不像被開大燈
function showNarr(text, dur) { if (!narrEl || !isReal(text)) return; narrEl.textContent = text; narrEl.style.opacity = "1"; clearTimeout(narrEl._t); narrEl._t = setTimeout(() => (narrEl.style.opacity = "0"), (dur || 3) * 1000); }
// B7 首次進軍營一次性方向指引:敘事閘順序(先進中山室找輔導長)不易自行發現,故首次進場給一句功能性指引,不受提示收合開關影響,只顯示一次(持久化)
let hubFirstHintShown = false; try { hubFirstHintShown = localStorage.getItem("tiantanglu_hub_first_hint_v1") === "1"; } catch (e) { }
function showHubFirstHint() {
  if (hubFirstHintShown || !hintEl) return;
  hubFirstHintShown = true; try { localStorage.setItem("tiantanglu_hub_first_hint_v1", "1"); } catch (e) { }
  setTimeout(() => {   // 等夢框建立句(hubEnter)先讀一拍,再浮現方向指引
    if (MODE !== "hub" || !hintEl) return;
    hintEl.classList.remove("pulse"); hintEl.style.opacity = "1"; hintEl.textContent = "先走進中山室，找輔導長談談";
    clearTimeout(hintEl._hubT); hintEl._hubT = setTimeout(() => { if (hintEl) hintEl.style.opacity = "0"; }, 6000);
  }, 4600);
}
/* ── 顧牛反差(EP40):先放「我是算彈著點最快的計算手」(反英雄設定),再放顧牛那句(最強的人被派去顧牛) ── */
let cowStandT = 0, cowFullShown = false;   // cowStandT:站在牛旁累積秒數;cowFullShown:站滿約 8s 解鎖的收尾句只放一次
function showCowBeat() {
  showNarr(NARR.cowSetup, 4.2);
  clearTimeout(showCowBeat._t);
  showCowBeat._t = setTimeout(() => { if (MODE === "hub" && nearCow()) showNarr(NARR.cow, 5.5); }, 4400);   // 反差設定先讀完,再落到顧牛那句
}
/* ── C2 剝好的牡丹蝦(EP28):那盤蝦那句先讀,再落到對面那個空座(scaffold,toni 填才顯示) verbatim canon ── */
function showShrimpBeat() {
  showNarr(NARR.shrimpA, 6.0);
  clearTimeout(showShrimpBeat._t);
  showShrimpBeat._t = setTimeout(() => { if (MODE === "hub" && nearShrimp()) showNarr(NARR.shrimpEmpty, 5.0); }, 6200);   // 蝦那句先讀完,再落到空座連接句
}
/* ── C3 鏡子·純白的紙(EP11):鏡前倒影裡兩句 verbatim canon 分拍沉下(純白=命中注定的承) ── */
function showMirrorBeat() {
  showNarr(NARR.mirrorA, 6.0);
  clearTimeout(showMirrorBeat._t);
  showMirrorBeat._t = setTimeout(() => { if (MODE === "hub" && nearWash()) showNarr(NARR.mirrorB, 5.5); }, 6200);   // 白紙那句先讀完,再落到一捏就爛、一碰就碎
}
/* ── A1 奪命連環 call(EP29):撥號→訊號掉進黑洞→撥不通,逐句沉下 verbatim canon ── */
function showPhoneBeat() {
  showNarr(NARR.phoneDial, 2.6);                                                        // 撥號 scaffold(placeholder→不顯示,toni 填真句才生效)
  try { tone(620, 600, 0.5, 0.12, "sine"); setTimeout(() => tone(440, 200, 0.7, 0.1, "sine"), 600); } catch (e) { }   // 撥號音→訊號掉進黑洞(下沉音)
  clearTimeout(showPhoneBeat._t1); clearTimeout(showPhoneBeat._t2); clearTimeout(showPhoneBeat._t3); clearTimeout(showPhoneBeat._t4);
  showPhoneBeat._t1 = setTimeout(() => showNarr(NARR.phoneA, 4.0), 2600);
  showPhoneBeat._t2 = setTimeout(() => showNarr(NARR.phoneB, 3.4), 6800);
  showPhoneBeat._t3 = setTimeout(() => showNarr(NARR.phoneC, 3.8), 10400);
  showPhoneBeat._t4 = setTimeout(() => showNarr(NARR.phoneD, 5.5), 14400);
}
/* ── A2 機車紙條(EP40):紙條那句先讀,再落到「我等了一天、又一天」 verbatim canon ── */
function showMotorbikeBeat() {
  showNarr(NARR.noteText, 4.5);
  clearTimeout(showMotorbikeBeat._t1); clearTimeout(showMotorbikeBeat._t2); clearTimeout(showMotorbikeBeat._t3);
  showMotorbikeBeat._t1 = setTimeout(() => showNarr(NARR.noteAfterA, 3.4), 4700);
  showMotorbikeBeat._t2 = setTimeout(() => showNarr(NARR.noteAfterB, 3.8), 8200);
  showMotorbikeBeat._t3 = setTimeout(() => showNarr(NARR.noteAfterC, 5.0), 12200);
}
/* ── A3 伯達樓轉角(EP13):多句旁白分拍沉下 verbatim canon ── */
function showCornerBeat() {
  showNarr(NARR.cornerA, 4.2);
  clearTimeout(showCornerBeat._t1); clearTimeout(showCornerBeat._t2);
  showCornerBeat._t1 = setTimeout(() => showNarr(NARR.cornerB, 5.0), 4400);
  showCornerBeat._t2 = setTimeout(() => showNarr(NARR.cornerC, 5.0), 9600);
}
/* ── A4 登登登的 7 秒(EP7):字面 ~7 秒等待,等待後現身那句 + 登登登 verbatim canon ── */
function showTerminalBeat() {
  showNarr(NARR.ddWait, 6.8);                                                           // 七秒等待 scaffold(placeholder→不顯示,toni 填真句才生效)
  clearTimeout(showTerminalBeat._t1); clearTimeout(showTerminalBeat._t2); clearTimeout(showTerminalBeat._t3); clearTimeout(showTerminalBeat._t4);
  showTerminalBeat._t1 = setTimeout(() => showNarr(NARR.ddA, 3.6), 7000);               // 等妳上線 7 秒後(字面延遲 7s 才現身)
  showTerminalBeat._t2 = setTimeout(() => { try { tone(523, 523, 0.12, 0.12, "square"); setTimeout(() => tone(659, 659, 0.12, 0.12, "square"), 130); setTimeout(() => tone(784, 784, 0.16, 0.13, "square"), 260); } catch (e) { } showNarr(NARR.ddB, 3.2); }, 10800);   // 「現身」那拍:三聲上行「登登登～」提示音
  showTerminalBeat._t3 = setTimeout(() => showNarr(NARR.ddC, 3.4), 14200);
  showTerminalBeat._t4 = setTimeout(() => showNarr(NARR.ddD, 5.0), 17800);
}
/* ── B3 那張光碟·信念補給:硬關地上一張光碟,走過去撿起 → EP40 verbatim(寫下三年五年的相信)。
   去爽-safe:只給很小的安靜回饋(微量 HP + 疤痕閃光抹平一拍),沒有大補、沒有無敵、沒有數字彈出;payload 是文字(信念),不是 power-up。每場最多一次,撿走或波結束即消失。 ── */
let disc = null;   // 光碟 prop(null=未生成);硬關生成一次,撿走/波結束清掉
function spawnDisc() {
  if (disc || _b3Said || MODE !== "sim") return;
  const g = new THREE.Group();
  // 落在玩家腳邊偏前的安靜處(用相機朝向往前 5~6m),保證走幾步就能撿到,不必跨場找
  const fwd = camera.getWorldDirection(new THREE.Vector3()); fwd.y = 0; if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1); fwd.normalize();
  let px = camera.position.x + fwd.x * 5.5, pz = camera.position.z + fwd.z * 5.5;
  for (let k = 1; k <= 6 && blockedAt(px, pz, 0.6); k++) { const d = 5.5 - k * 0.8; px = camera.position.x + fwd.x * d; pz = camera.position.z + fwd.z * d; }   // 防生在牆/建築裡:落點被擋就往玩家方向退回找空位
  g.position.set(px, 0, pz); ROOT.add(g);
  const cd = mat(0xcfd6e0, { metalness: 0.85, roughness: 0.18, envMapIntensity: 1.4 });   // 光碟銀亮反光面
  const d1 = add(new THREE.CylinderGeometry(0.6, 0.6, 0.03, 28), cd, 0, 0.06, 0, g); d1.rotation.x = 0;
  const hub = add(new THREE.CylinderGeometry(0.13, 0.13, 0.035, 18), mat(0x20242c, { metalness: 0.3, roughness: 0.7 }), 0, 0.066, 0, g);   // 中心孔環
  // 立一道脈動光柱(沿用互動點視覺語彙),讓硬關中也看得到它在哪
  const beam = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, color: 0x9fd0ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  beam.position.set(0, 1.7, 0); beam.scale.set(0.5, 3.4, 1); beam.raycast = () => { }; g.add(beam);
  disc = g; disc.userData.beam = beam;
}
function clearDisc() { if (disc) { ROOT.remove(disc); disc = null; } }
function nearDisc() { if (!disc) return false; const dx = camera.position.x - disc.position.x, dz = camera.position.z - disc.position.z; return dx * dx + dz * dz < 2.6; }
function pickupDisc() {
  if (!disc || _b3Said) return;
  _b3Said = true; clearDisc();
  if (actx) { tone(523, 660, 0.16, 0.08, "sine"); setTimeout(() => { if (actx) tone(784, 880, 0.2, 0.07, "sine"); }, 150); }   // 安靜的拾取上行兩聲(不是補血爽音)
  playerHP = Math.min(MAX_HP, playerHP + 6); if (hpEl) hpEl.textContent = Math.round(playerHP);   // 很小的 HP nudge(無彈窗,只反映在既有血條)
  scarFlash = 0;   // 疤痕閃光抹平一拍(brief scar-vignette calm)
  showNarr(NARR.discSetup, 4.5);
  setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr(NARR.discBelief, 5.5); }, 4700);
}
/* ── hub/sim 狀態機:把拔的夢,走到靶場才回到天堂路(實戰模擬練習) ── */
function nearRangeEntry() { const dx = camera.position.x - RANGE_ENTRY.x, dz = camera.position.z - RANGE_ENTRY.z; return dx * dx + dz * dz < 49; }
function nearCow() { const dx = camera.position.x - COW_POS.x, dz = camera.position.z - COW_POS.z; return dx * dx + dz * dz < 16; }
function nearJacket() { const dx = camera.position.x - JACKET_POS.x, dz = camera.position.z - JACKET_POS.z; return dx * dx + dz * dz < 13; }
function nearDiary() { const dx = camera.position.x - DIARY_POS.x, dz = camera.position.z - DIARY_POS.z; return dx * dx + dz * dz < 11; }
function nearCounselor() { const dx = camera.position.x - COUNSELOR_POS.x, dz = camera.position.z - COUNSELOR_POS.z; return dx * dx + dz * dz < 10; }
function nearCommander() { const dx = camera.position.x - COMMANDER_POS.x, dz = camera.position.z - COMMANDER_POS.z; return dx * dx + dz * dz < 10; }
function nearPhone() { const dx = camera.position.x - PHONE_POS.x, dz = camera.position.z - PHONE_POS.z; return dx * dx + dz * dz < 12; }
function nearMotorbike() { const dx = camera.position.x - MOTORBIKE_POS.x, dz = camera.position.z - MOTORBIKE_POS.z; return dx * dx + dz * dz < 13; }
function nearCorner() { const dx = camera.position.x - CORNER_POS.x, dz = camera.position.z - CORNER_POS.z; return dx * dx + dz * dz < 12; }
function nearTerminal() { const dx = camera.position.x - TERMINAL_POS.x, dz = camera.position.z - TERMINAL_POS.z; return dx * dx + dz * dz < 11; }
function nearShrimp() { const dx = camera.position.x - SHRIMP_POS.x, dz = camera.position.z - SHRIMP_POS.z; return dx * dx + dz * dz < 13; }   // C2 餐桌那盤蝦:半徑放寬到對齊其他互動點(原 <6 太緊+餐桌遮擋→看得到信標卻按E沒反應)
function nearWash() { if (!isReal(NARR.mirrorA)) return false; const dx = camera.position.x - WASH_POS.x, dz = camera.position.z - WASH_POS.z; return dx * dx + dz * dz < 11; }   // C3 盥洗台鏡前;mirrorA 仍是 ［待填］→ 整個鏡子互動(提示+對白)gate 掉,toni 填學長視角句後自動啟用
/* ── 敘事閘狀態(per-session,不持久化):輔導長→連長舉手→靶場解鎖。連長未談前靶場上鎖 ── */
let metCounselor = false, raisedHand = false;
let dreamLock = false, _preDreamDiff = null;   // 不舉手→夢醒→天堂路(難度 5)鎖死:此關不能改難度(夢中夢),死亡/重啟才解。_preDreamDiff:夢前難度快照,夢醒後還原(難度 5 只在這一輪生效,不寫進 localStorage→下次開遊戲不會被困在天堂路)
/* ── 對白浮層(輔導長/連長 → 玩家內心話 → 對方回話 → 選項);純 createElement/textContent ── */
const dialogEl = document.getElementById("dialog");
function unlockMouse() { if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }
function clearChildren(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
function closeDialog() { if (dialogEl) { dialogEl.classList.remove("on"); clearChildren(dialogEl); } }
function showDialog(lines, choices) {   // lines: [{who, text}];choices: [{label, onClick}] 或 null(顯示「繼續」關閉)
  if (!dialogEl) return;
  clearChildren(dialogEl);
  const card = document.createElement("div"); card.className = "dlg-card";
  for (const ln of lines) {
    const row = document.createElement("div"); row.className = "dlg-line" + (ln.who === "我" ? " self" : "");
    if (ln.who) { const w = document.createElement("div"); w.className = "dlg-who"; w.textContent = ln.who; row.appendChild(w); }
    const t = document.createElement("div"); t.className = "dlg-txt"; t.textContent = ln.text; row.appendChild(t);
    card.appendChild(row);
  }
  const btns = document.createElement("div"); btns.className = "dlg-btns";
  if (choices && choices.length) {
    for (const c of choices) { const b = document.createElement("button"); b.type = "button"; b.className = "dlg-btn"; b.textContent = c.label; b.addEventListener("click", () => { closeDialog(); c.onClick(); }); btns.appendChild(b); }
  } else {
    const b = document.createElement("button"); b.type = "button"; b.className = "dlg-btn"; b.textContent = "繼續"; b.addEventListener("click", closeDialog); btns.appendChild(b);
  }
  card.appendChild(btns); dialogEl.appendChild(card);
  dialogEl.classList.add("on"); unlockMouse();
}
/* ── 輔導長:玩家(學長)內心話 → 輔導長回話(笑而不答) ── */
function talkCounselor() {
  metCounselor = true;
  showDialog([
    { who: "我", text: "為什麼我還在當兵，我不是已經退伍了嗎？" },
    { who: "輔導長", text: "你去找連長談。" },   // 笑而不答
  ], null);
}
/* ── 連長:需先見過輔導長;舉手→伯達樓那段、解鎖靶場;不舉手→夢醒結局 ── */
function talkCommander() {
  if (!metCounselor) { showNarr("先去中山室找輔導長談談", 2.8); return; }
  showDialog([
    { who: "連長", text: "要參加兩棲蛙人的舉手！" },
  ], [
    { label: "舉手", onClick: () => { raisedHand = true; showDialog([{ who: "", text: "伯達樓那個轉角，那天我哭紅了雙眼。我就站在那邊，好久好久。" }], [{ label: "繼續", onClick: () => { showDialog([{ who: "連長", text: "去練習場模擬射擊。" }], null); } }]); } },   // #14:伯達樓 OS 後,連長指示去練習場(靶場已隨 raisedHand 解鎖)
    { label: "不舉手", onClick: dreamWake },
  ]);
}
const diaryEl = document.getElementById("diary");
function openDiary() { if (!diaryEl) return; diaryEl.classList.add("on"); if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }
function closeDiary() { if (diaryEl) diaryEl.classList.remove("on"); }
if (document.getElementById("diary-close")) document.getElementById("diary-close").addEventListener("click", closeDiary);
// toni #4:完成 顧牛 + 翻日記 + 看反穿外套 三互動 → 解鎖劇情模式,跳絢麗紅線提示(5s)
const shardsEl = document.getElementById("shards");
function shardCount() { return (seenCow ? 1 : 0) + (seenDiary ? 1 : 0) + (seenJacket ? 1 : 0); }   // 夢的碎片:顧牛/反穿外套/大兵日記三個探索點,讀持久旗標反映進度
function updateShards(bump) { if (!shardsEl) return; shardsEl.textContent = "夢的碎片 " + shardCount() + "/3"; if (bump) { shardsEl.classList.add("bump"); clearTimeout(updateShards._t); updateShards._t = setTimeout(() => { if (shardsEl) shardsEl.classList.remove("bump"); }, 1400); } }   // bump:首次遇見一個時亮一階再沉回(極低調,非任務清單)
updateShards(false);   // 載入時先反映持久進度(碎片文字)
function markStoryStep(which) {
  let changed = false;
  if (which === "cow" && !seenCow) { seenCow = true; try { localStorage.setItem("tiantanglu_seen_cow_v1", "1"); } catch (e) { } changed = true; }
  else if (which === "diary" && !seenDiary) { seenDiary = true; try { localStorage.setItem("tiantanglu_seen_diary_v1", "1"); } catch (e) { } changed = true; }
  else if (which === "jacket" && !seenJacket) { seenJacket = true; try { localStorage.setItem("tiantanglu_seen_jacket_v1", "1"); } catch (e) { } changed = true; }
  if (changed) updateShards(true);   // 首次遇見一個探索點:碎片 +1 並亮一階
  if (storyUnlocked) return;
  if (changed && seenCow && seenDiary && seenJacket) {
    storyUnlocked = true; try { localStorage.setItem("tiantanglu_story_unlocked_v1", "1"); } catch (e) { }
    if (refreshDiffSlider) refreshDiffSlider();
    showStoryUnlock();
  }
}
function showStoryUnlock() {
  if (document.getElementById("story-unlock")) return;
  const ov = document.createElement("div"); ov.id = "story-unlock";
  const lines = document.createElement("div"); lines.className = "su-lines";
  for (let i = 0; i < 5; i++) { const ln = document.createElement("span"); ln.className = "su-line"; ln.style.setProperty("--i", i); lines.appendChild(ln); }
  const card = document.createElement("div"); card.className = "su-card";
  const t1 = document.createElement("div"); t1.className = "su-title"; t1.textContent = "劇情模式・已解鎖";
  const t2 = document.createElement("div"); t2.className = "su-sub"; t2.textContent = "紅線記得你走過的路。到左上齒輪(設定)就能選「劇情模式」，血量彈藥最寬裕，專心看故事。";
  card.appendChild(t1); card.appendChild(t2);
  ov.appendChild(lines); ov.appendChild(card);
  document.body.appendChild(ov);
  requestAnimationFrame(() => ov.classList.add("on"));
  setTimeout(() => { ov.classList.remove("on"); setTimeout(() => { if (ov.parentNode) ov.parentNode.removeChild(ov); }, 900); }, 5000);   // 五秒後淡出消失(toni #4)
}

/* ══════════════ 故事選單(戰前/戰後/全部 42 集)+ 嵌入閱讀(同源 reader,離開戰場也不中斷音樂) ══════════════ */
const STORY = window.TTL_STORY || { intros: [], before: { framing: "", eps: [] }, after: { framing: "", eps: [] } };
const storyEl = document.getElementById("story"), storyListEl = document.getElementById("story-list"), storyFramingEl = document.getElementById("story-framing");
const reEl = document.getElementById("reader-embed"), reFrame = document.getElementById("re-frame"), reTitleEl = document.getElementById("re-title");
function introByEp(ep) { return STORY.intros.find((x) => x.ep === ep) || null; }
function makeEpRow(ep) {   // 共用:一張可點開閱讀的 EP 卡(戰前/戰後/全部/迴聲 都重用,純 createElement/textContent)
  const it = introByEp(ep); if (!it) return null;
  const row = document.createElement("button"); row.type = "button"; row.className = "ep-row";
  const t = document.createElement("div"); t.className = "ep-t";
  const b = document.createElement("b"); b.textContent = "EP" + ep; t.appendChild(b);
  t.appendChild(document.createTextNode(it.title));
  const ii = document.createElement("div"); ii.className = "ep-i"; ii.textContent = it.intro;
  row.appendChild(t); row.appendChild(ii);
  row.addEventListener("click", () => openEmbed(ep, it.title));
  return row;
}
function renderEcho() {   // 迴聲:成對的章節(隔二十年又響一次)+ 每組一句中性連接句(scaffold,非小說正文)
  const echo = STORY.echo || { framing: "", pairs: [] };
  if (storyFramingEl) storyFramingEl.textContent = echo.framing || "";
  while (storyListEl.firstChild) storyListEl.removeChild(storyListEl.firstChild);
  (echo.pairs || []).forEach((pr) => {
    const ra = makeEpRow(pr.a); if (ra) storyListEl.appendChild(ra);
    const note = document.createElement("div"); note.className = "echo-note"; note.textContent = pr.note || ""; storyListEl.appendChild(note);   // 連接句:「這句話，二十年後又響了一次」
    const rb = makeEpRow(pr.b); if (rb) storyListEl.appendChild(rb);
  });
  storyListEl.scrollTop = 0;
}
function setStoryTab(sec) { if (storyEl) storyEl.querySelectorAll(".story-tabs button").forEach((b) => b.classList.toggle("on", b.getAttribute("data-sec") === sec)); }
function renderStory(sec) {
  if (!storyListEl) return;
  if (sec === "echo") { setStoryTab("echo"); renderEcho(); return; }   // 迴聲分支:成對渲染,不走線性清單
  let eps, framing;
  if (sec === "after") { eps = STORY.after.eps; framing = STORY.after.framing; }
  else if (sec === "all") { eps = STORY.intros.map((x) => x.ep); framing = "從 EP0 一路讀到 EP41，看一眼瞬間怎麼走成一輩子。"; }
  else { sec = "before"; eps = STORY.before.eps; framing = STORY.before.framing; }
  setStoryTab(sec);
  if (storyFramingEl) storyFramingEl.textContent = framing || "";
  while (storyListEl.firstChild) storyListEl.removeChild(storyListEl.firstChild);
  eps.forEach((ep) => { const row = makeEpRow(ep); if (row) storyListEl.appendChild(row); });
  storyListEl.scrollTop = 0;
}
function openStory(sec) {
  if (!storyEl) return;
  renderStory(sec || "before");
  storyEl.classList.add("on");
  if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock();
}
function closeStory() { if (storyEl) storyEl.classList.remove("on"); }
function openEmbed(ep, title) {
  if (!reEl || !reFrame) return;
  reEl.classList.add("on");   // 先顯示容器:iframe 必須在「可見」狀態下載入,行動瀏覽器/content-visibility 才會正常 paint(否則整片黑,toni #1)
  if (reTitleEl) reTitleEl.textContent = "EP" + ep + (title ? " · " + title : "");
  // toni #1:開啟閱讀器不再啟動/改變音樂——本來在播什麼就續播什麼(reader 自畫 in-iframe bar 控制靜音)
  reFrame.onload = function () { try { var w = reFrame.contentWindow; if (w) { w.dispatchEvent(new Event("resize")); w.scrollTo(0, 0); w.postMessage({ source: "ttl-game", muted: masterMuted }, location.origin); } } catch (e) { } };   // 載入後踢一次 layout/scroll 逼節流 iframe paint;並把當前靜音狀態同步給 reader(它的 in-iframe bar 圖示據此顯示)
  reFrame.src = "../../../reader.html?embed=1&from=tiantanglu#ep-" + ep;   // 同源 iframe(frame-src 'self');from=tiantanglu→返回鍵顯示「回到天堂路」;遊戲端音樂照常續播,讀完按返回回清單
}
function closeEmbed() { if (reEl) reEl.classList.remove("on"); if (reFrame) reFrame.src = "about:blank"; }   // 卸載 iframe 釋放資源(不停音樂:本來在播什麼就續播)
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && reEl && reEl.classList.contains("on")) closeEmbed(); });   // r16:鍵盤 Esc 關閉閱讀(與月台/LM402 一致的鍵盤後援;萬一 in-iframe 回到遊戲鈕沒 postMessage 也不會被關住)
// toni #1:接收 reader in-iframe bar 的 postMessage(回故事清單 / 切換靜音);只信同源 + ttl-reader 來源
if (!window.__ttlReaderMsgBound__) {
  window.__ttlReaderMsgBound__ = true;
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    const d = e.data; if (!d || d.source !== "ttl-reader") return;
    if (d.action === "close") closeEmbed();
    else if (d.action === "toggle-mute") {
      setMasterMute(!masterMuted);   // 切換全域靜音
      const f = document.getElementById("re-frame");
      if (f && f.contentWindow) f.contentWindow.postMessage({ source: "ttl-game", muted: masterMuted }, location.origin);   // 回報新狀態讓 reader 圖示同步
    }
  });
}
(function buildStoryRec() {   // 建議先讀(toni #8):第一次來的入口三章 — EP3 一眼瞬間 / EP38 那光的年紀是十八 / EP41 謝謝妳沒放棄我
  const rec = document.getElementById("story-rec"); if (!rec) return;
  const lbl = document.createElement("div"); lbl.className = "rec-lbl"; lbl.textContent = "第一次來，建議先讀這三章"; rec.appendChild(lbl);
  [3, 38, 41].forEach((ep) => {
    const it = introByEp(ep); if (!it) return;
    const chip = document.createElement("button"); chip.type = "button"; chip.className = "rec-chip";
    chip.textContent = "EP" + ep + " · " + it.title;
    chip.addEventListener("click", () => openEmbed(ep, it.title));
    rec.appendChild(chip);
  });
})();
const _setStoryBtn = document.getElementById("set-story"); if (_setStoryBtn) _setStoryBtn.addEventListener("click", () => { closeSettings(); openStory("before"); });
const _diaryStoryBtn = document.getElementById("diary-story"); if (_diaryStoryBtn) _diaryStoryBtn.addEventListener("click", () => { closeDiary(); openStory("before"); });
/* ── toni #2:自訂 UI(操作模式切換 + 編輯模式:拖移/大小/重設)── */
(function bindCustomUI() {
  const box = document.getElementById("set-uimode-btns");
  const MODES = { 1: { n: "拖曳看", d: "右側滑動控視角" }, 2: { n: "視角搖桿", d: "右下搖桿+雙側射擊" } };
  function renderMode() {
    if (!box) return;
    while (box.firstChild) box.removeChild(box.firstChild);
    [1, 2].forEach((m) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "diff-btn" + (settings.uiMode === m ? " on" : "");
      const nm = document.createElement("span"); nm.className = "db-n"; nm.textContent = MODES[m].n;
      const ds = document.createElement("span"); ds.className = "db-d"; ds.textContent = MODES[m].d;
      b.appendChild(nm); b.appendChild(ds);
      b.addEventListener("click", () => { settings.uiMode = m; saveSettings(); applyUI(); renderMode(); });
      box.appendChild(b);
    });
  }
  renderMode();
  const customBtn = document.getElementById("set-customui");
  if (customBtn) customBtn.addEventListener("click", () => { closeSettings(); document.body.classList.add("ui-edit"); lookJX = 0; lookJY = 0; const sc = document.getElementById("uep-scale"); if (sc) sc.value = settings.uiScale || 1; });
  const doneBtn = document.getElementById("uep-done"); if (doneBtn) doneBtn.addEventListener("click", () => document.body.classList.remove("ui-edit"));
  const scaleEl = document.getElementById("uep-scale"); if (scaleEl) scaleEl.addEventListener("input", () => { settings.uiScale = Math.max(0.8, Math.min(1.5, parseFloat(scaleEl.value) || 1)); saveSettings(); applyUI(); });
  const resetBtn = document.getElementById("uep-reset"); if (resetBtn) resetBtn.addEventListener("click", () => { settings.uiPos = {}; settings.uiScale = 1; saveSettings(); applyUI(); if (scaleEl) scaleEl.value = 1; });
  // 編輯模式拖移:capture 先攔截(stopPropagation 不觸發遊戲鈕),改用 left/top 定位並存 uiPos
  let dragEl = null, dragId = null, offX = 0, offY = 0;
  function pick(target) { let el = target; while (el && el !== document.body) { if (el.id && UI_MOVABLE.indexOf(el.id) >= 0) return el; el = el.parentElement; } return null; }
  function dStart(x, y, target) { if (!document.body.classList.contains("ui-edit")) return false; const el = pick(target); if (!el) return false; dragEl = el; offX = x - el.offsetLeft; offY = y - el.offsetTop; return true; }   // 用 offsetLeft/Top(不含 transform)對齊 dMove/dEnd 的盒座標,uiScale≠1 時抓取不瞬間平移
  function dMove(x, y) { if (!dragEl) return; const l = Math.max(0, Math.min(innerWidth - dragEl.offsetWidth, x - offX)), t = Math.max(0, Math.min(innerHeight - dragEl.offsetHeight, y - offY)); dragEl.style.left = l + "px"; dragEl.style.top = t + "px"; dragEl.style.right = "auto"; dragEl.style.bottom = "auto"; }
  function dEnd() { if (!dragEl) return; settings.uiPos = settings.uiPos || {}; const _b = uiOri(); settings.uiPos[_b] = settings.uiPos[_b] || {}; settings.uiPos[_b][dragEl.id] = { l: Math.round(dragEl.offsetLeft), t: Math.round(dragEl.offsetTop) }; saveSettings(); dragEl = null; }   // 依當前方向(直/橫)分桶存版面盒座標(offsetLeft/Top),旋轉後不互相污染
  document.addEventListener("touchstart", (e) => { if (!document.body.classList.contains("ui-edit")) return; const t = e.changedTouches[0]; if (dStart(t.clientX, t.clientY, e.target)) { dragId = t.identifier; e.preventDefault(); e.stopPropagation(); } }, { passive: false, capture: true });
  document.addEventListener("touchmove", (e) => { if (!dragEl) return; for (const t of e.changedTouches) if (t.identifier === dragId) { dMove(t.clientX, t.clientY); e.preventDefault(); } }, { passive: false, capture: true });
  document.addEventListener("touchend", (e) => { if (!dragEl) return; for (const t of e.changedTouches) if (t.identifier === dragId) { dEnd(); dragId = null; } }, { capture: true });
  document.addEventListener("mousedown", (e) => { if (!document.body.classList.contains("ui-edit")) return; if (dStart(e.clientX, e.clientY, e.target)) { e.preventDefault(); e.stopPropagation(); } }, true);
  document.addEventListener("mousemove", (e) => { if (dragEl) dMove(e.clientX, e.clientY); });
  document.addEventListener("mouseup", () => { if (dragEl) dEnd(); });
})();
if (storyEl) storyEl.querySelectorAll(".story-tabs button").forEach((b) => b.addEventListener("click", () => renderStory(b.getAttribute("data-sec"))));
const _storyClose = document.getElementById("story-close"); if (_storyClose) _storyClose.addEventListener("click", closeStory);
// toni #1:re-back / re-music 改由 reader 在 iframe 內自畫並用 postMessage 通知(見上方 message listener),parent bar 已移除
backdropClose("story", closeStory);

/* ══════════════ 破關紀念(走完天堂路:不跳回開頭,音樂續播,邊聽邊看故事 / 再次挑戰) ══════════════ */
const clearEl = document.getElementById("clear"), clearSubEl = document.getElementById("clear-sub"), clearDiffEl = document.getElementById("clear-diff");
function updateMusicToggleLabels() {   // 結局選單/閱讀的音樂鈕標籤隨 gazeMusic 狀態
  const on = !!(gazeMusic && !gazeMusic.paused);
  const cm = document.getElementById("clear-music"); if (cm) cm.textContent = on ? "🔊 音樂播放中 · 點此關閉" : "🔇 音樂已關 · 點此開啟";
  // re-music 元素 r16 已移除(音樂鈕改由 reader iframe 內 bar 經 postMessage 管理)
}
function stopGazeMusic() { if (gazeMusic) { try { gazeMusic.pause(); } catch (e) { } gazeMusic = null; } updateMusicToggleLabels(); }   // 再玩一次/回全集:結局樂停
function toggleGazeMusic() { if (!gazeMusic) return; if (gazeMusic.paused) { gazeMusic.play().catch(() => { }); gazeMusic.volume = (settings.vol != null ? settings.vol : 0.8) * 0.45; } else gazeMusic.pause(); updateMusicToggleLabels(); }   // 看故事時可關/開音樂
function openClear() {
  if (!clearEl) return;
  if (clearSubEl) clearSubEl.textContent = "整整十五年的等待，他靠的不是變強，是相信。\n你撐過來了。坐下來，邊聽歌邊讀讀，當初有多浪漫，後來就有多揪心。";
  if (clearDiffEl) clearDiffEl.hidden = true;
  const _rb = clearEl.querySelector('[data-act="replay"]'); if (_rb) _rb.hidden = (clearedHard || settings.difficulty >= 5);   // 破過天堂路就不再給「再次挑戰」(toni #8);未破最難仍保留讓玩家挑戰更深的路
  clearEl.classList.add("on");
  updateMusicToggleLabels();   // gazeMusic(一眼瞬間)從結局一路 loop 到這,不重啟;只更新音樂鈕標籤
  if (document.exitPointerLock) document.exitPointerLock();
}
function closeClear() { if (clearEl) clearEl.classList.remove("on"); }
if (clearEl) {
  clearEl.querySelectorAll(".clear-actions button").forEach((b) => b.addEventListener("click", () => {
    const act = b.getAttribute("data-act");
    if (act === "before") openStory("before");          // 看戰前/戰後:音樂續播(在遊戲內閱讀)
    else if (act === "after") openStory("after");
    else if (act === "replay") { if (clearDiffEl) { clearDiffEl.hidden = false; if (clearDiffEl.scrollIntoView) clearDiffEl.scrollIntoView({ behavior: "smooth", block: "nearest" }); } }   // 展開難度選擇(音樂續播,選了難度才停)
    else if (act === "allreader") { stopGazeMusic(); location.href = "../../../reader.html"; }   // 回全集故事:音樂停,離開到 EP0~EP41 完整閱讀
  }));
  clearEl.querySelectorAll(".clear-diff button").forEach((b) => b.addEventListener("click", () => {
    if (dreamLock) { showNarr("這是夢中夢 · 你還沒醒來", 2.6); return; }   // 夢中夢那輪不可改難度
    const d = parseInt(b.getAttribute("data-diff"), 10) || 3;
    settings.difficulty = Math.max(3, Math.min(5, d)); saveSettings(); if (refreshDiffSlider) refreshDiffSlider();
    stopGazeMusic(); closeClear(); enterSim();   // 再玩一次:音樂停,以選定難度(普通/困難/天堂路)重新踏上天堂路
  }));
  const _cmBtn = document.getElementById("clear-music"); if (_cmBtn) _cmBtn.addEventListener("click", toggleGazeMusic);
}
// toni #1:re-music 已移除(改 reader in-iframe bar + postMessage toggle-mute);結局選單的 clear-music 仍用 toggleGazeMusic
const eyelidEl = document.getElementById("eyelid");
let blinking = false;
function blink(closeMs, holdMs, openMs, midFn) {   // 閉眼→(切換)→睜眼:夢框進場,世界在闔眼時切換
  if (!eyelidEl) { if (midFn) midFn(); return; }
  eyelidEl.style.setProperty("--lid-dur", closeMs + "ms");
  eyelidEl.classList.add("shut");
  setTimeout(() => {
    if (midFn) midFn();
    setTimeout(() => { eyelidEl.style.setProperty("--lid-dur", openMs + "ms"); eyelidEl.classList.remove("shut"); }, holdMs);
  }, closeMs);
}
function enterSim() {
  if (MODE === "sim" || blinking) return;
  blinking = true;
  blink(480, 320, 800, () => {
    MODE = "sim"; wave = 0; score = 0; kills = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 3.8;   // 首波延後:進場引言先在安靜畫面讀完再開打(文字不被戰鬥蓋台)
    _b1Said = _b2Said = _b3Said = _b4Said = false; clearDisc();   // 學長視角 4 拍 + 光碟 prop:每場實戰重置(每場最多各一次)
    applyDifficulty();   // 套玩家 HP/彈藥 + 敵人倍率/AI(難度)
    resetVehicles();     // 載具車況/油量/砲彈/使用權重置(item 3:除非重開遊戲不重置→進實戰才重置)
    if (scoreEl) scoreEl.textContent = 0; if (killsEl) killsEl.textContent = 0; if (hintEl) hintEl.style.opacity = "0";
    // 劇情/新手:首波前給 ~9s 無敵人試打(熟悉手感),不生敵;困難以上(diffIndex>=3)直接進
    warmupActive = ((curDiff && curDiff.diffIndex) || 1) <= 2; warmupT = warmupActive ? 9 : 0;
    updateWaveHUD(); playMusic(MUSIC_SIM); showNarr(NARR.enter, 3.6); blinking = false;
    if (!isTouch && document.pointerLockElement !== canvas && enterEl) enterEl.classList.remove("hide");   // 桌機從敘事閘(對白放開指針)進實戰時,確保「點畫面控制視角」提示可見;點一下即接管滑鼠(pointer-lock 規範需使用者手勢,無法在 blink 動畫回呼裡自動鎖)
  });
}
/* ── 不舉手 → 夢醒序幕:全白→「原來是夢......」→「起床」鈕→知情同意→掉進天堂路(難度5)且鎖死難度(夢中夢) ── */
/* ── 不舉手→夢醒→掉進天堂路難度(夢中夢):難度 5 只在記憶體不持久(無進場橫幅) ── */
function enterDreamLevel() {
  _preDreamDiff = settings.difficulty; settings.difficulty = 5; dreamLock = true;
  if (refreshDiffSlider) refreshDiffSlider();
  enterSim();
}
function dreamWake() {
  const ov = document.getElementById("dreamwake"); if (!ov) { enterDreamLevel(); return; }   // 浮層缺失也別卡住:直接進
  const btn = document.getElementById("dreamwake-btn");
  ov.classList.remove("fading"); ov.classList.add("on"); unlockMouse();
  requestAnimationFrame(() => ov.classList.add("in"));   // 白幕淡入
  if (btn) {
    btn.onclick = () => {
      ov.classList.add("fading"); ov.classList.remove("in");   // 白幕淡出
      setTimeout(() => {
        ov.classList.remove("on", "fading");
        // 知情同意:起床後、掉進難度5之前,告訴玩家這是夢中夢、這條路改不了(被碾壓正常、改不了也醒不來)。
        // framing intent:不舉手不是真實事件→所以進入夢中夢→被碾壓是正常→改不了也醒不來。dreamConsent 仍 ［-gated,toni 填真句才顯示
        if (isReal(NARR.dreamConsent)) showNarr(NARR.dreamConsent, 5);
        enterDreamLevel();   // 掉進天堂路(難度 5 只在記憶體)
      }, 900);
    };
  }
}
function tryInteract() {
  if (vehicle) { exitVehicle(); return; }
  if (!isActive()) return;
  if (MODE === "sim" && warmupActive) { endWarmup(); return; }   // 試打暖身期間:按「使用」/E(或手機「使用」鈕)略過暖身,直接開打
  const v = nearVehicle();   // 載具:hub 與 sim 都能開(item 3 實戰中可用);sim 需先買使用權(劇情/新手已免費解)
  if (v && !awaitDisarm && (MODE === "hub" || MODE === "sim")) { if (MODE === "sim" && !v.unlocked) { showNarr("這台要先在軍械庫(B)購買使用權", 2.6); return; } enterVehicle(v); return; }   // 放下槍窗口(awaitDisarm)不可再上車
  if (MODE !== "hub") return;   // 其餘互動(牛/外套/日記/輔導長/連長/靶場)只在軍營 hub
  if (nearCounselor()) talkCounselor();
  else if (nearCommander()) talkCommander();
  else if (nearCow()) { showCowBeat(); markStoryStep("cow"); }
  else if (nearJacket()) { showNarr(NARR.dream3, 5.5); markStoryStep("jacket"); }
  else if (nearDiary()) { openDiary(); markStoryStep("diary"); }
  else if (nearPhone()) showPhoneBeat();
  else if (nearMotorbike()) showMotorbikeBeat();
  else if (nearCorner()) showCornerBeat();
  else if (nearTerminal()) showTerminalBeat();
  else if (nearShrimp()) showShrimpBeat();
  else if (nearWash()) showMirrorBeat();
  else if (nearRangeEntry()) { if (raisedHand) enterSim(); else showNarr("要先去中山室找輔導長，再到用餐大廳找連長談過，才能進入實戰", 4); }   // 敘事閘:舉手才解鎖實戰
}
/* ── 一眼瞬間(Tier 2):撐過 GOAL_WAVE → 主動放下槍 → 抽象光形非戰鬥高光(放下武器,光才出現) ── */
function goalWave() { const d = (curDiff && curDiff.diffIndex) || 1; return d >= 4 ? 10 : d === 3 ? 8 : d === 2 ? 5 : 3; }   // 撐過這波=撐過了,夢讓他停下。toni #5:劇情 3、新手 5、普通 8、困難/天堂路 10(越硬派越累才放得下)
function gazeHardHold() { return ((curDiff && curDiff.diffIndex) || 1) >= 4 ? 3000 : 0; }   // 困難/天堂路:撐過後先在純黑+心跳裡留白 3s(EP41 不能干預只能撐/相信)才讓她浮現
let awaitDisarm = false, disarmT = 0, survivedAt = -99, disarmHoldT = 0;   // disarmT>0:放下槍動作進行中;survivedAt:撐過那刻時戳(讓「撐過了」旁白先獨處,放下槍提示稍後才浮現);disarmHoldT>0:放下槍到底後在「手空了」空鏡上停留(失重感落地,再進一眼瞬間)
const SHOW_HIT_CONFIRM = 1;   // 極克制命中確認(toni 選:加,可關)。1=開 0=關。不加分數/數字/金爆頭,只讓遠距離「打中/打死」看得出
function beginDisarm() { if (vehicle) return; if (MODE === "sim" && awaitDisarm && disarmT <= 0 && disarmHoldT <= 0) { disarmT = 0.85; ads = false; if (hintEl) hintEl.style.opacity = "0"; } }   // 駕駛中不可放下槍(放下槍是徒手身體動作);放下到底的「手空了」空鏡期間(disarmHoldT>0)不可重入
const GAZE_MUSIC_URL = "../一眼瞬間.mp3";   // 一眼瞬間專屬主題曲(非戰鬥樂,不污染)
let gazeMusic = null, gazeRAF = 0, gazeT0 = 0, gazeFigure = null, heartTimer = 0;
const GAZE_SWEEP_S = 2.6;   // A1 前門→後門 運鏡:她浮現前在純黑裡的鏡頭橫搖時長(緊湊,~2.6s);t∈[-GAZE_SWEEP_S,0] 走完,t≥0 她從後門方向浮現
let gazeSilentUntil = 0, gazeBellRung = false;   // A2:gazeSilentUntil 之前心跳靜默(~1s 純靜默)→ 鐘響;gazeBellRung 確保鐘只敲一次
// 結局文字(toni 親寫,逐字;放下槍→一眼瞬間→融合呈現:光形漸隱→轉純黑→逐句→末句留白) — 一字不可改
// hold=該句停留毫秒(重句多停、輕句快走=呼吸,非投影片勻速);txt 為 toni 親寫逐字,一字不可改
// gap=這張字卡浮現前的換場純黑毫秒(重句前黑久一點「呼吸」、輕句快走);只調換場節奏,不動字
const ENDING_CARDS = [
  { txt: "不論三年、還是五年，\n在跟你不期而遇的那天。", hold: 4200, gap: 0 },
  { txt: "「學妹！」\n「學長！」", hold: 3000, gap: 800 },          // 輕句:重逢呼喊,黑場快走
  { txt: "雖然後來事實的真相是，\n不是三年，也不是五年，\n是十七年後。", hold: 5400, gap: 2100 },   // 重句:十七年,換場黑久一點(呼吸)
  { txt: "「等待的時候，也算在約會的時間裡。」", hold: 4200, gap: 1150 },
  { txt: "妳後來問我：「你是不是在賭？」\n我說：「我只是相信『相信的力量』。」", hold: 5200, gap: 2100 },   // 重句:相信的力量,黑久一點
  { txt: "「每當我閉上眼睛，我就可以看見妳。」", hold: 6000, gap: 2100 },   // 末句(首尾合龍 echo):黑久一點再浮現
];
function buildGazeFigure() {   // 站立女性剪影的光點分佈(抽象光形)
  const pts = [], N = 64;
  for (let i = 0; i < N; i++) {
    const ny = i / (N - 1); let halfW;
    if (ny < 0.18) halfW = 0.04 + ny * 0.18; else if (ny < 0.34) halfW = 0.13;
    else if (ny < 0.62) halfW = 0.10 - (ny - 0.34) * 0.1; else halfW = 0.07 + (ny - 0.62) * 0.16;
    pts.push({ x: (Math.random() * 2 - 1) * halfW, y: ny, ph: Math.random() * 6.28, r: 1.6 + Math.random() * 2.2 });
  }
  return pts;
}
let gazeMotes = null;
function buildGazeMotes() {   // 緩緩上升的微塵(她站在後門那束光裡的浮塵);各自速度/相位,繞圈飄升
  const m = [], N = 26;
  for (let i = 0; i < N; i++) m.push({ x: (Math.random() * 2 - 1) * 0.32, y0: Math.random(), sp: 0.012 + Math.random() * 0.03, sway: 0.01 + Math.random() * 0.025, ph: Math.random() * 6.28, r: 0.7 + Math.random() * 1.4 });
  return m;
}
function startHeartbeat() {   // 動態心跳:reveal 慢而沉,連接句那拍收緊(被釘住),非節拍器
  stopHeartbeat();
  const beat = () => {
    const t = (performance.now() - gazeT0) / 1000; let iv = 1150, v0 = 0.3;
    if (t < 2.6) { iv = 1320; v0 = 0.34; } else if (t > 5.6 && t < 9.6) { iv = 880; v0 = 0.4; }   // 光形 reveal 慢沉 / 「妳一直都在」主拍那段收緊(A4 spread 後主拍延到 ~5.8–9.4s)
    const _silent = performance.now() < gazeSilentUntil;   // A2:鐘響前 ~1s 純靜默(連心跳也停),讓 11:00 鐘聲獨自落在她浮現那刻
    if (!_silent) try { tone(58, 42, 0.16, v0, "sine"); setTimeout(() => { try { if (performance.now() >= gazeSilentUntil) tone(50, 36, 0.13, v0 * 0.68, "sine"); } catch (e) { } }, 230); } catch (e) { }
    heartTimer = setTimeout(beat, iv);
  };
  beat();
}
function stopHeartbeat() { if (heartTimer) { clearTimeout(heartTimer); heartTimer = 0; } }   // heartTimer 由 setTimeout 設,用 clearTimeout 才語意正確
// A2 11:00 上課鐘:她浮現那刻的觸發音 — 柔和學校鐘聲(幾個輕微失諧泛音 + 慢起音長衰減的鐘形包絡;沿用 tone() helper),不刺耳、不勝利、不軍隊,只是那一秒的鐘
function sfxSchoolBell() {
  if (!actx) return;
  try {
    // 鐘形:基頻 + 略失諧泛音,各自慢起音、長衰減(tone 內 adsr attack 0.003 偏快,這裡疊兩三個泛音營造金屬鐘的厚度與餘韻)
    tone(660, 624, 1.7, 0.16, "sine");          // 基音(柔,低 peak 不過亮)
    tone(990, 944, 1.4, 0.075, "sine");         // 失諧泛音(鐘的金屬感)
    setTimeout(() => { try { tone(1320, 1268, 1.1, 0.045, "triangle"); } catch (e) { } }, 14);   // 高泛音極輕,微延遲=敲擊瞬態
  } catch (e) { }
}
function startGaze() {
  if (MODE === "gaze") return;
  MODE = "gaze"; awaitDisarm = false;
  for (const _id of ["shop", "settings", "diary", "tutorial", "story", "dialog"]) { const _e = document.getElementById(_id); if (_e) _e.classList.remove("on"); }   // 防禦:reveal 前清掉任何殘留浮層(不透明軍械庫/設定面板別蓋住一眼瞬間)
  markCleared();   // task4:放下槍進入一眼瞬間=走完天堂路→鎖定破關(劇情/新手永久關閉,破關紀念啟用)
  if (settings.difficulty >= 5 && !clearedHard) { clearedHard = true; try { localStorage.setItem("tiantanglu_cleared_hard_v1", "1"); } catch (e) { } }   // 破過最難「天堂路」:結局選單不再出現「再次挑戰」(toni #8)
  if (hintEl) hintEl.style.opacity = "0";
  stopMusic(); ensureAudio();
  if (document.exitPointerLock) document.exitPointerLock();
  const ov = document.getElementById("gaze"), cv = document.getElementById("gaze-cv"), lineEl = document.getElementById("gaze-line");
  if (!ov || !cv) { MODE = "hub"; return; }
  if (lineEl) { lineEl.textContent = NARR.gaze; lineEl.classList.remove("show", "cards", "echo"); }
  ov.classList.add("on"); ov.classList.remove("open", "closing");
  gazeFigure = buildGazeFigure(); gazeMotes = buildGazeMotes();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(window.innerWidth * dpr); cv.height = Math.round(window.innerHeight * dpr);
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  try { gazeMusic = new Audio(GAZE_MUSIC_URL); gazeMusic.loop = true; gazeMusic.volume = 0; gazeMusic.play().catch(() => { }); } catch (e) { }   // loop:結局後音樂不停,貫穿閉上眼睛→彩虹→結局選單→邊聽歌看故事
  const HOLD = gazeHardHold();   // 困難/天堂路:撐過後先在純黑+心跳裡留白 3s,才讓她浮現(EP41 只能撐/相信)
  // C1+C4 學長視角 pre-reveal:放下槍→reveal 前,純黑閉眼裡先閃過華江橋下那句(EP9)與夢中夢的清醒(EP40),短促兩拍,不動 toni 親寫結局。
  // 時間基準再前移 PRE_REVEAL:HOLD+PRE 期間 t 為負(光形不浮、字卡不跑),pre-reveal 在這段黑裡走完,結束後 reveal 才從 t≈0 起跑→ENDING_CARDS/reveal/gazeLoop 計時完全不變。
  const PRE_REVEAL = (isReal(NARR.bridgeFear) ? 3400 : 0) + (isReal(NARR.dreamAwake) ? 3000 : 0);   // 兩句各約一拍;真句缺則該拍歸零(保持結局乾淨)
  const SWEEP_MS = GAZE_SWEEP_S * 1000;   // A1:她浮現前固定加一段運鏡黑窗(前門探看→後門),確保即使無 HOLD/pre-reveal 也有橫搖空間;t∈[-GAZE_SWEEP_S,0] 在這段黑裡走完
  const HOLD_TOTAL = HOLD + PRE_REVEAL + SWEEP_MS;
  gazeT0 = performance.now() + HOLD_TOTAL;   // 時間基準前移到「浮現起點」:HOLD+PRE+SWEEP 期間 t 為負(光形不浮、字卡不跑、運鏡走完),結束後 t 過 0 → 光形從後門方向浮現;所有計時(心跳/reveal/字卡/收場)共用同一基準
  gazeSilentUntil = 0; gazeBellRung = false;   // A2:重置鐘聲/靜默狀態
  startHeartbeat();
  requestAnimationFrame(() => ov.classList.add("closing"));        // 閉眼(純黑留白開始)
  gazeLoop(ctx);   // A1:提前起跑(原本只在 beginReveal 末尾呼叫)→ 運鏡黑窗(t<0)期間渲染前門→後門的門框光橫搖;t≥0 reveal 邏輯照舊(reveal/clarity/fade 對 t<0 皆為 0,不會提早洩漏光形)
  // pre-reveal 兩拍在純黑裡浮現(用 #gaze-line 既有 .show 樣式,非 .cards/.echo);每個 setTimeout 都 MODE==="gaze" 守衛,不污染 reveal
  if (lineEl && PRE_REVEAL > 0) {
    if (isReal(NARR.bridgeFear)) {
      setTimeout(() => { if (MODE === "gaze") { lineEl.textContent = NARR.bridgeFear; lineEl.classList.remove("echo", "cards"); lineEl.classList.add("show"); } }, HOLD + 300);          // C1 EP9:我不怕妳,我只是害怕失去妳!
      setTimeout(() => { if (MODE === "gaze") lineEl.classList.remove("show"); }, HOLD + 3100);
    }
    if (isReal(NARR.dreamAwake)) {
      const c4at = HOLD + (isReal(NARR.bridgeFear) ? 3400 : 0);
      setTimeout(() => { if (MODE === "gaze") { lineEl.textContent = NARR.dreamAwake; lineEl.classList.remove("echo", "cards"); lineEl.classList.add("show"); } }, c4at + 300);   // C4 EP40:現在回頭看,真的有點天真。
      setTimeout(() => { if (MODE === "gaze") lineEl.classList.remove("show"); }, c4at + 2700);
    }
  }
  // A1 前門→後門 運鏡那拍的連接句(placeholder 不顯示,toni 填真句才生效):在轉向後門的那段(運鏡黑窗後半)浮現,她浮現前淡掉
  if (lineEl && isReal(NARR.backDoorSweep)) {
    const sweepStart = HOLD_TOTAL - SWEEP_MS;   // 運鏡黑窗起點(相對 now)
    setTimeout(() => { if (MODE === "gaze") { lineEl.textContent = NARR.backDoorSweep; lineEl.classList.remove("echo", "cards"); lineEl.classList.add("show"); } }, sweepStart + 1400);   // 轉向後門那段(st≈1.4s)
    setTimeout(() => { if (MODE === "gaze") lineEl.classList.remove("show"); }, HOLD_TOTAL - 300);   // 她浮現前淡掉
  }
  // A2 11:00 鐘聲 + 靜默:她開始浮現那刻(reveal 起點 t≈1.1s)前 ~1s 純靜默(連心跳停)→ 鐘聲落下當作觸發。canon 觸發=11:00 上課鐘,無文字。
  const BELL_AT = HOLD_TOTAL + 1100;   // 浮現後 ~1.1s(reveal 開始爬升那刻)
  gazeSilentUntil = performance.now() + (BELL_AT - 1000);   // 鐘響前 1s 起靜默(beat() 讀此值跳過心跳)
  setTimeout(() => { if (MODE === "gaze" && !gazeBellRung) { gazeBellRung = true; gazeSilentUntil = 0; sfxSchoolBell(); } }, BELL_AT);   // 鐘響=她浮現的觸發音;鐘響後解除靜默讓心跳接回
  const beginReveal = () => {
    if (MODE !== "gaze") return;
    setTimeout(() => ov.classList.add("open"), 2600);              // 睜眼(留電影黑邊):延到她開始浮現那刻,letterbox 對齊 reveal,別太早洩掉閉眼張力
    // 首尾合龍:剪影浮現那拍(t≈3.9s 最清晰)先以低亮度 echo 回返 cold-open 首句「每當我閉上眼睛,我就可以看見妳」,
    // 與 cold-open(首+末) / 末張結局字卡(同句 .echo)三方合龍;低亮 .echo 不搶後面「妳一直都在」(4000ms)的主拍
    if (isReal(NARR.gazeEcho)) {
      setTimeout(() => { if (MODE === "gaze" && lineEl) { lineEl.textContent = NARR.gazeEcho; lineEl.classList.remove("cards"); lineEl.classList.add("echo", "show"); } }, 2800);
      setTimeout(() => { if (MODE === "gaze" && lineEl) lineEl.classList.remove("show"); }, 4200);   // A4:多停一點(~1.4s)再淡,接著一段純黑留白才上主拍
    }
    // 光形相:她浮現,「妳一直都在」(連接句 #6)— A4 拉開留白:gazeEcho 淡掉後 ~1.6s 純黑再浮現,讓這句獨自落地「被釘在原地」
    setTimeout(() => { if (MODE === "gaze" && lineEl) { lineEl.textContent = NARR.gaze; lineEl.classList.remove("echo", "cards"); lineEl.classList.add("show"); } }, 5800);
    setTimeout(() => { if (MODE === "gaze" && lineEl) lineEl.classList.remove("show"); }, 9400);   // A4:主拍多停(~3.6s)再淡;「十八歲」前留更長一段純黑(獨享一拍)
    // EP35 verbatim 回聲:那光的年紀,是十八歲(她站在後門的光)— A4 拉開:主拍淡掉後 ~2.6s 純黑再讓它獨享一拍;對齊光形微亮(見 gazeLoop lightAgeGlow)
    setTimeout(() => { if (MODE === "gaze" && lineEl && isReal(NARR.lightAge)) { lineEl.textContent = NARR.lightAge; lineEl.classList.remove("echo", "cards"); lineEl.classList.add("show"); } }, 12000);
    setTimeout(() => { if (MODE === "gaze" && lineEl) lineEl.classList.remove("show"); }, 14600);   // A4:多停(~2.6s)再淡掉,讓光形隨之淡入純黑
    setTimeout(() => stopHeartbeat(), 14800);   // 光形相結束→心跳收,文字相只留一眼瞬間樂(A4 spread 後延到 ~14.8s)
    // 融合相:光形→純黑 後,toni 親寫結局逐句浮現(居中);重句多停輕句快走(呼吸);末句套 echo 低亮度回返=首尾合龍(回扣 cold-open 同句)
    let ct = 15200; const lastI = ENDING_CARDS.length - 1;   // A4 spread 後 reveal 結束延後,ENDING_CARDS 起點同步右移(不重疊)
    ENDING_CARDS.forEach((card, i) => {
      const gap = (i === 0) ? 0 : (card.gap != null ? card.gap : 1150);   // 這張字卡浮現前的換場純黑:重句前黑久一點「呼吸」、輕句快走(只調節奏,不動字)
      setTimeout(() => {
        if (MODE !== "gaze" || !lineEl) return;
        lineEl.classList.remove("show");
        setTimeout(() => { if (MODE !== "gaze" || !lineEl) return; lineEl.textContent = card.txt; lineEl.classList.remove("echo"); lineEl.classList.add("cards", "show"); if (i === lastI) lineEl.classList.add("echo"); }, gap);
      }, ct);
      ct += gap + card.hold;   // 累計=換場純黑(gap)+ 該句停留(hold),讓 hold 不被換場黑吃掉;每張字卡停留時間維持原 hold 設計
    });
    setTimeout(() => showCloseEyes(), ct + 5000);   // 末句後 5s 浮現「閉上眼睛」按鈕(音樂不停),收束權交給玩家點擊
    // (gazeLoop 已在 startGaze 開頭提前起跑;此處不再重複呼叫,避免雙 RAF 迴圈)
  };
  const afterHold = beginReveal;   // 運鏡黑窗 + 留白(困難/天堂路)+ C1/C4 學長視角 pre-reveal → 她浮現(toni 親寫結局逐字不動,不插入女兒視角的敲門拍)
  if (HOLD_TOTAL > 0) setTimeout(afterHold, HOLD_TOTAL); else afterHold();
}
function gazeLoop(ctx) {
  if (MODE !== "gaze") return;
  gazeRAF = requestAnimationFrame(() => gazeLoop(ctx));
  const t = (performance.now() - gazeT0) / 1000, W = window.innerWidth, H = window.innerHeight;
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * 0.52, fh = H * 0.62, top = cy - fh * 0.5;
  // A1 前門→後門 運鏡(t<0 的純黑運鏡黑窗,t∈[-GAZE_SWEEP_S,0]):第一人稱鏡頭橫搖 — 先轉向一側(前門,沒人)→停 ~0.5s →慢慢轉向另一側(後門),她隨後從後門方向浮現。純門框光柱橫移(非新幾何),極低亮,絕不過曝。
  if (t < 0 && t > -GAZE_SWEEP_S) {
    const st = t + GAZE_SWEEP_S;   // 0 → GAZE_SWEEP_S
    let yawN;   // 鏡頭橫搖位置:0=後門(中央,她在這)、1=前門(一側,沒人)
    if (st < 0.8) { const k = st / 0.8; yawN = k * k * (3 - 2 * k); }                 // 轉向前門(smoothstep)
    else if (st < 1.3) yawN = 1;                                                        // 停在前門 ~0.5s(沒人)
    else { const k = (st - 1.3) / (GAZE_SWEEP_S - 1.3); yawN = 1 - k * k * (3 - 2 * k); }   // 慢慢轉回後門(她浮現的方向)
    const beamX = cx + yawN * W * 0.34;   // 前門側偏右;後門=中央(她浮現處)
    const envFade = Math.min(1, st / 0.5) * Math.min(1, (GAZE_SWEEP_S - st) / 0.6);   // 黑窗兩端淡入淡出
    const sa = 0.11 * envFade * (0.85 + 0.15 * Math.sin(st * 2.4));   // 極低亮門框光,慢脈動
    if (sa > 0.004) {
      const bw = fh * 0.34, bx = beamX - bw / 2, bg = ctx.createLinearGradient(0, top - fh * 0.12, 0, cy + fh * 0.46);
      bg.addColorStop(0, "rgba(255,238,210," + sa.toFixed(3) + ")"); bg.addColorStop(0.55, "rgba(250,222,180," + (sa * 0.6).toFixed(3) + ")"); bg.addColorStop(1, "rgba(40,26,30,0)");
      ctx.fillStyle = bg; ctx.fillRect(bx, top - fh * 0.12, bw, fh * 1.0);
    }
    if (gazeMusic && !gazeMusic.paused) gazeMusic.volume = 0;   // 運鏡黑窗音樂尚未淡入(t<0)
    return;   // 運鏡期間不跑 reveal/figure(reveal/clarity/fade 對 t<0 本就為 0,提前 return 更乾淨)
  }
  const reveal = Math.max(0, Math.min(1, (t - 1.1) / 2.6)), fade = t > 14.8 ? Math.max(0, 1 - (t - 14.8) / 1.6) : 1;   // A4 spread:光形撐到 lightAge(~12–14.6s)之後才淡入純黑(原 9.2 太早會在十八歲前就淡掉)
  const focusBreath = 0.5 + 0.5 * Math.sin(t * 0.46);   // 慢呼吸:像鏡頭對焦輕輕一沉一浮(她站在那裡,看的人屏住又鬆開一口氣)
  const g = ctx.createRadialGradient(cx, cy - fh * 0.1, 0, cx, cy, fh * 0.95);   // 暖白背光(幾何漸層,非 bloom,避過曝白塊)
  g.addColorStop(0, "rgba(255,244,224," + (0.5 * reveal * fade).toFixed(3) + ")");
  g.addColorStop(0.4, "rgba(248,214,170," + (0.22 * reveal * fade).toFixed(3) + ")");
  g.addColorStop(1, "rgba(20,12,18,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 後門的光(EP35「她站在後門的光」):一道從她身後落下的柔和門框光柱 — 不是軍隊/神聖/勝利的光,只是後門透進來的一束。低透明 + 慢呼吸,絕不過曝成白塊
  const beamA = 0.16 * reveal * fade * (0.8 + 0.2 * focusBreath);   // 上限 ~0.16,遠低於 figure,確保不洗白
  if (beamA > 0.004) {
    const bw = fh * 0.34, bx = cx - bw / 2, bg = ctx.createLinearGradient(0, top - fh * 0.12, 0, cy + fh * 0.46);
    bg.addColorStop(0, "rgba(255,238,210," + beamA.toFixed(3) + ")"); bg.addColorStop(0.55, "rgba(250,222,180," + (beamA * 0.6).toFixed(3) + ")"); bg.addColorStop(1, "rgba(40,26,30,0)");
    ctx.fillStyle = bg; ctx.fillRect(bx, top - fh * 0.12, bw, fh * 1.0);   // 直立門框光(柔邊矩形,豎向漸層),落在她身後
  }
  ctx.globalCompositeOperation = "lighter";
  const clarity = Math.max(0, 1 - Math.abs(t - 3.9) / 0.95);   // 她整個人浮現完整的那一瞬最清晰（被釘在原地那種看見）
  // 紅線：沿著紅線走，不會走散 — 她與看的人之間那條跨時間的連結，一直都在
  const threadA = Math.min(1, reveal * fade * (1 + clarity * 0.4));
  if (threadA > 0.02) {
    const heartX = cx, heartY = cy - fh * 0.04, sway = Math.sin(t * 0.7) * W * 0.035;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 1.04);
    ctx.bezierCurveTo(W * 0.5 - W * 0.13 + sway, H * 0.82, heartX + W * 0.11 - sway, H * 0.58, heartX, heartY);
    ctx.strokeStyle = "rgba(214,58,52," + (0.32 * threadA).toFixed(3) + ")"; ctx.lineWidth = 6 + clarity * 3; ctx.stroke();          // 外層柔光
    ctx.strokeStyle = "rgba(255,140,122," + (0.5 * threadA * (1 + clarity * 0.6)).toFixed(3) + ")"; ctx.lineWidth = 1.6 + clarity * 2.0; ctx.stroke();   // 內層亮核:峰值最亮最粗=紅線「接通」那一刻
    const hr = fh * 0.12 * (1 + clarity * 0.4);   // 她的心口微光:峰值脹大脈動
    const hg = ctx.createRadialGradient(heartX, heartY, 0, heartX, heartY, hr);   // 線連到的那一點：她的心口微光
    hg.addColorStop(0, "rgba(255,150,130," + (0.4 * threadA * (1 + clarity * 0.5)).toFixed(3) + ")"); hg.addColorStop(1, "rgba(255,120,100,0)");
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(heartX, heartY, hr, 0, 6.3); ctx.fill();
  }
  const breathe = 0.85 + 0.15 * Math.sin(t * 1.4);
  // 「那光的年紀,是十八歲」那拍(A4 spread 後 t∈[12,14.6]):光形微微一亮(三角窗,峰值約 +14%),不過曝;對齊 reveal 字卡浮現(中心 ~13.3s)
  const lightAgeGlow = isReal(NARR.lightAge) ? 0.14 * Math.max(0, 1 - Math.abs(t - 13.3) / 1.3) : 0;
  const push = 1 + clarity * 0.06 + reveal * 0.02 + focusBreath * 0.006;   // ≤8% clarity-linked 緩推 + 慢呼吸微幅(<1%):她浮現完整那刻鏡頭微微逼近(被釘在原地那種看見),幅度小不致暈
  for (const p of gazeFigure) {
    const px0 = cx + p.x * (fh * 0.62), py0 = top + p.y * fh + Math.sin(t * 0.6 + p.ph) * 2.5;
    const px = cx + (px0 - cx) * push, py = cy + (py0 - cy) * push;
    const a = reveal * fade * breathe * (0.5 + 0.5 * Math.sin(t * 1.1 + p.ph)) * (1 + clarity * 0.6 + lightAgeGlow), rr = p.r * push * (1 + 0.2 * Math.sin(t * 2 + p.ph));
    const pg = ctx.createRadialGradient(px, py, 0, px, py, rr * 5);
    pg.addColorStop(0, "rgba(255,248,232," + Math.min(1, a * 0.9).toFixed(3) + ")"); pg.addColorStop(1, "rgba(255,240,210,0)");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, rr * 5, 0, 6.3); ctx.fill();
  }
  // A3 雙重曝光「兩個妳」:lightAge「那光的年紀,是十八歲」那拍(t≈13.3),在主光形旁疊一個更小、更年輕的同形剪影(2005 的她其實就是 1994 那個十八歲的她)。
  // 同一組 gazeFigure 點,縮小 + 偏移 + 極低 alpha(~0.1 峰值),~1s 淡入淡出;絕不過曝(峰值遠低於主光形,且套同一 lighter 混合不疊成白塊)
  const dblA = isReal(NARR.lightAge) ? 0.1 * Math.max(0, 1 - Math.abs(t - 13.3) / 1.0) * reveal * fade : 0;   // 窗口中心對齊 lightAge 微亮;受 reveal/fade 連動,結尾不殘留
  if (dblA > 0.004) {
    const dScale = 0.86, dOffX = fh * 0.085, dOffY = fh * 0.05;   // 更小(年輕)+ 略左上偏移=並立的另一個她
    for (const p of gazeFigure) {
      const px0 = cx + p.x * (fh * 0.62) * dScale - dOffX, py0 = top + p.y * fh * dScale + dOffY + Math.sin(t * 0.6 + p.ph) * 2.5;
      const px = cx + (px0 - cx) * push, py = cy + (py0 - cy) * push;
      const a = dblA * breathe * (0.5 + 0.5 * Math.sin(t * 1.1 + p.ph + 1.7));   // 相位偏移=兩個她不同步呼吸,看得出是兩個
      if (a <= 0.003) continue;
      const rr = p.r * push * dScale * (1 + 0.2 * Math.sin(t * 2 + p.ph));
      const pg = ctx.createRadialGradient(px, py, 0, px, py, rr * 5);
      pg.addColorStop(0, "rgba(255,246,228," + Math.min(0.5, a * 0.9).toFixed(3) + ")"); pg.addColorStop(1, "rgba(255,238,206,0)");
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, rr * 5, 0, 6.3); ctx.fill();
    }
  }
  // 緩緩上升的微塵(後門光柱裡的浮塵):極低透明,慢慢往上飄並輕輕左右擺;繞高度循環不消失
  if (gazeMotes) for (const m of gazeMotes) {
    const yy = (m.y0 + 1 - ((t * m.sp) % 1)) % 1;   // 由下往上飄(循環)
    const mx = cx + (m.x + Math.sin(t * 0.5 + m.ph) * m.sway) * (fh * 0.62), my = top + yy * fh * 1.05;
    const ma = reveal * fade * 0.34 * (0.4 + 0.6 * Math.sin(t * 0.8 + m.ph)) * Math.sin(yy * Math.PI);   // 上下兩端漸隱,中段最亮;整體低透明
    if (ma <= 0.01) continue;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, m.r * 4);
    mg.addColorStop(0, "rgba(255,242,214," + Math.min(0.5, ma).toFixed(3) + ")"); mg.addColorStop(1, "rgba(255,236,206,0)");
    ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my, m.r * 4, 0, 6.3); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  if (gazeMusic && !gazeMusic.paused) { const env = Math.min(1, Math.max(0, (t - 1) / 2)); gazeMusic.volume = env * (settings.vol != null ? settings.vol : 0.8) * 0.45; }   // 一眼瞬間樂 2s 淡入後維持(loop,不淡出);貫穿閉上眼睛→彩虹→結局選單,音樂不停
}
function showCloseEyes() {   // 結局末句後浮現「閉上眼睛」按鈕(音樂不停);把收束權交給玩家,他點了才接續
  if (MODE !== "gaze") return;
  const ce = document.getElementById("close-eyes"); if (!ce) { finishToClearMenu(); return; }
  ce.classList.add("on"); requestAnimationFrame(() => ce.classList.add("in"));
}
let _gazeClosing = false;
function onCloseEyes() {   // 點「閉上眼睛」:淡黑 → 全暗留白 5s → 彩虹光淡入 → 彩虹停留 5s → 結局選單(音樂全程不停)
  if (MODE !== "gaze" || _gazeClosing) return; _gazeClosing = true;
  const ce = document.getElementById("close-eyes"); if (ce) ce.classList.remove("in", "on");
  const ov = document.getElementById("gaze"), cv = document.getElementById("gaze-cv"), lineEl = document.getElementById("gaze-line");
  if (ov) ov.style.background = "#000";
  if (cv) { cv.style.transition = "opacity 2s"; cv.style.opacity = "0"; }   // 2s 淡到全黑
  if (lineEl) { lineEl.style.transition = "opacity 1.5s"; lineEl.style.opacity = "0"; }
  setTimeout(() => {   // 全暗後留白 5s(toni #15:此時還沒有彩虹)→ 彩虹光淡入
    if (MODE !== "gaze") { _gazeClosing = false; return; }   // 異常離開 gaze:解鎖,下次進結局按鈕仍可用
    const rb = document.getElementById("rainbow");
    if (rb) { rb.classList.remove("burst"); rb.style.transition = "opacity 1.6s ease, transform 1.6s ease"; rb.style.transform = "scale(1.08)"; void rb.offsetWidth; rb.style.opacity = "1"; }   // 彩虹光淡入(不用 burst:burst 2.6s 會自己淡出,撐不到 5s)
    setTimeout(() => { if (MODE === "gaze") finishToClearMenu(); }, 5000);   // 彩虹停留 ~5s 後接到結局選單;加 MODE 守衛防重入
  }, 5000);   // 全暗留白 5s
}
function finishToClearMenu() {   // 收束到結局選單:重置世界回 hub + 開破關紀念;gazeMusic(一眼瞬間)持續不停(由結局選單/閱讀的音樂鈕或「再玩/回全集」才停)
  cancelAnimationFrame(gazeRAF); stopHeartbeat(); _gazeClosing = false;
  const ov = document.getElementById("gaze"), cv = document.getElementById("gaze-cv"), lineEl = document.getElementById("gaze-line"), rb = document.getElementById("rainbow");
  if (ov) { ov.classList.remove("on", "open", "closing"); ov.style.opacity = ""; ov.style.transition = ""; ov.style.background = ""; }
  if (cv) { cv.style.opacity = ""; cv.style.transition = ""; }
  if (lineEl) { lineEl.style.opacity = ""; lineEl.style.transition = ""; lineEl.classList.remove("show", "echo", "cards"); }
  if (rb) { rb.classList.remove("burst"); rb.style.opacity = ""; rb.style.transition = ""; rb.style.transform = ""; }   // 清掉 #15 彩虹的 inline opacity/transition/transform,下次進結局重新淡入
  MODE = "hub"; awaitDisarm = false; dreamLock = false;   // 走完夢中夢=解鎖難度
  if (_preDreamDiff != null) { settings.difficulty = _preDreamDiff; _preDreamDiff = null; saveSettings(); }   // 夢醒後還原夢前難度(難度 5 不殘留)
  for (const en of enemies) ROOT.remove(en); enemies.length = 0;
  wave = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 1.5; gameOver = false; dead = false;
  playerHP = 100; if (hpEl) hpEl.textContent = 100;
  camera.position.set(8, EYE, 13); yaw = -0.3; pitch = 0; curSpeed = 0; mvLastX = 0; mvLastZ = 0; mvSprint = false;
  updateWaveHUD();
  openClear();   // 破關紀念選單(音樂續播,不重啟)
}
const _closeEyesBtn = document.getElementById("close-eyes"); if (_closeEyesBtn) _closeEyesBtn.addEventListener("click", onCloseEyes);
function hurtPlayer(d, src) { if (dead || gameOver || awaitDisarm) return; if (vehicle && MODE === "sim" && !vehicle.destroyed) { vehicle.hp -= d; haptic(18); if (vehicle.hp <= 0) explodeVehicle(vehicle); else if (shake != null) shake = Math.max(shake, 0.18); return; } let _abs = 0; if (armor > 0) { _abs = Math.min(armor, d * 0.5); armor -= _abs; d -= _abs; updateArmorHUD(); } playerHP = Math.max(0, playerHP - d); if (hpEl) hpEl.textContent = Math.round(playerHP); if (dmgEl) { dmgEl.classList.toggle("armor", _abs > 0); dmgEl.style.opacity = Math.min(0.85, 0.3 + d / 35).toString(); clearTimeout(dmgEl._t); dmgEl._t = setTimeout(() => (dmgEl.style.opacity = "0"), 130); } showHitDir(src); haptic(Math.min(60, 16 + d * 1.6)); sfxHurt(); if (playerHP <= 0) endRun(); }   // 護甲吃下傷害時冷藍 flash(背心保護看得見),否則紅;手機被擊中震動(傷害越大震越久);受擊方向暗紅弧(中性,無數字/不加分)
/* 受擊方向指示:把傷害來源相對鏡頭朝向轉成螢幕邊緣方位,亮一道暗紅弧。無來源→中央暗紅脈衝。一次建立 DOM 重用,中性(去爽:不顯示數字/方位角) */
let _hitArc = null; const _haDir = new THREE.Vector3();
function showHitDir(src) {
  if (!_hitArc) { _hitArc = document.createElement("div"); _hitArc.id = "hitdir"; document.body.appendChild(_hitArc); }
  let ang = null;   // null=來源不明 → 中央脈衝
  if (src && src.isVector3) { camera.getWorldPosition(tmpO); _haDir.copy(src).sub(tmpO); const world = Math.atan2(_haDir.x, _haDir.z); ang = world - yaw; }   // 相對鏡頭 yaw:0=正前,+右,-左,π=背後
  if (ang == null) { _hitArc.style.transform = "rotate(0deg)"; _hitArc.classList.remove("dir"); }
  else { let deg = ang * 180 / Math.PI; _hitArc.style.transform = "rotate(" + deg.toFixed(0) + "deg)"; _hitArc.classList.add("dir"); }   // CSS 弧本身畫在頂端(正前),rotate 轉到來源方位
  _hitArc.classList.remove("on"); void _hitArc.offsetWidth; _hitArc.classList.add("on");   // 重觸發 CSS 淡出動畫(reflow 重置)
}
function endRun() {
  if (dead) return;
  dead = true; gameOver = true; deaths++; stopMusic(); haptic([40, 60, 90]);   // 修補拍=樂停,沉默讓連接句說話;手機陣亡長震(三段)
  const isRecord = wave > bestWave;   // 撐出個人新高波
  const ceremony = deaths === 1 || isRecord;   // N4:完整大轉場只在首死 / 破紀錄波數後首死,避免高頻死亡稀釋莊重
  bestWave = Math.max(bestWave, wave);
  // EP41 稀有死亡變奏閘:每場最多一次、低頻(只在莊重儀式那種死亡 + 已撐過一段 + 機率),且 placeholder 未填不觸發
  const rareDeath = !dreamLock && !rareDeathDone && ceremony && deaths >= 3 && Math.random() < 0.34 && isReal(NARR.mendTwiceA) && isReal(NARR.mendTwiceB);   // 夢中夢陣亡有自己的釋放句,不疊稀有死亡
  if (rareDeath) rareDeathDone = true;
  if (mendEl) mendEl.textContent = dreamLock ? NARR.dreamMend : (rareDeath ? NARR.mendTwiceA : ((isRecord && deaths > 1 && isReal(NARR.mendRecord)) ? NARR.mendRecord : NARR.mend));   // 不舉手→天堂路那輪陣亡:toni 親寫釋放句(夠努力了不說加油);否則稀有死亡/結痂變奏/mend
  scarFloor = Math.min(0.55, scarFloor + 0.1); scarFlash = 0.6;   // 炸裂:疤痕 +1(更明顯,只變淡不歸零,帶著傷前進;保留跨重新部署)
  if (dmgEl) dmgEl.style.opacity = "0.92";            // 炸裂:紅閃
  try { sfxThud(); sfxExplode(camera.position.clone()); } catch (e) { }
  if (document.exitPointerLock) document.exitPointerLock();
  if (deadStatsEl) deadStatsEl.textContent = "撐到第 " + wave + " 波 · 歷來最久 " + bestWave + " 波";   // 去分數當頭:死亡字幕不報擊殺數(反 CS 計分),只記撐了多久
  clearTimeout(endRun._t);
  const autoRevive = !!(curDiff && curDiff.hp >= 2);   // 劇情/新手:自動接關(死亡儀式演完直接重生→軍械庫),不卡「重新部署」手動畫面
  _reviveShowAunt = ceremony && !rareDeath && !dreamLock;   // 重生時放 EP21「阿姨每次都會再回來一次」;稀有死亡/夢中夢陣亡已有自己的旁白,不疊
  const deathWave = wave;   // 劇情/新手從陣亡那波接關續打(item 4),不退回第一波
  // 稀有死亡:旁白依序放兩句「長得好像」的話(被同一句打中兩次)→ 收在 EP41 縱使淡去也只是變淡;延長儀式窗讓句子讀得完
  if (rareDeath) { showNarr(NARR.mendTwiceA, 4); setTimeout(() => { if (dead) showNarr(NARR.mendTwiceB, 4); }, 4200); if (isReal(NARR.mendFade)) setTimeout(() => { if (dead) showNarr(NARR.mendFade, 5.5); }, 8600); }
  if (dreamLock) { showNarr(NARR.dreamMend, 5);   // 不舉手→天堂路那輪陣亡:clearly 顯示 toni 親寫的釋放句
    // 夢中夢/不能穿越的 framing 連接句(明知改不了仍走):接在釋放句之後一拍;dreamCantCross 仍 ［-gated,toni 填真句才顯示
    if (isReal(NARR.dreamCantCross)) setTimeout(() => { if (dead) showNarr(NARR.dreamCantCross, 5); }, 5200); }
  const ceremonyMs = rareDeath ? 9200 : (ceremony ? 2000 : 420);   // 稀有死亡:黑屏儀式拉到約 9.2s(兩句 + 淡去)才接重生
  endRun._t = setTimeout(() => { if (dmgEl) dmgEl.style.opacity = "0"; if (autoRevive) restartGame(deathWave); else if (deadEl) deadEl.classList.add("on"); }, ceremonyMs);   // 修補:黑屏沉默拉長(韓劇式呼吸,只首死/破紀錄首死演足,N4 防稀釋)
}
function restartGame(resumeWave) {
  // 死亡重生包進閉眼睜眼:夢又把他帶回天堂路(劇情/新手從陣亡那波接關續打;手動重新部署回第一波),世界在闔眼時切換
  blink(440, 300, 760, () => {
    dreamLock = false;   // 死亡/重新部署=解鎖難度(夢中夢的鎖只在那一輪)
    if (_preDreamDiff != null) { settings.difficulty = _preDreamDiff; _preDreamDiff = null; saveSettings(); }   // 死亡也還原夢前難度(難度 5 不殘留 localStorage)
    for (const g of enemies) ROOT.remove(g); enemies.length = 0;
    wave = (resumeWave && resumeWave > 1) ? resumeWave - 1 : 0; score = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 1.5; gameOver = false; dead = false; kills = 0; warmupActive = false; warmupT = 0;   // resumeWave-1 → 下個 startWave 回到陣亡那波;無 resumeWave=回第一波;重生不重跑暖身(直接接打)
    if (killsEl) killsEl.textContent = 0; updateWaveHUD();
    applyDifficulty(); if (!resumeWave) resetVehicles(); if (deadEl) deadEl.classList.remove("on"); if (dmgEl) dmgEl.style.opacity = "0";   // 重新部署套難度 HP/彈藥;手動重新部署(回第一波)才重置載具殘骸/油彈,接關(resumeWave)則保留;scarFloor/deaths/bestWave 不重置(帶著傷前進)
    camera.position.set(8, EYE, 13); yaw = -0.3; pitch = 0; sprayPitch = 0; sprayYaw = 0; recoilKick = 0; curSpeed = 0; mvLastX = 0; mvLastZ = 0; mvSprint = false;   // 清移動慣性,重生不往舊方向抽一下
    drawT = 0; reloadT = 0; reloadFilled = true; chSpread = 0;   // 重生清乾淨拔槍/換彈/擴散狀態(死在換彈途中重開不卡)
    if (curDiff && curDiff.hp >= 2) { money += 1000; updateMoneyHUD(); }   // 劇情/新手:每次重啟 +1000 軍餉(裝備保留 + 彈藥已 reset,越打越有資源=接得下去)
    playMusic(MUSIC_SIM);   // 重新部署=夢又把他帶回熔爐,主題樂回來
    if (_reviveShowAunt && isReal(NARR.reviveAunt)) { _reviveShowAunt = false; showNarr(NARR.reviveAunt, 5); }   // EP21:她一次次回來找把拔,所以你再站起來(把「重來」翻成「被等回來」)
    openShopPause();   // 重啟也暫停時間自動開軍械庫(關掉再續打)
  });
}

/* ── 投擲物(手榴彈拋物 / 火箭) ── */
const projectiles = [];
const grenadeProjMat = new THREE.MeshStandardMaterial({ color: 0x3a4a2c, metalness: 0.3, roughness: 0.6, envMapIntensity: 1 });
const rocketHeadMat = new THREE.MeshStandardMaterial({ color: 0x8a3020, metalness: 0.4, roughness: 0.5 });
const rocketBodyMat = new THREE.MeshStandardMaterial({ color: 0x52402c, metalness: 0.4, roughness: 0.5 });
function throwGrenade(w) {
  if (w.count <= 0) { sfxDry(); return; } w.count--; updateHUD(); sfxThrow();
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), grenadeProjMat); m.castShadow = true; m.position.copy(tmpO).addScaledVector(tmpD, 0.6); scene.add(m);
  const vel = tmpD.clone().multiplyScalar(18); vel.y += 3;
  projectiles.push({ m, vel, type: "grenade", t: 0, fuse: 1.5 });
}
function fireRocket(w) {
  if (w.count <= 0) { sfxDry(); return; } w.count--; updateHUD(); sfxRocketFire(); w.muzzleT = 0.06; recoilKick = Math.min(0.32, recoilKick + 0.22); shake = Math.max(shake, 0.62); addKick("火箭砲");   // 火箭筒:大後座 + 強震(整個人被推一把)
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD);
  // 前方大火焰 + 濃煙 + 後焰 back-blast(火箭筒特徵:尾管向後下方噴一大團煙焰)
  if (w.muzzle) { w.muzzle.getWorldPosition(tmpO2); emitFx(sparkPool, tmpO2, 0.32, 0.55, 1.5, true); emitFx(dustPool, tmpO2, 0.85, 0.45, 2.0, false); }
  _ejP.copy(tmpO).addScaledVector(tmpD, -0.5); _ejP.y -= 0.45;
  for (let i = 0; i < 3; i++) { _ejR.set((Math.random() - 0.5) * 1.3, -0.3 - Math.random() * 0.4, (Math.random() - 0.5) * 1.3).add(_ejP); emitFx(dustPool, _ejR, 0.75, 0.4, 1.7, false); }
  const m = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), rocketBodyMat); body.rotation.x = Math.PI / 2; m.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 12), rocketHeadMat); tip.rotation.x = -Math.PI / 2; tip.position.z = -0.32; m.add(tip);
  m.position.copy(tmpO).addScaledVector(tmpD, 0.8); scene.add(m);
  projectiles.push({ m, vel: tmpD.clone().multiplyScalar(42), type: "rocket", t: 0, prev: m.position.clone() });
}
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]; p.t += dt;
    if (p.type === "grenade") {
      p.vel.y -= GRAV * dt; p.vel.multiplyScalar(0.995);
      const px = p.m.position.x, py = p.m.position.y, pz = p.m.position.z; p.m.position.addScaledVector(p.vel, dt);
      if (p.m.position.y <= 0.2) { p.m.position.y = 0.2; p.vel.y *= -0.45; p.vel.x *= 0.7; p.vel.z *= 0.7; }
      if (p.m.position.y < 1.5 && blockedAt(p.m.position.x, p.m.position.z, 0.18)) { p.m.position.set(px, py, pz); p.vel.x *= -0.4; p.vel.z *= -0.4; }   // 低於 1.5m 才檢建築/木箱:高拋物仍能越過低掩體(刻意保留),撞到實心牆/箱則回退反彈,不再穿牆
      p.m.rotation.x += dt * 6; p.m.rotation.y += dt * 4;
      if (p.t >= p.fuse) { explode(p.m.position.clone(), 0, !!p.big); scene.remove(p.m); p.m.geometry.dispose(); projectiles.splice(i, 1); }
    } else {
      p.prev.copy(p.m.position); const step = _projStep.copy(p.vel).multiplyScalar(dt); const dist = step.length(); p.m.position.add(step);
      p.m.lookAt(_projLook.copy(p.m.position).add(p.vel));
      if (Math.random() < 0.85) emitFx(trailPool, p.prev, 0.7, 0.5, 1.4, false);
      ray.set(p.prev, _projDir.copy(p.vel).normalize()); ray.far = dist + 0.3; const h = ray.intersectObject(ROOT, true);
      const killRocket = () => { p.m.children.forEach((c) => c.geometry && c.geometry.dispose()); scene.remove(p.m); projectiles.splice(i, 1); };
      if (h.length) { explode(h[0].point.clone(), 0, true); killRocket(); }
      else if (p.m.position.y <= 0.3 || p.t > 4) { explode(p.m.position.clone(), 0, true); killRocket(); }
    }
  }
}

/* ── 每幀更新(移動/物理/武器/特效) ── */
const fwd = new THREE.Vector3(), right = new THREE.Vector3();
const STAND = 1.75, CROUCH_EYE = 1.15, GRAV = 15.2, JUMPV = 4.8;   // GRAV=拋射物(手榴彈/火箭/砲彈)共用重力;JUMPV 5.4→4.8 = 跳低一點(阿兵哥身體很重,不浮)
const GRAV_PLAYER = 17.5;   // 玩家跳躍專用重力(比拋射物重=落地更快更紮實),與拋射彈道分開不影響投擲平衡
const GRAV_DEBRIS = 18;   // 退殼/空彈匣等碎屑重力(統一原本散落的 magic 17)
/* ── 碰撞:建築 AABB(世界 XZ)圓 vs 盒推出,不能走進空殼房屋 ── */
const COLLIDERS = [
  // 寢室(0,-30)/ 澡堂(-30,-16)已改為可進入,牆段在 ROOM_COLLIDERS(留門洞);此處不再放實心 barracks AABB
  [-35, -29, 1, 7],            // watchtower(-32,4)
  [-27.5, -16.5, 9.5, 18.5],  // fdc 計算所(-22,14)
  ...ROOM_COLLIDERS,           // 中山室/用餐大廳/寢室/澡堂 牆段(留門洞,可走進去)
];
const PLAYER_R = 0.55, BOUND_R = 76;   // 圓形邊界半徑(圍籬樁在 R=78,玩家貼內側)
function losBlocked(ax, az, bx, bz) { for (let s = 1; s <= 8; s++) { const t = s / 9, x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const c of COLLIDERS) if (x > c[0] && x < c[1] && z > c[2] && z < c[3]) return true; } return false; }   // 線段 vs 建築 AABB 取樣:爆炸/視線遮蔽(只算建築,低掩體不擋手榴彈拋物)
function coverBlocked(ax, az, bx, bz) {   // 子彈/視線遮蔽真實掩體:建築 + 木箱油桶(OBSTACLES) + 載具(玩家正在駕駛的那台不算自己);敵人 LOS/開火/爆炸都用它,躲坦克木箱後不被穿透
  for (let s = 1; s <= 8; s++) {
    const t = s / 9, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    for (const c of COLLIDERS) if (x > c[0] && x < c[1] && z > c[2] && z < c[3]) return true;
    for (const o of OBSTACLES) if (x > o[0] && x < o[1] && z > o[2] && z < o[3]) return true;
    for (const v of VEHICLES) { if (v === vehicle) continue; const r = v.type === "tank" ? 2.6 : v.type === "howitzer" ? 2.0 : 2.2, vx = v.group.position.x, vz = v.group.position.z; if (x > vx - r && x < vx + r && z > vz - r && z < vz + r) return true; }
  }
  return false;
}
function blockedAt(x, z, r) { for (const c of COLLIDERS) if (x > c[0] - r && x < c[1] + r && z > c[2] - r && z < c[3] + r) return true; for (const c of OBSTACLES) if (x > c[0] - r && x < c[1] + r && z > c[2] - r && z < c[3] + r) return true; return false; }   // 點+半徑是否壓到建築/木箱(敵人繞行探路用)
function resolveCollisionFor(p, r) {   // 圓 vs AABB 推出:建築+木箱都擋,玩家(PLAYER_R)與敵人(0.5)共用
  for (const list of [COLLIDERS, OBSTACLES]) for (const c of list) {
    const x0 = c[0] - r, x1 = c[1] + r, z0 = c[2] - r, z1 = c[3] + r;
    if (p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1) {
      const dl = p.x - x0, dr = x1 - p.x, dn = p.z - z0, df = z1 - p.z, m = Math.min(dl, dr, dn, df);
      if (m === dl) p.x = x0; else if (m === dr) p.x = x1; else if (m === dn) p.z = z0; else p.z = z1;
    }
  }
}
function clampBound(p) { const ex = p.x, ez = p.z + 20, er = Math.hypot(ex, ez); if (er > BOUND_R) { p.x = ex / er * BOUND_R; p.z = ez / er * BOUND_R - 20; } }   // 圓形邊界(中心 0,-20 貼合圍籬)
function resolveCollision() { resolveCollisionFor(camera.position, PLAYER_R); }
function resolveEnemyPush() {   // 玩家不能穿過敵人:被推出每隻敵人的身體半徑
  if (MODE !== "sim") return;
  for (const g of enemies) { const u = g.userData; if (u.dead || u.apparition) continue;   // 幻影蛙人可穿過(夢,打不到也擋不住)
    const er = 0.42 * (u.escale || 1) + PLAYER_R, dx = camera.position.x - g.position.x, dz = camera.position.z - g.position.z, d2 = dx * dx + dz * dz;
    if (d2 < er * er && d2 > 1e-4) { const d = Math.sqrt(d2), k = (er - d) / d; camera.position.x += dx * k; camera.position.z += dz * k; }
  }
}
function resolveVehiclePush() {   // 玩家不能穿過停著的載具/大炮(駕駛中人在車裡不檢);粗略圓推出,半徑 < nearVehicle 範圍故仍可按 E 上車/操砲
  if (vehicle) return;
  for (const v of VEHICLES) { const rr = (v.type === "tank" ? 2.4 : v.type === "howitzer" ? 1.9 : 2.0) + PLAYER_R, dx = camera.position.x - v.group.position.x, dz = camera.position.z - v.group.position.z, d2 = dx * dx + dz * dz;
    if (d2 < rr * rr && d2 > 1e-4) { const d = Math.sqrt(d2), k = (rr - d) / d; camera.position.x += dx * k; camera.position.z += dz * k; }
  }
}
const scopeEl = document.getElementById("scope"), crossEl = document.getElementById("cross");
let bob = 0, recoilKick = 0, recoilVel = 0, vy = 0, jumpY = 0, curEye = EYE, sprayResetT = 0, lastFootstep = 0, wasGrounded = true, adsBlend = 0;
let curSpeed = 0, mvLastX = 0, mvLastZ = 0, mvSprint = false;   // 移動加速度曲線(慣性,非瞬間滑冰) + 自動衝刺狀態
const RSPRING = { "小槍": [330, 34], "步槍": [300, 33], "機關槍": [420, 30], "狙擊槍": [180, 22], "火箭砲": [150, 20] };   // 後座回正彈簧[勁度K, 阻尼D];略低於臨界=輕微過衝後定住;狙擊K小晃更久更沉,機槍K大快速碎抖
let vmKick = 0, vmKickRot = 0, landDip = 0, prevAdsState = false;   // 武器在手中的後座頓挫(每發瞬間衝擊 → 快速回彈,與鏡頭爬升 recoilKick 分開);landDip=落地下沉;prevAdsState=開鏡狀態偵測
// 每把武器的頓挫量[往後位移衝擊, 槍口上揚衝擊];數值小但快,給「槍在手上一頓」的視覺
const WKICK = { "小槍": [0.05, 0.18], "步槍": [0.055, 0.2], "機關槍": [0.036, 0.13], "狙擊槍": [0.12, 0.45], "火箭砲": [0.17, 0.55] };
function addKick(name) { const k = WKICK[name]; if (!k) return; vmKick = Math.min(0.2, vmKick + k[0]); vmKickRot = Math.min(0.62, vmKickRot + k[1]); }
let drawT = 0, drawDur = 0.5, reloadT = 0, reloadDur = 2.4, reloadFilled = true, chSpread = 0;
let _hbT = 0, _hbLast = -1;   // 低血心跳計時(累積秒 / 上次跳的時點)
function updateFP(dt) {
  if (MODE === "gaze") return;   // 一眼瞬間 reveal:凍結 3D 世界+輸入(移動/跳/腳步/後座/搖桿視角);reveal 由 gazeLoop 獨立 rAF + gazeMusic 驅動,不讓任何戰鬥 SFX/鏡頭飄移蓋過這一秒
  const w = WEAPONS[wi];
  // 手機輔助瞄準(a):開鏡且準星貼近螢幕上敵人(~6°錐內)時,視角靈敏度滑向 0.55(微黏),離開回 1。桌機 isTouch=false 永遠 1,完全不變
  { let target = 1; if (isTouch && ads && !dead && !gameOver && MODE === "sim") { const r = nearestEnemyInCone(0.9945); if (r) target = 0.55 + 0.45 * Math.min(1, r.ang / 0.105); } touchAimMul += (target - touchAimMul) * Math.min(1, dt * 10); }
  if ((lookJX || lookJY) && !overlayOpen() && !document.body.classList.contains("ui-edit")) { const s = dt * 2.6 * (settings.sens || 1) * (disarmT > 0 ? 0.22 : 1) * touchAimMul; yaw -= lookJX * s; pitch = Math.max(-1.2, Math.min(1.2, pitch - lookJY * s)); }   // toni #2:模式2 視角搖桿每幀轉 yaw/pitch(編輯模式不轉,避免拖按鈕時鏡頭飄);touchAimMul=開鏡微黏
  if (vehicle) {   // 駕駛載具:獨立路徑(驅動 + 追逐攝影機),仍更新世界
    updateVehicle(dt); updateWaves(dt); updateMusic(dt); updateAmbient(dt);
    updateProjectiles(dt); updateTargets(dt); updateEnemies(dt); updateEffects(dt);
    updateFxPool(sparkPool, dt); updateFxPool(dustPool, dt); updateFxPool(trailPool, dt); updateFxPool(bloodPool, dt);
    updateMemShards(dt); updateTracers(dt); updateShells(dt); updateCasings(dt); updateMags(dt); updateListener();
    return;
  }
  const crouch = !!(keys.ShiftLeft || keys.ShiftRight) || tCrouch;   // 桌機 Shift / 手機蹲鈕
  const silent = !!(keys.ControlLeft || keys.ControlRight) || tWalk;   // 桌機 Ctrl / 手機走鈕(慢走靜步)
  updateWaves(dt);
  // 視角 + 後座 + 震動
  camera.rotation.set(pitch - recoilKick - sprayPitch, yaw + sprayYaw, 0);
  if (shake > 0) { shake = Math.max(0, shake - dt * 1.6); const s = shake * 0.045; camera.rotation.x += (Math.random() - 0.5) * s; camera.rotation.y += (Math.random() - 0.5) * s; camera.rotation.z = (Math.random() - 0.5) * s * 0.6; }
  // 水平移動(ADS 減速)
  camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.crossVectors(fwd, UP).normalize();
  let mx = 0, mz = 0; if (keys.KeyW) mz += 1; if (keys.KeyS) mz -= 1; if (keys.KeyD) mx += 1; if (keys.KeyA) mx -= 1;
  if (tjx || tjz) { mx += tjx; mz += tjz; }   // 手機左搖桿類比移動
  const moving = !!(mx || mz); mvMoving = moving; mvCrouch = crouch;
  let speed = (crouch ? 1.6 : (silent ? 2.5 : 4.8)) * (w.moveMul || 1); if (ads) speed *= w.scope ? 0.5 : 0.72;
  const len = Math.hypot(mx, mz);
  let dirX = 0, dirZ = 0; if (len > 0.01) { dirX = mx / len; dirZ = mz / len; mvLastX = dirX; mvLastZ = dirZ; }   // 記住最後方向供減速滑行
  // 自動衝刺:直線前進(推到底)+ 未蹲/走/開鏡/開火 + 著地 → 速度緩升(無需鍵位,手機搖桿推到底亦可)
  const fwdRun = len > 0.01 ? dirZ : 0;
  mvSprint = fwdRun > 0.7 && Math.abs(dirX) < 0.55 && !crouch && !silent && !ads && !mouseDown && grounded && (realT - lastShot > 0.5);
  const tgtSpeed = len > 0.05 ? speed * (mvSprint ? 1.4 : 1) : 0;
  curSpeed += (tgtSpeed - curSpeed) * Math.min(1, dt * (tgtSpeed > curSpeed ? 7 : 13));   // 加速慢/減速快=有慣性,非瞬間起停滑冰
  if (!dead && curSpeed > 0.04) {
    const useX = len > 0.01 ? dirX : mvLastX, useZ = len > 0.01 ? dirZ : mvLastZ;   // 鬆鍵後沿最後方向滑行一小段
    camera.position.addScaledVector(fwd, useZ * curSpeed * dt);
    camera.position.addScaledVector(right, useX * curSpeed * dt);
    resolveCollision();   // 碰撞:被建築/木箱 AABB 推出(不能走進空殼房屋或穿木箱)
    resolveEnemyPush(); resolveVehiclePush();   // 不能穿過敵人 / 停著的載具+大炮
    clampBound(camera.position);   // 圓形邊界貼合圍籬,不再撞方形空氣牆
  } else mvSprint = false;
  // 跳躍重力
  if (!dead && keys.Space && grounded) { vy = JUMPV; grounded = false; sfxJump(); }
  if (!grounded) { vy -= GRAV_PLAYER * dt; jumpY += vy * dt; if (jumpY <= 0) { jumpY = 0; const vimp = vy; vy = 0; grounded = true; if (!wasGrounded) { sfxLand(); landDip = Math.min(0.2, -vimp * 0.022); vmKickRot = Math.min(0.62, vmKickRot + landDip * 0.5); if (vimp < -7) shake = Math.max(shake, 0.25); } } }   // 落地:依落地速度下沉+槍口點一下,重摔加震(用 GRAV_PLAYER 比拋射物重=更紮實)
  wasGrounded = grounded;
  // 蹲下視高
  const targetEye = crouch ? CROUCH_EYE : STAND; curEye += (targetEye - curEye) * Math.min(1, dt * 12);
  camera.position.y = curEye + jumpY - landDip;
  // 腳步聲(快走/蹲走有聲,Ctrl 靜步無聲)
  if (moving && grounded && !silent) { lastFootstep -= dt; if (lastFootstep <= 0) { sfxStep(crouch); lastFootstep = crouch ? 0.5 : (mvSprint ? 0.28 : 0.36); } } else lastFootstep = 0;   // 衝刺腳步更急
  // 後座衰減 + spray reset
  { const rs = RSPRING[w.name] || [140, 22]; recoilVel += (-recoilKick * rs[0] - recoilVel * rs[1]) * dt; recoilKick += recoilVel * dt; if (recoilKick < -0.02) recoilKick = -0.02; if (Math.abs(recoilKick) < 0.0004 && Math.abs(recoilVel) < 0.012) { recoilKick = 0; recoilVel = 0; } }   // 彈簧式後座回正:輕微過衝後定住(非線性鋸齒)
  vmKick += (0 - vmKick) * Math.min(1, dt * 17); vmKickRot += (0 - vmKickRot) * Math.min(1, dt * 15);   // 頓挫快速回彈(snappy)
  if (landDip > 0) landDip += (0 - landDip) * Math.min(1, dt * 12);   // 落地下沉 spring 回彈
  if (drawT > 0) drawT = Math.max(0, drawT - dt);
  if (reloadT > 0) { reloadT = Math.max(0, reloadT - dt); if (!reloadFilled && 1 - reloadT / reloadDur >= 0.6) { const rw = WEAPONS[wi]; const t = Math.min(rw.mag - rw.ammo, rw.reserve); rw.ammo += t; rw.reserve -= t; reloadFilled = true; updateHUD(); } }
  chSpread = Math.max(0, chSpread - dt * 26);
  if (scarFlash > 0) scarFlash = Math.max(0, scarFlash - dt * 0.55);   // 疤痕閃光衰減,留下永久 scarFloor
  // 低血(<30)危急:疤痕 vignette 加一層低頻脈動 + 柔和低沉心跳(重用 tone);血回升即停
  let _lowPulse = 0;
  if (playerHP < 30 && playerHP > 0 && !dead && MODE === "sim") { _hbT += dt; const beat = 1.05 - (30 - playerHP) / 60; const ph = (_hbT % beat) / beat; _lowPulse = 0.12 * Math.max(0, Math.sin(ph * Math.PI)); if (_hbT - _hbLast >= beat) { _hbLast = _hbT; if (actx && settings.vol > 0) { tone(58, 40, 0.16, 0.05, "sine"); setTimeout(() => { if (actx) tone(52, 36, 0.14, 0.04, "sine"); }, 150); } } } else { _hbT = 0; _hbLast = -1; }   // 越接近 0 心跳越快(beat 從 ~1.05s 縮到 ~0.55s);兩聲 lub-dub
  if (scarEl) scarEl.style.opacity = (scarFloor + scarFlash + _lowPulse).toFixed(3);
  // 顧牛站滿 ~8s:安靜地陪著那頭牛(顧著不亂跑),解鎖收尾句「日子就是往前」— 反英雄:最強的人被派去顧牛,也只是讓日子往前
  if (MODE === "hub" && !dead && nearCow()) { cowStandT += dt; if (cowStandT >= 8 && !cowFullShown && isReal(NARR.cowFull)) { cowFullShown = true; showNarr(NARR.cowFull, 5); } } else cowStandT = 0;
  // B3:光碟在硬關地上脈動;走過去(近距)即拾取 → EP40 信念句。離開實戰就清掉
  if (disc) { if (MODE !== "sim") clearDisc(); else { if (disc.userData.beam) disc.userData.beam.material.opacity = 0.34 + 0.22 * (0.5 + 0.5 * Math.sin(realT * 3.2)); disc.rotation.y += dt * 0.7; if (!dead && !gameOver && nearDisc()) pickupDisc(); } }
  const disarmReady = MODE === "sim" && awaitDisarm && disarmT <= 0 && disarmHoldT <= 0 && (realT - survivedAt > 2.2);   // 撐過那刻先讓「撐過了」+ survived 旁白獨處 ~2.2s,放下槍提示才浮現(不稀釋轉折);放下到底的空鏡期間(disarmHoldT>0)不再回顯提示
  document.body.classList.toggle("hud-dim", MODE === "sim" && awaitDisarm);   // 撐過了那拍:awaitDisarm 期間(戰鬥已止)把血/波/分數字淡到極低,只留「撐過了」+旁白;戰鬥恢復(awaitDisarm 解除)即還原
  if (shardsEl) shardsEl.classList.toggle("on", MODE === "hub" && isActive());   // 夢的碎片計數:只在軍營角落極低調顯示(實戰/結局隱藏)
  if (tbDisarmEl) tbDisarmEl.classList.toggle("on", isTouch && touchActive && disarmReady);   // 手機放下槍鈕(放下動作期間隱藏)
  document.body.classList.toggle("disarm-active", isTouch && touchActive && disarmReady);   // 放下槍那一刻:藏戰鬥拇指群,聚焦放下槍鈕(不疊鈕)
  if (hintEl) {
    const _tbAct = document.getElementById("tb-act");
    const _nearI = (MODE === "hub" && isActive()) ? (nearVehicle() ? "上車駕駛" : nearCounselor() ? "和輔導長談談" : nearCommander() ? "和連長談談" : nearCow() ? "替連長顧那頭牛" : nearJacket() ? "看那件反穿的外套" : nearDiary() ? "翻開大兵日記 · 看戰前的故事" : nearPhone() ? "拿起那具公共電話" : nearMotorbike() ? "看機車上夾的那張紙條" : nearCorner() ? "走到那個牆角站著" : nearTerminal() ? "看那台舊電腦的螢幕" : nearShrimp() ? "看那盤剝好的牡丹蝦" : nearWash() ? "走到盥洗台的鏡子前" : nearRangeEntry() ? "進入「實戰模擬練習」" : null) : null;
    if (_tbAct) { _tbAct.classList.toggle("glow", !!_nearI);   // toni #2:靠近可互動點→「使用」鈕發紅光提示
      if (_nearI) {   // #5:越靠近可互動點,「使用」鈕紅光脈動越快(縮短 animation duration)
        let nd = 99; for (let i = 0; i < beacons.length; i++) { const a = beacons[i].userData.anchor; if (!a) continue; const d = Math.hypot(camera.position.x - a.x, camera.position.z - a.z); if (d < nd) nd = d; }
        const gp = Math.max(0, Math.min(1, (12 - nd) / 11));   // 12m 外=0、1m 內=1
        _tbAct.style.animationDuration = (1.05 - gp * 0.72).toFixed(2) + "s";   // 1.05s(遠)→0.33s(貼近)越近越急促
      } else if (_tbAct.style.animationDuration) _tbAct.style.animationDuration = "";   // 離開可互動點還原預設節奏
    }
    const _hintsOn = document.body.classList.contains("hints-on");   // 提示預設收合(toni #2);靠近互動點/放下槍/試打暖身 例外一定顯示
    if (MODE === "sim" && warmupActive) { hintEl.classList.remove("pulse"); hintEl.style.opacity = "1"; hintEl.textContent = isTouch ? "試打看看 · 熟悉手感 · 按「使用」鈕開始實戰" : "試打看看 · 熟悉手感 · 按 E 開始實戰"; }   // 劇情/新手首波前無敵人試打:功能提示一定顯示
    else if (MODE === "sim" && awaitDisarm && disarmT <= 0) { if (disarmReady) { hintEl.style.opacity = "1"; hintEl.classList.add("pulse"); hintEl.textContent = isTouch ? "夠了 · 輕觸「放下槍」" : "夠了 · 按 H 放下槍"; } else { hintEl.classList.remove("pulse"); hintEl.style.opacity = "1"; hintEl.textContent = "可以停下了"; } }   // 放下槍=關鍵轉折,不收合;B6:撐過後、放下槍提示浮現前的空檔顯示中性「可以停下了」收束信號(配合準星淡出),讓玩家知道不必再獵敵
    else { hintEl.classList.remove("pulse");
      if (_nearI) { hintEl.style.opacity = "1"; hintEl.textContent = actHint(_nearI, " · "); }   // 靠近可互動:短提示一定顯示(不受收合影響)
      else if (_hintsOn && MODE === "sim" && inBreak && !shopPause && !(shopEl && shopEl.classList.contains("on"))) { hintEl.style.opacity = "1"; hintEl.textContent = wave >= 1 ? (isTouch ? "前一波已通關 · 按「軍械庫」鈕購買 · 倒數後自動開打" : "前一波已通關 · 按 B 開軍備購買 · 倒數後自動開打") : (isTouch ? "準備 · 按「軍械庫」鈕購買裝備" : "準備 · 按 B 開軍備購買"); }
      else if (_hintsOn && MODE === "hub" && isActive()) { hintEl.style.opacity = "1"; hintEl.textContent = isTouch ? "搖桿走動軍營 · 按「軍械庫」鈕購買裝備 · 走到靶場(右前方)按「使用」鈕開始實戰" : "自由走動軍營 · 按 B 開軍械庫購買裝備 · 走到靶場(右前方)按 E 開始實戰模擬"; }
      else hintEl.style.opacity = "0"; }
  }
  updateMusic(dt); updateAmbient(dt);
  moodSim += ((MODE === "sim" && !dead ? 1 : 0) - moodSim) * Math.min(1, dt * 0.8);   // 夢進熔爐:光影收緊(暗角加深 / 曝光略降 / 顆粒略增)
  if (postfxOn && postfx) { const tt = postfx.tuning; tt.vignette.darkness = 0.26 + moodSim * 0.14 + skyDarkCur * 0.12; tt.exposure = 1.08 - moodSim * 0.07 - skyDarkCur * 0.06; tt.grain.amount = 0.012 + moodSim * 0.01; if (pupilT > 0) { pupilT -= dt; const k = Math.max(0, pupilT / 2.0); tt.exposure *= (1 - k * 0.42); tt.vignette.darkness += k * 0.3; } }   // 瞳孔適應:進軍營頭2s 曝光漸升+暗角漸退
  // 漸暗天空:撐越久天越暗(夢的長夜情緒累積),平滑 lerp 不換波跳變
  const skyDarkTgt = MODE === "sim" ? Math.min(1, (wave - 1) / 9) : 0;   // wave1=0 → wave10=1
  skyDarkCur += (skyDarkTgt - skyDarkCur) * Math.min(1, dt * 0.5);
  if (skyDomeMat) skyDomeMat.color.setScalar(1 - skyDarkCur * 0.62);
  if (sunDiscMat) sunDiscMat.color.setScalar(1 - skyDarkCur * 0.5);
  sun.intensity = 3.3 * (1 - skyDarkCur * 0.55); ambient.intensity = 0.32 * (1 - skyDarkCur * 0.45); hemi.intensity = 0.9 * (1 - skyDarkCur * 0.4);
  if (scene.fog) { const k = skyDarkCur; scene.fog.color.setRGB(0.917 - k * 0.752, 0.796 - k * 0.623, 0.659 - k * 0.432); scene.fog.near = 95 - k * 40 - moodSim * 14; scene.fog.far = 280 - k * 100 - moodSim * 34; }   // 夜霧:天越暗霧越暗越近(暖桃→暗藍灰),不再永遠亮奶油色
  for (let i = 0; i < beacons.length; i++) { const b = beacons[i]; b.visible = MODE === "hub"; if (b.userData.ring) b.userData.ring.visible = MODE === "hub"; if (!b.visible) continue;
    const a = b.userData.anchor; const dist = a ? Math.hypot(camera.position.x - a.x, camera.position.z - a.z) : 99;
    const prox = Math.max(0, Math.min(1, (16 - dist) / 12.5));   // #5:近距增強因子——16m 外=0、3.5m 內=1,越近越亮越大越快
    const pulse = 0.5 + 0.5 * Math.sin(realT * (1.8 + prox * 3.4) + i * 2.1);   // 越近脈動越快(1.8→5.2Hz 區間)
    b.material.opacity = (0.34 + 0.62 * prox) * (0.55 + 0.45 * pulse);          // 越近底亮越高、脈幅更明顯(遠處 ~0.34 微亮、貼近最高 ~0.96)
    const sc = 1 + prox * 0.6 + pulse * (0.06 + prox * 0.22);                   // 越近光柱越粗壯、脈動呼吸更大
    b.scale.set(0.55 * sc, 3.6 * (1 + prox * 0.18), 1);
    b.position.y = 1.85 + (0.12 + prox * 0.14) * Math.sin(realT * (1.1 + prox * 1.6) + i);
    if (b.userData.ring) { const r = b.userData.ring; r.material.opacity = (0.1 + 0.32 * prox) * (0.7 + 0.3 * pulse); const rsc = 1 + prox * 0.18 + pulse * 0.05; r.scale.set(rsc, rsc, 1); }   // 地面站位光暈環:平時極淡(~0.1)、走近才明顯(~0.42),告訴玩家「站到這個圈裡按 E」(蝦的桌邊遮擋特別受益)
  }   // toni #2/#5:紅光柱在 hub 脈動引玩家走向可互動點,越靠近越強、脈動越快
  // NPC 柔白輝光:待辦步驟未完成時脈動引導(輔導長 until metCounselor、連長 until raisedHand);hub only
  const _pulse = 1.3 + 0.7 * Math.sin(realT * 2.4);
  if (counselorGlow) counselorGlow.intensity = (MODE === "hub" && !metCounselor) ? _pulse : 0;
  if (commanderGlow) commanderGlow.intensity = (MODE === "hub" && !raisedHand) ? _pulse : 0;
  for (const c of skyClouds) { c.position.x += dt * 0.5; if (c.position.x > 440) c.position.x -= 880; }   // 雲極慢側向飄:死貼圖變活氛圍
  if (skyHalo) skyHalo.material.opacity = 0.82 + 0.13 * Math.sin(realT * 0.34);   // 太陽光暈極輕呼吸
  if (cowTail) cowTail.rotation.z = 0.4 + Math.sin(realT * 2.1) * 0.26;   // 顧牛 idle:尾巴搖
  if (cowHead) { cowHead.rotation.z = Math.sin(realT * 0.7) * 0.09; cowHead.position.y = 1.62 - Math.max(0, Math.sin(realT * 0.7)) * 0.06; }   // 抬頭微擺(頭 base y=1.62,對齊新模組)
  if (realT - lastShot > 0.12) { sprayPitch += (0 - sprayPitch) * Math.min(1, dt * 6); sprayYaw += (0 - sprayYaw) * Math.min(1, dt * 6); }
  if (muzzleLight.intensity > 0) muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * (60 + Math.random() * 30));
  if ((sprayResetT -= dt) <= 0) sprayCount = 0;
  // ADS 縮放 + 狙擊鏡
  const scoped = ads && !!w.scope;
  if (actx && ads !== prevAdsState) { if (ads) { noiseHit(0.03, 1500, 900, 0.1); if (WEAPONS[wi].scope) tone(2200, 2200, 0.02, 0.06, "triangle"); } else noiseHit(0.025, 1100, 700, 0.07); prevAdsState = ads; }   // 開/出鏡就位咔聲(狙擊額外玻璃 tick),端槍瞄準的儀式感
  // B2:首次開鏡(ADS)一次 — 20年訓練看穿世界只要3秒(EP2),唯一盲點是她轉身那刻(EP9 verbatim);稀缺,每場一次
  if (ads && !_b2Said && MODE === "sim" && !dead && !gameOver) { _b2Said = true; showNarr(NARR.adsSee, 4.2); setTimeout(() => { if (MODE === "sim" && !dead && !gameOver) showNarr(NARR.adsTurn, 5.0); }, 4400); }
  adsBlend += ((ads ? 1 : 0) - adsBlend) * Math.min(1, dt * 18);
  const tgFov = (ads && w.adsFov) ? w.adsFov : (mvSprint ? 86 : 80); camera.fov += (tgFov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix();   // 衝刺視野微推給速度感
  if (scopeEl) scopeEl.classList.toggle("on", scoped);
  if (crossEl) crossEl.style.display = scoped ? "none" : "block";
  // B6 撐過最後一波→戰鬥結束的「可停下」收束信號:awaitDisarm 期間把準星淡到極低(別再追著敵人打),戰鬥恢復即還原
  if (crossEl) { const _over = MODE === "sim" && awaitDisarm; crossEl.style.transition = _over ? "opacity .6s ease" : ""; crossEl.style.opacity = _over ? "0.12" : "1"; }   // transition 只在 awaitDisarm 期間掛,戰鬥恢復即清→準星瞬間還原不延遲淡入
  // 動態準心:開火/移動/跳躍張開,靜止收攏(對齊真實 spread 回饋)
  if (crossEl && !scoped) { let ex = chSpread; if (!grounded) ex += 16; else if (mvMoving && !crouch) ex += 7; else if (crouch && !mvMoving) ex -= 1.5; if (ads) ex *= 0.3; document.documentElement.style.setProperty("--ch-gap", Math.max(1, settings.chGap + ex).toFixed(1) + "px"); }
  // 自動射擊(步槍/機槍按住)
  if (!dead && mouseDown && w.type === "auto" && isActive() && realT - lastShot >= w.rate) { fire(); }   // 節流改由 fire() 統一掌管 lastShot(與 semi 一致),這裡只負責 auto 連發節奏判定
  // 槍口焰
  for (const k of WEAPONS) if (k.muzzle) { if (k.muzzleT > 0) { k.muzzleT -= dt; const aSup = k === w ? adsBlend : 0; k.muzzle.material.opacity = Math.max(0, k.muzzleT / 0.06) * 0.9 * (1 - aSup * 0.55); const _ms = (1 + (1 - k.muzzleT / 0.06) * 0.7) * (1 - aSup * 0.6); k.muzzle.scale.set(_ms, _ms, _ms * 2.4); } else k.muzzle.material.opacity = 0; }   // 沿膛線前噴的火舌(z 拉長),非圓球   // 開鏡抑制火光,不糊住瞄準
  // 武器姿態(bob + 後座 + 揮舞/投擲 + ADS 置中)
  bob += dt * (moving ? (crouch ? 7 : 11) : 1.6);
  const bobAmp = (moving ? (crouch ? 0.008 : 0.014) : 0.003) * (1 - adsBlend * 0.7);
  // 揮擊動畫:三段弧線(蓄力↗ → 揮擊↘ → 收回),多軸 pitch/roll/位移,真實揮砍
  let swRx = 0, swRy = 0, swRz = 0, swPx = 0, swPy = 0, swPz = 0;
  if ((w.type === "melee" || w.type === "throw") && w.swingT > 0) {
    w.swingT -= dt;
    const dur = w.type === "throw" ? 0.45 : (w.swingDur || 0.3);
    const pr = Math.min(1, 1 - w.swingT / dur);
    if (w.melee === "swing") {   // 鐵鎚/小刀:過肩斜揮
      if (pr < 0.22) { const k = pr / 0.22, e = k * k; swRx = e * 0.85; swRz = e * 0.6; swPy = e * 0.07; }                                                       // 蓄力:抬起+側傾
      else if (pr < 0.52) { const k = (pr - 0.22) / 0.3, e = 1 - (1 - k) * (1 - k); swRx = 0.85 - e * 2.3; swRz = 0.6 - e * 1.2; swPx = -e * 0.05; swPy = 0.07 - e * 0.19; swPz = -e * 0.17; }   // 揮擊:快速下掃+前送
      else { const k = (pr - 0.52) / 0.48, e = k * k * (3 - 2 * k); swRx = -1.45 * (1 - e); swRz = -0.6 * (1 - e); swPx = -0.05 * (1 - e); swPy = -0.12 * (1 - e); swPz = -0.17 * (1 - e); }   // 收回:smoothstep 回 base
    } else if (w.melee === "stab") {   // 刺槍:後拉蓄力 → 快速前刺 → 收回
      if (pr < 0.25) { const k = pr / 0.25, e = k * k; swPz = e * 0.09; swRx = e * 0.16; }
      else if (pr < 0.5) { const k = (pr - 0.25) / 0.25, e = 1 - (1 - k) * (1 - k); swPz = 0.09 - e * 0.55; swRx = 0.16 - e * 0.18; }
      else { const k = (pr - 0.5) / 0.5, e = k * k * (3 - 2 * k); swPz = -0.46 * (1 - e); swRx = -0.02 * (1 - e); }
    } else {   // 手榴彈:過肩投擲
      if (pr < 0.3) { const k = pr / 0.3, e = k * k; swRx = e * 0.7; swPz = e * 0.08; }
      else { const k = (pr - 0.3) / 0.7, e = 1 - (1 - k) * (1 - k); swRx = 0.7 - e * 1.1; swPz = 0.08 - e * 0.2; }
    }
  }
  // spring sway:武器對滑鼠轉向產生慣性延遲(現代手感)
  const dyaw = yaw - prevYaw, dpitch = pitch - prevPitch; prevYaw = yaw; prevPitch = pitch;
  const sk = Math.min(1, dt * 9);
  swayX += (-dyaw * 1.5 - swayX) * sk; swayY += (dpitch * 1.5 - swayY) * sk;
  swayX = Math.max(-0.045, Math.min(0.045, swayX)); swayY = Math.max(-0.045, Math.min(0.045, swayY));
  // 拔槍/換彈位移:拔槍由低處 ease-out 升起;換彈正弦下沉+傾斜
  let drawDipY = 0, drawDipZ = 0, drawRotX = 0, rlDipY = 0, rlRotX = 0, rlRotZ = 0, disDipY = 0, disRotX = 0;
  if (disarmT > 0) { disarmT -= dt; if (disarmT < 0) disarmT = 0; const e = 1 - disarmT / 0.85, s = e * e; disDipY = -s * 0.75; disRotX = s * 1.15; pitch += (-0.34 - pitch) * Math.min(1, dt * 3.5); if (disarmT === 0) disarmHoldT = 0.8; }   // 放下槍:槍垂下+槍口下傾(ease-in)+ 鏡頭順勢低頭看放下的手(韓劇運鏡),到底→先在「手空了」空鏡停 0.8s(失重多沉一拍再進一眼瞬間)
  else if (disarmHoldT > 0) { disarmHoldT -= dt; disDipY = -0.75; disRotX = 1.15; pitch += (-0.34 - pitch) * Math.min(1, dt * 3.5); if (disarmHoldT <= 0) { disarmHoldT = 0; startGaze(); } }   // 「手空了」空鏡:槍維持垂下到底的姿勢停 0.4s(失重感落地),再進一眼瞬間
  if (drawT > 0) { const dp = 1 - drawT / drawDur, e = 1 - (1 - dp) * (1 - dp); drawDipY = -(1 - e) * 0.4; drawDipZ = (1 - e) * 0.12; drawRotX = (1 - e) * 1.0; }
  if (reloadT > 0) { const rp = 1 - reloadT / reloadDur, rc = reloadCurve(WEAPONS[wi].name, rp); rlDipY = rc[0]; rlRotX = rc[1]; rlRotZ = rc[2]; }
  const ax = w.base.x * (1 - adsBlend * 0.7) + swayX, ay = w.base.y + adsBlend * 0.03 + swayY;
  w.group.position.set(ax + Math.sin(bob) * bobAmp + swPx, ay + Math.abs(Math.cos(bob)) * bobAmp - recoilKick * 0.5 + vmKick * 0.16 - landDip * 0.5 + drawDipY + rlDipY + disDipY + swPy, w.base.z + recoilKick * 1.2 + vmKick + swPz + drawDipZ);
  w.group.rotation.set(w.rot.x + swRx - swayY * 2 + vmKickRot + drawRotX + rlRotX + disRotX, w.rot.y + swRy + swayX * 2, w.rot.z + swRz + rlRotZ);
  w.group.visible = !scoped;
  updateProjectiles(dt); updateTargets(dt); updateEnemies(dt); updateEffects(dt);
  updateFxPool(sparkPool, dt); updateFxPool(dustPool, dt); updateFxPool(trailPool, dt); updateFxPool(bloodPool, dt);
  updateMemShards(dt); updateTracers(dt); updateShells(dt); updateCasings(dt); updateMags(dt);   // 記憶光點 + CS 曳光 + 榴彈砲彈道 + 退殼 + 空彈匣
  updateListener();
}
showWeapon(1);   // 預設刺槍(鐵鎚 / 小刀已隱藏,toni #1)

/* ───────── 氣氛:霧 + 光塵 ───────── */
scene.fog = new THREE.Fog(0xeacba8, 95, 280);
let motes;
(function makeMotes() {
  const n = 120, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - 0.5) * 110; pos[i * 3 + 1] = Math.random() * 30 + 1; pos[i * 3 + 2] = (Math.random() - 0.5) * 110 - 20; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement("canvas"); cv.width = cv.height = 32; const c = cv.getContext("2d");
  const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255,238,208,1)"); gr.addColorStop(1, "rgba(255,238,208,0)"); c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
  motes = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, color: 0xffeed0 }));
  motes.frustumCulled = false; scene.add(motes);
})();

/* ───────── postfx ───────── */
let postfx = null, postfxOn = false;
try {
  postfx = createPostFX({ renderer, scene, camera }); const t = postfx.tuning;
  t.exposure = 1.08; t.motionBlur = false;
  t.bloom.strength = 0.22; t.bloom.threshold = 0.8;
  t.dof.enabled = false; // FPS 要清晰
  t.ssao.enabled = true; t.ssao.intensity = 0.42; t.ssao.radius = 7;
  t.vignette.darkness = 0.26; t.vignette.color = [0.16, 0.09, 0.06];
  t.grain.amount = 0.012;
  t.colorGrade.shadowTint = [0.9, 0.97, 1.12]; t.colorGrade.highlightTint = [1.12, 1.0, 0.84];
  t.godRays.strength = 0.18; t.lensFlare.strength = 0.1;
  if (t.volFog) { t.volFog.density = 0.014; if (t.volFog.color) t.volFog.color = [0.66, 0.62, 0.62]; }   // 晨霧:低密度近地霧讓逆光太陽方向有晨霧層次(hub 不再像白天操場)
  postfx.setJuniorAnchor(null);
  postfx.setSize(Math.round(window.innerWidth * renderer.getPixelRatio()), Math.round(window.innerHeight * renderer.getPixelRatio()));
  postfxOn = true;
} catch (e) { console.warn("[3d營] postfx fail", e && e.message); postfxOn = false; }

/* ───────── 5 級畫質(預設中):解析度 / 陰影 / 後製 ───────── */
// losMul=AI 視線重算間隔倍率(越大越省 CPU) / enemyCap=每波敵人數倍率(低檔砍半救中低階手機)
const QUALITY = { 1: { pr: 0.6, shadow: false, shadowSize: 0, postfx: false, losMul: 2.2, enemyCap: 0.55 }, 2: { pr: 0.8, shadow: true, shadowSize: 1024, postfx: false, losMul: 1.6, enemyCap: 0.78 }, 3: { pr: 1, shadow: true, shadowSize: 2048, postfx: true, losMul: 1, enemyCap: 1 }, 4: { pr: 1.5, shadow: true, shadowSize: 2048, postfx: true, losMul: 1, enemyCap: 1 }, 5: { pr: 2, shadow: true, shadowSize: 4096, postfx: true, losMul: 1, enemyCap: 1 } };
let postfxWanted = true, qLosMul = 1, qEnemyCap = 1;   // postfx 是否被畫質允許(與 runtime fail 分開) + 效能旗標
function applyQuality(q) {
  const p = QUALITY[q] || QUALITY[3];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pr));
  renderer.shadowMap.enabled = p.shadow;
  if (sun && sun.shadow && p.shadowSize) { sun.shadow.mapSize.set(p.shadowSize, p.shadowSize); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  postfxWanted = p.postfx; postfxOn = p.postfx && !!postfx; qLosMul = p.losMul || 1; qEnemyCap = p.enemyCap || 1;
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (postfx) postfx.setSize(Math.round(window.innerWidth * renderer.getPixelRatio()), Math.round(window.innerHeight * renderer.getPixelRatio()));
}
applyQuality(settings.quality);

/* ───────── 太陽 screen-space UV(god rays/lens flare) ───────── */
const _sunWorld = SUN_DIR.clone().multiplyScalar(520);
const _sunUv = new THREE.Vector2(0.5, 0.7);
const _sunDir = new THREE.Vector3(), _sunRel = new THREE.Vector3();
function computeSunUv() {
  camera.getWorldDirection(_sunDir); _sunRel.copy(_sunWorld).sub(camera.position);
  if (_sunDir.dot(_sunRel) <= 0) { _sunUv.set(-10, -10); return _sunUv; }   // 太陽在鏡頭後方:project 會鏡像出假 UV → 觸發假 god rays/鏡頭光暈;設離屏無效值讓 postfx guard 擋掉
  const v = _sunWorld.clone().project(camera); _sunUv.set((v.x + 1) / 2, (v.y + 1) / 2); return _sunUv;
}

/* ───────── 渲染 ───────── */
let realT = 0; const clock = new THREE.Clock();
let vmStack = true;   // 武器疊加層(防穿牆),可由 __VMSTACK__(false) 關閉
function renderOnce() {
  if (motes) { motes.rotation.y = realT * 0.011; motes.position.y = Math.sin(realT * 0.4) * 0.6; }   // 微塵旋轉略快 + 整體極輕上下浮(天空有在動)
  computeSunUv();
  // 主世界 pass(相機 layer 0):不含武器(武器在 layer 1)
  if (postfxOn) { try { postfx.render(realT, _sunUv); } catch (e) { postfxOn = false; } } else renderer.render(scene, camera);
  if (vmStack) {
    // 疊加 pass:清深度後只畫 layer 1(武器)→ 永遠在最上層,槍管不穿牆
    const ac = renderer.autoClear, su = renderer.shadowMap.autoUpdate, tm = renderer.toneMapping, te = renderer.toneMappingExposure;
    renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;   // 不重算陰影
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92; // postfx 關掉內建 tonemap,疊加層要自己開
    renderer.setRenderTarget(null); renderer.clearDepth();
    camera.layers.set(VIEWMODEL_LAYER); renderer.render(scene, camera); camera.layers.set(0);
    renderer.autoClear = ac; renderer.shadowMap.autoUpdate = su; renderer.toneMapping = tm; renderer.toneMappingExposure = te;
  }
}
/* ── FPS 看門狗:卡頓持續 ~2s 自動降一級畫質(每場限一次,不回升,避免來回抖) ── */
let _fpsAccum = 0, _fpsTimer = 0, _autoDropped = false;
function fpsWatchdog(dt) {
  if (_autoDropped || settings.quality <= 1) return;
  if (realT < 4) { _fpsAccum = 0; _fpsTimer = 0; return; }   // 開場 ~4s 寬限:略過建場/首載卡頓,避免誤判降畫質(累加器歸零→首個結算窗從乾淨開始)
  _fpsAccum += dt; _fpsTimer += 1;
  if (_fpsAccum < 2) return;   // 每 ~2s 結算一次平均
  const avgFps = _fpsTimer / _fpsAccum; _fpsAccum = 0; _fpsTimer = 0;
  if (avgFps < 30) { _autoDropped = true; settings.quality -= 1; applyQuality(settings.quality); saveSettings(); showNarr("偵測到卡頓，已自動調低畫質", 3); const _qs = document.getElementById("set-quality"); if (_qs) _qs.value = settings.quality; const _qv = document.getElementById("set-quality-val"); if (_qv) _qv.textContent = ({ 1: "低", 2: "中低", 3: "中", 4: "中高", 5: "高" })[settings.quality] || "中"; }   // 全形標點(中文後不接半形逗號);同步畫質滑桿+檔位名顯示(若設定面板開著)
}
function loop() { requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), 0.05); realT += dt; fpsWatchdog(dt); updateFP(dt); updateFlag(realT); updateRadar(); renderOnce(); }
/* ── console debug 後門:預設關閉,只在 URL 帶 ?debug 才暴露(production 防作弊 / 輔助 XSS / 資訊洩漏,OWASP 建議) ── */
const DEBUG = /[?&](debug|dev)\b/i.test(location.search || "");
if (DEBUG) {
  window.__VMSTACK__ = (b) => { vmStack = b !== false; camera.layers.set(0); if (!vmStack) camera.layers.enable(VIEWMODEL_LAYER); return vmStack; };
  window.__RENDER__ = (n) => { for (let i = 0; i < (n || 1); i++) { realT += 0.016; updateFP(0.016); renderOnce(); } };
  window.__CAM__ = camera; window.__SUN__ = SUN_DIR;
  window.__TP__ = (x, y, z) => { camera.position.set(x, y, z); }; // debug 傳送
  window.__BOOM__ = (n) => { const m = explosives[n || 0]; if (m) { const p = m.position.clone(); m.userData.dead = true; m.visible = false; const i = explosives.indexOf(m); if (i >= 0) explosives.splice(i, 1); explode(p, 0); } }; // debug 引爆
  window.__SHOOT__ = () => shootHit(WEAPONS[wi]); // debug 射擊
  window.__FIRE__ = () => fire(); // debug 完整擊發(含退殼/槍口煙/後焰)
  window.__WEP__ = (i) => showWeapon(i); // debug 切武器
  window.__SPAWN__ = (n) => { for (let i = 0; i < (n || 6); i++) spawnEnemy(-6 + i * 2.4, -8); return enemies.map((e) => e.userData.etype); }; // debug 生敵人看兵種變化
  window.__SPAWNW__ = (specs, z) => { const arr = specs || ["pistol", "rifle", "mg", "sniper", "rocket", "knife", "frog"]; arr.forEach((w, i) => spawnEnemy(-7.5 + i * 2.6, z == null ? -8 : z, 100, w === "frog" ? { frogman: true } : { weapon: w })); return enemies.map((e) => e.userData.weapon + (e.userData.frog ? "(frog)" : "")); }; // debug 生指定武器/蛙人看模組
  window.__SIMTEST__ = (diff) => { MODE = "sim"; settings.difficulty = diff || 3; applyDifficulty(); resetVehicles(); inBreak = false; wave = 1; for (let i = 0; i < 5; i++) spawnEnemy(-8 + i * 4, -22 - (i % 2) * 6, 100, { weapon: "pistol" }); return { mode: MODE, radarMap, radarSat }; }; // debug 強制進實戰看雷達/HUD
  window.__FROG__ = (sq) => { spawnFrogmen(sq || 1); return { active: frogmenActive, ghosts: frogmenGhostCount }; };   // debug 觸發蛙人幻影穿越
  window.__ENEMIES__ = () => ({ active: frogmenActive, ghosts: frogmenGhostCount, realT: Math.round(realT * 10) / 10, deadline: Math.round(frogmenDeadline * 10) / 10, list: enemies.map((e) => ({ app: !!e.userData.apparition, z: Math.round(e.position.z * 10) / 10, appT: Math.round((e.userData.appT || 0) * 10) / 10 })) });   // debug 看幻影位置/計時
  window.__DISARMTEST__ = () => { MODE = "sim"; awaitDisarm = true; beginDisarm(); return { disarmT, MODE }; }; // debug 測放下槍動作
  window.__STATE__ = () => ({ MODE, awaitDisarm, disarmT: +disarmT.toFixed(2) }); // debug 看 disarm 狀態
  window.__ADS__ = (v) => { ads = !!v; }; // debug 開鏡
  window.__AIM__ = (x, y, z) => { camera.lookAt(x, y, z); yaw = camera.rotation.y; pitch = camera.rotation.x; }; // debug 瞄向
  window.__KILLTEST__ = () => { let best = null, bd = 1e9; for (const g of enemies) { if (g.userData.dead) continue; const d = g.position.distanceTo(camera.position); if (d < bd) { bd = d; best = g; } } if (!best) return "no enemy"; camera.lookAt(best.position.clone().setY(1.2)); yaw = camera.rotation.y; pitch = camera.rotation.x; camera.updateMatrixWorld(true); const hp0 = best.userData.hp; for (let i = 0; i < 6; i++) shootHit(WEAPONS[wi]); return { dist: Math.round(bd), hp0, hpAfter: best.userData.hp, kills }; }; // debug 殺最近敵
  window.__DBG__ = () => ({ enemies: enemies.length, alive: waveAlive, queue: spawnQueue, wave, score, kills, hp: playerHP, dead, gameOver, MODE, awaitDisarm }); // debug 狀態
  window.__GAZE__ = startGaze; // debug 觸發一眼瞬間
}
function onResize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (postfx) postfx.setSize(Math.round(w * renderer.getPixelRatio()), Math.round(h * renderer.getPixelRatio())); if (typeof applyUI === "function") applyUI(); }   // 旋轉/改尺寸後重新夾擠自訂 UI 位置(toni #2)
window.addEventListener("resize", onResize);
setTimeout(() => document.getElementById("title").classList.add("show"), 600);
if (isTouch) setTimeout(() => { const t = document.getElementById("title"); if (t) t.classList.remove("show"); }, 4600);   // 手機:標題只當開場 splash,讀完(~4.6s)淡出,把擁擠的頂部 HUD 帶完整讓給血量/彈藥/雷達(桌機標題在上方不擋,維持原樣)
loop();
