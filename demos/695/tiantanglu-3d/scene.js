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
let skyDomeMat = null, sunDiscMat = null;   // 漸暗天空用:撐越久天越暗
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
  halo.scale.set(190, 190, 1); halo.position.copy(sunPos); scene.add(halo);
  // 柔雲
  const clc = document.createElement("canvas"); clc.width = 256; clc.height = 128; const cx = clc.getContext("2d");
  for (let i = 0; i < 26; i++) { const x = 30 + Math.random() * 196, y = 50 + Math.random() * 50, r = 18 + Math.random() * 34; const gg = cx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, "rgba(255,246,232," + (0.5 + Math.random() * 0.3) + ")"); gg.addColorStop(1, "rgba(255,246,232,0)"); cx.fillStyle = gg; cx.beginPath(); cx.arc(x, y, r, 0, 7); cx.fill(); }
  const cloudTex = new THREE.CanvasTexture(clc);
  const cloudPos = [[-180, 120, -340, 150], [220, 150, -380, 200], [-40, 170, -420, 240], [320, 110, -260, 130]];
  for (const [x, y, z, s] of cloudPos) { const cl = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.38, depthWrite: false, fog: false })); cl.position.set(x, y, z); cl.scale.set(s, s * 0.5, 1); scene.add(cl); }
})();

/* ───────── 第一人稱相機 (CS 視角) ───────── */
const UP = new THREE.Vector3(0, 1, 0);
const EYE = 1.75;
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.02, 1500);
camera.rotation.order = "YXZ";
camera.position.set(8, EYE, 13);
camera.lookAt(-4, 1.45, -26);
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
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6; sun.shadow.radius = 3;
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
const matT = (col, t, rx, ry, o = {}) => { const m = t.clone(); m.needsUpdate = true; m.repeat.set(rx, ry); return new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.9, map: m, envMapIntensity: 1.0, ...o }); };

const ROOT = new THREE.Group(); scene.add(ROOT);
function add(geo, m, x, y, z, parent) { const b = new THREE.Mesh(geo, m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; (parent || ROOT).add(b); return b; }

/* ───────── 地面 + 操場 + 道路 ───────── */
(function terrain() {
  // 大地(泥土草)
  const g = add(new THREE.BoxGeometry(360, 1, 360), matT(0x8a7c5e, T.ground, 40, 40, { roughness: 1 }), 0, -0.5, -30);
  g.castShadow = false;
  // 操場混凝土
  add(new THREE.BoxGeometry(56, 0.4, 46), matT(0xd0c7ae, T.concrete, 10, 8, { roughness: 0.95 }), 0, 0.2, -6).castShadow = false;
  // 操場白漆邊線 + 中線
  const line = mat(0xe8e2cf, { roughness: 0.85 });
  const ln = (w, d, x, z) => { const m = add(new THREE.BoxGeometry(w, 0.05, d), line, x, 0.42, z); m.castShadow = false; };
  ln(46, 0.4, 0, -22); ln(46, 0.4, 0, 10); ln(0.4, 32, -23, -6); ln(0.4, 32, 23, -6); ln(46, 0.3, 0, -6);
  // 主幹道(柏油)
  add(new THREE.BoxGeometry(10, 0.42, 120), matT(0x57534d, T.asphalt, 2, 22, { roughness: 0.85 }), 34, 0.22, -20).castShadow = false;
  add(new THREE.BoxGeometry(80, 0.42, 9), matT(0x57534d, T.asphalt, 16, 2, { roughness: 0.85 }), 0, 0.22, 18).castShadow = false;
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
}
barracks(0, -30, 0, true);
barracks(-30, -16, Math.PI / 2, false);

/* ───────── 旗桿 + 旗(操場中軸) ───────── */
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
  const fl = add(new THREE.BoxGeometry(5, 3.2, 0.12), new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.78, side: THREE.DoubleSide, envMapIntensity: 0.55 }), 2.7, 12.4, -6); fl.rotation.y = 0.05;
})();

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
    add(new THREE.BoxGeometry(0.4, 3, 0.4), postM, x, 1.5, z);
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

/* ───────── 顧牛(EP40 夢中違和物件:軍營裡一頭牛,「我顧著牠不要亂跑,我也不要亂跑」) ───────── */
let cowTail = null, cowHead = null;
(function buildCow() {
  const cx = -14, cz = 18;
  const hide = mat(0xf4f1ea, { roughness: 0.93, envMapIntensity: 0.48 }), patch = mat(0x2a241d, { roughness: 0.95, envMapIntensity: 0.42 }), hoof = mat(0x1f1a16, { roughness: 0.96, envMapIntensity: 0.42 }), muz = mat(0xb0a098, { roughness: 0.86, envMapIntensity: 0.45 });
  const root = new THREE.Group(); root.position.set(cx, 0, cz); root.rotation.y = 0.55; ROOT.add(root);
  const part = (geo, m, x, y, z, p) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); e.castShadow = e.receiveShadow = true; (p || root).add(e); return e; };
  const body = part(new THREE.BoxGeometry(1.55, 0.84, 0.8), hide, -0.05, 1.08, 0);                 // 軀幹
  part(new THREE.BoxGeometry(0.74, 0.74, 0.76), hide, 0.7, 1.04, 0);                                // 肩胸(前段略寬)
  part(new THREE.BoxGeometry(0.58, 0.56, 0.82), patch, 0.28, 0.14, 0.01, body);                     // 黑斑(背)
  part(new THREE.BoxGeometry(0.44, 0.5, 0.82), patch, -0.48, -0.04, -0.02, body);                   // 黑斑(後腹)
  part(new THREE.BoxGeometry(0.34, 0.42, 0.84), patch, -0.06, 0.18, 0.0, body);                     // 黑斑(肩)
  const neck = part(new THREE.BoxGeometry(0.44, 0.5, 0.52), hide, 1.04, 0.82, 0);                   // 頸(往前下)
  neck.rotation.z = -0.5;
  cowHead = part(new THREE.BoxGeometry(0.5, 0.46, 0.44), hide, 1.32, 0.52, 0);                       // 頭(低垂吃草)
  part(new THREE.BoxGeometry(0.15, 0.34, 0.46), patch, 0.1, 0.05, 0, cowHead);                       // 額斑
  part(new THREE.BoxGeometry(0.32, 0.26, 0.4), muz, 0.3, -0.13, 0, cowHead);                         // 口鼻
  for (const s of [-1, 1]) {
    const ear = part(new THREE.BoxGeometry(0.22, 0.09, 0.16), hide, -0.05, 0.16, 0.3 * s, cowHead); ear.rotation.z = 0.35;   // 寬扁耳(非刺)
    const horn = part(new THREE.CylinderGeometry(0.025, 0.055, 0.16, 6), mat(0xcabf9e, { roughness: 0.6 }), 0.05, 0.27, 0.11 * s, cowHead); horn.rotation.z = -0.45 * s;   // 短鈍角
    part(new THREE.SphereGeometry(0.035, 8, 6), patch, 0.2, 0.0, 0.18 * s, cowHead);                 // 眼
  }
  for (const [lx, lz] of [[0.56, 0.27], [0.56, -0.27], [-0.6, 0.27], [-0.6, -0.27]]) {
    part(new THREE.BoxGeometry(0.17, 0.66, 0.17), hide, lx, 0.4, lz);                                // 腿
    part(new THREE.BoxGeometry(0.19, 0.12, 0.19), hoof, lx, 0.06, lz);                               // 蹄
  }
  cowTail = part(new THREE.BoxGeometry(0.08, 0.58, 0.08), hide, -0.82, 0.9, 0);
  cowTail.rotation.z = 0.4;
  part(new THREE.BoxGeometry(0.12, 0.14, 0.12), patch, 0, -0.33, 0, cowTail);                        // 尾穗
})();

/* ───────── 夢中違和物件:反穿的學校外套(#3 名字藏起來;軍營裡一件學校外套=夢的錯位) ───────── */
(function buildJacket() {
  const jx = 12, jz = 16;
  const benchW = mat(0x5f4730, { roughness: 0.9 }), benchM = mat(0x4a3826, { roughness: 0.92 });
  add(new THREE.BoxGeometry(1.5, 0.09, 0.46), benchW, jx, 0.45, jz);                                  // 椅板
  add(new THREE.BoxGeometry(1.5, 0.4, 0.06), benchM, jx, 0.74, jz - 0.2);                             // 椅背(讓外套披掛)
  for (const lx of [-0.64, 0.64]) for (const lz of [-0.16, 0.16]) add(new THREE.BoxGeometry(0.08, 0.45, 0.08), benchM, jx + lx, 0.22, jz + lz);  // 4 腿
  const jOut = mat(0x232c46, { roughness: 0.95, envMapIntensity: 0.4 });   // 深藍校服(正面)
  const jLin = mat(0x9097a3, { roughness: 0.92, envMapIntensity: 0.4 });    // 內裡(反穿朝外=名字藏住)
  const root = new THREE.Group(); root.position.set(jx, 0, jz); root.rotation.y = 0.12; ROOT.add(root);
  const part = (geo, m, x, y, z, rx, rz) => { const e = new THREE.Mesh(geo, m); e.position.set(x, y, z); if (rx) e.rotation.x = rx; if (rz) e.rotation.z = rz; e.castShadow = true; root.add(e); return e; };
  part(new THREE.BoxGeometry(0.72, 0.5, 0.1), jLin, 0, 0.74, -0.14, 0.12, 0);                          // 披在椅背的外套身(反面朝外)
  part(new THREE.BoxGeometry(0.74, 0.12, 0.18), jOut, 0, 0.98, -0.11, 0.34, 0);                        // 翻出的領(深藍)
  part(new THREE.BoxGeometry(0.64, 0.12, 0.42), jLin, 0, 0.5, 0.06, 0, 0);                             // 下襬披在椅面(反面)
  for (const s of [-1, 1]) {
    part(new THREE.BoxGeometry(0.15, 0.52, 0.15), jOut, 0.33 * s, 0.6, -0.04, -0.15, 0.13 * s);        // 垂掛的袖
    part(new THREE.BoxGeometry(0.16, 0.09, 0.16), jLin, 0.37 * s, 0.35, 0.01, 0, 0);                   // 袖口(反面)
  }
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
  sandbagWall(26, 3, 0.35, 6); sandbagWall(-4, 26, 1.25, 5);
  // 油桶堆(直立 + 一個倒地)
  const drums = (cx, cz) => { add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumR, cx, 0.55, cz); add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumG, cx + 0.85, 0.55, cz + 0.15); add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumR, cx + 0.42, 0.55, cz + 0.78); const lay = add(new THREE.CylinderGeometry(0.4, 0.4, 1.1, 16), drumG, cx - 0.7, 0.4, cz + 0.6); lay.rotation.z = Math.PI / 2; stain(cx, cz + 0.4, 2.4, 2.4, 0.3, 0x14100a, 0.4); };
  drums(-9, 23); drums(17, -7);
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
P(gRifle, new THREE.BoxGeometry(0.09, 0.24, 0.14), gunMag, 0, -0.18, 0.0, 0.28, 0, 0);
P(gRifle, new THREE.BoxGeometry(0.085, 0.16, 0.13), gunMag, 0, -0.34, 0.05, 0.5, 0, 0);
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
P(gSniper, new THREE.BoxGeometry(0.08, 0.18, 0.12), gunMag, 0, -0.14, -0.02, 0.2, 0, 0); // 彈匣
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
/* ── 5 段難度(toni:劇情/新手/正常/困難/天堂路) ── */
const DIFF = {
  1: { name: "劇情", hp: 3, ammo: 3, enemyMul: 1, smart: false },
  2: { name: "新手", hp: 2, ammo: 2, enemyMul: 1, smart: false },
  3: { name: "正常", hp: 1, ammo: 1, enemyMul: 1, smart: false },
  4: { name: "困難", hp: 1, ammo: 1, enemyMul: 2, smart: false },
  5: { name: "天堂路", hp: 1, ammo: 1, enemyMul: 2, smart: true },
};
function applyDifficulty() {   // 進實戰/重新部署時套:玩家 HP、彈藥、敵人倍率/AI(讀 curDiff)
  curDiff = DIFF[settings.difficulty] || DIFF[3];
  MAX_HP = Math.round(100 * curDiff.hp); playerHP = MAX_HP; if (hpEl) hpEl.textContent = MAX_HP;
  WEAPONS.forEach((w) => { if (w.baseReserve != null) { w.ammo = w.mag; w.reserve = Math.round(w.baseReserve * curDiff.ammo); } if (w.baseCount != null) w.count = Math.round(w.baseCount * curDiff.ammo); });
  updateHUD();
}
let wi = 0; // 預設鐵鎚(slot 1)
function updateHUD() {
  const w = WEAPONS[wi]; const am = document.getElementById("am"), ar = document.getElementById("amres"), nm = document.getElementById("wpn");
  if (nm) nm.textContent = w.name;
  if (w.type === "melee") { if (am) am.textContent = "∞"; if (ar) ar.textContent = ""; }
  else if (w.type === "throw" || w.type === "launcher") { if (am) am.textContent = w.count; if (ar) ar.textContent = ""; }
  else { if (am) am.textContent = w.ammo; if (ar) ar.textContent = w.reserve; }
}
function showWeapon(i) {
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
let actx = null, masterGain = null;
const settings = { sens: 1, vol: 0.8, chSize: 8, chGap: 4, chThick: 2, chColor: "#7dff8a", quality: 3, difficulty: 3 };
try { Object.assign(settings, JSON.parse(localStorage.getItem("tiantanglu_settings_v1") || "{}")); } catch (e) { }
(function sanitizeSettings() {   // 防 tampered localStorage:數值夾範圍 + chColor 必須 hex(擋 chColor → CSS 變數注入路徑)
  const num = (v, lo, hi, d) => { v = +v; return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  settings.sens = num(settings.sens, 0.4, 2.5, 1); settings.vol = num(settings.vol, 0, 1, 0.8);
  settings.chSize = num(settings.chSize, 3, 18, 8); settings.chGap = num(settings.chGap, 0, 14, 4); settings.chThick = num(settings.chThick, 1, 6, 2);
  if (!/^#[0-9a-fA-F]{6}$/.test(settings.chColor)) settings.chColor = "#7dff8a";
  settings.quality = Math.max(1, Math.min(5, Math.round(+settings.quality) || 3));
  settings.difficulty = Math.max(1, Math.min(5, Math.round(+settings.difficulty) || 3));
})();
function saveSettings() { try { localStorage.setItem("tiantanglu_settings_v1", JSON.stringify(settings)); } catch (e) { } }
function applyCrosshair() { const r = document.documentElement.style; r.setProperty("--ch-size", settings.chSize + "px"); r.setProperty("--ch-gap", settings.chGap + "px"); r.setProperty("--ch-thick", settings.chThick + "px"); r.setProperty("--ch-color", /^#[0-9a-fA-F]{6}$/.test(settings.chColor) ? settings.chColor : "#7dff8a"); }   // 消費點也守 hex(belt-and-suspenders,擋 chColor → CSS url() 外洩)
applyCrosshair();
function ensureAudio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); masterGain = actx.createGain(); masterGain.gain.value = settings.vol; masterGain.connect(actx.destination); } catch (e) { } } if (actx && actx.state === "suspended") actx.resume(); startAmbient(); }
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
function panner(pos) { const p = actx.createPanner(); p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 6; p.maxDistance = 90; p.rolloffFactor = 1.1; if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; } else p.setPosition(pos.x, pos.y, pos.z); p.connect(audioOut()); return p; }
function updateListener() { if (!actx) return; const l = actx.listener, p = camera.position; camera.getWorldDirection(tmpD); if (l.positionX) { l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z; l.forwardX.value = tmpD.x; l.forwardY.value = tmpD.y; l.forwardZ.value = tmpD.z; l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0; } else { l.setPosition(p.x, p.y, p.z); l.setOrientation(tmpD.x, tmpD.y, tmpD.z, 0, 1, 0); } }
function noiseBuf(dur) { const n = Math.max(1, Math.floor(actx.sampleRate * dur)); const b = actx.createBuffer(1, n, actx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; }
function adsr(g, t0, a, peak, d) { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d); }
function noiseHit(dur, f0, f1, peak, type, out) { const t0 = actx.currentTime; const s = actx.createBufferSource(); s.buffer = noiseBuf(dur); const lp = actx.createBiquadFilter(); lp.type = type || "lowpass"; lp.frequency.setValueAtTime(f0, t0); lp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur); const g = actx.createGain(); adsr(g, t0, 0.002, peak, dur); s.connect(lp).connect(g).connect(audioOut(out)); s.start(t0); s.stop(t0 + dur + 0.02); }
function tone(f0, f1, dur, peak, wave, out) { const t0 = actx.currentTime; const o = actx.createOscillator(); o.type = wave || "sine"; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); const g = actx.createGain(); adsr(g, t0, 0.003, peak, dur); o.connect(g).connect(audioOut(out)); o.start(t0); o.stop(t0 + dur + 0.02); }
function sfxShot(type) { if (!actx) return; noiseHit(0.16, type === "auto" ? 2800 : 1900, 400, type === "auto" ? 0.5 : 0.6); tone(150, 55, 0.12, 0.4); }
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
function sfxRocketFire() { if (!actx) return; noiseHit(0.45, 900, 120, 0.7); tone(220, 60, 0.4, 0.5); }
function sfxPunch() { if (!actx) return; noiseHit(0.1, 700, 250, 0.22); }
function sfxKnife() { if (!actx) return; noiseHit(0.14, 2600, 900, 0.2, "bandpass"); }
function sfxEnemyShot(pos) { if (!actx) return; noiseHit(0.14, 1600, 350, pos ? 0.34 : 0.28, "lowpass", pos ? panner(pos) : null); }
function sfxEnemyStep(pos) { if (!actx) return; noiseHit(0.06, 520, 200, 0.11, "lowpass", panner(pos)); }   // 敵人腳步(空間音,逼近不再靜音)
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
let touchActive = false, tjx = 0, tjz = 0, tCrouch = false, tWalk = false;   // tCrouch/tWalk:手機蹲下/慢走切換鍵狀態
function isActive() { return document.pointerLockElement === canvas || touchActive; }   // pointer lock(桌機)或 touchActive(手機)
// 任一全螢幕 overlay(設定/軍械/日記/教學)開啟時為 true。手機輕觸常帶微小位移,touchmove 的 preventDefault 會吞掉 overlay 按鈕的 click,
// 故 overlay 開時整組 touch-look/搖桿/遊戲鈕一律讓位,讓 overlay 自己的按鈕吃到原生 click(修「軍械庫關不掉」)。
function overlayOpen() { for (const id of ["settings", "shop", "diary", "tutorial"]) { const e = document.getElementById(id); if (e && e.classList.contains("on")) return true; } return false; }
const DIGIT = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7, Digit9: 8 };
addEventListener("keydown", (e) => { keys[e.code] = 1; if (e.code === "Space" || e.code === "Tab") e.preventDefault(); if (e.code in DIGIT) showWeapon(DIGIT[e.code]); else if (e.code === "KeyQ") showWeapon((wi + 1) % WEAPONS.length); else if (e.code === "KeyR") reload(); else if (e.code === "KeyE") tryInteract(); else if (e.code === "KeyH") { if (MODE === "sim" && awaitDisarm) startGaze(); } else if (e.code === "KeyB") { if (shopEl && shopEl.classList.contains("on")) closeShop(); else openShop(); } else if (e.code === "KeyG") callArtillery(); });
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
document.addEventListener("pointerlockchange", () => { if (enterEl) enterEl.classList.toggle("hide", document.pointerLockElement === canvas); if (document.pointerLockElement !== canvas) { mouseDown = false; ads = false; } else if (MODE === "hub" && !firstHubShown) { firstHubShown = true; showNarr(NARR.hubEnter, 4.2); } });   // #1 首次進軍營:夢框建立句(placeholder 自動不顯示)
addEventListener("mousemove", (e) => { if (document.pointerLockElement === canvas) { const sens = 0.0023 * settings.sens * (camera.fov / 80); yaw -= e.movementX * sens; pitch -= e.movementY * sens; pitch = Math.max(-1.2, Math.min(1.2, pitch)); } });
/* ── 手機觸控:進場 + 左搖桿移動 + 右側拖曳視角 + 按鈕 ── */
const tbDisarmEl = document.getElementById("tb-disarm"), tbArtyEl = document.getElementById("tb-arty");
if (isTouch) {
  const touchUI = document.getElementById("touch"), tjEl = document.getElementById("tj"), tjKnob = document.getElementById("tj-knob");
  // 進場:第一次點畫面 → touchActive(取代 pointer lock)
  canvas.addEventListener("touchstart", (e) => {
    if (!touchActive && MODE !== "gaze") { touchActive = true; document.body.classList.add("touch"); if (enterEl) enterEl.classList.add("hide"); if (touchUI) touchUI.classList.add("on"); ensureAudio(); if (maskOwned && maskEl) maskEl.classList.add("on"); if (MODE === "hub" && !firstHubShown) { firstHubShown = true; showNarr(NARR.hubEnter, 4.2); } e.preventDefault(); }
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
  addEventListener("touchstart", (e) => { if (!touchActive || lookId !== null || overlayOpen()) return; for (const t of e.changedTouches) { const el = document.elementFromPoint(t.clientX, t.clientY); if (el && (el.classList.contains("tbtn") || el.id === "tj" || el.id === "tj-knob" || el.id === "gear")) continue; lookId = t.identifier; lpx = t.clientX; lpy = t.clientY; break; } }, { passive: true });
  addEventListener("touchmove", (e) => { if (lookId === null || overlayOpen()) return; for (const t of e.changedTouches) if (t.identifier === lookId) { const s = 0.0052 * settings.sens; yaw -= (t.clientX - lpx) * s; pitch -= (t.clientY - lpy) * s; pitch = Math.max(-1.2, Math.min(1.2, pitch)); lpx = t.clientX; lpy = t.clientY; e.preventDefault(); } }, { passive: false });
  const lookEnd = (e) => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; };
  addEventListener("touchend", lookEnd); addEventListener("touchcancel", lookEnd);
  // 按鈕
  const tbtn = (id, down, up) => { const el = document.getElementById(id); if (!el) return; el.addEventListener("touchstart", (e) => { e.preventDefault(); e.stopPropagation(); if (overlayOpen()) return; if (down) down(); }, { passive: false }); if (up) { el.addEventListener("touchend", (e) => { e.preventDefault(); up(); }); el.addEventListener("touchcancel", up); } };
  tbtn("tb-fire", () => { mouseDown = true; if (WEAPONS[wi].type !== "auto") fire(); }, () => { mouseDown = false; });
  tbtn("tb-jump", () => { keys.Space = 1; setTimeout(() => { keys.Space = 0; }, 60); });
  tbtn("tb-aim", () => { ads = !ads; });
  tbtn("tb-reload", () => reload());
  tbtn("tb-wpn", () => { let n = wi; for (let i = 0; i < WEAPONS.length; i++) { n = (n + 1) % WEAPONS.length; if (WEAPONS[n].owned) { showWeapon(n); break; } } });
  tbtn("tb-act", () => { tryInteract(); });
  tbtn("tb-shop", () => { if (shopEl && shopEl.classList.contains("on")) closeShop(); else openShop(); });
  tbtn("tb-disarm", () => { if (MODE === "sim" && awaitDisarm) startGaze(); });
  tbtn("tb-arty", () => { callArtillery(); });
  tbtn("tb-crouch", () => { tCrouch = !tCrouch; const e = document.getElementById("tb-crouch"); if (e) e.classList.toggle("act", tCrouch); });   // 蹲下切換(再按起身)
  tbtn("tb-walk", () => { tWalk = !tWalk; const e = document.getElementById("tb-walk"); if (e) e.classList.toggle("act", tWalk); });   // 慢走/靜步切換
}

/* ── 設定選單 + 可調準星 + 結算重啟 ── */
const settingsEl = document.getElementById("settings"), gearEl = document.getElementById("gear");
function openSettings() { if (settingsEl) settingsEl.classList.add("on"); if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }
function closeSettings() { if (settingsEl) settingsEl.classList.remove("on"); }
if (gearEl) gearEl.addEventListener("click", openSettings);
const setCloseEl = document.getElementById("set-close"); if (setCloseEl) setCloseEl.addEventListener("click", closeSettings);
addEventListener("keydown", (e) => { if (e.code === "Escape") { if (settingsEl && settingsEl.classList.contains("on")) closeSettings(); else openSettings(); } });
function bindSetting(id, key, isColor, fn) { const el = document.getElementById(id); if (!el) return; el.value = settings[key]; el.addEventListener("input", () => { settings[key] = isColor ? el.value : parseFloat(el.value); saveSettings(); if (fn) fn(); }); }
bindSetting("set-sens", "sens", false);
bindSetting("set-vol", "vol", false, () => { if (masterGain) masterGain.gain.value = settings.vol; });
bindSetting("set-chsize", "chSize", false, applyCrosshair);
bindSetting("set-chgap", "chGap", false, applyCrosshair);
bindSetting("set-chthick", "chThick", false, applyCrosshair);
bindSetting("set-chcolor", "chColor", true, applyCrosshair);
(function bindQuality() {   // 畫質 5 級:即時套用 + 中文檔位名
  const QNAMES = { 1: "低", 2: "中低", 3: "中", 4: "中高", 5: "高" };
  const el = document.getElementById("set-quality"), val = document.getElementById("set-quality-val");
  if (!el) return; const upd = () => { if (val) val.textContent = QNAMES[settings.quality] || "中"; };
  el.value = settings.quality; upd();
  el.addEventListener("input", () => { settings.quality = Math.max(1, Math.min(5, Math.round(parseFloat(el.value)) || 3)); saveSettings(); applyQuality(settings.quality); upd(); });
})();
(function bindDifficulty() {   // 難度 5 段:存設定,下次進實戰生效(避免戰鬥中改 HP)
  const DNAMES = { 1: "劇情", 2: "新手", 3: "正常", 4: "困難", 5: "天堂路" };
  const el = document.getElementById("set-diff"), val = document.getElementById("set-diff-val");
  if (!el) return; const upd = () => { if (val) val.textContent = DNAMES[settings.difficulty] || "正常"; };
  el.value = settings.difficulty; upd();
  el.addEventListener("input", () => { settings.difficulty = Math.max(1, Math.min(5, Math.round(parseFloat(el.value)) || 3)); saveSettings(); upd(); });
})();
const restartBtnEl = document.getElementById("restart-btn"); if (restartBtnEl) restartBtnEl.addEventListener("click", () => { restartGame(); if (canvas.requestPointerLock) canvas.requestPointerLock(); });
(function bindTutorial() {   // 新手教學:cold-open 後進場畫面的友善教學(stopPropagation 不觸發進場)
  const btn = document.getElementById("tut-btn"), ov = document.getElementById("tutorial"), close = document.getElementById("tut-close");
  if (btn && ov) btn.addEventListener("click", (e) => { e.stopPropagation(); ov.classList.add("on"); });
  if (close && ov) close.addEventListener("click", (e) => { e.stopPropagation(); ov.classList.remove("on"); });
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
];
function updateMoneyHUD() { if (moneyEl) moneyEl.textContent = money; const sm = document.getElementById("shop-money"); if (sm) sm.textContent = money; }
function updateArmorHUD() { if (arEl) arEl.textContent = Math.round(armor); }
function itemOwned(it) { if (it.wpn) { const w = WEAPONS.find((x) => x.name === it.wpn); return !!(w && w.owned); } return it.has ? it.has() : false; }
function buyItem(it) {
  if (money < it.price || (it.id !== "ammo" && itemOwned(it))) return;
  money -= it.price;
  if (it.wpn) { const w = WEAPONS.find((x) => x.name === it.wpn); if (w) { w.owned = true; if (w.baseReserve != null) w.reserve = Math.round(w.baseReserve * (curDiff ? curDiff.ammo : 1)); if (w.baseCount != null) w.count = Math.round(w.baseCount * (curDiff ? curDiff.ammo : 1)); } }
  else if (it.buy) it.buy();
  if (actx) tone(620, 880, 0.09, 0.12, "sine"); updateMoneyHUD(); renderShop();
}
function renderShop() {
  const list = document.getElementById("shop-list"); if (!list) return; updateMoneyHUD();
  while (list.firstChild) list.removeChild(list.firstChild);
  for (const it of SHOP_ITEMS) {
    const owned = it.id !== "ammo" && itemOwned(it);
    const row = document.createElement("div"); row.className = "item" + (owned ? " owned" : "");
    const info = document.createElement("div"); info.className = "nm"; info.textContent = it.nm;
    const ds = document.createElement("div"); ds.className = "ds"; ds.textContent = it.ds; info.appendChild(ds); row.appendChild(info);
    const pr = document.createElement("div"); pr.className = "pr"; pr.textContent = "$" + it.price; row.appendChild(pr);
    const btn = document.createElement("button"); btn.type = "button"; btn.textContent = owned ? "已擁有" : "購買"; btn.disabled = owned || money < it.price;
    btn.addEventListener("click", () => buyItem(it)); row.appendChild(btn);
    list.appendChild(row);
  }
}
function shopOpenable() { return !dead && !gameOver && (MODE === "hub" || (MODE === "sim" && inBreak)); }
function openShop() { if (!shopEl || !shopOpenable()) return; shopEl.classList.add("on"); renderShop(); if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }
function closeShop() { if (shopEl) shopEl.classList.remove("on"); }
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
for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: decalTex, transparent: true, depthWrite: false, opacity: 0.85, fog: false })); s.scale.setScalar(0.16); s.visible = false; scene.add(s); decals.push(s); }
function putDecal(p) { const s = decals[decalI = (decalI + 1) % decals.length]; s.position.copy(p); s.visible = true; }
// 池化高頻特效(火花/灰塵/火箭尾煙)— 每槽自帶 material,只重用不 new
function makeFxPool(n, makeMat) { const a = []; for (let i = 0; i < n; i++) { const s = new THREE.Sprite(makeMat()); s.visible = false; scene.add(s); a.push({ s, on: false, t: 0, life: 0, base: 0, grow: 0, add: false }); } a._i = 0; return a; }
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
// 分材質彈著:金屬跳彈火花 / 木屑 / 泥土揚塵 / 混凝土灰 / 沙包悶噗
function impact(point, surf) {
  const p = point.clone().addScaledVector(tmpD, -0.03);
  surf = surf || "dirt";
  if (surf === "metal") { for (let i = 0; i < 3; i++) { _imp.copy(p); _imp.x += (Math.random() - 0.5) * 0.16; _imp.y += (Math.random() - 0.5) * 0.16; spark(_imp); } putDecal(p); sfxRicochet(); }   // 鐵桶:火花四濺 + 跳彈,無揚塵
  else if (surf === "wood") { dust(p); spark(p); _imp.copy(p); _imp.y += 0.1; spark(_imp); putDecal(p); sfxWoodHit(); }   // 木箱:木屑 + 悶響
  else if (surf === "sand") { dust(p); dust(p); sfxDirtHit(); }   // 沙包:多揚塵悶噗,無火花無彈孔
  else if (surf === "concrete") { dust(p); spark(p); putDecal(p); sfxImpact(); }   // 混凝土:灰粉 + 小火花 + 彈孔
  else { dust(p); dust(p); putDecal(p); sfxDirtHit(); }   // 泥土:大揚塵,無火花
}

/* ── 命中判定 ── */
const ray = new THREE.Raycaster(); const tmpO = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpO2 = new THREE.Vector3();
let mvMoving = false, mvCrouch = false, grounded = true, sprayCount = 0;
function spreadOf(w) { let s = w.type === "auto" ? 0.006 : 0.003; if (w.recoilMul) s *= w.recoilMul * 0.7; if (!grounded) s += 0.06; else if (mvMoving) s += 0.022; else if (mvCrouch) s *= 0.4; s += sprayCount * 0.004; return s; }
function findHit(o) { let p = o; while (p) { if (p.userData && p.userData.kind) return p; p = p.parent; } return null; }
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
    if (!c.on) continue; c.t += dt; c.v.y -= 17 * dt;
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
    if (!c.on) continue; c.t += dt; c.v.y -= 17 * dt;
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
  if (!isActive() || dead || vehicle) return;   // 駕駛中左鍵=戰車開炮(updateVehicle 處理),不開手持武器
  if (drawT > 0 || reloadT > 0) return;   // 拔槍/換彈動畫期間不能開火
  const w = WEAPONS[wi];
  if (w.type === "melee") { if (w.swingT <= 0) { w.swingT = w.swingDur || 0.3; (w.name === "鐵鎚" ? sfxThud : w.name === "小刀" ? sfxKnife : sfxSwoosh)(); meleeHit(w); } return; }
  if (w.type === "throw") { if (w.swingT <= 0) { w.swingT = 0.45; throwGrenade(w); } return; }
  if (w.type === "launcher") { if (realT - lastShot < w.rate) return; lastShot = realT; fireRocket(w); return; }
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
  if (!h.length) return;
  const o = findHit(h[0].object);
  if (o && o.userData.kind === "barrel") { if (o.userData.boom) { const p = o.position.clone(); killBarrel(o); explode(p, 0, false); } else impact(h[0].point, "metal"); }
  else if (o && o.userData.kind === "enemy") { const hs = !!(h[0].object.userData && h[0].object.userData.head); hitEnemy(o, (WDMG[w.name] || 30) * (hs ? 2.6 : 1), hs, h[0].point); }
  else if (o && o.userData.kind === "target") targetHit(o);
  else impact(h[0].point, surfaceOf(h[0].object, h[0].point));
}
function meleeHit(w) {
  camera.getWorldPosition(tmpO); camera.getWorldDirection(tmpD); ray.set(tmpO, tmpD); ray.far = w.reach;
  const h = ray.intersectObject(ROOT, true); if (!h.length || h[0].distance > w.reach) return;
  const o = findHit(h[0].object);
  if (o && o.userData.kind === "barrel") { if (o.userData.boom) { const p = o.position.clone(); killBarrel(o); explode(p, 0, false); } else impact(h[0].point, "metal"); }
  else if (o && o.userData.kind === "enemy") hitEnemy(o, WDMG[w.name] || 30, false, h[0].point);
  else if (o && o.userData.kind === "target") targetHit(o);
  else impact(h[0].point, surfaceOf(h[0].object, h[0].point));
}

/* ── 爆炸 ── */
function explode(pos, depth, big) {
  sfxExplode(pos); shake = Math.max(shake, big ? 1.0 : 0.7);
  const fl = new THREE.PointLight(0xffb060, big ? 70 : 45, big ? 46 : 34, 2); fl.position.copy(pos); fl.position.y = Math.max(1.2, pos.y); scene.add(fl);
  const fb = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); fb.position.copy(pos); fb.position.y += 0.8; fb.scale.setScalar(big ? 2.6 : 1.5); scene.add(fb);
  const sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, color: 0x29251f, transparent: true, opacity: 0, depthWrite: false, fog: false })); sm.position.copy(pos); sm.position.y += 1; sm.scale.setScalar(big ? 3 : 2); scene.add(sm);
  const N = big ? 26 : 16, deb = []; for (let i = 0; i < N; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), debrisMat); d.position.copy(pos); d.position.y += 0.8; d.userData.v = new THREE.Vector3((Math.random() - 0.5) * (big ? 13 : 9), 4 + Math.random() * (big ? 10 : 7), (Math.random() - 0.5) * (big ? 13 : 9)); scene.add(d); deb.push(d); }
  effects.push({ t: 0, life: big ? 3.0 : 2.6, fb, sm, fl, deb, big: !!big });
  for (let i = 0; i < (big ? 14 : 8); i++) emitFx(sparkPool, pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2.5, Math.random() * 1.6, (Math.random() - 0.5) * 2.5)), 0.3 + Math.random() * 0.3, 0.3, 1.2, true);
  const R = big ? 7 : 5;
  for (const g of targets) if (!g.userData.down && g.position.distanceTo(pos) < R) targetHit(g);
  for (const g of enemies) if (!g.userData.dead && g.position.distanceTo(pos) < R && !losBlocked(pos.x, pos.z, g.position.x, g.position.z)) hitEnemy(g, 200);   // B2:隔牆不吃爆炸傷害
  if (!dead && !gameOver) { const pd = camera.position.distanceTo(pos); if (pd < R && !losBlocked(pos.x, pos.z, camera.position.x, camera.position.z)) hurtPlayer(Math.round((big ? 60 : 38) * (1 - pd / R))); }   // B2:躲掩體後不被隔牆雷炸死
  if (depth < 3) for (const m of explosives.slice()) { if (m.userData.boom && !m.userData.dead && m.position.distanceTo(pos) < (big ? 6.5 : 4.8)) { const pp = m.position.clone(); killBarrel(m); setTimeout(() => explode(pp, depth + 1, false), 90); } }
}
/* ── 天降砲擊(計算手呼叫火力:瞄地面標座標 → 呼嘯延遲 → 6 發叢集砲彈天降;28s 冷卻) ── */
const artyMarker = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.4, 28), new THREE.MeshBasicMaterial({ color: 0xff5232, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, fog: false }));
artyMarker.rotation.x = -Math.PI / 2; artyMarker.visible = false; scene.add(artyMarker);
let artyCD = 0; const ARTY_CD = 28;
function callArtillery() {
  if (MODE !== "sim" || dead || gameOver || awaitDisarm) return;
  if (artyCD > 0) { if (actx) tone(280, 200, 0.07, 0.06, "square"); showNarr("砲擊冷卻 " + Math.ceil(artyCD) + " 秒", 1.2); return; }
  const o = camera.getWorldPosition(new THREE.Vector3()), d = camera.getWorldDirection(new THREE.Vector3());
  if (d.y > -0.05) { showNarr("準星先對準地面，再呼叫砲擊", 1.4); return; }
  const t = -o.y / d.y, tx = o.x + d.x * t, tz = o.z + d.z * t;
  if (Math.hypot(tx, tz + 20) > 76) { showNarr("座標超出射界", 1.4); return; }
  if (Math.hypot(tx - o.x, tz - o.z) < 15) { showNarr("座標太近 · 危險距離，瞄遠一點", 1.6); return; }   // 防誤炸自己(danger close)
  artyCD = ARTY_CD;
  artyMarker.position.set(tx, 0.06, tz); artyMarker.visible = true;
  showNarr("砲擊已呼叫 · 座標鎖定", 2.4);
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
const vOlive = mat(0x4a5034, { roughness: 0.82, metalness: 0.12, envMapIntensity: 0.7 }), vDark = mat(0x32371f, { roughness: 0.86 }), vTire = mat(0x16161a, { roughness: 0.92 });
const vGlass = new THREE.MeshPhysicalMaterial({ color: 0x141c2a, roughness: 0.1, metalness: 0, envMapIntensity: 1.5, clearcoat: 0.5 });
function makeVehicle(type, x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; ROOT.add(g);
  let turret = null;
  if (type === "humvee") {
    add(new THREE.BoxGeometry(2.5, 0.82, 4.4), vOlive, 0, 1.0, 0, g);
    add(new THREE.BoxGeometry(2.4, 0.84, 2.1), vOlive, 0, 1.76, 0.4, g);                                   // 駕駛艙
    add(new THREE.BoxGeometry(2.12, 0.62, 0.1), vGlass, 0, 1.84, -0.66, g);                                 // 擋風
    add(new THREE.BoxGeometry(2.42, 0.5, 1.3), vOlive, 0, 1.16, -1.86, g);                                  // 引擎蓋
    add(new THREE.BoxGeometry(2.45, 0.1, 2.0), vDark, 0, 2.22, 0.45, g);                                    // 車頂
    for (const sx of [-1, 1]) for (const sz of [-1.45, 1.45]) { const wh = add(new THREE.CylinderGeometry(0.56, 0.56, 0.42, 14), vTire, sx * 1.2, 0.56, sz, g); wh.rotation.z = Math.PI / 2; }
  } else if (type === "tank") {
    add(new THREE.BoxGeometry(2.9, 0.82, 5.2), vOlive, 0, 0.98, 0, g);                                      // 車體
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.76, 0.78, 5.4), vDark, sx * 1.46, 0.6, 0, g); for (let i = -2; i <= 2; i++) { const rl = add(new THREE.CylinderGeometry(0.3, 0.3, 0.82, 12), vTire, sx * 1.46, 0.6, i * 1.05, g); rl.rotation.z = Math.PI / 2; } }
    turret = new THREE.Group(); turret.position.set(0, 1.56, -0.1); g.add(turret);
    add(new THREE.BoxGeometry(2.0, 0.72, 2.4), vOlive, 0, 0, 0, turret);
    add(new THREE.CylinderGeometry(0.18, 0.2, 0.42, 12), vOlive, 0, 0.42, 0.1, turret);                     // 砲塔頂
    const bar = add(new THREE.CylinderGeometry(0.14, 0.17, 3.3, 14), gunMetal, 0, 0.04, -2.4, turret); bar.rotation.x = Math.PI / 2;   // 砲管
  } else {   // howitzer 榴彈砲(站位手動瞄發)
    add(new THREE.BoxGeometry(1.5, 0.38, 1.0), vOlive, 0, 0.72, 0.5, g);                                    // 砲架體
    for (const sx of [-1, 1]) { const wh = add(new THREE.CylinderGeometry(0.68, 0.68, 0.28, 16), vTire, sx * 1.0, 0.68, 0.5, g); wh.rotation.z = Math.PI / 2; }  // 大輪
    add(new THREE.BoxGeometry(1.9, 1.0, 0.12), vDark, 0, 1.18, -0.2, g);                                    // 防盾
    add(new THREE.BoxGeometry(0.22, 0.22, 2.2), vOlive, 0, 0.5, 1.7, g);                                    // 駐鋤(後拖)
    turret = new THREE.Group(); turret.position.set(0, 1.2, 0); g.add(turret);                              // 俯仰組
    const bar = add(new THREE.CylinderGeometry(0.12, 0.16, 3.8, 14), gunMetal, 0, 0, -1.9, turret); bar.rotation.x = Math.PI / 2;   // 長砲管
    add(new THREE.BoxGeometry(0.42, 0.42, 0.6), gunMetal, 0, 0, 0.25, turret);                              // 砲閂
    turret.rotation.x = 0.3;
  }
  const v = { type, group: g, turret, heading: ry, speed: 0, fireT: 0 }; VEHICLES.push(v); return v;
}
makeVehicle("humvee", 22, 32, 0.5);
makeVehicle("tank", 31, 25, 0.2);
makeVehicle("howitzer", 30, 13, 0);
let vehicle = null;
function nearVehicle() { for (const v of VEHICLES) { const dx = camera.position.x - v.group.position.x, dz = camera.position.z - v.group.position.z; if (dx * dx + dz * dz < 18) return v; } return null; }
function enterVehicle(v) { vehicle = v; v.speed = 0; if (WEAPONS[wi]) WEAPONS[wi].group.visible = false; const fire = isTouch ? "射擊鈕" : "左鍵"; showNarr(v.type === "tank" ? "戰車 · WASD／搖桿駕駛 · " + fire + "開炮 · 按 E 下車" : v.type === "howitzer" ? "榴彈砲 · 看高一點增加射程 · " + fire + "發射 · 按 E 離開砲位" : "悍馬車 · WASD／搖桿駕駛 · 按 E 下車", 3.4); }
function exitVehicle() { if (!vehicle) return; const v = vehicle; camera.position.set(v.group.position.x + Math.cos(v.heading) * 3, EYE, v.group.position.z + Math.sin(v.heading) * 3); yaw = v.heading + Math.PI / 2; pitch = 0; vehicle = null; if (WEAPONS[wi]) WEAPONS[wi].group.visible = true; }
function fireTankShell(v, fx, fz) {
  const tip = new THREE.Vector3(v.group.position.x + fx * 3.6, 1.6, v.group.position.z + fz * 3.6);
  shake = Math.max(shake, 0.85); sfxExplode(tip); emitFx(sparkPool, tip, 0.35, 0.35, 1.1, true);
  const d = new THREE.Vector3(fx, -0.015, fz).normalize(); ray.set(tip, d); ray.far = 90; const h = ray.intersectObject(ROOT, true);
  const pt = (h.length && h[0].point) ? h[0].point.clone() : tip.clone().addScaledVector(d, 70);
  setTimeout(() => { explode(new THREE.Vector3(pt.x, 0.3, pt.z), 0, true); }, 110);
}
const shells = [];
function spawnShell(pos, vel) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), gunMetal); m.position.copy(pos); m.castShadow = true; scene.add(m); shells.push({ m, vel: vel.clone(), prev: pos.clone(), life: 9 }); }
function updateShells(dt) {
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i]; s.vel.y -= 17 * dt; s.prev.copy(s.m.position);
    const np = s.m.position.clone().addScaledVector(s.vel, dt);
    let hit = null;
    if (np.y <= 0.25) hit = new THREE.Vector3(np.x, 0.3, np.z);
    else { ray.set(s.prev, s.vel.clone().normalize()); ray.far = s.prev.distanceTo(np) + 0.3; const h = ray.intersectObject(ROOT, true); if (h.length) hit = h[0].point.clone(); }
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
function updateVehicle(dt) {
  const v = vehicle;
  if (v.type === "howitzer") {   // 站位榴彈砲:自由瞄準 + 砲管俯仰 + 彈道發射
    camera.rotation.set(pitch, yaw, 0);
    const hfx = -Math.sin(v.heading), hfz = -Math.cos(v.heading);
    camera.position.set(v.group.position.x - hfx * 0.7, 1.78, v.group.position.z - hfz * 0.7);
    let trav = yaw - v.heading; while (trav > Math.PI) trav -= 2 * Math.PI; while (trav < -Math.PI) trav += 2 * Math.PI;
    v.turret.rotation.y = Math.max(-1.0, Math.min(1.0, trav)); v.turret.rotation.x = Math.max(0.05, Math.min(1.1, pitch));   // 方位±57°/仰角
    if (v.fireT > 0) v.fireT -= dt;
    if (mouseDown && v.fireT <= 0) { v.fireT = 2.2; fireHowitzer(v); }
    if (hintEl) { hintEl.style.opacity = "1"; hintEl.textContent = isTouch ? "榴彈砲 · 鏡頭抬高增加射程 · 射擊鈕發射 · 按 E 離開砲位" : "榴彈砲 · 看高一點增加射程 · 左鍵發射 · 按 E 離開砲位"; }
    return;
  }
  let thr = 0, steer = 0;
  if (keys.KeyW) thr += 1; if (keys.KeyS) thr -= 1; if (keys.KeyA) steer -= 1; if (keys.KeyD) steer += 1;
  thr += tjz; steer += tjx;
  const maxSpd = v.type === "tank" ? 8 : 14, accel = v.type === "tank" ? 7 : 12, turnRate = v.type === "tank" ? 1.2 : 1.9;
  v.speed += thr * accel * dt; v.speed *= Math.max(0, 1 - dt * 1.5); v.speed = Math.max(-maxSpd * 0.45, Math.min(maxSpd, v.speed));
  if (Math.abs(v.speed) > 0.25) v.heading -= steer * turnRate * dt * Math.sign(v.speed) * Math.min(1, Math.abs(v.speed) / 2.5);
  v.group.rotation.y = v.heading;
  const fx = -Math.sin(v.heading), fz = -Math.cos(v.heading);
  v.group.position.x += fx * v.speed * dt; v.group.position.z += fz * v.speed * dt;
  resolveCollisionFor(v.group.position, 1.9); clampBound(v.group.position);
  const cd = v.type === "tank" ? 9.5 : 8.5;
  camera.position.set(v.group.position.x - fx * cd, 4.7, v.group.position.z - fz * cd);
  camera.lookAt(v.group.position.x + fx * 3, 1.5, v.group.position.z + fz * 3);
  if (v.fireT > 0) v.fireT -= dt;
  if (v.type === "tank" && mouseDown && v.fireT <= 0) { v.fireT = 1.5; fireTankShell(v, fx, fz); }
  if (hintEl) { hintEl.style.opacity = "1"; hintEl.textContent = v.type === "tank" ? "戰車 · 左鍵開炮 · 按 E 下車" : "悍馬車 · 按 E 下車"; }
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
    if (e.deb) for (const d of e.deb) { d.userData.v.y -= 18 * dt; d.position.addScaledVector(d.userData.v, dt); if (d.position.y < 0.12) { d.position.y = 0.12; d.userData.v.multiplyScalar(0); } d.rotation.x += dt * 5; d.rotation.y += dt * 4; }
    if (e.t >= e.life) { if (e.fb) { scene.remove(e.fb); e.fb.material.dispose(); } if (e.sm) { scene.remove(e.sm); e.sm.material.dispose(); } if (e.fl) scene.remove(e.fl); if (e.deb) for (const d of e.deb) { scene.remove(d); d.geometry.dispose(); } effects.splice(i, 1); }
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
for (let i = 0; i < 56; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: memDotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 })); s.visible = false; scene.add(s); memShards.push({ s, on: false, t: 0, life: 0, vx: 0, vy: 0, vz: 0 }); }
let msI = 0;
function memoryShatter(pos) {   // 擊倒→記憶光點上升消散(碎成她的話語光,不留屍/血)
  const n = 11 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const sh = memShards[msI = (msI + 1) % memShards.length];
    sh.s.position.set(pos.x + (Math.random() - 0.5) * 0.9, 0.85 + Math.random() * 1.1, pos.z + (Math.random() - 0.5) * 0.9);
    sh.s.scale.setScalar(0.16 + Math.random() * 0.14); sh.s.material.opacity = 0.95; sh.s.visible = true;
    sh.on = true; sh.t = 0; sh.life = 0.9 + Math.random() * 0.7; sh.vx = (Math.random() - 0.5) * 0.7; sh.vy = 0.9 + Math.random() * 0.9; sh.vz = (Math.random() - 0.5) * 0.7;
  }
}
function updateMemShards(dt) { for (const sh of memShards) { if (!sh.on) continue; sh.t += dt; const k = sh.t / sh.life; if (k >= 1) { sh.on = false; sh.s.visible = false; continue; } sh.s.position.x += sh.vx * dt; sh.s.position.y += sh.vy * dt; sh.s.position.z += sh.vz * dt; sh.vy -= 0.45 * dt; sh.s.material.opacity = 0.95 * (1 - k * k); sh.s.scale.setScalar(0.16 + k * 0.22); } }
/* ── CS 級曳光彈(扎實射擊手感,只在遠程開火) ── */
const tracers = [];
for (let i = 0; i < 16; i++) { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const m = new THREE.LineBasicMaterial({ color: 0xffe09a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); const ln = new THREE.Line(geo, m); ln.visible = false; ln.frustumCulled = false; scene.add(ln); tracers.push({ ln, t: 0, on: false, op: 0.8 }); }
let trI = 0;
function tracer(fx, fy, fz, tx, ty, tz, color, opacity) { const tr = tracers[trI = (trI + 1) % tracers.length]; const p = tr.ln.geometry.attributes.position; p.setXYZ(0, fx, fy, fz); p.setXYZ(1, tx, ty, tz); p.needsUpdate = true; if (color != null) tr.ln.material.color.setHex(color); tr.op = opacity != null ? opacity : 0.8; tr.ln.material.opacity = tr.op; tr.ln.visible = true; tr.on = true; tr.t = 0; }
function updateTracers(dt) { for (const tr of tracers) { if (!tr.on) continue; tr.t += dt; if (tr.t > 0.055) { tr.on = false; tr.ln.visible = false; continue; } tr.ln.material.opacity = tr.op * (1 - tr.t / 0.055); } }
const eBody = new THREE.MeshStandardMaterial({ color: 0x55502f, roughness: 0.85, envMapIntensity: 0.7 });
const eGear = new THREE.MeshStandardMaterial({ color: 0x35351f, roughness: 0.82 });
const eSkin = new THREE.MeshStandardMaterial({ color: 0xb98c63, roughness: 0.72 });
const WDMG = { 鐵鎚: 75, 刺槍: 60, 小刀: 58, 小槍: 34, 步槍: 36, 機關槍: 32, 狙擊槍: 120 };
const eBoot = new THREE.MeshStandardMaterial({ color: 0x1c1a16, roughness: 0.7 });
// 夢中天堂路的對手:三兵種(標準步兵 / 重裝 / 突擊),體型 + 血量 + 移速 + 頭盔各異
const ENEMY_TYPES = [
  { key: "rifleman", weight: 5, scale: 1.0, hpMul: 1.0, speedMul: 1.0, cap: false, pack: false },
  { key: "heavy", weight: 2, scale: 1.18, hpMul: 1.9, speedMul: 0.78, cap: false, pack: true },
  { key: "scout", weight: 3, scale: 0.86, hpMul: 0.6, speedMul: 1.35, cap: true, pack: false },
];
function pickEnemyType() { let tot = 0; for (const t of ENEMY_TYPES) tot += t.weight; let r = Math.random() * tot; for (const t of ENEMY_TYPES) { r -= t.weight; if (r <= 0) return t; } return ENEMY_TYPES[0]; }
function jitterMat(base, dh, ds, dl) { const m = base.clone(); const hsl = {}; m.color.getHSL(hsl); m.color.setHSL((hsl.h + dh + 1) % 1, Math.max(0, Math.min(1, hsl.s + ds)), Math.max(0.04, Math.min(0.96, hsl.l + dl))); return m; }
function spawnEnemy(x, z, hp) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const type = pickEnemyType();
  const body = jitterMat(eBody, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.14);   // 每隻軍服色略不同
  const skin = jitterMat(eSkin, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.16);  // 每隻膚色略不同
  const ms = [];
  const eb = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); ms.push(b); return b; };
  eb(0.5, 0.74, 0.3, body, 0, 1.16, 0);                  // 軀幹
  eb(0.56, 0.5, 0.36, eGear, 0, 1.2, 0.01);              // 防彈背心
  eb(0.2, 0.16, 0.1, eGear, 0, 1.32, 0.19);              // 彈匣袋(前)
  eb(0.46, 0.36, 0.3, eGear, 0, 0.68, 0);                // 臀
  eb(0.12, 0.12, 0.12, skin, 0, 1.57, 0);                // 頸
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 12), skin); head.position.y = 1.68; head.userData.head = true; ms.push(head);
  if (type.cap) { eb(0.34, 0.12, 0.34, eGear, 0, 1.79, 0).userData.head = true; eb(0.42, 0.04, 0.16, eGear, 0, 1.75, 0.18); }   // 突擊兵:軟帽 + 帽簷
  else { const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10, 0, 6.3, 0, 1.6), eGear); helmet.position.y = 1.72; helmet.userData.head = true; ms.push(helmet); eb(0.4, 0.05, 0.4, eGear, 0, 1.64, 0); }   // 鋼盔 + 盔簷
  if (type.pack) eb(0.42, 0.5, 0.22, eGear, 0, 1.2, -0.24);   // 重裝:背包
  for (const sx of [-1, 1]) {
    eb(0.18, 0.62, 0.22, eGear, sx * 0.13, 0.4, 0);       // 腿
    eb(0.2, 0.12, 0.3, eBoot, sx * 0.13, 0.06, 0.04);     // 靴
    eb(0.14, 0.5, 0.16, body, sx * 0.27, 1.18, 0.02);     // 上臂
  }
  // 持槍(胸前) + 前臂
  eb(0.1, 0.1, 0.62, gunMetal, 0.1, 1.16, -0.28);        // 步槍
  eb(0.07, 0.16, 0.12, gunMag, 0.1, 1.04, -0.12);        // 彈匣
  eb(0.14, 0.34, 0.14, body, 0.18, 1.0, -0.18);          // 前臂
  ms.forEach((m) => { m.castShadow = true; g.add(m); });
  g.scale.setScalar(type.scale);
  g.userData.kind = "enemy"; g.userData.hp = Math.round((hp || 100) * type.hpMul); g.userData.speedMul = type.speedMul; g.userData.etype = type.key; g.userData.dead = false; g.userData.deadT = 0; g.userData.fireT = 1 + Math.random() * 2; g.userData.flinch = 0; g.userData.strafe = Math.random() < 0.5 ? 1 : -1; g.userData.strafeT = 1 + Math.random() * 2; g.userData.state = "chase"; g.userData.grenadeT = 6 + Math.random() * 8; g.userData.spawn = new THREE.Vector3(x, 0, z); g.userData.stepT = Math.random() * 0.4; g.userData.alertT = 0; g.userData.sawPlayer = false;
  ROOT.add(g); enemies.push(g);
}
/* ── 波次 horde + 計分 ── */
const SPAWN_PTS = [[-18, -34], [10, -38], [26, -30], [-30, -26], [38, -20], [-38, -10], [44, 2], [0, -42], [-44, -28], [34, -38]];
const COVER_PTS = [[4, 4], [5.4, 2.6], [-8, -12], [13, -14], [14.5, -13.2], [10, 6], [-14, -6], [22, 8]].map(([x, z]) => new THREE.Vector3(x, 0, z));
let wave = 0, score = 0, waveAlive = 0, spawnQueue = 0, spawnTimer = 0, betweenT = 2.5, inBreak = true, gameOver = false;
let MODE = "hub";   // hub(自由走軍營,不生敵) | sim(實戰模擬練習,波次戰鬥) — 把拔的夢:走到靶場才回到天堂路
const RANGE_ENTRY = new THREE.Vector3(32, 0, 6.5);   // 靶場射擊位(進入實戰模擬的觸發點)
const COW_POS = new THREE.Vector3(-14, 0, 18);       // 顧牛互動點
const JACKET_POS = new THREE.Vector3(12, 0, 16);     // 反穿外套互動點(#3 夢中違和)
const DIARY_POS = new THREE.Vector3(6, 0, 8);        // 大兵日記互動點(#4-④ 雋永連結)
const waveEl = document.getElementById("wave"), scoreEl = document.getElementById("scoreval");
function updateWaveHUD() { if (MODE !== "sim") { if (waveEl) waveEl.textContent = "軍營"; return; } if (waveEl) waveEl.textContent = inBreak ? (wave < 1 ? "準備" : "第 " + wave + " 波 · 清空") : "第 " + wave + " 波"; if (scoreEl) scoreEl.textContent = score; }
function startWave() { wave++; inBreak = false; const em = curDiff ? curDiff.enemyMul : 1; const n = Math.min(Math.round(16 * em), Math.round((3 + wave * 1.7) * em)); spawnQueue = n; waveAlive = n; spawnTimer = 0; updateWaveHUD(); }   // 困難/天堂路:每波敵人 ×2
function updateWaves(dt) {
  if (gameOver || MODE !== "sim" || awaitDisarm) return;
  if (inBreak) { betweenT -= dt; if (betweenT <= 0) startWave(); return; }
  if (spawnQueue > 0) { spawnTimer -= dt; if (spawnTimer <= 0) { const p = SPAWN_PTS[(Math.random() * SPAWN_PTS.length) | 0]; spawnEnemy(p[0], p[1], 90 + wave * 14); spawnQueue--; spawnTimer = 0.5 + Math.random() * 0.6; } }
  if (waveAlive <= 0 && spawnQueue <= 0) {
    if (wave >= GOAL_WAVE) { awaitDisarm = true; inBreak = true; for (const e of enemies) scene.remove(e); enemies.length = 0; if (waveEl) waveEl.textContent = "撐過了"; }   // B1:撐過 GOAL_WAVE → 停波+清殘敵,保護放下槍高潮不被殘敵打死
    else { inBreak = true; betweenT = 4; money += 150; updateMoneyHUD(); updateWaveHUD(); if (wave === 1 || wave % 5 === 0) showNarr(NARR.wave, 3.4); }   // 撐過一波 +150 軍餉(波間按 B 補裝);金句稀缺:只首波/每5波留白
  }
}
updateWaveHUD();
function bloodAt(p) { emitFx(bloodPool, p, 0.32, 0.14, 0.28, false); }   // 極簡血:中彈只輕微暗紅一抹,不渲染暴力(夢框揭心非軍武)
function hitEnemy(g, dmg, head, point) {
  const u = g.userData; if (u.dead) return;
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
    sfxThud(); memoryShatter(g.position); waveAlive--; updateWaveHUD();   // 夢敵人擊倒:碎成記憶光點(非血池/屍體)
  } else { if (head) sfxHead(); else sfxImpact(); }   // 去爽 W2:enemy 全程不給十字回饋(連爆頭金✕),殺只是消耗;靶場 target 保留十字
}
function enemyShoot(g, dist) {
  const dir = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y));
  const mp = g.position.clone().setY(1.25).addScaledVector(dir, 0.6);
  emitFx(sparkPool, mp, 0.1, 0.28, 0.3, true); sfxEnemyShot(mp);
  const hitChance = Math.max(0.08, 0.46 - dist * 0.009); const hit = Math.random() < hitChance;
  camera.getWorldPosition(tmpO2);   // 朝玩家飛來的曳光:命中=直指頭胸,未命中=擦身偏移(冷橘區隔敵我,讓「子彈朝你飛來」可見)
  const ox = hit ? 0 : (Math.random() - 0.5) * 1.3, oy = hit ? 0.05 : (Math.random() - 0.5) * 1.0, oz = hit ? 0 : (Math.random() - 0.5) * 1.3;
  tracer(mp.x, mp.y, mp.z, tmpO2.x + ox, tmpO2.y - 0.15 + oy, tmpO2.z + oz, 0xff7040, 0.7);
  if (hit) hurtPlayer(6 + Math.random() * 8);
}
function enemyGrenade(g) {
  camera.getWorldPosition(tmpO2); const from = g.position.clone().setY(1.2);
  const vel = tmpO2.clone().sub(from); vel.y = 0; const d = vel.length() || 1; vel.normalize().multiplyScalar(Math.min(22, d * 1.05)); vel.y = 4 + d * 0.06;
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), grenadeProjMat); m.position.copy(from); scene.add(m);
  projectiles.push({ m, vel, type: "grenade", t: 0, fuse: 1.6 }); sfxThrow();
}
const losRay = new THREE.Raycaster();
function enemySeesPlayer(g, dist) {
  const from = g.position.clone().setY(1.5); camera.getWorldPosition(tmpO2); const dir = tmpO2.clone().setY(1.5).sub(from); const dd = dir.length() || 1; dir.normalize();
  losRay.set(from, dir); losRay.far = dd; const hs = losRay.intersectObject(ROOT, true);
  for (const hit of hs) { const o = findHit(hit.object); if (o && o.userData.kind === "enemy") continue; if (hit.distance < dd - 1.4) return false; }
  return true;
}
function updateEnemies(dt) {
  if (awaitDisarm) return;   // B1:放下槍窗口不更新敵人(殘敵已清,雙保險)
  for (let i = enemies.length - 1; i >= 0; i--) {
    const g = enemies[i], u = g.userData;
    if (u.dead) { u.deadT += dt; g.rotation.x = Math.max(-1.55, g.rotation.x - dt * 4.5); g.rotation.z += ((u.deathLean || 0) - g.rotation.z) * Math.min(1, dt * 5); if (u.deadT > 5) { scene.remove(g); enemies.splice(i, 1); } continue; }
    const dx = camera.position.x - g.position.x, dz = camera.position.z - g.position.z, dist = Math.hypot(dx, dz) || 1;
    { const tgtY = Math.atan2(dx, dz); let dY = tgtY - g.rotation.y; while (dY > Math.PI) dY -= 6.2832; while (dY < -Math.PI) dY += 6.2832; g.rotation.y += dY * Math.min(1, dt * (u.alertT > 0 ? 3.5 : 14)); }   // 反應延遲:剛發現玩家慢慢轉(非瞬間鎖定)
    if (u.flinch > 0) { const f = u.flinch / (u.flinchMax || 0.18); g.rotation.x = -0.18 * f; g.rotation.z = (u.flinchSide || 0) * f; u.flinch -= dt; } else { g.rotation.x = 0; g.rotation.z = 0; }   // 方向化中彈:後仰 + 往中彈側扭
    if (u.stagger > 0) u.stagger -= dt;   // 腿傷踉蹌計時
    if (u.coverT > 0) u.coverT -= dt;
    const sees = dist < 72 ? enemySeesPlayer(g, dist) : false;
    if (sees) { if (!u.sawPlayer) { u.sawPlayer = true; u.alertT = 0.35 + Math.random() * 0.35; } } else u.sawPlayer = false;   // 首次發現玩家 → 反應延遲
    if (u.alertT > 0) u.alertT -= dt;
    const smart = !!(curDiff && curDiff.smart);   // 天堂路模式:團隊圍攻
    const fx = dx / dist, fz = dz / dist, rx = -fz, rz = fx; let mvx = 0, mvz = 0, sp = 2.0;
    if ((u.coverT > 0 || u.hp < 40) && sees && !smart) { // 找最近掩體(天堂路模式少躲,主動圍攻)
      let best = null, bd = 1e9; for (const c of COVER_PTS) { const d = c.distanceTo(g.position); if (d < bd) { bd = d; best = c; } }
      if (best && bd > 1.8) { const cdx = best.x - g.position.x, cdz = best.z - g.position.z, cl = Math.hypot(cdx, cdz) || 1; mvx = cdx / cl; mvz = cdz / cl; sp = 2.7; }
    } else if (!sees && dist > 6) { mvx = fx; mvz = fz; sp = 2.4; } // 看不到 → 推進找視線
    else if (dist > (smart ? 12 : 17)) { mvx = fx; mvz = fz; } else if (dist < 9) { mvx = -fx; mvz = -fz; }
    if (!smart && Math.random() < 0.4 * dt) u.strafe *= -1;   // 低機率隨機翻轉,破除整群同步左右平移
    if (sees && dist < 42) { const sw = smart ? 1.3 : 0.8; mvx += rx * u.strafe * sw; mvz += rz * u.strafe * sw; }
    const ml = Math.hypot(mvx, mvz);
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
    if (!dead && sees && u.flinch <= 0 && u.alertT <= 0 && dist < 56) {   // 反應延遲內不開火(發現→舉槍→開火)
      u.fireT -= dt; if (u.fireT <= 0) { u.fireT = 1.1 + Math.random() * 1.4; enemyShoot(g, dist); }
      u.grenadeT -= dt; if (u.grenadeT <= 0 && dist > 12 && dist < 40) { u.grenadeT = 9 + Math.random() * 8; enemyGrenade(g); }
    } else u.grenadeT -= dt * 0.3;
  }
}

/* ── 玩家生命 + 結算 ── */
const hpEl = document.getElementById("hp"), dmgEl = document.getElementById("dmg"), deadEl = document.getElementById("dead"), deadStatsEl = document.getElementById("dead-stats");
const scarEl = document.getElementById("scar"), narrEl = document.getElementById("narr"), mendEl = document.getElementById("mend-line"), hintEl = document.getElementById("hint");
let playerHP = 100, MAX_HP = 100, curDiff = null, dead = false, deaths = 0, bestWave = 0, scarFloor = 0, scarFlash = 0;
let money = 1000, armor = 0, maskOwned = false;   // 購買系統:軍餉 / 防彈背心 ARMOR / 防護面罩
/* ── toni 連接句留白(只有 toni 可改;Claude 一字不寫,僅留 placeholder 標位置;聲音=把拔夢中第一人稱) ── */
const NARR = {
  // #1 進軍營(夢框建立)— toni 選 EP40 verbatim:首次鎖入軍營顯示一次,痛與迷惘的夢框底色
  hubEnter: "有時候腦袋很亂。痛。痛到不知道未來在哪裡。",
  // #3 夢中違和(反穿的學校外套/名字藏起來)— toni 選 EP33 verbatim:走近夢中反穿外套觸發
  dream3: "原來長大，有時是把名字藏起來的練習。",
  // 顧牛(EP40 夢中違和物件)— toni 親寫 verbatim canon(連長叫砲兵連算彈最快的計算手去顧牛;忠誠不亂跑)
  cow: "連長叫我去顧一頭牛。我就負責顧著這頭牛不要亂跑，我也不要亂跑。",
  // #4 死亡「修補」拍 — toni 選「炸裂修補」方向 → 用 EP8 原句(toni 親寫,非 Claude 代筆;要換成新句隨時說)
  mend: "炸裂！修補。再炸裂！再修補。",
  // #4b 撐出新高波時的變奏(W6:綁 bestWave 突破才換)— toni 選 EP34 verbatim:結痂仍留疤的更深修補
  mendRecord: "我知道傷口結痂後，傷口還是會存在。",
  // #5 撐過一波 — toni 選「撐≠強,是相信」方向 → 用 EP40 原句
  wave: "所以我撐，跟我強不強沒關係，是因為未來還沒到。",
  // #2 進實戰模擬前 — toni 選「熔爐不是軍隊是她」→ EP8 原句(鋼鐵人是她要的)
  enter: "妳要我成為鋼鐵人，有打不倒的自信，也有敲不碎的心。",
  // #6 一眼瞬間收束 — toni 選「妳一直都在」→ EP29 原句(放下槍才看見她一直都在)
  gaze: "妳一直都在。",
};
if (mendEl) mendEl.textContent = NARR.mend;
function isReal(s) { return !!s && s[0] !== "［"; }   // 連接句守門:placeholder([…])不顯示,toni 填真句後自動生效
let firstHubShown = false;
function showNarr(text, dur) { if (!narrEl || !isReal(text)) return; narrEl.textContent = text; narrEl.style.opacity = "1"; clearTimeout(narrEl._t); narrEl._t = setTimeout(() => (narrEl.style.opacity = "0"), (dur || 3) * 1000); }
/* ── hub/sim 狀態機:把拔的夢,走到靶場才回到天堂路(實戰模擬練習) ── */
function nearRangeEntry() { const dx = camera.position.x - RANGE_ENTRY.x, dz = camera.position.z - RANGE_ENTRY.z; return dx * dx + dz * dz < 49; }
function nearCow() { const dx = camera.position.x - COW_POS.x, dz = camera.position.z - COW_POS.z; return dx * dx + dz * dz < 16; }
function nearJacket() { const dx = camera.position.x - JACKET_POS.x, dz = camera.position.z - JACKET_POS.z; return dx * dx + dz * dz < 13; }
function nearDiary() { const dx = camera.position.x - DIARY_POS.x, dz = camera.position.z - DIARY_POS.z; return dx * dx + dz * dz < 11; }
const diaryEl = document.getElementById("diary");
function openDiary() { if (!diaryEl) return; diaryEl.classList.add("on"); if (document.pointerLockElement === canvas && document.exitPointerLock) document.exitPointerLock(); }
function closeDiary() { if (diaryEl) diaryEl.classList.remove("on"); }
if (document.getElementById("diary-close")) document.getElementById("diary-close").addEventListener("click", closeDiary);
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
    MODE = "sim"; wave = 0; score = 0; kills = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 1.2;
    applyDifficulty();   // 套玩家 HP/彈藥 + 敵人倍率/AI(難度)
    if (scoreEl) scoreEl.textContent = 0; if (killsEl) killsEl.textContent = 0; if (hintEl) hintEl.style.opacity = "0";
    updateWaveHUD(); playMusic(MUSIC_SIM); showNarr(NARR.enter, 3.6); blinking = false;
  });
}
function tryInteract() { if (vehicle) { exitVehicle(); return; } if (MODE !== "hub" || !isActive()) return; const v = nearVehicle(); if (v) { enterVehicle(v); return; } if (nearCow()) showNarr(NARR.cow, 5.5); else if (nearJacket()) showNarr(NARR.dream3, 5.5); else if (nearDiary()) openDiary(); else if (nearRangeEntry()) enterSim(); }
/* ── 一眼瞬間(Tier 2):撐過 GOAL_WAVE → 主動放下槍 → 抽象光形非戰鬥高光(放下武器,光才出現) ── */
const GOAL_WAVE = 5;   // 撐過這波=撐過了,夢讓他停下(toni 選先驗收用 5)
let awaitDisarm = false;
const GAZE_MUSIC_URL = "../一眼瞬間.mp3";   // 一眼瞬間專屬主題曲(非戰鬥樂,不污染)
let gazeMusic = null, gazeRAF = 0, gazeT0 = 0, gazeFigure = null, heartTimer = 0;
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
function startHeartbeat() { stopHeartbeat(); const beat = () => { try { tone(58, 42, 0.16, 0.32, "sine"); setTimeout(() => { try { tone(50, 36, 0.13, 0.22, "sine"); } catch (e) { } }, 230); } catch (e) { } }; beat(); heartTimer = setInterval(beat, 1150); }
function stopHeartbeat() { if (heartTimer) { clearInterval(heartTimer); heartTimer = 0; } }
function startGaze() {
  if (MODE === "gaze") return;
  MODE = "gaze"; awaitDisarm = false;
  if (hintEl) hintEl.style.opacity = "0";
  stopMusic(); ensureAudio();
  if (document.exitPointerLock) document.exitPointerLock();
  const ov = document.getElementById("gaze"), cv = document.getElementById("gaze-cv"), lineEl = document.getElementById("gaze-line");
  if (!ov || !cv) { MODE = "hub"; return; }
  if (lineEl) { lineEl.textContent = NARR.gaze; lineEl.classList.remove("show"); }
  ov.classList.add("on"); ov.classList.remove("open", "closing");
  gazeFigure = buildGazeFigure();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(window.innerWidth * dpr); cv.height = Math.round(window.innerHeight * dpr);
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  try { gazeMusic = new Audio(GAZE_MUSIC_URL); gazeMusic.volume = 0; gazeMusic.play().catch(() => { }); } catch (e) { }
  startHeartbeat();
  requestAnimationFrame(() => ov.classList.add("closing"));        // 閉眼
  setTimeout(() => ov.classList.add("open"), 1150);                // 睜眼(留電影黑邊)
  setTimeout(() => { if (lineEl) lineEl.classList.add("show"); }, 6200);   // 連接句 #6 浮現
  setTimeout(() => endGaze(), 11000);                             // 收束
  gazeT0 = performance.now(); gazeLoop(ctx);
}
function gazeLoop(ctx) {
  if (MODE !== "gaze") return;
  gazeRAF = requestAnimationFrame(() => gazeLoop(ctx));
  const t = (performance.now() - gazeT0) / 1000, W = window.innerWidth, H = window.innerHeight;
  ctx.clearRect(0, 0, W, H);
  const reveal = Math.max(0, Math.min(1, (t - 1.1) / 2.6)), fade = t > 9.2 ? Math.max(0, 1 - (t - 9.2) / 1.6) : 1;
  const cx = W / 2, cy = H * 0.52, fh = H * 0.62, top = cy - fh * 0.5;
  const g = ctx.createRadialGradient(cx, cy - fh * 0.1, 0, cx, cy, fh * 0.95);   // 暖白背光(幾何漸層,非 bloom,避過曝白塊)
  g.addColorStop(0, "rgba(255,244,224," + (0.5 * reveal * fade).toFixed(3) + ")");
  g.addColorStop(0.4, "rgba(248,214,170," + (0.22 * reveal * fade).toFixed(3) + ")");
  g.addColorStop(1, "rgba(20,12,18,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  const breathe = 0.85 + 0.15 * Math.sin(t * 1.4);
  for (const p of gazeFigure) {
    const px = cx + p.x * (fh * 0.62), py = top + p.y * fh + Math.sin(t * 0.6 + p.ph) * 2.5;
    const a = reveal * fade * breathe * (0.5 + 0.5 * Math.sin(t * 1.1 + p.ph)), rr = p.r * (1 + 0.2 * Math.sin(t * 2 + p.ph));
    const pg = ctx.createRadialGradient(px, py, 0, px, py, rr * 5);
    pg.addColorStop(0, "rgba(255,248,232," + (a * 0.9).toFixed(3) + ")"); pg.addColorStop(1, "rgba(255,240,210,0)");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, rr * 5, 0, 6.3); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  if (gazeMusic) gazeMusic.volume = Math.max(0, Math.min(1, reveal * fade)) * (settings.vol != null ? settings.vol : 0.8) * 0.45;
}
function endGaze() {
  cancelAnimationFrame(gazeRAF); stopHeartbeat();
  if (gazeMusic) { try { gazeMusic.pause(); } catch (e) { } gazeMusic = null; }
  const ov = document.getElementById("gaze");
  if (ov) { ov.style.transition = "opacity 1.6s"; ov.style.opacity = "0"; }
  setTimeout(() => {
    if (ov) { ov.classList.remove("on", "open", "closing"); ov.style.opacity = ""; ov.style.transition = ""; }
    MODE = "hub"; awaitDisarm = false;   // 回 hub(夢繼續,點擊再入)
    for (const en of enemies) scene.remove(en); enemies.length = 0;
    wave = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 1.5; gameOver = false; dead = false;
    playerHP = 100; if (hpEl) hpEl.textContent = 100;
    camera.position.set(8, EYE, 13); yaw = -0.3; pitch = 0;
    stopMusic(); updateWaveHUD();
  }, 1700);
}
function hurtPlayer(d) { if (dead || gameOver || awaitDisarm) return; if (armor > 0) { const a = Math.min(armor, d * 0.5); armor -= a; d -= a; updateArmorHUD(); } playerHP = Math.max(0, playerHP - d); if (hpEl) hpEl.textContent = Math.round(playerHP); if (dmgEl) { dmgEl.style.opacity = Math.min(0.85, 0.3 + d / 35).toString(); clearTimeout(dmgEl._t); dmgEl._t = setTimeout(() => (dmgEl.style.opacity = "0"), 130); } sfxHurt(); if (playerHP <= 0) endRun(); }
function endRun() {
  if (dead) return;
  dead = true; gameOver = true; deaths++; stopMusic();   // 修補拍=樂停,沉默讓連接句說話
  const isRecord = wave > bestWave;   // 撐出個人新高波
  const ceremony = deaths === 1 || isRecord;   // N4:完整大轉場只在首死 / 破紀錄波數後首死,避免高頻死亡稀釋莊重
  bestWave = Math.max(bestWave, wave);
  if (mendEl) mendEl.textContent = (isRecord && deaths > 1 && isReal(NARR.mendRecord)) ? NARR.mendRecord : NARR.mend;   // W6:撐出新高才換「又被縫一針」變奏(placeholder 未填則退回 mend)
  scarFloor = Math.min(0.55, scarFloor + 0.1); scarFlash = 0.6;   // 炸裂:疤痕 +1(更明顯,只變淡不歸零,帶著傷前進;保留跨重新部署)
  if (dmgEl) dmgEl.style.opacity = "0.92";            // 炸裂:紅閃
  try { sfxThud(); sfxExplode(camera.position.clone()); } catch (e) { }
  if (document.exitPointerLock) document.exitPointerLock();
  if (deadStatsEl) deadStatsEl.textContent = "撐到第 " + wave + " 波 · 歷來最久 " + bestWave + " 波";   // 去分數當頭:死亡字幕不報擊殺數(反 CS 計分),只記撐了多久
  clearTimeout(endRun._t);
  endRun._t = setTimeout(() => { if (dmgEl) dmgEl.style.opacity = "0"; if (deadEl) deadEl.classList.add("on"); }, ceremony ? 2000 : 420);   // 修補:黑屏沉默拉長(韓劇式呼吸,只首死/破紀錄首死演足,N4 防稀釋)
}
function restartGame() {
  for (const g of enemies) scene.remove(g); enemies.length = 0;
  wave = 0; score = 0; waveAlive = 0; spawnQueue = 0; inBreak = true; betweenT = 1.5; gameOver = false; dead = false; kills = 0;
  if (killsEl) killsEl.textContent = 0; updateWaveHUD();
  applyDifficulty(); if (deadEl) deadEl.classList.remove("on"); if (dmgEl) dmgEl.style.opacity = "0";   // 重新部署套難度 HP/彈藥;scarFloor/deaths/bestWave 刻意不重置(帶著傷前進)
  camera.position.set(8, EYE, 13); yaw = -0.3; pitch = 0; sprayPitch = 0; sprayYaw = 0; recoilKick = 0;
  drawT = 0; reloadT = 0; reloadFilled = true; chSpread = 0;   // 重生清乾淨拔槍/換彈/擴散狀態(死在換彈途中重開不卡)
  playMusic(MUSIC_SIM);   // 重新部署=夢又把他帶回熔爐,主題樂回來
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
      p.vel.y -= GRAV * dt; p.vel.multiplyScalar(0.995); p.m.position.addScaledVector(p.vel, dt);
      if (p.m.position.y <= 0.2) { p.m.position.y = 0.2; p.vel.y *= -0.45; p.vel.x *= 0.7; p.vel.z *= 0.7; }
      p.m.rotation.x += dt * 6; p.m.rotation.y += dt * 4;
      if (p.t >= p.fuse) { explode(p.m.position.clone(), 0, false); scene.remove(p.m); p.m.geometry.dispose(); projectiles.splice(i, 1); }
    } else {
      p.prev.copy(p.m.position); const step = p.vel.clone().multiplyScalar(dt); const dist = step.length(); p.m.position.add(step);
      p.m.lookAt(p.m.position.clone().add(p.vel));
      if (Math.random() < 0.85) emitFx(trailPool, p.prev, 0.7, 0.5, 1.4, false);
      ray.set(p.prev, p.vel.clone().normalize()); ray.far = dist + 0.3; const h = ray.intersectObject(ROOT, true);
      const killRocket = () => { p.m.children.forEach((c) => c.geometry && c.geometry.dispose()); scene.remove(p.m); projectiles.splice(i, 1); };
      if (h.length) { explode(h[0].point.clone(), 0, true); killRocket(); }
      else if (p.m.position.y <= 0.3 || p.t > 4) { explode(p.m.position.clone(), 0, true); killRocket(); }
    }
  }
}

/* ── 每幀更新(移動/物理/武器/特效) ── */
const fwd = new THREE.Vector3(), right = new THREE.Vector3();
const STAND = 1.75, CROUCH_EYE = 1.15, GRAV = 15.2, JUMPV = 5.4;
/* ── 碰撞:建築 AABB(世界 XZ)圓 vs 盒推出,不能走進空殼房屋 ── */
const COLLIDERS = [
  [-13, 13, -34.5, -25.5],     // barracks(0,-30) W26 D8.5
  [-34.5, -25.5, -29, -3],     // barracks(-30,-16) 旋轉90:26 沿 z
  [-35, -29, 1, 7],            // watchtower(-32,4)
  [-27.5, -16.5, 9.5, 18.5],  // fdc 計算所(-22,14)
];
const PLAYER_R = 0.55, BOUND_R = 76;   // 圓形邊界半徑(圍籬樁在 R=78,玩家貼內側)
function losBlocked(ax, az, bx, bz) { for (let s = 1; s <= 8; s++) { const t = s / 9, x = ax + (bx - ax) * t, z = az + (bz - az) * t; for (const c of COLLIDERS) if (x > c[0] && x < c[1] && z > c[2] && z < c[3]) return true; } return false; }   // 線段 vs 建築 AABB 取樣:爆炸/視線遮蔽(只算建築,低掩體不擋手榴彈拋物)
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
const scopeEl = document.getElementById("scope"), crossEl = document.getElementById("cross");
let bob = 0, recoilKick = 0, vy = 0, jumpY = 0, curEye = EYE, sprayResetT = 0, lastFootstep = 0, wasGrounded = true, adsBlend = 0;
let vmKick = 0, vmKickRot = 0, landDip = 0, prevAdsState = false;   // 武器在手中的後座頓挫(每發瞬間衝擊 → 快速回彈,與鏡頭爬升 recoilKick 分開);landDip=落地下沉;prevAdsState=開鏡狀態偵測
// 每把武器的頓挫量[往後位移衝擊, 槍口上揚衝擊];數值小但快,給「槍在手上一頓」的視覺
const WKICK = { "小槍": [0.05, 0.18], "步槍": [0.055, 0.2], "機關槍": [0.036, 0.13], "狙擊槍": [0.12, 0.45], "火箭砲": [0.17, 0.55] };
function addKick(name) { const k = WKICK[name]; if (!k) return; vmKick = Math.min(0.2, vmKick + k[0]); vmKickRot = Math.min(0.62, vmKickRot + k[1]); }
let drawT = 0, drawDur = 0.5, reloadT = 0, reloadDur = 2.4, reloadFilled = true, chSpread = 0;
function updateFP(dt) {
  const w = WEAPONS[wi];
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
  const len = Math.hypot(mx, mz) || 1;
  if (!dead) {
    camera.position.addScaledVector(fwd, (mz / len) * speed * dt);
    camera.position.addScaledVector(right, (mx / len) * speed * dt);
    resolveCollision();   // 碰撞:被建築/木箱 AABB 推出(不能走進空殼房屋或穿木箱)
    clampBound(camera.position);   // 圓形邊界貼合圍籬,不再撞方形空氣牆
  }
  // 跳躍重力
  if (!dead && keys.Space && grounded) { vy = JUMPV; grounded = false; sfxJump(); }
  if (!grounded) { vy -= GRAV * dt; jumpY += vy * dt; if (jumpY <= 0) { jumpY = 0; const vimp = vy; vy = 0; grounded = true; if (!wasGrounded) { sfxLand(); landDip = Math.min(0.2, -vimp * 0.022); vmKickRot = Math.min(0.62, vmKickRot + landDip * 0.5); if (vimp < -7) shake = Math.max(shake, 0.25); } } }   // 落地:依落地速度下沉+槍口點一下,重摔加震
  wasGrounded = grounded;
  // 蹲下視高
  const targetEye = crouch ? CROUCH_EYE : STAND; curEye += (targetEye - curEye) * Math.min(1, dt * 12);
  camera.position.y = curEye + jumpY - landDip;
  // 腳步聲(快走/蹲走有聲,Ctrl 靜步無聲)
  if (moving && grounded && !silent) { lastFootstep -= dt; if (lastFootstep <= 0) { sfxStep(crouch); lastFootstep = crouch ? 0.5 : 0.36; } } else lastFootstep = 0;
  // 後座衰減 + spray reset
  if (recoilKick > 0) recoilKick = Math.max(0, recoilKick - dt * 0.5);
  vmKick += (0 - vmKick) * Math.min(1, dt * 17); vmKickRot += (0 - vmKickRot) * Math.min(1, dt * 15);   // 頓挫快速回彈(snappy)
  if (landDip > 0) landDip += (0 - landDip) * Math.min(1, dt * 12);   // 落地下沉 spring 回彈
  if (drawT > 0) drawT = Math.max(0, drawT - dt);
  if (reloadT > 0) { reloadT = Math.max(0, reloadT - dt); if (!reloadFilled && 1 - reloadT / reloadDur >= 0.6) { const rw = WEAPONS[wi]; const t = Math.min(rw.mag - rw.ammo, rw.reserve); rw.ammo += t; rw.reserve -= t; reloadFilled = true; updateHUD(); } }
  chSpread = Math.max(0, chSpread - dt * 26);
  if (scarFlash > 0) scarFlash = Math.max(0, scarFlash - dt * 0.55);   // 疤痕閃光衰減,留下永久 scarFloor
  if (scarEl) scarEl.style.opacity = (scarFloor + scarFlash).toFixed(3);
  if (tbDisarmEl) tbDisarmEl.classList.toggle("on", isTouch && touchActive && MODE === "sim" && awaitDisarm);   // 手機放下槍鈕
  if (hintEl) { if (MODE === "sim" && awaitDisarm) { hintEl.style.opacity = "1"; hintEl.textContent = isTouch ? "夠了 · 輕觸「放下槍」" : "夠了 · 按 H 放下槍"; } else if (MODE === "hub" && isActive()) { hintEl.style.opacity = "1"; hintEl.textContent = nearVehicle() ? "按 E 上車駕駛" : nearCow() ? "按 E · 替連長顧那頭牛" : nearJacket() ? "按 E · 看那件反穿的外套" : nearDiary() ? "按 E · 翻開大兵日記" : nearRangeEntry() ? "按 E 進入「實戰模擬練習」" : (isTouch ? "搖桿走動軍營 · 按「軍械」鈕購買裝備 · 走到靶場(右前方)按 E 開始實戰" : "自由走動軍營 · 按 B 開軍械庫購買裝備 · 走到靶場(右前方)按 E 開始實戰模擬"); } else hintEl.style.opacity = "0"; }
  updateMusic(dt); updateAmbient(dt);
  moodSim += ((MODE === "sim" && !dead ? 1 : 0) - moodSim) * Math.min(1, dt * 0.8);   // 夢進熔爐:光影收緊(暗角加深 / 曝光略降 / 顆粒略增)
  if (postfxOn && postfx) { const tt = postfx.tuning; tt.vignette.darkness = 0.26 + moodSim * 0.14 + skyDarkCur * 0.12; tt.exposure = 1.08 - moodSim * 0.07 - skyDarkCur * 0.06; tt.grain.amount = 0.012 + moodSim * 0.01; }
  // 漸暗天空:撐越久天越暗(夢的長夜情緒累積),平滑 lerp 不換波跳變
  const skyDarkTgt = MODE === "sim" ? Math.min(1, (wave - 1) / 9) : 0;   // wave1=0 → wave10=1
  skyDarkCur += (skyDarkTgt - skyDarkCur) * Math.min(1, dt * 0.5);
  if (skyDomeMat) skyDomeMat.color.setScalar(1 - skyDarkCur * 0.62);
  if (sunDiscMat) sunDiscMat.color.setScalar(1 - skyDarkCur * 0.5);
  sun.intensity = 3.3 * (1 - skyDarkCur * 0.55); ambient.intensity = 0.32 * (1 - skyDarkCur * 0.45); hemi.intensity = 0.9 * (1 - skyDarkCur * 0.4);
  if (cowTail) cowTail.rotation.z = 0.4 + Math.sin(realT * 2.1) * 0.26;   // 顧牛 idle:尾巴搖
  if (cowHead) { cowHead.rotation.z = Math.sin(realT * 0.7) * 0.1; cowHead.position.y = 0.52 - Math.max(0, Math.sin(realT * 0.7)) * 0.08; }   // 低頭吃草微動(頭 base y=0.52)
  if (realT - lastShot > 0.12) { sprayPitch += (0 - sprayPitch) * Math.min(1, dt * 6); sprayYaw += (0 - sprayYaw) * Math.min(1, dt * 6); }
  if (muzzleLight.intensity > 0) muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * (60 + Math.random() * 30));
  if ((sprayResetT -= dt) <= 0) sprayCount = 0;
  // ADS 縮放 + 狙擊鏡
  const scoped = ads && !!w.scope;
  if (actx && ads !== prevAdsState) { if (ads) { noiseHit(0.03, 1500, 900, 0.1); if (WEAPONS[wi].scope) tone(2200, 2200, 0.02, 0.06, "triangle"); } else noiseHit(0.025, 1100, 700, 0.07); prevAdsState = ads; }   // 開/出鏡就位咔聲(狙擊額外玻璃 tick),端槍瞄準的儀式感
  adsBlend += ((ads ? 1 : 0) - adsBlend) * Math.min(1, dt * 18);
  const tgFov = (ads && w.adsFov) ? w.adsFov : 80; camera.fov += (tgFov - camera.fov) * Math.min(1, dt * 12); camera.updateProjectionMatrix();
  if (scopeEl) scopeEl.classList.toggle("on", scoped);
  if (crossEl) crossEl.style.display = scoped ? "none" : "block";
  // 動態準心:開火/移動/跳躍張開,靜止收攏(對齊真實 spread 回饋)
  if (crossEl && !scoped) { let ex = chSpread; if (!grounded) ex += 16; else if (mvMoving && !crouch) ex += 7; else if (crouch && !mvMoving) ex -= 1.5; if (ads) ex *= 0.3; document.documentElement.style.setProperty("--ch-gap", Math.max(1, settings.chGap + ex).toFixed(1) + "px"); }
  // 自動射擊(步槍/機槍按住)
  if (!dead && mouseDown && w.type === "auto" && isActive() && realT - lastShot >= w.rate) { lastShot = realT; fire(); }
  // 槍口焰
  for (const k of WEAPONS) if (k.muzzle) { if (k.muzzleT > 0) { k.muzzleT -= dt; const aSup = k === w ? adsBlend : 0; k.muzzle.material.opacity = Math.max(0, k.muzzleT / 0.06) * 0.9 * (1 - aSup * 0.55); k.muzzle.scale.setScalar((1 + (1 - k.muzzleT / 0.06) * 0.7) * (1 - aSup * 0.6)); } else k.muzzle.material.opacity = 0; }   // 開鏡抑制火光,不糊住瞄準
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
  let drawDipY = 0, drawDipZ = 0, drawRotX = 0, rlDipY = 0, rlRotX = 0, rlRotZ = 0;
  if (drawT > 0) { const dp = 1 - drawT / drawDur, e = 1 - (1 - dp) * (1 - dp); drawDipY = -(1 - e) * 0.4; drawDipZ = (1 - e) * 0.12; drawRotX = (1 - e) * 1.0; }
  if (reloadT > 0) { const rp = 1 - reloadT / reloadDur, rc = reloadCurve(WEAPONS[wi].name, rp); rlDipY = rc[0]; rlRotX = rc[1]; rlRotZ = rc[2]; }
  const ax = w.base.x * (1 - adsBlend * 0.7) + swayX, ay = w.base.y + adsBlend * 0.03 + swayY;
  w.group.position.set(ax + Math.sin(bob) * bobAmp + swPx, ay + Math.abs(Math.cos(bob)) * bobAmp - recoilKick * 0.5 + vmKick * 0.16 - landDip * 0.5 + drawDipY + rlDipY + swPy, w.base.z + recoilKick * 1.2 + vmKick + swPz + drawDipZ);
  w.group.rotation.set(w.rot.x + swRx - swayY * 2 + vmKickRot + drawRotX + rlRotX, w.rot.y + swRy + swayX * 2, w.rot.z + swRz + rlRotZ);
  w.group.visible = !scoped;
  updateProjectiles(dt); updateTargets(dt); updateEnemies(dt); updateEffects(dt);
  updateFxPool(sparkPool, dt); updateFxPool(dustPool, dt); updateFxPool(trailPool, dt); updateFxPool(bloodPool, dt);
  updateMemShards(dt); updateTracers(dt); updateShells(dt); updateCasings(dt); updateMags(dt);   // 記憶光點 + CS 曳光 + 榴彈砲彈道 + 退殼 + 空彈匣
  updateListener();
}
showWeapon(0);

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
  postfx.setJuniorAnchor(null);
  postfx.setSize(Math.round(window.innerWidth * renderer.getPixelRatio()), Math.round(window.innerHeight * renderer.getPixelRatio()));
  postfxOn = true;
} catch (e) { console.warn("[3d營] postfx fail", e && e.message); postfxOn = false; }

/* ───────── 5 級畫質(預設中):解析度 / 陰影 / 後製 ───────── */
const QUALITY = { 1: { pr: 0.6, shadow: false, shadowSize: 0, postfx: false }, 2: { pr: 0.8, shadow: true, shadowSize: 1024, postfx: false }, 3: { pr: 1, shadow: true, shadowSize: 2048, postfx: true }, 4: { pr: 1.5, shadow: true, shadowSize: 2048, postfx: true }, 5: { pr: 2, shadow: true, shadowSize: 4096, postfx: true } };
let postfxWanted = true;   // postfx 是否被畫質允許(與 runtime fail 分開)
function applyQuality(q) {
  const p = QUALITY[q] || QUALITY[3];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pr));
  renderer.shadowMap.enabled = p.shadow;
  if (sun && sun.shadow && p.shadowSize) { sun.shadow.mapSize.set(p.shadowSize, p.shadowSize); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  postfxWanted = p.postfx; postfxOn = p.postfx && !!postfx;
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (postfx) postfx.setSize(Math.round(window.innerWidth * renderer.getPixelRatio()), Math.round(window.innerHeight * renderer.getPixelRatio()));
}
applyQuality(settings.quality);

/* ───────── 太陽 screen-space UV(god rays/lens flare) ───────── */
const _sunWorld = SUN_DIR.clone().multiplyScalar(520);
const _sunUv = new THREE.Vector2(0.5, 0.7);
function computeSunUv() { const v = _sunWorld.clone().project(camera); _sunUv.set((v.x + 1) / 2, (v.y + 1) / 2); return _sunUv; }

/* ───────── 渲染 ───────── */
let realT = 0; const clock = new THREE.Clock();
let vmStack = true;   // 武器疊加層(防穿牆),可由 __VMSTACK__(false) 關閉
function renderOnce() {
  if (motes) motes.rotation.y = realT * 0.006;
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
function loop() { requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), 0.05); realT += dt; updateFP(dt); renderOnce(); }
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
  window.__ADS__ = (v) => { ads = !!v; }; // debug 開鏡
  window.__AIM__ = (x, y, z) => { camera.lookAt(x, y, z); yaw = camera.rotation.y; pitch = camera.rotation.x; }; // debug 瞄向
  window.__KILLTEST__ = () => { let best = null, bd = 1e9; for (const g of enemies) { if (g.userData.dead) continue; const d = g.position.distanceTo(camera.position); if (d < bd) { bd = d; best = g; } } if (!best) return "no enemy"; camera.lookAt(best.position.clone().setY(1.2)); yaw = camera.rotation.y; pitch = camera.rotation.x; camera.updateMatrixWorld(true); const hp0 = best.userData.hp; for (let i = 0; i < 6; i++) shootHit(WEAPONS[wi]); return { dist: Math.round(bd), hp0, hpAfter: best.userData.hp, kills }; }; // debug 殺最近敵
  window.__DBG__ = () => ({ enemies: enemies.length, alive: waveAlive, queue: spawnQueue, wave, score, kills, hp: playerHP, dead, gameOver, MODE, awaitDisarm }); // debug 狀態
  window.__GAZE__ = startGaze; // debug 觸發一眼瞬間
}
function onResize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (postfx) postfx.setSize(Math.round(w * renderer.getPixelRatio()), Math.round(h * renderer.getPixelRatio())); }
window.addEventListener("resize", onResize);
setTimeout(() => document.getElementById("title").classList.add("show"), 600);
loop();
