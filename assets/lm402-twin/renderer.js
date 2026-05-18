import * as e from "./vendor-three.module.js";
import { GLTFLoader } from "./GLTFLoader.js";
import { DRACOLoader } from "./DRACOLoader.js";
import { WORLD as t, CINEMATIC_TIMELINE as o } from "./data.js";
import { buildSunsetEnvMap, SUNSET_SUN_DIR } from "./envmap-sunset.js";
import { createPostFX } from "./postfx.js";
import * as JM from "./junior-materials-hr.js";
import { createJuniorExpressionRig } from "./expression-rig.js";
import { createClothRig } from "./cloth-rig.js";
import { createConsciousnessLights } from "./consciousness-lights.js";
import { createConsciousnessParticles } from "./consciousness-particles.js";
import { createConsciousnessText } from "./consciousness-text.js";
import { createEnvironmentPresets } from "./environment-presets.js";
import { createE4Props } from "./e4-props.js";
import "./debug-character-inspect.js";   // B-VIS-001 debug:console __INSPECT_CHARS__() / __INSPECT_LEGS__('Go')
import { createNarrativeOverlay } from "./narrative-overlay.js";
import { createTransitions } from "./narrative-transitions.js";
import { createNarrativeLetter } from "./narrative-letter.js";
import { createNarrativeAudio } from "./narrative-audio.js";
import { createInitiatedInteractions } from "./initiated-interactions.js";
import { createPolaroidCapture } from "./polaroid.js";
let __juniorRig = null;
let __clothRig = null;
let __conscLights = null;
let __conscParticles = null;
let __conscText = null;
let __envPresets = null;
let __e4Props = null;
let __narrativeOverlay = null;
let __transitions = null;
let __letter = null;
let __audioLayer = null;
let __initiated = null;
let __polaroid = null;
const __sunFar = new e.Vector3();   // Tier 7：太陽世界座標暫存（每幀 reuse）
const __sunUv = new e.Vector2();    // Tier 7：太陽螢幕座標（NDC → UV）
export const WORLD_SCALE = 1 / 80;
const a = new e.Vector3(),
  n = new e.Vector3(),
  s = new e.Vector3(),
  r = (new e.Box3(), new e.Vector2()),
  i = new e.Vector2(),
  l = new e.Vector3(0, 0.32, -0.18),
  c = new e.Vector3(-0.2, 0.34, -0.48),
  h = new e.Vector3(-0.14, 0.22, -0.74),
  d = new e.Vector3(0.1, 0.14, -0.56),
  p = new e.Color("#e0d8ff"),
  m = new e.Color("#ffd8a0"),
  w = new e.Vector3(0, 1.5, 0),
  M = new e.Vector3(0.03, 1.57, 0.04),
  f = new e.Vector3(0.18, 0.08, -0.12),
  u = new e.Vector3(0.02, 0.012, 0.004),
  y = new e.Vector3(0.008, 0.006, 0);
new e.Vector3(0.004, 0.018, 0);
function g(e) {
  return 0.0125 * e;
}
function x(e, t = !0, o = !0) {
  e.traverse((e) => {
    e.isMesh && ((e.castShadow = t), (e.receiveShadow = o));
  });
}
function b(t, o, a, n = 0.35) {
  const s = document.createElement("canvas");
  ((s.width = 256), (s.height = 256));
  const r = s.getContext("2d"),
    i = r.createRadialGradient(128, 128, 12, 128, 128, 120);
  (i.addColorStop(0, t.replace("1)", `${n})`)),
    i.addColorStop(0.35, t.replace("1)", 0.4 * n + ")")),
    i.addColorStop(1, t.replace("1)", "0)")),
    (r.fillStyle = i),
    r.fillRect(0, 0, 256, 256));
  const l = new e.CanvasTexture(s);
  l.colorSpace = e.SRGBColorSpace;
  const c = new e.MeshBasicMaterial({
    map: l,
    transparent: !0,
    depthWrite: !1,
    side: e.DoubleSide,
  });
  return new e.Mesh(new e.PlaneGeometry(o, a), c);
}
function buildJuniorHairRibbonAlpha() {
  const t = document.createElement("canvas");
  ((t.width = 128), (t.height = 512));
  const o = t.getContext("2d");
  (o.clearRect(0, 0, 128, 512), (o.fillStyle = "#000"), o.fillRect(0, 0, 128, 512));
  const a = o.createLinearGradient(0, 0, 0, 512);
  (a.addColorStop(0, "rgba(255,255,255,.98)"),
    a.addColorStop(0.16, "rgba(255,255,255,.95)"),
    a.addColorStop(0.82, "rgba(255,255,255,.92)"),
    a.addColorStop(1, "rgba(255,255,255,0)"),
    (o.globalCompositeOperation = "source-over"),
    (o.fillStyle = a),
    o.beginPath(),
    o.moveTo(62, 0),
    o.bezierCurveTo(94, 0, 104, 82, 84, 216),
    o.bezierCurveTo(74, 320, 72, 432, 66, 512),
    o.lineTo(62, 512),
    o.bezierCurveTo(54, 432, 50, 320, 38, 214),
    o.bezierCurveTo(22, 82, 30, 0, 62, 0),
    o.closePath(),
    o.fill(),
    (o.globalCompositeOperation = "destination-out"));
  for (let t = 0; t < 7; t += 1) {
    const a = 34 + 10 * t + (t % 2 ? -4 : 4);
    ((o.strokeStyle = "rgba(0,0,0,.2)"),
      (o.lineWidth = 1 + 0.18 * t),
      o.beginPath(),
      o.moveTo(a, 0),
      o.bezierCurveTo(a - 6, 86, a + 10, 192, a + (t % 2 ? -8 : 8), 512),
      o.stroke());
  }
  (o.globalCompositeOperation = "source-over");
  const n = new e.CanvasTexture(t);
  return ((n.colorSpace = e.SRGBColorSpace), n);
}
const juniorHairRibbonAlpha = buildJuniorHairRibbonAlpha();
function buildJuniorHairRibbon(t, o, a, n = {}) {
  const s = new e.PlaneGeometry(o, a, 1, n.segments ?? 8),
    r = s.attributes.position;
  for (let t = 0; t < r.count; t += 1) {
    const o = r.getY(t),
      a = o / Math.max(0.001, 0.5 * s.parameters.height),
      i = e.MathUtils.mapLinear(a, -1, 1, n.bottomWidth ?? 0.8, n.topWidth ?? 0.46),
      l = Math.sin((0.5 * (a + 1)) * Math.PI) * (n.curve ?? 0.016);
    (r.setX(t, r.getX(t) * i), r.setZ(t, l));
  }
  (r.needsUpdate = !0, s.computeVertexNormals());
  const i = new e.Mesh(
    s,
    new e.MeshPhysicalMaterial({
      color: new e.Color(t),
      alphaMap: juniorHairRibbonAlpha,
      transparent: !0,
      opacity: n.opacity ?? 0.96,
      alphaTest: n.alphaTest ?? 0.18,
      side: e.DoubleSide,
      depthWrite: !1,
      roughness: n.roughness ?? 0.44,
      metalness: 0.03,
      clearcoat: n.clearcoat ?? 0.12,
      clearcoatRoughness: 0.34,
      sheen: 0.3,
      sheenRoughness: 0.34,
      sheenColor: new e.Color("#a77f5d"),
      // A2 Marschner approximation — anisotropy 推極限 + 加 clearcoat secondary
      anisotropy: 0.92,                  // 0.75 → 0.92
      anisotropyRotation: n.anisotropyRotation ?? 0,
      envMapIntensity: 1.15,             // 1.0 → 1.15
    }),
  );
  // Tier 4 標記為可動（cloth-rig 會 traverse 找這個 flag）
  i.userData.cloth = true;
  return ((i.renderOrder = n.renderOrder ?? 18), i);
}
function buildReferenceJuniorHeroHead(t = {}) {
  const o = new e.Group();
  (o.position.set(0.01, 1.55, 0.008), o.scale.set(0.62, 0.64, 0.62));
  o.visible = !1;
  o.userData.kind = "procedural_hero_head";
  o.userData.ready = !0;
  o.userData.heroAnchor = {
    center: new e.Vector3(0.01, 1.548, 0.008),
    face: new e.Vector3(0.01, 1.602, 0.106),
    chest: new e.Vector3(0.01, 1.468, 0.072),
    eyes: new e.Vector3(0.01, 1.592, 0.102),
    shoulder: new e.Vector3(0.01, 1.428, 0.036),
  };
  const a = new e.Color(t.skinColor ?? "#f9e7da"),
    n = new e.Color(t.hairColor ?? "#3c2a22"),
    s = new e.Color(t.irisColor ?? "#5d4334"),
    // === Tier 2 半寫實材質（HR = Half Realistic）===
    r = JM.createSkinMaterialHR(t.skinColor ?? "#f9e7da"),
    i = JM.createSkinSubMaterialHR(t.skinColor ?? "#f9e7da"),
    l = JM.createHairMaterialHR(t.hairColor ?? "#3c2a22"),
    c = JM.createEyeWhiteMaterialHR(),
    h = JM.createIrisMaterialHR(t.irisColor ?? "#5d4334"),
    d = JM.createLashBrowMaterialHR(),
    p = JM.createLipMaterialHR("#bf8f8f"),
    m = JM.createLipLineMaterialHR();
    // === /Tier 2 ===
  const w = new e.Mesh(new e.SphereGeometry(0.114, 48, 48), r);
  (w.position.set(0, -0.004, -0.01), w.scale.set(0.72, 0.92, 0.68), o.add(w));
  const M = new e.Mesh(new e.SphereGeometry(0.086, 44, 44), i);
  (M.position.set(0, -0.076, 0.012), M.scale.set(0.52, 0.46, 0.5), o.add(M));
  // (c3) 下巴尖 — 圓潤但有定義（符合 reference 圖學妹臉型，不是尖下巴）
  const chinTip = new e.Mesh(new e.SphereGeometry(0.018, 24, 24), i);
  (chinTip.position.set(0, -0.108, 0.046),
    chinTip.scale.set(0.62, 0.52, 0.58),
    o.add(chinTip));
  const f = new e.Mesh(new e.SphereGeometry(0.018, 20, 20), i);
  (f.position.set(0, -0.132, 0.044), f.scale.set(0.8, 0.42, 0.82), o.add(f));
  const u = new e.Mesh(new e.SphereGeometry(0.026, 20, 20), i);
  (u.position.set(-0.046, -0.02, 0.04), u.scale.set(0.82, 0.58, 0.54), o.add(u));
  const y = u.clone();
  ((y.position.x = 0.052), o.add(y));
  // (c2) 顴骨 — 雙頰上方微突 sphere（黃昏側光打在顴骨上很有立體感）
  const cheekBoneL = new e.Mesh(new e.SphereGeometry(0.014, 16, 16), i);
  (cheekBoneL.position.set(-0.054, -0.005, 0.054),
    cheekBoneL.scale.set(0.72, 0.38, 0.48),
    o.add(cheekBoneL));
  const cheekBoneR = cheekBoneL.clone();
  ((cheekBoneR.position.x = 0.060), o.add(cheekBoneR));
  // B8 Blush overlay — 雙頰紅潤（害羞/微笑時 expression-rig 提升 opacity）
  const blushMatBase = new e.MeshBasicMaterial({
    color: "#ff8a78",
    transparent: !0,
    opacity: 0,
    depthWrite: !1,
  });
  const blushL = new e.Mesh(new e.SphereGeometry(0.013, 14, 14), blushMatBase.clone());
  (blushL.position.set(-0.052, -0.012, 0.062),
    blushL.scale.set(0.7, 0.4, 0.35),
    (blushL.renderOrder = 17),
    (blushL.visible = !1),
    o.add(blushL));
  const blushR = blushL.clone();
  ((blushR.material = blushL.material.clone()),
    (blushR.position.x = 0.058),
    o.add(blushR));
  // B8 Forehead sweat — 額頭汗珠（緊張/驚訝時提升 opacity + clearcoat）
  const sweatDrop = new e.Mesh(
    new e.SphereGeometry(0.0035, 12, 12),
    new e.MeshPhysicalMaterial({
      color: "#e8f0ff",
      transparent: !0,
      opacity: 0,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.55,
      ior: 1.33,
      thickness: 0.2,
      envMapIntensity: 1.6,
      depthWrite: !1,
    }),
  );
  (sweatDrop.position.set(0.022, 0.058, 0.078),
    sweatDrop.scale.set(0.85, 1.4, 0.7),
    (sweatDrop.renderOrder = 18),
    (sweatDrop.visible = !1),
    o.add(sweatDrop));
  // (c1) 鼻樑 — 加長、加挺、變窄（更接近真實亞洲鼻型）
  const g = new e.Mesh(
    new e.CapsuleGeometry(0.0042, 0.042, 4, 10),
    i,
  );
  (g.position.set(0, -0.020, 0.080),
    g.scale.set(0.40, 0.78, 0.58),
    o.add(g));
  // (c1) 鼻根 — 在鼻樑頂端、眉間下方做微凸（接續眉骨）
  const noseRoot = new e.Mesh(new e.SphereGeometry(0.006, 16, 16), i);
  (noseRoot.position.set(0, 0.000, 0.078),
    noseRoot.scale.set(0.55, 0.35, 0.4),
    o.add(noseRoot));
  // (c1) 鼻樑高光 — 模擬黃昏側光打在鼻骨上（細長白點）
  const noseHi = new e.Mesh(
    new e.SphereGeometry(0.0024, 12, 12),
    new e.MeshBasicMaterial({ color: "#ffffff", transparent: !0, opacity: 0.34 }),
  );
  (noseHi.position.set(0, -0.012, 0.086),
    noseHi.scale.set(0.4, 1.6, 0.3),
    o.add(noseHi));
  const x = new e.Mesh(new e.SphereGeometry(0.013, 24, 24), i);
  (x.position.set(0, -0.048, 0.088), x.scale.set(0.72, 0.52, 0.84), o.add(x));
  const b = new e.Mesh(new e.SphereGeometry(0.0048, 18, 18), i);
  (b.position.set(-0.008, -0.056, 0.088), b.scale.set(0.72, 0.46, 0.7), o.add(b));
  const S = b.clone();
  ((S.position.x = 0.009), o.add(S));
  const P = new e.Mesh(
    new e.CapsuleGeometry(0.0022, 0.014, 4, 6),
    new e.MeshStandardMaterial({
      color: "#c89b95",
      roughness: 0.62,
      metalness: 0,
      transparent: !0,
      opacity: 0.56,
    }),
  );
  (P.position.set(0, -0.078, 0.088), o.add(P));
  const v = new e.Mesh(new e.PlaneGeometry(0.036, 0.01), m);
  (v.position.set(0, -0.094, 0.096), (v.renderOrder = 17), o.add(v));
  const G = new e.Mesh(new e.CapsuleGeometry(0.0026, 0.026, 4, 10), p);
  (G.position.set(0, -0.09, 0.098), (G.rotation.z = Math.PI / 2), o.add(G));
  // (b3) 下唇 — 比上唇亮 + 更高 clearcoat（飽滿、唇蜜感）
  const z = new e.Mesh(new e.CapsuleGeometry(0.0032, 0.03, 4, 10), JM.createLipMaterialHR("#d29694"));
  ((z.material.clearcoat = 0.58),
    z.position.set(0, -0.1, 0.096),
    (z.rotation.z = Math.PI / 2),
    o.add(z));
  const eyeGroup = (t) => {
      const o = new e.Group();
      o.position.set(0.041 * t, -0.002, 0.082);
      const a = new e.Mesh(new e.SphereGeometry(0.017, 24, 24), c);
      (a.scale.set(1.14, 0.6, 0.34), o.add(a));
      // (a1) iris 改用 CircleGeometry plane，讓 procedural iris texture 1:1 顯示
      const n = new e.Mesh(new e.CircleGeometry(0.011, 28), h);
      (n.position.set(0, 0, 0.018),
        n.scale.set(1, 1.05, 1),
        o.add(n));
      const s = new e.Mesh(
        new e.SphereGeometry(0.0036, 16, 16),
        new e.MeshBasicMaterial({ color: "#161113" }),
      );
      (s.position.set(0, 0, 0.022), s.scale.set(0.76, 0.82, 0.32), o.add(s));
      const r = new e.Mesh(new e.CapsuleGeometry(0.0026, 0.028, 4, 10), i);
      (r.position.set(0, 0.008, 0.008), (r.rotation.z = Math.PI / 2), o.add(r));
      // (b1) 雙眼皮 — 上眼瞼上方薄條，半透明深棕（亞洲女性辨識特徵）
      const doubleLid = new e.Mesh(
        new e.CapsuleGeometry(0.0008, 0.024, 3, 8),
        new e.MeshStandardMaterial({
          color: "#5a4338",
          transparent: !0,
          opacity: 0.42,
          roughness: 0.72,
          metalness: 0,
        }),
      );
      (doubleLid.position.set(0, 0.013, 0.012),
        (doubleLid.rotation.z = Math.PI / 2),
        doubleLid.scale.set(0.95, 1, 0.6),
        o.add(doubleLid));
      const l = new e.Mesh(new e.CapsuleGeometry(0.0016, 0.026, 4, 10), i);
      (l.position.set(0, -0.011, 0.006),
        (l.rotation.z = Math.PI / 2),
        l.scale.set(0.92, 0.74, 0.72),
        o.add(l));
      const p = new e.Mesh(new e.CapsuleGeometry(0.0016, 0.03, 4, 10), d);
      (p.position.set(0, 0.007, 0.016),
        (p.rotation.z = Math.PI / 2),
        p.scale.set(0.84, 0.82, 0.68),
        o.add(p));
      // Tier 2.2 cornea — 透明角膜層（黃昏光反射 = 水汪汪眼神）
      const cornea = new e.Mesh(
        new e.SphereGeometry(0.014, 20, 20),
        new e.MeshPhysicalMaterial({
          color: new e.Color("#ffffff"),
          transparent: !0,
          opacity: 0.18,
          roughness: 0.03,
          metalness: 0,
          transmission: 0.7,
          ior: 1.376,
          thickness: 0.3,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          envMapIntensity: 2.5,
          side: e.FrontSide,
          depthWrite: !1,
          // Tier 6 iridescence — 角膜濕潤的彩虹閃（黃昏光最戲劇性）
          iridescence: 0.7,
          iridescenceIOR: 1.5,
        }),
      );
      (cornea.position.set(0, 0, 0.012),
        cornea.scale.set(1, 1, 0.5),
        (cornea.renderOrder = 18),
        o.add(cornea));
      // Tier 2.2 睫毛 plane — 梳狀 alpha map（取代 capsule p 的細條）
      const lashPlane = new e.Mesh(
        new e.PlaneGeometry(0.03, 0.0085),
        JM.createLashFanMaterialHR(),
      );
      (lashPlane.position.set(0, 0.013, 0.022),
        (lashPlane.rotation.x = -0.22),
        (lashPlane.renderOrder = 19),
        o.add(lashPlane));
      const m = new e.Mesh(
        new e.SphereGeometry(0.0028, 12, 12),
        new e.MeshBasicMaterial({
          color: "#ffffff",
          transparent: !0,
          opacity: 0.82,
        }),
      );
      return (
        (m.position.set(-0.003 * t, 0.006, 0.024),
          m.scale.set(1.08, 0.96, 0.4),
          o.add(m),
          (a.userData.baseScale = a.scale.clone()),
          (n.userData.baseScale = n.scale.clone()),
          {
            root: o,
            eyeWhite: a,
            iris: n,
            pupil: s,
            upperLid: r,
            lowerLid: l,
            lash: p,
            highlight: m,
            doubleLid: doubleLid,
            cornea: cornea,
            lashPlane: lashPlane,
          })
      );
    },
    eyeL = eyeGroup(-1),
    eyeR = eyeGroup(1);
  o.add(eyeL.root, eyeR.root);
  const T = new e.Mesh(new e.CapsuleGeometry(0.002, 0.028, 4, 10), d);
  (T.position.set(-0.046, 0.032, 0.084),
    T.scale.set(0.72, 0.8, 0.68),
    T.rotation.set(0.03, 0.05, 0.12),
    o.add(T));
  const R = T.clone();
  ((R.position.x = 0.048), (R.rotation.z = -0.12), (R.rotation.y = -0.05), o.add(R));
  // (b2) 眉頭加深 — 眉峰位置加深色小球（亞洲眉型常見「眉頭深、眉尾淺」）
  const browInL = new e.Mesh(new e.SphereGeometry(0.003, 12, 12), d);
  (browInL.position.set(-0.052, 0.028, 0.083),
    browInL.scale.set(0.7, 1.3, 0.55),
    o.add(browInL));
  const browInR = browInL.clone();
  ((browInR.position.x = 0.054), o.add(browInR));
  const I = new e.Mesh(
    new e.SphereGeometry(0.118, 48, 48, 0, 2 * Math.PI, 0, 0.76 * Math.PI),
    l,
  );
  (I.position.set(0, 0.036, -0.04),
    I.scale.set(0.74, 0.74, 0.68),
    (I.rotation.x = -0.12),
    o.add(I));
  const A = new e.Mesh(new e.SphereGeometry(0.092, 40, 40), l);
  (A.position.set(0, -0.012, -0.11), A.scale.set(0.68, 0.84, 0.56), o.add(A));
  const C = new e.Mesh(new e.SphereGeometry(0.028, 20, 20), l);
  (C.position.set(0.024, 0.086, -0.13), C.scale.set(0.88, 0.78, 0.76), o.add(C));
  const E = new e.Mesh(
    new e.TorusGeometry(0.03, 0.011, 10, 24),
    new e.MeshStandardMaterial({
      color: "#19161a",
      roughness: 0.76,
      metalness: 0.02,
    }),
  );
  (E.position.set(0.024, 0.086, -0.128), (E.rotation.x = Math.PI / 2), o.add(E));
  const U = [
    { x: -0.048, y: 0.064, z: 0.092, w: 0.016, h: 0.094, rx: -0.06, ry: 0.1, rz: 0.12 },
    { x: -0.024, y: 0.06, z: 0.098, w: 0.012, h: 0.078, rx: -0.04, ry: 0.06, rz: 0.06 },
    { x: 0.022, y: 0.06, z: 0.098, w: 0.012, h: 0.078, rx: -0.04, ry: -0.06, rz: -0.06 },
    { x: 0.046, y: 0.064, z: 0.092, w: 0.016, h: 0.094, rx: -0.06, ry: -0.1, rz: -0.12 },
  ];
  U.forEach((t) => {
    const a = buildJuniorHairRibbon(n, t.w, t.h, {
      curve: 0.012,
      topWidth: 0.3,
      bottomWidth: 0.48,
      opacity: 0.82,
    });
    (a.position.set(t.x, t.y, t.z),
      a.rotation.set(t.rx, t.ry, t.rz),
      o.add(a));
  });
  [
    { x: -0.072, y: 0, z: 0.064, w: 0.022, h: 0.16, ry: 0.28, rz: 0.12 },
    { x: -0.056, y: -0.008, z: 0.084, w: 0.012, h: 0.084, ry: 0.14, rz: 0.04, opacity: 0.58 },
    { x: 0.072, y: 0, z: 0.064, w: 0.022, h: 0.16, ry: -0.28, rz: -0.12 },
    { x: 0.056, y: -0.008, z: 0.084, w: 0.012, h: 0.084, ry: -0.14, rz: -0.04, opacity: 0.58 },
  ].forEach((t) => {
    const a = buildJuniorHairRibbon(n, t.w, t.h, {
      curve: 0.016,
      topWidth: 0.42,
      bottomWidth: 0.58,
      opacity: t.opacity ?? 0.78,
    });
    (a.position.set(t.x, t.y, t.z),
      a.rotation.set(-0.02, t.ry, t.rz),
      o.add(a));
  });
  const W = new e.Group();
  (W.position.set(0.026, 0.066, -0.134), o.add(W));
  [
    { y: -0.018, z: -0.008, r: 0.02, len: 0.074, rotX: -0.16, rotZ: -0.06 },
    { y: -0.082, z: 0, r: 0.018, len: 0.088, rotX: -0.1, rotZ: -0.08 },
    { y: -0.152, z: 0.01, r: 0.015, len: 0.072, rotX: -0.06, rotZ: -0.08 },
  ].forEach((t, idx) => {
    const o = new e.Mesh(new e.CapsuleGeometry(t.r, t.len, 6, 10), l);
    (o.position.set(0.01, t.y, t.z),
      o.rotation.set(t.rotX, 0.08, t.rotZ),
      o.scale.set(0.84, 0.9, 0.64),
      // Tier 4 馬尾段可動，越下面 mass 越輕（擺動越明顯）
      (o.userData.cloth = true),
      (o.userData.clothMass = 1.5 - idx * 0.4),
      W.add(o));
  });
  // Tier 2.2 牙齒 plane — 嘴唇後方淡白 plane（避免微張嘴時內部全黑）
  const teethPlane = new e.Mesh(
    new e.PlaneGeometry(0.024, 0.005),
    new e.MeshStandardMaterial({
      color: "#f5f0e0",
      roughness: 0.32,
      metalness: 0.04,
      transparent: !0,
      opacity: 0.72,
    }),
  );
  (teethPlane.position.set(0, -0.094, 0.094),
    (teethPlane.renderOrder = 16),
    o.add(teethPlane));
  // Tier 2.2 耳朵 — 左右兩側 sphere（用副皮膚 i 含 SSS，耳殼薄處透光）
  const earL = new e.Mesh(new e.SphereGeometry(0.022, 16, 16), i);
  (earL.position.set(-0.082, -0.025, 0.005),
    earL.scale.set(0.38, 1.0, 0.55),
    (earL.rotation.z = 0.18),
    o.add(earL));
  const earR = earL.clone();
  ((earR.position.x = 0.090),
    (earR.rotation.z = -0.18),
    o.add(earR));
  // Tier 2.3 鎖骨 — 脖子下方斜向外的細 capsule（黃昏側光打鎖骨陰影超有戲）
  const collarBoneL = new e.Mesh(new e.CapsuleGeometry(0.0034, 0.058, 4, 8), r);
  (collarBoneL.position.set(-0.034, -0.182, 0.054),
    (collarBoneL.rotation.z = -1.18),
    (collarBoneL.rotation.y = 0.20),
    collarBoneL.scale.set(0.55, 1, 0.5),
    o.add(collarBoneL));
  const collarBoneR = collarBoneL.clone();
  ((collarBoneR.position.x = 0.054),
    (collarBoneR.rotation.z = 1.18),
    (collarBoneR.rotation.y = -0.20),
    o.add(collarBoneR));
  // Tier 2.3 髮絲飛揚 — 馬尾後方延伸的飄逸細條（沿用 hair material l 自帶 anisotropy）
  const flyHairData = [
    { px: 0.04, py: 0.04, pz: -0.18, rx: -0.4, rz: -0.1 },
    { px: 0.05, py: -0.02, pz: -0.20, rx: -0.5, rz: 0.05 },
    { px: 0.04, py: -0.08, pz: -0.22, rx: -0.6, rz: -0.08 },
  ];
  for (const cfg of flyHairData) {
    const flyRibbon = new e.Mesh(new e.PlaneGeometry(0.006, 0.07, 1, 6), l);
    const flyR = flyRibbon.geometry.attributes.position;
    for (let fi = 0; fi < flyR.count; fi++) {
      const fy = flyR.getY(fi);
      const ft = (fy + 0.035) / 0.07;
      flyR.setZ(fi, Math.sin(ft * Math.PI) * 0.005);
    }
    flyR.needsUpdate = true;
    flyRibbon.geometry.computeVertexNormals();
    flyRibbon.position.set(cfg.px, cfg.py, cfg.pz);
    flyRibbon.rotation.set(cfg.rx, 0, cfg.rz);
    o.add(flyRibbon);
  }
  const D = new e.Mesh(
    new e.PlaneGeometry(0.16, 0.11),
    new e.MeshBasicMaterial({
      color: "#1e1514",
      transparent: !0,
      opacity: 0.02,
      depthWrite: !1,
    }),
  );
  (D.position.set(0, 0.03, 0.088), (D.renderOrder = 16), o.add(D));
  return (
    o.traverse((t) => {
      t.isMesh && ((t.castShadow = !1), (t.receiveShadow = !1));
    }),
    {
      root: o,
      refs: {
        headShell: w,
        jawShell: M,
        // 眼睛（每隻：白/虹膜/瞳孔/眼瞼/睫毛/雙眼皮/角膜，給 expression-rig 全套用）
        heroEyeWhiteL: eyeL.eyeWhite, heroEyeWhiteR: eyeR.eyeWhite,
        heroIrisL: eyeL.iris,         heroIrisR: eyeR.iris,
        heroPupilL: eyeL.pupil,       heroPupilR: eyeR.pupil,
        heroUpperLidL: eyeL.upperLid, heroUpperLidR: eyeR.upperLid,
        heroLowerLidL: eyeL.lowerLid, heroLowerLidR: eyeR.lowerLid,
        heroLashL: eyeL.lashPlane,    heroLashR: eyeR.lashPlane,
        heroDoubleLidL: eyeL.doubleLid, heroDoubleLidR: eyeR.doubleLid,
        heroCorneaL: eyeL.cornea,     heroCorneaR: eyeR.cornea,
        // 眉毛
        heroBrowL: T, heroBrowR: R,
        // 嘴部
        heroUpperLip: G, heroLowerLip: z, heroLipLine: v,
        // 頭髮
        heroHairCap: I,
        heroPonytail: W,
        // B8 情緒驅動皮膚（blush + sweat overlay）
        heroBlushL: blushL,
        heroBlushR: blushR,
        heroSweat: sweatDrop,
      },
    }
  );
}
function S(t) {
  const o = new e.Group();
  o.userData.baseY = 0;
  const a = Boolean(t.referenceJunior),
    n = t.female && a,
    s = new e.MeshPhysicalMaterial({
      color: t.torso,
      roughness: t.female ? 0.42 : 0.5,
      metalness: 0.02,
      clearcoat: t.female ? 0.14 : 0.06,
      clearcoatRoughness: 0.52,
    }),
    r = new e.MeshPhysicalMaterial({
      color: t.torsoAccent ?? t.torso,
      roughness: t.female ? 0.36 : 0.42,
      metalness: 0.03,
      clearcoat: t.female ? 0.18 : 0.08,
      clearcoatRoughness: 0.44,
    }),
    i = new e.MeshPhysicalMaterial({
      color: t.legs,
      roughness: n ? 0.72 : t.female ? 0.44 : 0.54,
      metalness: 0.02,
      clearcoat: t.female ? 0.1 : 0.04,
      clearcoatRoughness: 0.4,
    }),
    l = n
      ? new e.Color(t.skin).lerp(new e.Color("#ffe4d0"), 0.15)
      : new e.Color(t.skin),
    c = new e.MeshPhysicalMaterial({
      color: l,
      roughness: n ? 0.18 : 0.36,
      metalness: 0,
      clearcoat: n ? 0.42 : 0.22,
      clearcoatRoughness: n ? 0.28 : 0.56,
      sheen: n ? 0.85 : 0.18,
      sheenRoughness: n ? 0.2 : 0.65,
      sheenColor: new e.Color(n ? "#ffc8a8" : t.female ? "#ffcfb8" : "#e8b8a4"),
    }),
    h = new e.MeshPhysicalMaterial({
      color: t.female ? "#f3c3bc" : "#d7a18f",
      roughness: 0.56,
      metalness: 0,
      transparent: !0,
      opacity: t.female ? 0.26 : 0.14,
      sheen: 0.1,
    }),
    d = new e.MeshPhysicalMaterial({
      color: t.hair,
      roughness: n ? 0.12 : 0.34,
      metalness: n ? 0.06 : 0.08,
      clearcoat: n ? 0.58 : 0.12,
      clearcoatRoughness: n ? 0.14 : 0.3,
      sheen: n ? 0.32 : 0,
      sheenRoughness: n ? 0.28 : 1,
      sheenColor: new e.Color(n ? "#7a5a3a" : "#000"),
    }),
    p = new e.MeshPhysicalMaterial({
      color: t.shoes,
      roughness: 0.56,
      metalness: 0.1,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
    }),
    m = new e.MeshPhysicalMaterial({
      color: "#f6ede3",
      roughness: 0.42,
      metalness: 0.06,
      clearcoat: 0.16,
      clearcoatRoughness: 0.28,
    }),
    w = new e.Mesh(
      new e.CapsuleGeometry(
        t.female ? (n ? 0.118 : 0.126) : 0.132,
        0.18,
        5,
      10,
      ),
      s,
    );
  if (n) {
    s.roughness = 0.32;
    s.clearcoat = 0.22;
    s.clearcoatRoughness = 0.22;
    r.roughness = 0.28;
    r.clearcoat = 0.26;
    r.clearcoatRoughness = 0.2;
    i.roughness = 0.36;
    i.clearcoat = 0.15;
    i.clearcoatRoughness = 0.24;
    c.roughness = 0.12;
    c.clearcoat = 0.58;
    c.clearcoatRoughness = 0.14;
    c.sheen = 0.95;
    c.sheenRoughness = 0.12;
    c.sheenColor = new e.Color("#ffc4a0");
    d.roughness = 0.06;
    d.metalness = 0.1;
    d.clearcoat = 0.88;
    d.clearcoatRoughness = 0.06;
    d.sheen = 0.45;
    d.sheenRoughness = 0.12;
    d.sheenColor = new e.Color("#8a6a42");
    p.roughness = 0.44;
    p.clearcoat = 0.16;
    m.roughness = 0.3;
    m.clearcoat = 0.2;
  }
  (w.position.set(0, 0.84, 0),
    w.scale.set(t.female ? (n ? 0.88 : 1.04) : 1.14, n ? 1.04 : 1.02, n ? 0.76 : 0.86),
    o.add(w));
  const M = new e.Mesh(
    new e.CapsuleGeometry(
      t.female ? (n ? 0.148 : 0.172) : 0.166,
      t.female ? (n ? 0.54 : 0.62) : 0.6,
      8,
      18,
    ),
    s,
  );
  (M.position.set(0, 1.08, 0),
    M.scale.set(t.female ? (n ? 0.86 : 0.98) : 1.1, 1.04, t.female ? (n ? 0.74 : 0.82) : 0.9),
    o.add(M));
  const f = new e.Mesh(
    new e.SphereGeometry(t.female ? (n ? 0.148 : 0.172) : 0.158, 22, 22),
    r,
  );
  let u;
  if (
    (f.position.set(0, 1.13, 0.038),
    f.scale.set(n ? 0.9 : 1.06, t.female ? (n ? 0.52 : 0.64) : 0.58, t.female ? (n ? 0.42 : 0.52) : 0.58),
    o.add(f),
    n)
  ) {
    u = new e.CylinderGeometry(0.166, 0.19, 0.16, 24, 1, !1);
    const t = u.getAttribute("position");
    for (let e = 0; e < t.count; e++) {
      const o = t.getY(e);
      if (o < -0.07) {
        const a = Math.atan2(t.getZ(e), t.getX(e)),
          n = 0.005 * Math.sin(6 * a) + 0.002 * Math.sin(12 * a);
        t.setY(e, o + n);
      }
    }
    ((t.needsUpdate = !0), u.computeVertexNormals());
  } else
    u = new e.CylinderGeometry(
      t.female ? 0.166 : 0.158,
      t.female ? 0.208 : 0.174,
      t.female ? 0.24 : 0.22,
      16,
    );
  const y = new e.Mesh(u, i);
  if (
    (y.position.set(0, n ? 0.75 : t.female ? 0.71 : 0.74, 0),
    o.add(y),
    t.female)
  ) {
    const a = new e.MeshPhysicalMaterial({
        color: t.legs,
        roughness: 0.38,
        metalness: 0.03,
        clearcoat: 0.16,
        clearcoatRoughness: 0.3,
      }),
      n = new e.Mesh(new e.TorusGeometry(0.138, 0.014, 8, 24), a);
    (n.position.set(0, 0.83, 0), (n.rotation.x = Math.PI / 2), o.add(n));
  }
  const g = new e.CapsuleGeometry(
      t.female ? (n ? 0.05 : 0.064) : 0.072,
      t.female ? (n ? 0.68 : 0.74) : 0.68,
      6,
      12,
    ),
    S = new e.Mesh(g, c);
  (S.position.set(t.female ? (n ? -0.072 : -0.085) : -0.092, t.female ? 0.36 : 0.34, 0.01),
    (S.rotation.z = 0.02));
  const z = S.clone();
  ((z.position.x = t.female ? (n ? 0.072 : 0.085) : 0.092),
    (z.rotation.z = -0.02),
    o.add(S, z));
  if (n) {
    var collarMat = new e.MeshPhysicalMaterial({color:"#fcfcfa",roughness:0.34,metalness:0.01,clearcoat:0.2,clearcoatRoughness:0.2});
    var collarL = new e.Mesh(new e.BoxGeometry(0.07,0.05,0.02), collarMat);
    collarL.position.set(-0.04, 1.38, 0.12); collarL.rotation.set(-0.3, -0.15, -0.2);
    var collarR = new e.Mesh(new e.BoxGeometry(0.07,0.05,0.02), collarMat);
    collarR.position.set(0.04, 1.38, 0.12); collarR.rotation.set(-0.3, 0.15, 0.2);
    o.add(collarL, collarR);
    var cuffMat = new e.MeshPhysicalMaterial({color:"#faf8f5",roughness:0.38,metalness:0.01,clearcoat:0.14});
    var cuffL = new e.Mesh(new e.TorusGeometry(0.032, 0.008, 6, 16), cuffMat);
    cuffL.position.set(-0.085, -0.04, 0.01); cuffL.rotation.x = Math.PI/2; o.add(cuffL);
    var cuffR = cuffL.clone(); cuffR.position.x = 0.085; o.add(cuffR);
  }
  const P = new e.Mesh(
    new e.BoxGeometry(
      t.female ? 0.34 : 0.38,
      t.female ? 0.34 : 0.22,
      t.female ? 0.26 : 0.27,
    ),
    i,
  );
  if ((P.position.set(0, t.female ? 0.67 : 0.63, 0.01), (!n && o.add(P)),
    t.female && (function(){
      var legMat = n ? c : i;
      var legGeo = n
        ? new e.CapsuleGeometry(0.065, 0.36, 6, 12)
        : new e.CapsuleGeometry(0.072, 0.40, 6, 12);
      var legL = new e.Mesh(legGeo, legMat);
      legL.position.set(-0.085, n ? 0.46 : 0.44, 0.008); o.add(legL);
      var legR = legL.clone(); legR.position.x = 0.085; o.add(legR);
      var wb = new e.MeshPhysicalMaterial({color:"#1e3a56",roughness:0.46,metalness:0.04,clearcoat:0.14,clearcoatRoughness:0.3});
      var wm = new e.Mesh(new e.BoxGeometry(0.35,0.05,0.27), wb);
      wm.position.set(0,0.80,0.01); o.add(wm);
      var cuffGeo = new e.CylinderGeometry(n ? 0.078 : 0.085, n ? 0.076 : 0.083, 0.03, 12);
      var cuff = new e.Mesh(cuffGeo, wb);
      cuff.position.set(-0.085, n ? 0.62 : 0.62, 0.008); o.add(cuff);
      var cuffR = cuff.clone(); cuffR.position.x = 0.085; o.add(cuffR);
    })(),
    !t.female)) {
    // 牛仔褲 box 尺寸必須完整包覆膚色 capsule 腿(S/z, 直徑 0.144 / Y span -0.072~0.752)
    const t = new e.Mesh(new e.BoxGeometry(0.165, 0.72, 0.19), i);
    t.position.set(-0.095, 0.37, 0.008);
    const a = t.clone();
    a.position.x = 0.095;
    const n = new e.Mesh(
      new e.BoxGeometry(0.34, 0.05, 0.18),
      new e.MeshStandardMaterial({
        color: "#181a20",
        roughness: 0.58,
        metalness: 0.06,
      }),
    );
    (n.position.set(0, 0.72, 0.016), o.add(t, a, n));
  }
  const v = new e.BoxGeometry(n ? 0.1 : 0.13, n ? 0.05 : 0.06, n ? 0.2 : 0.25),
    G = new e.Mesh(v, p);
  (G.position.set(t.female ? (n ? -0.078 : -0.094) : -0.102, 0.042, 0.055),
    (G.rotation.x = 0.04));
  const C = G.clone();
  ((C.position.x = t.female ? (n ? 0.078 : 0.094) : 0.102), o.add(G, C));
  const B = new e.Mesh(
    new e.SphereGeometry(t.female ? (n ? 0.068 : 0.086) : 0.102, 18, 18),
    s,
  );
  B.position.set(t.female ? (n ? -0.158 : -0.188) : -0.252, 1.18, 0);
  const k = B.clone();
  if (((k.position.x = t.female ? (n ? 0.158 : 0.188) : 0.236), o.add(B, k), n)) {
    const t = c.clone(),
      a = new e.Mesh(new e.SphereGeometry(0.036, 14, 14), t);
    (a.position.set(-0.206, 1.2, 0.01), a.scale.set(1.1, 0.9, 0.85));
    const n = a.clone();
    ((n.position.x = 0.206), o.add(a, n));
  }
  const T = new e.CapsuleGeometry(
      t.female ? (n ? 0.042 : 0.048) : 0.056,
      t.female ? 0.42 : 0.46,
      5,
      10,
    ),
    I = new e.Mesh(T, c);
  (I.position.set(t.female ? -0.228 : -0.266, 1, 0.02),
    (I.rotation.z = t.female ? 0.12 : 0.15));
  const R = I.clone();
  if (
    ((R.position.x = t.female ? 0.228 : 0.246),
    (R.rotation.z = t.female ? -0.12 : -0.15),
    o.add(I, R),
    n)
  ) {
    const t = new e.MeshPhysicalMaterial({
        color: l,
        roughness: 0.18,
        metalness: 0,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      }),
      a = new e.Mesh(new e.TorusGeometry(0.034, 0.006, 8, 16), t);
    (a.position.set(-0.252, 0.75, 0.035), (a.rotation.z = 0.12));
    const n = a.clone();
    ((n.position.x = 0.252), (n.rotation.z = -0.12), o.add(a, n));
  }
  const D = new e.SphereGeometry(t.female ? (n ? 0.038 : 0.048) : 0.054, 18, 18),
    V = new e.Mesh(D, c);
  V.position.set(t.female ? (n ? -0.242 : -0.264) : -0.302, 0.71, 0.04);
  const E = V.clone();
  if (
    ((E.position.x = t.female ? (n ? 0.242 : 0.264) : 0.286),
    n && (V.scale.set(0.72, 0.92, 1.1), E.scale.set(0.72, 0.92, 1.1)),
    o.add(V, E),
    n)
  ) {
    const t = c.clone(),
      a = new e.CylinderGeometry(0.008, 0.006, 0.06, 8),
      n = new e.Mesh(a, t);
    (n.position.set(-0.264, 0.676, 0.06), (n.rotation.x = 0.38 * Math.PI));
    const s = n.clone();
    ((s.position.x = 0.264), o.add(n, s));
  }
  const U = new e.CylinderGeometry(
      t.female ? (n ? 0.056 : 0.072) : 0.078,
      t.female ? (n ? 0.062 : 0.078) : 0.084,
      n ? 0.16 : 0.2,
      14,
    ),
    W = new e.Mesh(U, r);
  (W.position.set(t.female ? (n ? -0.166 : -0.18) : -0.2, 1.1, 0.02), (W.rotation.z = 1.06));
  const q = W.clone();
  ((q.position.x = t.female ? (n ? 0.166 : 0.18) : 0.2), (q.rotation.z = -1.06), o.add(W, q));
  const _ = c.clone();
  _.color = new e.Color(t.skin).lerp(new e.Color("#e8b89c"), 0.12);
  const A = new e.Mesh(new e.CylinderGeometry(n ? 0.052 : 0.065, n ? 0.066 : 0.08, n ? 0.12 : 0.14, 18), _);
  (A.position.set(0, n ? 1.34 : 1.33, 0.02), o.add(A));
  const Z = new e.Mesh(
    new e.TorusGeometry(0.082, 0.01, 8, 24),
    new e.MeshPhysicalMaterial({
      color: t.female ? "#fffdf6" : "#e6ebf0",
      roughness: 0.52,
      metalness: 0.01,
      clearcoat: 0.1,
    }),
  );
  (Z.position.set(0, 1.26, 0.02), (Z.rotation.x = Math.PI / 2), o.add(Z));
  const L = new e.Mesh(
    new e.SphereGeometry(t.female ? 0.168 : 0.182, 48, 48),
    c,
  );
  (L.position.set(0, 1.56, 0),
    L.scale.set(
      t.female ? (a ? 0.7 : 0.94) : 0.98,
      t.female ? (a ? 1.16 : 1.08) : 1.04,
      t.female ? (a ? 0.78 : 0.91) : 0.9,
    ),
    o.add(L),
    n && (L.position.set(0, 1.555, 0.01), L.scale.set(0.82, 1.12, 0.8)));
  const X = new e.Mesh(
    new e.SphereGeometry(t.female ? 0.14 : 0.154, 36, 36),
    c,
  );
  (X.position.set(0, t.female ? 1.47 : 1.48, 0.02),
    X.scale.set(
      t.female ? (a ? 0.6 : 0.92) : 1.02,
      t.female ? (a ? 0.52 : 0.78) : 0.84,
      t.female ? (a ? 0.7 : 0.88) : 0.92,
    ),
    o.add(X),
    n && (X.position.set(0, 1.462, 0.032), X.scale.set(0.44, 0.34, 0.52)));
  const j = new e.SphereGeometry(0.032, 16, 16),
    $ = new e.Mesh(j, c);
  ($.position.set(-0.165, 1.55, 0.01), $.scale.set(0.72, 1.02, 0.56));
  const H = $.clone();
  ((H.position.x = 0.165),
    o.add($, H),
    n &&
      ($.position.set(-0.128, 1.514, 0.01),
      H.position.set(0.128, 1.514, 0.01),
      $.scale.set(0.44, 0.66, 0.42),
      H.scale.copy($.scale)));
  const F = new e.Mesh(
    new e.ConeGeometry(
      t.female ? (a ? 0.007 : 0.024) : 0.026,
      t.female ? (a ? 0.026 : 0.062) : 0.07,
      12,
    ),
    c,
  );
  (F.position.set(0, a ? 1.538 : 1.54, a ? 0.149 : 0.154),
    (F.rotation.x = 0.5 * Math.PI),
    o.add(F));
  const N = new e.Mesh(
    new e.CapsuleGeometry(a ? 0.004 : 0.006, a ? 0.04 : 0.08, 4, 10),
    new e.MeshPhysicalMaterial({
      color: "#fff8f2",
      roughness: 0.28,
      metalness: 0,
      transparent: !0,
      opacity: 0.24,
      clearcoat: 0.22,
      clearcoatRoughness: 0.16,
    }),
  );
  (N.position.set(0, a ? 1.553 : 1.57, a ? 0.145 : 0.135),
    a && (N.rotation.x = Math.PI / 2),
    o.add(N));
  const O = new e.Mesh(
    new e.TorusGeometry(
      t.female && a ? 0.038 : 0.045,
      t.female && a ? 0.0065 : 0.009,
      8,
      18,
      Math.PI,
    ),
    new e.MeshStandardMaterial({
      color: t.female ? "#cc7282" : "#ae7670",
      roughness: 0.5,
      metalness: 0.03,
    }),
  );
  if (
    (O.position.set(0, a ? 1.446 : 1.46, a ? 0.154 : 0.148),
    (O.rotation.x = Math.PI),
    o.add(O),
    n)
  ) {
    const t = new e.Mesh(
      new e.SphereGeometry(0.024, 14, 14),
      new e.MeshStandardMaterial({
        color: "#f3b6bc",
        roughness: 0.48,
        metalness: 0.02,
        transparent: !0,
        opacity: 0.72,
      }),
    );
    (t.position.set(0, 1.433, 0.153), t.scale.set(1.64, 0.42, 0.42), o.add(t));
  }
  const J = new e.MeshStandardMaterial({
      color: t.female ? "#3a2422" : "#31201e",
      roughness: 0.7,
      metalness: 0.02,
    }),
    K = new e.Mesh(
      a
        ? new e.CapsuleGeometry(0.0038, 0.045, 4, 8)
        : new e.BoxGeometry(0.08, 0.012, 0.02),
      J,
    );
  (K.position.set(a ? -0.061 : -0.074, a ? 1.596 : 1.62, a ? 0.148 : 0.136),
    a ? (K.rotation.z = -1.28) : (K.rotation.z = -0.08));
  const Q = K.clone();
  ((Q.position.x = a ? 0.067 : 0.072),
    (Q.rotation.z = a ? 1.28 : 0.08),
    o.add(K, Q),
    n &&
      (K.position.set(-0.06, 1.592, 0.152), Q.position.set(0.06, 1.592, 0.152)));
  const ee = new e.TorusGeometry(
      t.female && a ? 0.034 : 0.032,
      0.004,
      6,
      18,
      Math.PI,
    ),
    te = new e.MeshStandardMaterial({
      color: t.female ? "#3a1f20" : "#2f1d1e",
      roughness: 0.54,
      metalness: 0.02,
    }),
    oe = new e.Mesh(ee, te);
  (oe.position.set(a ? -0.068 : -0.062, 1.57, 0.168),
    (oe.rotation.z = Math.PI));
  const ae = oe.clone();
  ((ae.position.x = a ? 0.064 : 0.062), o.add(oe, ae));
  const ne = new e.MeshPhysicalMaterial({
      color: n ? "#fdfeff" : "#fcfcfd",
      roughness: n ? 0.08 : 0.18,
      metalness: 0.01,
      clearcoat: n ? 0.72 : 0.14,
      clearcoatRoughness: n ? 0.06 : 0.12,
      sheen: n ? 0.3 : 0,
      sheenRoughness: n ? 0.15 : 1,
      sheenColor: n ? new e.Color("#e8f0ff") : new e.Color("#000"),
    }),
    se = new e.MeshPhysicalMaterial({
      color: t.iris ?? (t.female ? "#3a261f" : "#2b1c18"),
      roughness: n ? 0.16 : 0.34,
      metalness: n ? 0.04 : 0.02,
      clearcoat: n ? 0.62 : 0.12,
      clearcoatRoughness: n ? 0.08 : 0.2,
    }),
    re = new e.Mesh(
      new e.SphereGeometry(t.female && a ? 0.025 : 0.022, 12, 12),
      ne,
    );
  (re.position.set(a ? -0.068 : -0.062, 1.56, a ? 0.158 : 0.15),
    re.scale.set(t.female && a ? 1.56 : 1.35, t.female && a ? 1.02 : 0.9, 0.5));
  const ie = re.clone();
  ie.position.x = a ? 0.068 : 0.062;
  const le = new e.Mesh(
    new e.SphereGeometry(t.female && a ? 0.0122 : 0.011, 10, 10),
    se,
  );
  le.position.set(a ? -0.068 : -0.062, a ? 1.558 : 1.56, a ? 0.175 : 0.166);
  const ce = le.clone();
  if (
    ((ce.position.x = a ? 0.068 : 0.062),
    o.add(re, ie, le, ce),
    n &&
      (re.position.set(-0.064, 1.557, 0.16),
      ie.position.set(0.064, 1.557, 0.16),
      re.scale.set(1.64, 1.08, 0.56),
      ie.scale.copy(re.scale),
      le.position.set(-0.062, 1.554, 0.176),
      ce.position.set(0.062, 1.554, 0.176),
      le.scale.set(1.1, 1.02, 0.88),
      ce.scale.copy(le.scale)),
    t.female)
  ) {
    const t = new e.MeshStandardMaterial({
        color: "#241618",
        roughness: 0.52,
        metalness: 0.02,
      }),
      n = new e.Mesh(new e.BoxGeometry(a ? 0.064 : 0.058, a ? 0.012 : 0.01, a ? 0.016 : 0.014), t);
    (n.position.set(a ? -0.068 : -0.062, a ? 1.585 : 1.586, 0.174),
      (n.rotation.z = a ? -0.012 : -0.03));
    const s = n.clone();
    ((s.position.x = a ? 0.068 : 0.062),
      (s.rotation.z = a ? 0.012 : 0.03),
      o.add(n, s));
    if (a) {
      var lashTipL = new e.Mesh(new e.BoxGeometry(0.02, 0.008, 0.012), t);
      lashTipL.position.set(-0.098, 1.582, 0.168); lashTipL.rotation.z = -0.2;
      var lashTipR = lashTipL.clone(); lashTipR.position.x = 0.098; lashTipR.rotation.z = 0.2;
      o.add(lashTipL, lashTipR);
    }
  }
  re.userData.baseScale = re.scale.clone();
  ie.userData.baseScale = ie.scale.clone();
  le.userData.baseScale = le.scale.clone();
  ce.userData.baseScale = ce.scale.clone();
  const he = new e.SphereGeometry(0.028, 12, 12),
    de = new e.Mesh(he, h);
  (de.position.set(a ? -0.076 : -0.094, a ? 1.476 : 1.488, 0.146),
    de.scale.set(a ? 0.92 : 1.7, a ? 0.62 : 1.2, 0.32));
  const pe = de.clone();
  ((pe.position.x = a ? 0.084 : 0.094), o.add(de, pe));
  if (n) {
    var blushMat = new e.MeshStandardMaterial({color:"#f4a0a8",roughness:0.7,metalness:0,transparent:!0,opacity:0.18});
    var blushL = new e.Mesh(new e.SphereGeometry(0.022, 10, 10), blushMat);
    blushL.position.set(-0.082, 1.48, 0.152); blushL.scale.set(1.4, 0.7, 0.3);
    var blushR = blushL.clone(); blushR.position.x = 0.082;
    o.add(blushL, blushR);
  }
  const me = new e.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: n ? 0.38 : 0.12,
      roughness: n ? 0.06 : 0.2,
      metalness: n ? 0.05 : 0.02,
    }),
    we = new e.Mesh(new e.SphereGeometry(n ? 0.007 : 0.004, 8, 8), me);
  we.position.set(a ? -0.058 : -0.055, n ? 1.573 : 1.568, n ? 0.188 : 0.176);
  n && we.scale.set(1.3, 1.3, 1.0);
  const Me = we.clone();
  ((Me.position.x = a ? 0.072 : 0.069), o.add(we, Me));
  if (n) {
    var spark2L = new e.Mesh(new e.SphereGeometry(0.004, 8, 8), me);
    spark2L.position.set(-0.072, 1.564, 0.185);
    var spark2R = spark2L.clone(); spark2R.position.x = 0.058;
    var spark3Mat = new e.MeshStandardMaterial({color:"#ffffff",emissive:"#f0f4ff",emissiveIntensity:0.22,roughness:0.08,metalness:0.03});
    var spark3L = new e.Mesh(new e.SphereGeometry(0.0025, 6, 6), spark3Mat);
    spark3L.position.set(-0.054, 1.57, 0.186);
    var spark3R = spark3L.clone(); spark3R.position.x = 0.076;
    o.add(spark2L, spark2R, spark3L, spark3R);
  }
  const fe = new e.Mesh(
    new e.SphereGeometry(
      t.female ? (n ? 0.202 : 0.194) : 0.188,
      28,
      28,
      0,
      2 * Math.PI,
      0,
      0.72 * Math.PI,
    ),
    d,
  );
  (fe.position.set(0, 1.62, -0.01), (fe.rotation.x = -0.1), !t.pompadour && o.add(fe));
  const ue = new e.Mesh(
    new e.SphereGeometry(t.female ? 0.214 : 0.182, 28, 28),
    d,
  );
  (ue.position.set(0, t.female ? 1.5 : 1.61, t.female ? -0.08 : -0.1),
    ue.scale.set(0.88, t.female ? 1.42 : 0.42, t.female ? 0.7 : 0.52),
    !t.pompadour && o.add(ue));
  if (a) {
    fe.scale.set(0.88, 0.86, 0.84);
    fe.position.set(0, 1.604, 0.024);
    ue.scale.set(0.78, t.female ? 1.08 : 0.42, t.female ? 0.52 : 0.52);
    ue.position.set(0, t.female ? 1.472 : 1.61, t.female ? -0.116 : -0.1);
  }
  if (t.ponytail && t.female) {
    const ptLen = t.ponytailLength ?? 0.36;
    const ptCurve = t.ponytailCurve ?? 0.1;
    const ptMat = new e.MeshPhysicalMaterial({
      color: t.hair, roughness: 0.14, metalness: 0.05,
      clearcoat: 0.62, clearcoatRoughness: 0.12,
      sheen: 0.4, sheenRoughness: 0.2,
      sheenColor: new e.Color("#6a4a30"),
    });
    const bandMat = new e.MeshPhysicalMaterial({
      color: "#e8d0b8", roughness: 0.52, metalness: 0.02,
      clearcoat: 0.18, clearcoatRoughness: 0.3,
    });
    const ptBand = new e.Mesh(new e.TorusGeometry(0.028, 0.006, 8, 16), bandMat);
    ptBand.position.set(0, 1.52, -0.12);
    ptBand.rotation.x = Math.PI * 0.38;
    ptBand.name = "scrunchie";
    o.add(ptBand);
    const ptCurveObj = new e.CatmullRomCurve3([
      new e.Vector3(0, 1.52, -0.12),
      new e.Vector3(0, 1.48 - ptCurve * 0.3, -0.14 - ptLen * 0.3),
      new e.Vector3(0, 1.42 - ptCurve, -0.16 - ptLen * 0.6),
      new e.Vector3(0, 1.36 - ptCurve * 1.4, -0.15 - ptLen * 0.8),
    ]);
    const ptGeo = new e.TubeGeometry(ptCurveObj, 24, 0.024, 10, !1);
    const ptMesh = new e.Mesh(ptGeo, ptMat);
    ptMesh.name = "ponytail-main";
    o.add(ptMesh);
    const ptTipCurve = new e.CatmullRomCurve3([
      new e.Vector3(0, 1.36 - ptCurve * 1.4, -0.15 - ptLen * 0.8),
      new e.Vector3(0.01, 1.3 - ptCurve * 1.6, -0.13 - ptLen * 0.9),
      new e.Vector3(0.005, 1.24 - ptCurve * 1.8, -0.1 - ptLen),
    ]);
    const ptTip = new e.Mesh(
      new e.TubeGeometry(ptTipCurve, 16, 0.016, 8, !1),
      ptMat.clone()
    );
    ptTip.material.opacity = 0.85; ptTip.material.transparent = !0;
    ptTip.name = "ponytail-tip";
    o.add(ptTip);
    for (let si = 0; si < 3; si++) {
      const xOff = (si - 1) * 0.012;
      const sCurve = new e.CatmullRomCurve3([
        new e.Vector3(xOff, 1.52, -0.12),
        new e.Vector3(xOff + 0.004, 1.46 - ptCurve * 0.5, -0.15 - ptLen * 0.4),
        new e.Vector3(xOff - 0.002, 1.38 - ptCurve * 1.2, -0.14 - ptLen * 0.7),
      ]);
      const sMat = ptMat.clone();
      sMat.opacity = 0.6 + si * 0.1; sMat.transparent = !0;
      const sMesh = new e.Mesh(new e.TubeGeometry(sCurve, 18, 0.004, 6, !1), sMat);
      o.add(sMesh);
    }
  }
  const ye = new e.Mesh(
    a
      ? new e.CapsuleGeometry(0.018, 0.056, 4, 8)
      : new e.BoxGeometry(0.2, 0.08, 0.05),
    d,
  );
  (ye.position.set(0, a ? 1.622 : 1.612, a ? 0.134 : 0.12),
    a && ((ye.rotation.z = -0.08), (ye.rotation.x = 0.22)),
    !t.pompadour && o.add(ye),
    n &&
      (ye.position.set(0, 1.606, 0.132),
      ye.scale.set(0.84, 0.92, 0.82),
      (ye.rotation.z = -0.04),
      (ye.rotation.x = 0.18)));
  const ge = new e.Mesh(
    a
      ? new e.CapsuleGeometry(0.012, 0.2, 4, 10)
      : new e.BoxGeometry(0.076, 0.42, 0.06),
    d,
  );
  ge.position.set(a ? -0.126 : -0.14, a ? 1.454 : t.female ? 1.458 : 1.49, 0.05);
  a && ((ge.rotation.z = 0.16), (ge.rotation.x = 0.02));
  const xe = ge.clone();
  ((xe.position.x = a ? 0.108 : 0.15),
    !t.pompadour && o.add(ge, xe),
    n &&
      (ge.position.set(-0.122, 1.452, 0.062),
      xe.position.set(0.122, 1.452, 0.062),
      (xe.rotation.z = -0.16),
      ge.scale.set(0.86, 0.98, 0.82),
      xe.scale.copy(ge.scale)));
  // ── Natural short male hair + black-frame glasses (senior only) ──────────
  if (t.pompadour) {
    // Main hair cap — full coverage on top of head
    const pBase = new e.Mesh(
      new e.SphereGeometry(0.196, 28, 28, 0, 2 * Math.PI, 0, 0.72 * Math.PI),
      d,
    );
    pBase.position.set(0, 1.618, -0.006);
    pBase.rotation.x = -0.08;
    pBase.scale.set(0.96, 0.78, 0.94);
    o.add(pBase);
    // Back hair volume
    const pBack = new e.Mesh(new e.SphereGeometry(0.186, 22, 22), d);
    pBack.position.set(0, 1.604, -0.082);
    pBack.scale.set(0.86, 0.50, 0.62);
    o.add(pBack);
    // Left side hair — tapered but clearly visible
    const pSideL = new e.Mesh(new e.BoxGeometry(0.048, 0.15, 0.11), d);
    pSideL.position.set(-0.152, 1.51, 0.012);
    pSideL.rotation.z = 0.05;
    o.add(pSideL);
    // Right side hair
    const pSideR = pSideL.clone();
    pSideR.position.x = 0.152;
    pSideR.rotation.z = -0.05;
    o.add(pSideR);
    // Top volume — natural body swept slightly to the right
    const slickPath = new e.CatmullRomCurve3([
      new e.Vector3(0.012, 1.638, 0.088),
      new e.Vector3(0.008, 1.662, 0.044),
      new e.Vector3(0.004, 1.668, -0.004),
      new e.Vector3(0.000, 1.660, -0.050),
      new e.Vector3(-0.002, 1.645, -0.088),
    ]);
    const pSlick = new e.Mesh(
      new e.TubeGeometry(slickPath, 24, 0.064, 10, false),
      d,
    );
    o.add(pSlick);
    // Width fill — broadens the top volume
    const pTopFill = new e.Mesh(new e.BoxGeometry(0.148, 0.054, 0.182), d);
    pTopFill.position.set(0.006, 1.656, -0.002);
    pTopFill.rotation.x = -0.06;
    o.add(pTopFill);
    // Front fringe — natural hairline across forehead
    const fringePath = new e.CatmullRomCurve3([
      new e.Vector3(-0.072, 1.622, 0.098),
      new e.Vector3(-0.024, 1.636, 0.112),
      new e.Vector3(0.028, 1.640, 0.114),
      new e.Vector3(0.076, 1.626, 0.100),
    ]);
    const pFringe = new e.Mesh(
      new e.TubeGeometry(fringePath, 18, 0.032, 8, false),
      d,
    );
    o.add(pFringe);
    // ── Thick black-frame glasses ──────────────────────────────────────────
    const glassesMat = new e.MeshPhysicalMaterial({
      color: "#0a0a0a",
      roughness: 0.28,
      metalness: 0.38,
      clearcoat: 0.62,
      clearcoatRoughness: 0.18,
    });
    // Left lens frame (thick torus)
    const lensL = new e.Mesh(new e.TorusGeometry(0.026, 0.007, 8, 20), glassesMat);
    lensL.position.set(-0.055, 1.569, 0.162);
    lensL.rotation.x = Math.PI / 2 - 0.12;
    lensL.scale.set(1.1, 1.0, 1.0);
    o.add(lensL);
    // Right lens frame
    const lensR = lensL.clone();
    lensR.position.x = 0.055;
    o.add(lensR);
    // Nose bridge
    const bridge = new e.Mesh(new e.BoxGeometry(0.024, 0.007, 0.006), glassesMat);
    bridge.position.set(0, 1.572, 0.163);
    o.add(bridge);
    // Left temple arm (goes back toward ear)
    const templeL = new e.Mesh(new e.BoxGeometry(0.007, 0.007, 0.096), glassesMat);
    templeL.position.set(-0.084, 1.569, 0.12);
    o.add(templeL);
    // Right temple arm
    const templeR = templeL.clone();
    templeR.position.x = 0.084;
    o.add(templeR);
  }
  let closeupRefinement = null,
    heroCloseupHead = null;
  const be = new e.Mesh(
    new e.SphereGeometry(t.female ? 0.16 : 0.15, 20, 20),
    new e.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.2,
      metalness: 0.02,
      transparent: !0,
      opacity: 0.08,
    }),
  );
  if (
    (be.position.set(0.02, 1.66, 0.04),
    be.scale.set(0.82, 0.42, 0.5),
    o.add(be),
    a)
  ) {
    const a = new e.MeshPhysicalMaterial({
        color: t.hair,
        roughness: 0.12,
        metalness: 0.04,
        clearcoat: 0.42,
        clearcoatRoughness: 0.18,
        transparent: !0,
        opacity: 0.14,
        sheen: 0.34,
        sheenRoughness: 0.26,
        sheenColor: new e.Color("#8b6b4a"),
      }),
      n = new e.Mesh(
        new e.SphereGeometry(
          t.female ? 0.148 : 0.192,
          28,
          28,
          0,
          2 * Math.PI,
          0,
          0.54 * Math.PI,
        ),
        a,
      );
    (n.position.set(0, 1.625, -0.008),
      (n.rotation.x = -0.1),
      n.scale.set(0.84, 0.56, 0.74),
      o.add(n),
      (o.userData.referenceHairCap = n),
      fe.scale.set(0.92, 0.88, 0.86),
      ue.scale.set(0.92 * ue.scale.x, 0.96 * ue.scale.y, 0.9 * ue.scale.z),
      (ue.position.y -= 0.01),
      (ue.position.z -= 0.008));
    closeupRefinement = new e.Group();
    closeupRefinement.visible = !1;
    const strandBaseMaterial = new e.MeshPhysicalMaterial({
      color: t.hair,
      roughness: 0.22,
      metalness: 0.03,
      clearcoat: 0.28,
      clearcoatRoughness: 0.22,
      transparent: !0,
      opacity: 0.92,
    });
    const createCloseupStrand = (
      points,
      radius = 0.005,
      opacity = 0.92,
      tubularSegments = 28,
    ) => {
      const material = strandBaseMaterial.clone();
      material.opacity = opacity;
      const curve = new e.CatmullRomCurve3(
        points.map((t) => (t.clone ? t.clone() : new e.Vector3(...t))),
      );
      const strand = new e.Mesh(
        new e.TubeGeometry(curve, tubularSegments, radius, 7, !1),
        material,
      );
      return (
        (strand.castShadow = !0),
        (strand.receiveShadow = !0),
        strand
      );
    };
    const hairlineArc = createCloseupStrand(
      [
        new e.Vector3(-0.118, 1.604, 0.07),
        new e.Vector3(-0.07, 1.624, 0.082),
        new e.Vector3(0, 1.632, 0.086),
        new e.Vector3(0.072, 1.622, 0.082),
        new e.Vector3(0.118, 1.602, 0.07),
      ],
      0.0084,
      0.82,
      36,
    );
    const strandSpecs = [
      {
        points: [
          [-0.086, 1.604, 0.078],
          [-0.074, 1.574, 0.104],
          [-0.062, 1.518, 0.132],
        ],
        radius: 0.0048,
        opacity: 0.9,
      },
      {
        points: [
          [-0.058, 1.61, 0.082],
          [-0.046, 1.58, 0.11],
          [-0.034, 1.506, 0.136],
        ],
        radius: 0.0046,
        opacity: 0.9,
      },
      {
        points: [
          [-0.028, 1.616, 0.082],
          [-0.02, 1.588, 0.11],
          [-0.014, 1.5, 0.136],
        ],
        radius: 0.0042,
        opacity: 0.88,
      },
      {
        points: [
          [0.0, 1.616, 0.082],
          [0.0, 1.592, 0.11],
          [0.0, 1.498, 0.136],
        ],
        radius: 0.0038,
        opacity: 0.82,
      },
      {
        points: [
          [0.028, 1.616, 0.082],
          [0.018, 1.588, 0.11],
          [0.012, 1.5, 0.136],
        ],
        radius: 0.0042,
        opacity: 0.88,
      },
      {
        points: [
          [0.058, 1.61, 0.082],
          [0.044, 1.58, 0.11],
          [0.03, 1.506, 0.136],
        ],
        radius: 0.0046,
        opacity: 0.9,
      },
      {
        points: [
          [0.086, 1.604, 0.078],
          [0.072, 1.574, 0.104],
          [0.06, 1.518, 0.132],
        ],
        radius: 0.0048,
        opacity: 0.9,
      },
      {
        points: [
          [-0.118, 1.582, 0.052],
          [-0.128, 1.53, 0.072],
          [-0.116, 1.452, 0.11],
        ],
        radius: 0.0052,
        opacity: 0.76,
      },
      {
        points: [
          [0.118, 1.582, 0.052],
          [0.128, 1.53, 0.072],
          [0.116, 1.452, 0.11],
        ],
        radius: 0.0052,
        opacity: 0.76,
      },
      {
        points: [
          [-0.134, 1.566, 0.024],
          [-0.148, 1.498, 0.048],
          [-0.138, 1.422, 0.086],
        ],
        radius: 0.0038,
        opacity: 0.56,
        tubularSegments: 24,
      },
      {
        points: [
          [0.134, 1.566, 0.024],
          [0.148, 1.498, 0.048],
          [0.138, 1.422, 0.086],
        ],
        radius: 0.0038,
        opacity: 0.56,
        tubularSegments: 24,
      },
    ];
    const cheekShadowMaterial = new e.MeshStandardMaterial({
      color: "#2b1618",
      roughness: 0.64,
      metalness: 0.01,
      transparent: !0,
      opacity: 0.22,
    });
    const leftTemple = new e.Mesh(
      new e.SphereGeometry(0.024, 12, 12),
      cheekShadowMaterial,
    );
    leftTemple.position.set(-0.09, 1.52, 0.092);
    leftTemple.scale.set(1.2, 1.7, 0.8);
    const rightTemple = leftTemple.clone();
    rightTemple.position.x = 0.09;
    closeupRefinement.add(hairlineArc, leftTemple, rightTemple);
    strandSpecs.forEach((t) => {
      closeupRefinement.add(
        createCloseupStrand(
          t.points,
          t.radius,
          t.opacity,
          t.tubularSegments ?? 28,
        ),
      );
    });
    o.add(closeupRefinement);
    heroCloseupHead = buildReferenceJuniorHeroHead({
      skinColor: l.clone(),
      hairColor: t.hair,
      irisColor: t.iris ?? "#5b4030",
    });
    o.add(heroCloseupHead.root);
    // Tier 3 表情系統：建立 rig + 暴露 console API
    // Tier 8 加 getCamera options，給 eye tracking 用
    // C6 加 canvas + getJuniorHead，給 hover/click raycaster 用
    __juniorRig = createJuniorExpressionRig(heroCloseupHead.refs, {
      getCamera: () => q,
      canvas: U.domElement,
      getJuniorHead: () => heroCloseupHead.root,
    });
    // Tier 4 布料動態：traverse head 找 userData.cloth = true 的 mesh
    __clothRig = createClothRig(heroCloseupHead.root);
    if (typeof window !== "undefined") {
      window.__JUNIOR_RIG__ = __juniorRig;
      window.__CLOTH_RIG__ = __clothRig;
    }
  }
  const Se = (function (t, o = 1) {
    const a = new e.MeshBasicMaterial({
        map: t,
        transparent: !0,
        opacity: o,
        depthWrite: !1,
      }),
      n = new e.Mesh(new e.PlaneGeometry(0.27, 0.3), a);
    return (n.position.set(0, 0.01, 0.176), n);
  })(
    (function ({ female: t = !1, referenceJunior: o = !1 } = {}) {
      const a = document.createElement("canvas");
      ((a.width = 320), (a.height = 320));
      const n = a.getContext("2d");
      n.clearRect(0, 0, 320, 320);
      const s = n.createRadialGradient(160, 132, 24, 160, 188, 164);
      (s.addColorStop(0, t ? "rgba(255,237,230,.3)" : "rgba(255,234,224,.22)"),
        s.addColorStop(1, "rgba(0,0,0,0)"),
        (n.fillStyle = s),
        n.fillRect(0, 0, 320, 320),
        o
          ? ((n.fillStyle = "rgba(112,84,74,.72)"),
            n.beginPath(),
            n.moveTo(88, 128),
            n.quadraticCurveTo(104, 112, 144, 117),
            n.lineTo(144, 123),
            n.quadraticCurveTo(104, 118, 90, 130),
            n.closePath(),
            n.fill(),
            n.beginPath(),
            n.moveTo(232, 128),
            n.quadraticCurveTo(216, 112, 176, 117),
            n.lineTo(176, 123),
            n.quadraticCurveTo(216, 118, 230, 130),
            n.closePath(),
            n.fill())
          : ((n.strokeStyle = t ? "rgba(82,48,47,.7)" : "rgba(74,43,40,.72)"),
            (n.lineWidth = t ? 6 : 7),
            n.beginPath(),
            n.moveTo(92, 116),
            n.quadraticCurveTo(118, t ? 94 : 100, 142, 110),
            n.moveTo(178, 110),
            n.quadraticCurveTo(202, t ? 94 : 100, 228, 116),
            n.stroke()),
        o &&
          ((n.fillStyle = "rgba(255,255,255,.85)"),
          n.beginPath(),
          n.ellipse(114, 152, 26, 17, -0.02, 0, 2 * Math.PI),
          n.fill(),
          n.beginPath(),
          n.ellipse(206, 152, 26, 17, 0.02, 0, 2 * Math.PI),
          n.fill()),
        (n.fillStyle = "#24191a"),
        n.beginPath(),
        n.ellipse(
          114,
          o ? 152 : 146,
          o ? 21 : 15,
          o ? 16 : 12,
          -0.02,
          0,
          2 * Math.PI,
        ),
        n.ellipse(
          206,
          o ? 152 : 146,
          o ? 21 : 15,
          o ? 16 : 12,
          0.02,
          0,
          2 * Math.PI,
        ),
        n.fill(),
        (n.fillStyle = t ? (o ? "#5b3929" : "#3f231f") : "#35201d"),
        n.beginPath(),
        n.ellipse(
          114,
          o ? 152 : 146,
          o ? 8.6 : 6,
          o ? 10.6 : 7,
          0,
          0,
          2 * Math.PI,
        ),
        n.ellipse(
          206,
          o ? 152 : 146,
          o ? 8.6 : 6,
          o ? 10.6 : 7,
          0,
          0,
          2 * Math.PI,
        ),
        n.fill(),
        t &&
          ((n.strokeStyle = o ? "rgba(64,38,34,.72)" : "rgba(39,20,18,.7)"),
          (n.lineWidth = o ? 2.1 : 2),
          n.beginPath(),
          n.moveTo(94, o ? 158 : 154),
          n.quadraticCurveTo(114, o ? 164 : 162, 134, o ? 158 : 154),
          n.moveTo(186, o ? 158 : 154),
          n.quadraticCurveTo(206, o ? 164 : 162, 226, o ? 158 : 154),
          n.stroke(),
          (n.strokeStyle = o ? "rgba(36,22,24,.82)" : "rgba(39,20,18,.68)"),
          (n.lineWidth = o ? 3.6 : 2.4),
          (n.lineCap = "round"),
          n.beginPath(),
          n.moveTo(o ? 82 : 88, o ? 140 : 136),
          n.quadraticCurveTo(
            o ? 100 : 104,
            o ? 130 : 128,
            o ? 120 : 124,
            o ? 136 : 132,
          ),
          n.stroke(),
          n.beginPath(),
          n.moveTo(o ? 108 : 112, o ? 134 : 130),
          n.quadraticCurveTo(
            o ? 126 : 128,
            o ? 128 : 124,
            o ? 140 : 142,
            o ? 134 : 132,
          ),
          n.stroke(),
          n.beginPath(),
          n.moveTo(o ? 200 : 196, o ? 140 : 136),
          n.quadraticCurveTo(
            o ? 218 : 216,
            o ? 130 : 128,
            o ? 238 : 232,
            o ? 136 : 132,
          ),
          n.stroke(),
          n.beginPath(),
          n.moveTo(o ? 180 : 178, o ? 134 : 130),
          n.quadraticCurveTo(
            o ? 198 : 196,
            o ? 128 : 124,
            o ? 212 : 210,
            o ? 134 : 132,
          ),
          n.stroke(),
          o &&
            ((n.strokeStyle = "rgba(120,80,70,.35)"),
            (n.lineWidth = 2),
            n.beginPath(),
            n.moveTo(88, 134),
            n.quadraticCurveTo(114, 126, 140, 134),
            n.stroke(),
            n.beginPath(),
            n.moveTo(180, 134),
            n.quadraticCurveTo(206, 126, 232, 134),
            n.stroke(),
            (n.strokeStyle = "rgba(36,22,24,.7)"),
            (n.lineWidth = 1.4),
            n.beginPath(),
            n.moveTo(78, 144),
            n.quadraticCurveTo(72, 136, 68, 130),
            n.stroke(),
            n.beginPath(),
            n.moveTo(82, 142),
            n.quadraticCurveTo(74, 132, 72, 126),
            n.stroke(),
            n.beginPath(),
            n.moveTo(86, 140),
            n.quadraticCurveTo(80, 130, 78, 124),
            n.stroke(),
            n.beginPath(),
            n.moveTo(242, 144),
            n.quadraticCurveTo(248, 136, 252, 130),
            n.stroke(),
            n.beginPath(),
            n.moveTo(238, 142),
            n.quadraticCurveTo(246, 132, 248, 126),
            n.stroke(),
            n.beginPath(),
            n.moveTo(234, 140),
            n.quadraticCurveTo(240, 130, 242, 124),
            n.stroke())),
        (n.fillStyle = "rgba(255,255,255,.94)"),
        n.beginPath(),
        n.ellipse(
          110,
          o ? 145 : 142,
          o ? 4.6 : 3,
          o ? 4.6 : 3,
          0,
          0,
          2 * Math.PI,
        ),
        n.ellipse(
          202,
          o ? 145 : 142,
          o ? 4.6 : 3,
          o ? 4.6 : 3,
          0,
          0,
          2 * Math.PI,
        ),
        n.fill(),
        o &&
          ((n.strokeStyle = "rgba(180,140,130,.28)"),
          (n.lineWidth = 1.5),
          n.beginPath(),
          n.moveTo(160, 122),
          n.bezierCurveTo(161, 148, 159, 174, 157, 198),
          n.stroke(),
          (n.strokeStyle = "rgba(255,255,255,.12)"),
          (n.lineWidth = 1),
          n.beginPath(),
          n.moveTo(158, 124),
          n.bezierCurveTo(159, 148, 157, 172, 155, 196),
          n.stroke()),
        (n.strokeStyle = o ? "rgba(152,104,96,.46)" : "rgba(144,97,91,.52)"),
        (n.lineWidth = o ? 5 : 6),
        n.beginPath(),
        n.moveTo(160, 146),
        n.quadraticCurveTo(172, 180, 156, 194),
        n.stroke(),
        (n.fillStyle = t
          ? o
            ? "rgba(242,178,186,.16)"
            : "rgba(232,164,174,.2)"
          : "rgba(196,126,120,.14)"),
        n.beginPath(),
        n.ellipse(
          102,
          o ? 190 : 188,
          o ? 20 : 22,
          o ? 12 : 14,
          0,
          0,
          2 * Math.PI,
        ),
        n.ellipse(
          218,
          o ? 190 : 188,
          o ? 20 : 22,
          o ? 12 : 14,
          0,
          0,
          2 * Math.PI,
        ),
        n.fill(),
        o &&
          ((n.fillStyle = "rgba(255,255,255,.09)"),
          n.beginPath(),
          n.ellipse(96, 180, 14, 10, -0.15, 0, 2 * Math.PI),
          n.fill(),
          n.beginPath(),
          n.ellipse(224, 180, 14, 10, 0.15, 0, 2 * Math.PI),
          n.fill(),
          (n.fillStyle = "rgba(62,38,32,.72)"),
          n.beginPath(),
          n.arc(126, 174, 2.2, 0, 2 * Math.PI),
          n.fill()),
        o &&
          ((n.fillStyle = "rgba(212,135,122,.6)"),
          n.beginPath(),
          n.moveTo(130, 226),
          n.bezierCurveTo(140, 218, 155, 216, 160, 220),
          n.bezierCurveTo(165, 216, 180, 218, 190, 226),
          n.bezierCurveTo(178, 230, 165, 232, 160, 230),
          n.bezierCurveTo(155, 232, 142, 230, 130, 226),
          n.closePath(),
          n.fill(),
          (n.fillStyle = "rgba(212,135,122,.48)"),
          n.beginPath(),
          n.moveTo(134, 230),
          n.bezierCurveTo(142, 228, 155, 232, 160, 230),
          n.bezierCurveTo(165, 232, 178, 228, 186, 230),
          n.bezierCurveTo(178, 244, 165, 248, 160, 247),
          n.bezierCurveTo(155, 248, 142, 244, 134, 230),
          n.closePath(),
          n.fill(),
          (n.fillStyle = "rgba(255,255,255,.14)"),
          n.beginPath(),
          n.ellipse(160, 237, 16, 4, 0, 0, 2 * Math.PI),
          n.fill()),
        (n.strokeStyle = t
          ? o
            ? "rgba(186,126,132,.7)"
            : "rgba(176,86,112,.92)"
          : "rgba(126,82,76,.86)"),
        (n.lineWidth = t ? (o ? 4.8 : 7) : 6),
        n.beginPath(),
        n.moveTo(o ? 132 : 116, o ? 238 : 236),
        n.quadraticCurveTo(160, o ? 242 : 258, o ? 188 : 208, o ? 238 : 236),
        n.stroke(),
        o &&
          ((n.strokeStyle = "rgba(186,126,132,.4)"),
          (n.lineWidth = 1.8),
          n.beginPath(),
          n.moveTo(132, 238),
          n.quadraticCurveTo(128, 236, 126, 232),
          n.stroke(),
          n.beginPath(),
          n.moveTo(188, 238),
          n.quadraticCurveTo(192, 236, 194, 232),
          n.stroke()),
        (n.strokeStyle = "rgba(255,255,255,.18)"),
        (n.lineWidth = 3),
        n.beginPath(),
        n.moveTo(o ? 136 : 126, 234),
        n.quadraticCurveTo(160, o ? 238 : 248, o ? 184 : 194, 234),
        n.stroke());
      const r = new e.CanvasTexture(a);
      return ((r.colorSpace = e.SRGBColorSpace), r);
    })({ female: t.female, referenceJunior: a }),
    n ? 0.5 : 0.86,
  );
  ((Se.position.y = n ? 1.556 : 1.55),
    (Se.position.z = n ? 0.19 : t.female ? 0.178 : 0.172),
    Se.scale.setScalar(n ? 0.84 : t.female ? 0.95 : 0.92),
    o.add(Se),
    n && (Se.position.set(0, 1.554, 0.194), Se.scale.setScalar(0.87)));
  const ze = new e.Mesh(
    new e.PlaneGeometry(0.18, 0.06),
    new e.MeshBasicMaterial({
      color: "#5a3d3c",
      transparent: !0,
      opacity: 0.08,
      depthWrite: !1,
    }),
  );
  let frontHairStripL = null,
    frontHairStripR = null,
    frontHairInnerL = null,
    frontHairInnerR = null,
    hairCurtainL = null,
    hairCurtainR = null;
  if ((ze.position.set(0, 1.59, 0.17), o.add(ze), t.female)) {
    const s = new e.Mesh(new e.BoxGeometry(0.16, 0.64, 0.08), d);
    (s.position.set(0, 1.22, -0.11), s.scale.set(1, 1.06, 0.82), o.add(s));
    const r = new e.Mesh(new e.BoxGeometry(0.028, n ? 0.32 : 0.26, 0.028), d);
    (r.position.set(n ? -0.102 : -0.112, n ? 1.44 : 1.46, n ? 0.124 : 0.118),
      (r.rotation.z = -0.12));
    const i = r.clone();
    if (
      ((i.position.x = n ? 0.104 : 0.112),
      (i.rotation.z = 0.12),
      (frontHairStripL = r),
      (frontHairStripR = i),
      o.add(r, i),
      n)
    ) {
      const t = new e.Mesh(new e.BoxGeometry(0.022, 0.28, 0.02), d);
      (t.position.set(-0.052, 1.502, 0.16), (t.rotation.z = -0.02));
      const a = t.clone();
      ((a.position.x = 0.056),
        (a.rotation.z = 0.02),
        (frontHairInnerL = t),
        (frontHairInnerR = a));
      /* 瀏海已移除：統一為妹妹頭造型，不加入場景 */
    }
    const l = new e.Mesh(new e.BoxGeometry(0.034, 0.34, 0.032), d);
    (l.position.set(-0.152, 1.36, 0.02), (l.rotation.z = -0.08));
    const c = l.clone();
    ((c.position.x = 0.152),
      (c.rotation.z = 0.08),
      (hairCurtainL = l),
      (hairCurtainR = c),
      o.add(l, c));
    const h = new e.Mesh(
      new e.TorusGeometry(0.1, 0.018, 8, 20, Math.PI),
      new e.MeshStandardMaterial({
        color: "#fffef8",
        roughness: 0.76,
        metalness: 0.01,
      }),
    );
    if (
      (h.position.set(0, 1.2, 0.08),
      (h.rotation.x = 0.54 * Math.PI),
      o.add(h),
      n)
    ) {
      const t = new e.MeshPhysicalMaterial({
          color: "#ffffff",
          roughness: 0.42,
          metalness: 0.01,
          clearcoat: 0.16,
          clearcoatRoughness: 0.2,
        }),
        a = new e.BufferGeometry(),
        n = new Float32Array([0, 0, 0, -0.06, 0.04, 0, -0.05, -0.02, 0]);
      (a.setAttribute("position", new e.BufferAttribute(n, 3)),
        a.computeVertexNormals());
      const s = new e.Mesh(a, t);
      (s.position.set(-0.01, 1.22, 0.14),
        (s.rotation.y = 0.3),
        (s.rotation.z = -0.1),
        o.add(s));
      const r = new e.BufferGeometry(),
        i = new Float32Array([0, 0, 0, 0.06, 0.04, 0, 0.05, -0.02, 0]);
      (r.setAttribute("position", new e.BufferAttribute(i, 3)),
        r.computeVertexNormals());
      const l = new e.Mesh(r, t);
      (l.position.set(0.01, 1.22, 0.14),
        (l.rotation.y = -0.3),
        (l.rotation.z = 0.1),
        o.add(l));
    }
    const p = new e.Mesh(
      new e.CapsuleGeometry(0.164, 0.48, 8, 16),
      new e.MeshPhysicalMaterial({
        color: "#fffdfa",
        roughness: 0.3,
        metalness: 0.01,
        clearcoat: 0.2,
        clearcoatRoughness: 0.24,
      }),
    );
    (p.position.set(0, 1.06, 0.02),
      p.scale.set(a ? 0.92 : 0.94, a ? 1.05 : 0.92, 0.8),
      o.add(p));
    const w = new e.Mesh(new e.TorusGeometry(0.146, 0.012, 8, 20), m);
    (w.position.set(0, 0.84, 0.02), (w.rotation.x = Math.PI / 2), o.add(w));
    const M = new e.Mesh(
      new e.PlaneGeometry(0.12, 0.34),
      new e.MeshPhysicalMaterial({
        color: "#efe7dc",
        roughness: 0.54,
        metalness: 0,
        transparent: !0,
        opacity: 0.22,
        clearcoat: 0.08,
        clearcoatRoughness: 0.22,
      }),
    );
    (M.position.set(0, 1.02, 0.2), o.add(M));
    (n ? [-0.02, 0.08, 0.16, 0.24] : [-0.02, 0.1, 0.22]).forEach((t) => {
      const a = new e.Mesh(new e.SphereGeometry(n ? 0.01 : 0.012, 10, 10), m);
      (a.position.set(0, 1.12 - t, 0.2), o.add(a));
    });
    const f = new e.CapsuleGeometry(0.054, 0.34, 5, 10),
      u = new e.MeshPhysicalMaterial({
        color: "#fffdfa",
        roughness: 0.32,
        metalness: 0.01,
        clearcoat: 0.18,
        clearcoatRoughness: 0.24,
      }),
      y = new e.Mesh(f, u);
    (y.position.set(-0.246, 0.88, 0.03), (y.rotation.z = 0.12));
    const g = y.clone();
    ((g.position.x = 0.246), (g.rotation.z = -0.12), o.add(y, g));
    const x = new e.Mesh(new e.TorusGeometry(0.046, 0.012, 8, 18), m);
    (x.position.set(-0.254, 0.74, 0.03), (x.rotation.z = 1.52));
    const b = x.clone();
    ((b.position.x = 0.254), o.add(x, b));
    const S = new e.MeshStandardMaterial({
        color: "#faf7f1",
        roughness: 0.76,
        metalness: 0.01,
      }),
      z = new e.Mesh(new e.CylinderGeometry(0.07, 0.072, 0.14, 14), S);
    z.position.set(-0.085, 0.11, 0.008);
    const P = z.clone();
    ((P.position.x = 0.085), o.add(z, P));
    const v = new e.Mesh(new e.SphereGeometry(0.056, 18, 18), d);
    (v.position.set(0.028, 1.698, -0.17), o.add(v));
    const G = new e.Mesh(
      new e.TorusGeometry(0.052, 0.016, 8, 20),
      new e.MeshStandardMaterial({
        color: "#1f1a22",
        roughness: 0.7,
        metalness: 0.04,
      }),
    );
    if (
      (G.position.set(0.028, 1.698, -0.17),
      (G.rotation.x = Math.PI / 2),
      o.add(G),
      n)
    ) {
      const a = new e.MeshPhysicalMaterial({
        color: t.hair,
        roughness: 0.08,
        metalness: 0.05,
        clearcoat: 0.72,
        clearcoatRoughness: 0.08,
        sheen: 0.48,
        sheenRoughness: 0.2,
        sheenColor: new e.Color("#7a5a3a"),
      });
      (v.position.set(0.02, 1.692, -0.164),
        G.position.set(0.02, 1.692, -0.164));
      const n = new e.Mesh(
        new e.TorusGeometry(0.038, 0.01, 12, 24),
        new e.MeshPhysicalMaterial({
          color: "#2a1418",
          roughness: 0.3,
          metalness: 0.08,
          clearcoat: 0.4,
        }),
      );
      (n.position.set(0.02, 1.62, -0.19),
        (n.rotation.x = 0.35 * Math.PI),
        (n.rotation.z = -0.05),
        o.add(n));
      const s = new e.Mesh(new e.CapsuleGeometry(0.042, 0.22, 8, 14), a);
      (s.position.set(0.04, 1.52, -0.22),
        (s.rotation.x = 0.35),
        (s.rotation.z = -0.04),
        s.scale.set(0.82, 1, 0.72),
        o.add(s));
      const r = new e.Mesh(new e.CapsuleGeometry(0.036, 0.22, 8, 14), a);
      (r.position.set(0.08, 1.32, -0.2),
        (r.rotation.x = 0.15),
        (r.rotation.z = -0.06),
        r.scale.set(0.78, 1, 0.68),
        o.add(r));
      const i = new e.Mesh(new e.CapsuleGeometry(0.03, 0.2, 8, 12), a);
      (i.position.set(0.12, 1.14, -0.14),
        (i.rotation.x = -0.12),
        (i.rotation.z = -0.04),
        i.scale.set(0.76, 1, 0.66),
        o.add(i));
      const l = new e.Mesh(new e.CapsuleGeometry(0.022, 0.18, 8, 10), a);
      (l.position.set(0.15, 0.97, -0.08),
        (l.rotation.x = -0.28),
        (l.rotation.z = -0.03),
        l.scale.set(0.74, 1, 0.62),
        o.add(l));
    } else {
      const t = new e.Mesh(new e.CapsuleGeometry(0.05, 0.62, 6, 12), d);
      (t.position.set(0.092, 1.24, -0.24),
        (t.rotation.z = -0.18),
        (t.rotation.x = 0.1),
        t.scale.set(0.86, 1.24, 0.8),
        o.add(t));
      const a = new e.Mesh(new e.CapsuleGeometry(0.036, 0.42, 6, 10), d);
      (a.position.set(0.14, 0.92, -0.16),
        (a.rotation.z = -0.22),
        (a.rotation.x = -0.04),
        a.scale.set(0.84, 1.28, 0.82),
        o.add(a));
    }
  }
  if (!t.female) {
    const t = new e.Mesh(
      new e.BoxGeometry(0.11, 0.52, 0.03),
      new e.MeshPhysicalMaterial({
        color: "#5f7893",
        roughness: 0.42,
        metalness: 0.03,
        clearcoat: 0.12,
        clearcoatRoughness: 0.28,
        transparent: !0,
        opacity: 0.94,
      }),
    );
    (t.position.set(0, 1.08, 0.19), o.add(t));
    const a = new e.Mesh(
      new e.CapsuleGeometry(0.162, 0.52, 8, 16),
      new e.MeshPhysicalMaterial({
        color: "#eef2f7",
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.1,
        clearcoatRoughness: 0.22,
      }),
    );
    (a.position.set(0, 1.06, 0.02), a.scale.set(1.08, 0.94, 0.88), o.add(a));
    const n = new e.Mesh(
      new e.TorusGeometry(0.092, 0.016, 8, 20, Math.PI),
      new e.MeshPhysicalMaterial({
        color: "#e4ebf2",
        roughness: 0.44,
        metalness: 0.02,
        clearcoat: 0.12,
        clearcoatRoughness: 0.18,
      }),
    );
    (n.position.set(0, 1.2, 0.08), (n.rotation.x = 0.54 * Math.PI), o.add(n));
    const s = new e.BoxGeometry(0.06, 0.04, 0.03),
      r = new e.MeshPhysicalMaterial({
        color: "#e8edf4",
        roughness: 0.42,
        metalness: 0.02,
        clearcoat: 0.1,
      }),
      i = new e.Mesh(s, r);
    (i.position.set(-0.06, 1.22, 0.12),
      (i.rotation.z = -0.3),
      (i.rotation.x = -0.2));
    const l = i.clone();
    ((l.position.x = 0.06), (l.rotation.z = 0.3), o.add(i, l));
    const c = new e.Mesh(new e.BoxGeometry(0.136, 0.084, 0.054), d);
    (c.position.set(0, 1.616, 0.122), o.add(c));
    const h = new e.Mesh(new e.BoxGeometry(0.032, 0.18, 0.028), d);
    (h.position.set(-0.132, 1.5, 0.06), (h.rotation.z = -0.06));
    const p = h.clone();
    ((p.position.x = 0.128), (p.rotation.z = 0.06));
    const m = new e.Mesh(new e.BoxGeometry(0.18, 0.07, 0.06), d);
    (m.position.set(0, 1.52, -0.164), o.add(h, p, m));
  }
  if (t.phone) {
    (R.position.set(0.18, 1.16, 0.02),
      (R.rotation.z = -0.6),
      (R.rotation.x = -0.52),
      q.position.set(0.164, 1.2, 0.03),
      (q.rotation.z = -0.78),
      (q.rotation.x = -0.46),
      E.position.set(0.19, 1.24, 0.08));
    const t = new e.Mesh(
      new e.BoxGeometry(0.05, 0.12, 0.018),
      new e.MeshStandardMaterial({
        color: "#141518",
        roughness: 0.38,
        metalness: 0.28,
      }),
    );
    (t.position.set(0.16, 1.38, 0.07),
      t.rotation.set(-0.24, 0.16, 0.18),
      o.add(t));
  }
  if (t.highlight) {
    const e = b("rgba(255,234,184,1)", 1.2, 1.8, 0.28);
    (e.position.set(0.12, 1.16, -0.08), o.add(e), (o.userData.glow = e));
  }
  return (
    t.echo &&
      o.traverse((o) => {
        o.isMesh &&
          ((o.material = o.material.clone()),
          (o.material.transparent = !0),
          (o.material.opacity = t.echoOpacity ?? 0.35),
          o.material.emissive && o.material.emissive.set
            ? (o.material.emissive.set(t.echoColor ?? "#ffcfb1"),
               (o.material.emissiveIntensity = 0.16))
            : (o.material.emissive = new e.Color(t.echoColor ?? "#ffcfb1"),
               (o.material.emissiveIntensity = 0.16),
               (o.material.needsUpdate = !0)));
      }),
    o.scale.setScalar(t.scale ?? 0.95),
    (o.userData.pose = {
      waist: w,
      torso: M,
      chest: f,
      leftArm: I,
      rightArm: R,
      leftLeg: S,
      rightLeg: z,
      leftHand: V,
      rightHand: E,
      head: L,
      jaw: X,
      faceSideL: $,
      faceSideR: H,
      eyeWhiteL: re,
      eyeWhiteR: ie,
      irisL: le,
      irisR: ce,
      eyeContourL: oe,
      eyeContourR: ae,
      eyeSparkleL: we,
      eyeSparkleR: Me,
      facePlane: Se,
      faceShell: fe,
      faceFront: fe,
      heroHeadRoot: heroCloseupHead?.root ?? null,
      heroHeadShell: heroCloseupHead?.refs.headShell ?? null,
      heroJawShell: heroCloseupHead?.refs.jawShell ?? null,
      heroEyeWhiteL: heroCloseupHead?.refs.heroEyeWhiteL ?? null,
      heroEyeWhiteR: heroCloseupHead?.refs.heroEyeWhiteR ?? null,
      heroIrisL: heroCloseupHead?.refs.heroIrisL ?? null,
      heroIrisR: heroCloseupHead?.refs.heroIrisR ?? null,
      heroBrowL: heroCloseupHead?.refs.heroBrowL ?? null,
      heroBrowR: heroCloseupHead?.refs.heroBrowR ?? null,
      heroHairCap: heroCloseupHead?.refs.heroHairCap ?? null,
      heroPonytail: heroCloseupHead?.refs.heroPonytail ?? null,
      mouth: O,
      noseTip: F,
      noseBridge: N,
      lipGloss: ze,
      headGlow: be,
      hairBack: ue,
      fringe: ye,
      sideLockL: ge,
      sideLockR: xe,
      frontHairStripL: frontHairStripL,
      frontHairStripR: frontHairStripR,
      frontHairInnerL: frontHairInnerL,
      frontHairInnerR: frontHairInnerR,
      hairCurtainL: hairCurtainL,
      hairCurtainR: hairCurtainR,
      browL: K,
      browR: Q,
      closeupRefinement: closeupRefinement,
      blushL: de,
      blushR: pe,
      shoulderL: B,
      shoulderR: k,
      female: Boolean(t.female),
      hasPhone: Boolean(t.phone),
      referenceJunior: a,
    }),
    x(o),
    o
  );
}
function z(e) {
  const t = e.userData.pose;
  t &&
    (t.waist.rotation.set(0, 0, 0),
    t.torso.rotation.set(0, 0, 0),
    t.chest.rotation.set(0, 0, 0),
    t.leftArm.rotation.set(0, 0, t.female ? 0.12 : 0.15),
    t.rightArm.rotation.set(0, 0, t.female ? -0.12 : -0.15),
    t.leftLeg.rotation.set(0, 0, 0.02),
    t.rightLeg.rotation.set(0, 0, -0.02),
    t.leftHand.rotation.set(0, 0, 0),
    t.rightHand.rotation.set(0, 0, 0),
    t.head.rotation.set(0, 0, 0),
    t.jaw.rotation.set(0, 0, 0),
    t.hairBack.rotation.set(0, 0, 0),
    t.fringe.rotation.set(0, 0, 0),
    t.heroHeadRoot && t.heroHeadRoot.rotation.set(0, 0, 0),
    t.heroPonytail && t.heroPonytail.rotation.set(0, 0, 0),
    t.eyeWhiteL?.userData.baseScale && t.eyeWhiteL.scale.copy(t.eyeWhiteL.userData.baseScale),
    t.eyeWhiteR?.userData.baseScale && t.eyeWhiteR.scale.copy(t.eyeWhiteR.userData.baseScale),
    t.irisL?.userData.baseScale && t.irisL.scale.copy(t.irisL.userData.baseScale),
    t.irisR?.userData.baseScale && t.irisR.scale.copy(t.irisR.userData.baseScale),
    t.heroEyeWhiteL?.userData.baseScale &&
      t.heroEyeWhiteL.scale.copy(t.heroEyeWhiteL.userData.baseScale),
    t.heroEyeWhiteR?.userData.baseScale &&
      t.heroEyeWhiteR.scale.copy(t.heroEyeWhiteR.userData.baseScale),
    t.heroIrisL?.userData.baseScale &&
      t.heroIrisL.scale.copy(t.heroIrisL.userData.baseScale),
    t.heroIrisR?.userData.baseScale &&
      t.heroIrisR.scale.copy(t.heroIrisR.userData.baseScale),
    (e.position.y = 0));
}
function P(e, t, o = 1) {
  const a = e.userData.pose;
  if (!a) return;
  const n = Math.max(-1, Math.min(1, t)),
    s = Math.abs(n),
    r = Math.asin(n),
    i = a.female ? 0.58 : 0.48,
    l = Math.sin(r - 0.22),
    c = a.hasPhone ? 0.14 : 0.42;
  ((a.leftLeg.rotation.x = n * i), (a.rightLeg.rotation.x = -n * i));
  const h = 0.08 * Math.max(0, n),
    d = 0.08 * Math.max(0, -n);
  ((a.leftLeg.rotation.z = 0.02 + h),
    (a.rightLeg.rotation.z = -0.02 - d),
    (a.leftArm.rotation.x = -l * c),
    (a.rightArm.rotation.x = a.hasPhone ? 0.06 * n - 0.56 : l * c),
    (a.leftArm.rotation.z = (a.female ? 0.12 : 0.15) + 0.06 * Math.max(0, l)),
    (a.rightArm.rotation.z =
      -(a.female ? 0.12 : 0.15) - 0.06 * Math.max(0, -l)),
    (a.leftHand.rotation.x = 0.12 * l),
    (a.rightHand.rotation.x = a.hasPhone ? 0 : 0.12 * -l),
    (a.torso.rotation.z = 0.04 * -n * o),
    (a.torso.rotation.x = 0.028 * s),
    (a.torso.rotation.y = 0.07 * n * o),
    (a.waist.rotation.z = 0.07 * n * o),
    (a.waist.rotation.y = 0.06 * -n * o),
    (a.waist.rotation.x = 0.02 * s),
    (a.chest.rotation.y = 0.09 * -n * o),
    (a.head.rotation.z = 0.022 * n * o),
    (a.head.rotation.y = 0.035 * n * o),
    (a.head.rotation.x = 0.012 * s),
    (a.shoulderL.rotation.z = 0.07 * -n),
    (a.shoulderR.rotation.z = 0.07 * n),
    (a.shoulderL.rotation.x = 0.03 * l),
    (a.shoulderR.rotation.x = 0.03 * -l),
    a.female &&
      ((a.hairBack.rotation.z = 0.04 * n),
      (a.hairBack.rotation.x = 0.02 * s),
      (a.fringe.rotation.z = 0.015 * -n)),
    a.referenceJunior &&
      ((a.head.rotation.y += 0.012 * Math.sin(1.8 * t) * o),
      (a.head.rotation.x += 0.006 * Math.sin(2.2 * t + 0.3) * o),
      (a.head.rotation.z += 0.004 * Math.sin(1.5 * t + 0.4) * o),
      (a.hairBack.rotation.y += 0.008 * Math.sin(1.4 * t + 0.2) * o),
      (a.hairBack.rotation.z += 0.018 * Math.sin(1.1 * t + 0.6) * o),
      (a.fringe.rotation.z += 0.006 * Math.sin(1.7 * t + 0.4) * o),
      a.heroHeadRoot &&
        (a.heroHeadRoot.rotation.copy(a.head.rotation),
        a.heroPonytail &&
          ((a.heroPonytail.rotation.y = 0.4 * a.hairBack.rotation.y),
          (a.heroPonytail.rotation.z = 0.7 * a.hairBack.rotation.z)))));
  const p = 0.026 * Math.abs(Math.cos(r)) + 0.016 * s,
    m = 0.014 * n * o;
  ((e.position.y = p), (e.position.x += m));
}
function v(e, t, o = 1) {
  const a = e.userData.pose;
  if (!a) return;
  const n = 0.022 * Math.sin(1.4 * t) * o,
    s = 0.014 * Math.sin(1.4 * t + 0.3) * o;
  ((a.torso.rotation.x = n),
    (a.chest.rotation.x = 0.8 * n + 0.4 * s),
    (a.waist.rotation.x = 0.18 * n));
  const r = 0.008 * Math.sin(0.42 * t) * o;
  ((a.waist.rotation.z = r),
    (a.torso.rotation.z = 0.5 * -r),
    (a.head.rotation.y =
      0.048 * Math.sin(0.7 * t) * o + 0.008 * Math.sin(1.9 * t) * o),
    (a.head.rotation.x = 0.014 * Math.sin(0.9 * t) * o),
    (a.head.rotation.z = 0.006 * Math.sin(0.55 * t) * o),
    (a.hairBack.rotation.z = 0.026 * Math.sin(1.1 * t) * o),
    (a.hairBack.rotation.x = 0.01 * Math.sin(0.8 * t) * o),
    a.female && (a.fringe.rotation.z = 0.008 * Math.sin(1.3 * t + 0.4) * o),
    a.referenceJunior &&
      ((a.head.rotation.y += 0.008 * Math.sin(0.38 * t + 0.15) * o),
      (a.head.rotation.x += 0.006 * Math.sin(1.12 * t + 0.4) * o),
      (a.head.rotation.z += 0.004 * Math.sin(0.62 * t + 0.2) * o),
      (a.hairBack.rotation.y += 0.007 * Math.sin(0.52 * t + 0.25) * o),
      (a.hairBack.rotation.z += 0.01 * Math.sin(0.74 * t + 0.1) * o),
      (a.fringe.rotation.z += 0.004 * Math.sin(1.75 * t + 0.32) * o),
      a.heroHeadRoot &&
        (a.heroHeadRoot.rotation.copy(a.head.rotation),
        a.heroPonytail &&
          ((a.heroPonytail.rotation.y = 0.42 * a.hairBack.rotation.y),
          (a.heroPonytail.rotation.z = 0.72 * a.hairBack.rotation.z)))),
    (a.shoulderL.rotation.z = 0.01 * Math.sin(1.4 * t + 0.5) * o),
    (a.shoulderR.rotation.z = 0.01 * -Math.sin(1.4 * t + 0.5) * o),
    (a.leftArm.rotation.x = 0.01 * Math.sin(0.6 * t) * o),
    (a.rightArm.rotation.x = a.hasPhone
      ? -0.56
      : 0.01 * Math.sin(0.6 * t + 0.4) * o),
    (e.position.y = 0.012 * Math.abs(Math.sin(1.4 * t)) * o));
  if (a.referenceJunior) {
    const blink = 1 - 0.18 * Math.pow(Math.max(0, Math.sin(1.62 * t + 0.58)), 10) * o;
    a.eyeWhiteL?.userData.baseScale &&
      a.eyeWhiteL.scale.set(
        a.eyeWhiteL.userData.baseScale.x,
        a.eyeWhiteL.userData.baseScale.y * blink,
        a.eyeWhiteL.userData.baseScale.z,
      );
    a.eyeWhiteR?.userData.baseScale &&
      a.eyeWhiteR.scale.set(
        a.eyeWhiteR.userData.baseScale.x,
        a.eyeWhiteR.userData.baseScale.y * blink,
        a.eyeWhiteR.userData.baseScale.z,
      );
    a.irisL?.userData.baseScale &&
      a.irisL.scale.set(
        a.irisL.userData.baseScale.x,
        a.irisL.userData.baseScale.y * blink,
        a.irisL.userData.baseScale.z,
      );
    a.irisR?.userData.baseScale &&
      a.irisR.scale.set(
        a.irisR.userData.baseScale.x,
        a.irisR.userData.baseScale.y * blink,
        a.irisR.userData.baseScale.z,
      );
    a.heroEyeWhiteL?.userData.baseScale &&
      a.heroEyeWhiteL.scale.set(
        a.heroEyeWhiteL.userData.baseScale.x,
        a.heroEyeWhiteL.userData.baseScale.y * blink,
        a.heroEyeWhiteL.userData.baseScale.z,
      );
    a.heroEyeWhiteR?.userData.baseScale &&
      a.heroEyeWhiteR.scale.set(
        a.heroEyeWhiteR.userData.baseScale.x,
        a.heroEyeWhiteR.userData.baseScale.y * blink,
        a.heroEyeWhiteR.userData.baseScale.z,
      );
    a.heroIrisL?.userData.baseScale &&
      a.heroIrisL.scale.set(
        a.heroIrisL.userData.baseScale.x,
        a.heroIrisL.userData.baseScale.y * blink,
        a.heroIrisL.userData.baseScale.z,
      );
    a.heroIrisR?.userData.baseScale &&
      a.heroIrisR.scale.set(
        a.heroIrisR.userData.baseScale.x,
        a.heroIrisR.userData.baseScale.y * blink,
        a.heroIrisR.userData.baseScale.z,
      );
  }
}
function G(t, o, a, n = 1, s = 1) {
  const r = document.createElement("canvas");
  ((r.width = t), (r.height = o));
  a(r.getContext("2d"), t, o);
  const i = new e.CanvasTexture(r);
  return (
    (i.colorSpace = e.SRGBColorSpace),
    (i.wrapS = e.RepeatWrapping),
    (i.wrapT = e.RepeatWrapping),
    i.repeat.set(n, s),
    i
  );
}
function C({ base: e, accent: t, line: o, warm: a = !1 } = {}) {
  return G(
    512,
    512,
    (n, s, r) => {
      ((n.fillStyle = e), n.fillRect(0, 0, s, r));
      for (let e = 0; e < 1200; e += 1) {
        const e = Math.random() * s,
          t = Math.random() * r,
          o = 0.04 + 0.08 * Math.random();
        ((n.fillStyle = a
          ? `rgba(165,142,118,${o})`
          : `rgba(116,128,144,${o})`),
          n.fillRect(e, t, 1 + 2 * Math.random(), 1 + 2 * Math.random()));
      }
      ((n.strokeStyle = o), (n.lineWidth = 1));
      for (let e = 0; e < 9; e += 1) {
        const t = (r / 9) * e + 8;
        ((n.globalAlpha = 0.1),
          n.beginPath(),
          n.moveTo(0, t),
          n.lineTo(s, t + (8 * Math.random() - 4)),
          n.stroke());
      }
      ((n.globalAlpha = 1), (n.fillStyle = t), n.fillRect(0, r - 10, s, 10));
    },
    3.5,
    3.5,
  );
}
function B({ base: e, line: t, speck: o } = {}) {
  return G(
    512,
    512,
    (a, n, s) => {
      ((a.fillStyle = e), a.fillRect(0, 0, n, s));
      ((a.strokeStyle = t), (a.lineWidth = 3));
      for (let e = 0; e <= n; e += 84)
        (a.beginPath(), a.moveTo(e, 0), a.lineTo(e, s), a.stroke());
      for (let e = 0; e <= s; e += 84)
        (a.beginPath(), a.moveTo(0, e), a.lineTo(n, e), a.stroke());
      for (let e = 0; e < 1600; e += 1)
        ((a.fillStyle = `${o}${(0.05 + 0.08 * Math.random()).toFixed(2)})`),
          a.fillRect(Math.random() * n, Math.random() * s, 1.5, 1.5));
    },
    4,
    6,
  );
}
function k({ base: e, dark: t, highlight: o } = {}) {
  return G(
    512,
    512,
    (a, n, s) => {
      const r = a.createLinearGradient(0, 0, 0, s);
      (r.addColorStop(0, o),
        r.addColorStop(0.42, e),
        r.addColorStop(1, t),
        (a.fillStyle = r),
        a.fillRect(0, 0, n, s));
      for (let e = 0; e < 80; e += 1) {
        const e = Math.random() * s;
        ((a.strokeStyle = `rgba(74,45,24,${0.08 + 0.1 * Math.random()})`),
          (a.lineWidth = 1 + 2 * Math.random()),
          a.beginPath(),
          a.moveTo(0, e),
          a.bezierCurveTo(
            0.3 * n,
            e + 16 * Math.random(),
            0.7 * n,
            e - 16 * Math.random(),
            n,
            e + 8 * Math.random(),
          ),
          a.stroke());
      }
      for (let e = 0; e < 14; e += 1) {
        const e = Math.random() * n,
          t = Math.random() * s;
        ((a.strokeStyle = "rgba(58,33,18,.16)"),
          (a.lineWidth = 3),
          a.beginPath(),
          a.ellipse(
            e,
            t,
            18 + 16 * Math.random(),
            10 + 8 * Math.random(),
            Math.random(),
            0,
            2 * Math.PI,
          ),
          a.stroke());
      }
    },
    3,
    6,
  );
}
function T(
  t,
  o = 0.82,
  a = 0.26,
  { bg: n = "#44505f", fg: s = "#f7ecd1" } = {},
) {
  const r = document.createElement("canvas");
  ((r.width = 512), (r.height = 160));
  const i = r.getContext("2d");
  ((i.fillStyle = n),
    i.fillRect(0, 0, 512, 160),
    (i.fillStyle = s),
    (i.font = "600 86px DM Mono"),
    (i.textAlign = "center"),
    (i.textBaseline = "middle"),
    i.fillText(t, 256, 88));
  const l = new e.CanvasTexture(r);
  l.colorSpace = e.SRGBColorSpace;
  const c = new e.MeshStandardMaterial({
    map: l,
    roughness: 0.7,
    metalness: 0.02,
  });
  return new e.Mesh(new e.PlaneGeometry(o, a), c);
}
function I(e, t, o, a, n, s) {
  e.push({ minX: t, maxX: o, minZ: a, maxZ: n, label: s });
}
function R(t, o, a, n, s, r, i, l, c = !0, h = !0) {
  const d = new e.Mesh(a, n);
  return (
    d.position.copy(s),
    r && d.rotation.set(r.x, r.y, r.z),
    (d.castShadow = c),
    (d.receiveShadow = h),
    t.add(d),
    l && I(i, l.minX, l.maxX, l.minZ, l.maxZ, l.label),
    d.material.transparent || o.push(d),
    d
  );
}
function loadLm402Texture(t, o) {
  return new Promise((a, n) => {
    t.load(
      o,
      (t) => {
        ((t.colorSpace = e.SRGBColorSpace), a(t));
      },
      void 0,
      n,
    );
  });
}
function buildCurvedPortraitPlane(t, o = {}) {
  const a = o.width ?? 1,
    n = o.height ?? 1.8,
    s = new e.PlaneGeometry(a, n, 28, 40),
    r = s.getAttribute("position"),
    i = a / 2,
    l = o.curveDepth ?? 0.08;
  for (let e = 0; e < r.count; e += 1) {
    const t = r.getX(e),
      o = Math.abs(t / i);
    r.setZ(e, -(l * o * o));
  }
  ((r.needsUpdate = !0), s.computeVertexNormals());
  const c0 = t.clone();
  const h0 = o.featherMask ? buildPortraitFeatherMap(o.featherMask) : null;
  ((c0.needsUpdate = !0),
    o.mapRepeat &&
      c0.repeat.set(o.mapRepeat.x ?? c0.repeat.x, o.mapRepeat.y ?? c0.repeat.y),
    o.mapOffset &&
      c0.offset.set(
        o.mapOffset.x ?? c0.offset.x,
        o.mapOffset.y ?? c0.offset.y,
      ));
  const c = new e.MeshStandardMaterial({
      map: c0,
      alphaMap: h0,
      transparent: !0,
      alphaTest: h0 ? 0.02 : (o.alphaTest ?? 0.18),
      side: e.DoubleSide,
      depthWrite: !1,
      roughness: o.roughness ?? 0.72,
      metalness: o.metalness ?? 0.02,
      emissive: new e.Color(o.emissive ?? "#fff3ea"),
      emissiveIntensity: o.emissiveIntensity ?? 0.06,
    }),
    h = new e.Mesh(s, c);
  return (
    h.position.copy(o.position ?? new e.Vector3()),
    o.rotation && h.rotation.set(o.rotation.x, o.rotation.y, o.rotation.z),
    o.scale && h.scale.copy(o.scale),
    h
  );
}
function buildPortraitFeatherMap(t = {}) {
  const o = document.createElement("canvas");
  ((o.width = 512), (o.height = 512));
  const a = o.getContext("2d"),
    n = 512 * (t.centerX ?? 0.5),
    s = 512 * (t.centerY ?? 0.54),
    r = 512 * (t.radiusX ?? 0.3),
    i = 512 * (t.radiusY ?? 0.42),
    l = 512 * (t.inner ?? 0.12),
    c = 512 * (t.outer ?? 0.34);
  (a.clearRect(0, 0, 512, 512),
    a.save(),
    a.translate(n, s),
    a.scale(1, i / Math.max(1, r)));
  const h = a.createRadialGradient(0, 0, l, 0, 0, c);
  return (
    (h.addColorStop(0, "rgba(255,255,255,1)"),
    h.addColorStop(0.68, "rgba(255,255,255,1)"),
    h.addColorStop(1, "rgba(0,0,0,0)"),
    (a.fillStyle = h),
    a.beginPath(),
    a.arc(0, 0, c, 0, 2 * Math.PI),
    a.fill(),
    a.restore()),
    new e.CanvasTexture(o)
  );
}
const juniorPortraitCameraWorld = new e.Vector3(),
  juniorPortraitCameraLocal = new e.Vector3(),
  juniorHeroAnchorBox = new e.Box3(),
  juniorHeroAnchorCenter = new e.Vector3(),
  juniorHeroAnchorFace = new e.Vector3(),
  juniorHeroAnchorChest = new e.Vector3(),
  juniorHeroAnchorEyes = new e.Vector3();
function angularDistance(t, o) {
  return Math.abs(Math.atan2(Math.sin(t - o), Math.cos(t - o)));
}
function buildJuniorPortraitShell(t, o = {}) {
  const a = new e.Group(),
    n = [
      {
        texture: t.frontClose ?? t.front ?? null,
        center: 0,
        blendWidth: 0.92,
        width: 0.88,
        height: 1.08,
        position: new e.Vector3(0.015, 1.57, 0.19),
        opacity: 1,
        emissiveIntensity: 0.06,
      },
      {
        texture: t.leftFrontClose ?? t.frontClose ?? t.front ?? null,
        center: 0.62,
        blendWidth: 0.76,
        width: 0.86,
        height: 1.06,
        position: new e.Vector3(0.02, 1.57, 0.17),
        opacity: 0.96,
        emissiveIntensity: 0.052,
      },
      {
        texture:
          t.rightFrontClose ??
          t.leftFrontClose ??
          t.frontClose ??
          t.front ??
          null,
        center: -0.62,
        blendWidth: 0.76,
        width: 0.86,
        height: 1.06,
        position: new e.Vector3(0.02, 1.57, 0.17),
        opacity: 0.96,
        emissiveIntensity: 0.052,
        mirror: !t.rightFrontClose && Boolean(t.leftFrontClose),
      },
      {
        texture: t.sideClose ?? t.side ?? null,
        center: 1.16,
        blendWidth: 0.58,
        width: 0.8,
        height: 1.04,
        position: new e.Vector3(0.02, 1.56, 0.1),
        opacity: 0.8,
        emissiveIntensity: 0.04,
      },
      {
        texture: t.sideClose ?? t.side ?? null,
        center: -1.16,
        blendWidth: 0.58,
        width: 0.8,
        height: 1.04,
        position: new e.Vector3(0.02, 1.56, 0.1),
        opacity: 0.8,
        emissiveIntensity: 0.04,
        mirror: !0,
      },
      {
        texture: t.backClose ?? null,
        center: Math.PI,
        blendWidth: 0.7,
        width: 0.84,
        height: 1.08,
        position: new e.Vector3(0.01, 1.58, -0.02),
        opacity: 0.86,
        emissiveIntensity: 0.03,
      },
    ],
    s = [];
  n.forEach((n) => {
    if (!n.texture) return;
    const r = buildCurvedPortraitPlane(n.texture, {
      width: n.width,
      height: n.height,
      curveDepth: 0.06,
      alphaTest: 0.16,
      featherMask: { centerX: 0.5, centerY: 0.54, inner: 0.12, outer: 0.34 },
      roughness: 0.84,
      emissive: "#fff4eb",
      emissiveIntensity: n.emissiveIntensity,
      position: n.position.clone(),
      scale: new e.Vector3(
        (n.mirror ? -1 : 1) * (o.scaleX ?? 1),
        o.scaleY ?? 1,
        1,
      ),
    });
    ((r.renderOrder = 14),
      (r.userData.viewCenter = n.center),
      (r.userData.blendWidth = n.blendWidth),
      (r.userData.baseOpacity = n.opacity),
      s.push(r),
      a.add(r));
  });
  const r0 = t.frontClose ?? t.front ?? null;
  if (r0) {
    const t = buildCurvedPortraitPlane(r0, {
      width: 0.22,
      height: 0.29,
      curveDepth: 0.024,
      alphaTest: 0.04,
      featherMask: {
        centerX: 0.5,
        centerY: 0.5,
        radiusX: 0.22,
        radiusY: 0.26,
        inner: 0.12,
        outer: 0.24,
      },
      roughness: 0.92,
      emissive: "#fff6ef",
      emissiveIntensity: 0.04,
      position: new e.Vector3(0.008, 1.576, 0.164),
      mapRepeat: new e.Vector2(0.24, 0.4),
      mapOffset: new e.Vector2(0.38, 0.38),
    });
    ((t.renderOrder = 16),
      (t.visible = !1),
      (t.material.opacity = 0),
      (t.material.depthTest = !1),
      a.add(t),
      (a.userData.heroFaceCard = t));
  }
  const r = b("rgba(255,244,218,1)", 1.04, 1.18, 0.12);
  return (
    (r.position.set(0.02, 1.58, 0.1), (r.renderOrder = 13)),
    a.add(r),
    (a.userData.planes = s),
    (a.userData.glow = r),
    a
  );
}
function updateJuniorHeroFaceCard(t, o, a, n = 1) {
  const s = o?.userData?.heroFaceCard;
  if (!s?.material) return;
  const r = t.userData.runtimeModelRoot?.visible
      ? t.userData.runtimeModelRoot
      : t.userData.runtimeModelRoot ?? null,
    i = r?.userData?.heroAnchor?.face ?? null;
  i &&
    (s.position.set(
      i.x + 0.002,
      i.y - 0.01,
      i.z + 0.028,
    ),
    s.scale.setScalar(0.72));
  (a.getWorldPosition(juniorPortraitCameraWorld),
    juniorPortraitCameraLocal.copy(juniorPortraitCameraWorld),
    t.worldToLocal(juniorPortraitCameraLocal));
  const l = juniorPortraitCameraLocal.x - s.position.x,
    c = juniorPortraitCameraLocal.z - s.position.z,
    h = juniorPortraitCameraLocal.y - s.position.y;
  ((s.rotation.y = Math.atan2(l, Math.abs(c) < 0.001 ? 0.001 : c)),
    (s.rotation.x = 0.06 * Math.atan2(h, Math.max(0.24, Math.hypot(l, c)))),
    (s.material.opacity = n),
    (s.visible = n > 0.02));
}
function updateJuniorPortraitShell(t, o, a, n = 1) {
  const s = o?.userData?.planes;
  if (!s?.length) return;
  (a.getWorldPosition(juniorPortraitCameraWorld),
    juniorPortraitCameraLocal.copy(juniorPortraitCameraWorld),
    t.worldToLocal(juniorPortraitCameraLocal));
  const r = Math.atan2(
    juniorPortraitCameraLocal.x,
    Math.abs(juniorPortraitCameraLocal.z) < 0.001
      ? 0.001
      : juniorPortraitCameraLocal.z,
  );
  let i = 0;
  s.forEach((t) => {
    const o = Math.max(
      0,
      1 -
        angularDistance(r, t.userData.viewCenter ?? 0) /
          (t.userData.blendWidth ?? 0.7),
    );
    ((t.userData.viewWeight = o * o * (3 - 2 * o)),
      (i = Math.max(i, t.userData.viewWeight)));
    const a = juniorPortraitCameraLocal.x - t.position.x,
      n = juniorPortraitCameraLocal.z - t.position.z,
      s = juniorPortraitCameraLocal.y - t.position.y;
    ((t.rotation.y = Math.atan2(a, Math.abs(n) < 0.001 ? 0.001 : n)),
      (t.rotation.x = 0.14 * Math.atan2(s, Math.max(0.22, Math.hypot(a, n)))));
  });
  s.forEach((t) => {
    if (!t.material) return;
    const o = i > 0.001 ? (t.userData.viewWeight ?? 0) / i : 0,
      a = Math.min(
        1,
        n * (t.userData.baseOpacity ?? 1) * Math.pow(Math.max(0, o), 2.8),
      );
    ((t.material.opacity = a), (t.visible = a > 0.02));
  });
  const l = o.userData.glow;
  if (!l?.material) return;
  const c = juniorPortraitCameraLocal.x - l.position.x,
    h = juniorPortraitCameraLocal.z - l.position.z,
    d = juniorPortraitCameraLocal.y - l.position.y,
    p = 0.08 * n;
  ((l.material.opacity = p),
    (l.visible = p > 0.02),
    (l.rotation.y = Math.atan2(c, Math.abs(h) < 0.001 ? 0.001 : h)),
    (l.rotation.x = 0.08 * Math.atan2(d, Math.max(0.22, Math.hypot(c, h)))));
}
function resolveJuniorRuntimeManifest(t = {}) {
  const o = t.runtimeModelUrl ?? t.modelUrl ?? t.runtimeUrl ?? null,
    a = t.heroCloseupModelUrl ?? t.closeupModelUrl ?? o ?? null;
  return {
    ...t,
    runtimeModelUrl: o,
    heroCloseupModelUrl: a,
    hasRuntimeModelUrl: Boolean(o),
    hasHeroCloseupModelUrl: Boolean(a),
  };
}
function resolveJuniorGltfLoaderCtor() {
  return typeof GLTFLoader < "u"
    ? GLTFLoader
    : typeof window > "u"
      ? null
      : window.GLTFLoader ?? window.THREE?.GLTFLoader ?? null;
}
function loadJuniorGltfModel(t, o = {}) {
  if (!t) return Promise.resolve(null);
  const a = resolveJuniorGltfLoaderCtor();
  if (!a) {
    const o = new Error("GLTFLoader unavailable for junior runtime asset.");
    return ((o.code = "gltf_loader_unavailable"), Promise.reject(o));
  }
  return new Promise((n, s) => {
    try {
      const r = new a(o.manager ?? new e.LoadingManager());
      // 設 DRACOLoader 解碼 Draco-compressed GLB(2026-05-09 round-15+ 加)
      // 用 import.meta.url 計算相對 renderer.js 的 draco/ 路徑(避免 page URL 跟 module URL 不同 base 問題)
      if (typeof DRACOLoader !== "undefined") {
        try {
          const d = new DRACOLoader();
          d.setDecoderPath(new URL("./draco/", import.meta.url).href);
          r.setDRACOLoader(d);
        } catch (e) {
          // 沒設成功仍可 load 非 Draco GLB
        }
      }
      o.crossOrigin && (r.crossOrigin = o.crossOrigin);
      r.load(t, n, void 0, s);
    } catch (t) {
      s(t);
    }
  });
}
function attachJuniorGltfModel(t, o, a = {}) {
  if (!t) return null;
  const n = o?.scene ?? o?.scenes?.[0] ?? null;
  if (!n) return null;
  t.clear(),
    a.scale && n.scale.setScalar(a.scale),
    a.position && n.position.copy(a.position),
    a.rotation && n.rotation.set(a.rotation.x, a.rotation.y, a.rotation.z),
    (n.visible = !0),
    t.add(n),
    t.updateMatrixWorld(!0),
    n.updateMatrixWorld(!0);
  const s = new e.Box3().setFromObject(n),
    r = s.getSize(new e.Vector3()),
    i = s.getCenter(new e.Vector3()),
    l = (o) => t.worldToLocal(o.clone()),
    c = (o) => {
      const a = n.getObjectByName(o);
      if (!a) return null;
      return t.worldToLocal(a.getWorldPosition(new e.Vector3()));
    },
    h = {
      center: c("hero_center_anchor"),
      face: c("hero_face_anchor"),
      chest: c("hero_bust_anchor"),
      eyes: c("hero_eyes_anchor"),
      shoulder: c("hero_shoulders_anchor"),
    },
    d = {
      center: h.center ?? l(i.clone()),
      face:
        h.face ??
        l(new e.Vector3(i.x, s.max.y - 0.24 * r.y, i.z + 0.09 * r.z)),
      chest:
        h.chest ??
        l(new e.Vector3(i.x, s.max.y - 0.45 * r.y, i.z + 0.04 * r.z)),
      eyes:
        h.eyes ??
        l(new e.Vector3(i.x, s.max.y - 0.2 * r.y, i.z + 0.11 * r.z)),
      shoulder:
        h.shoulder ??
        l(new e.Vector3(i.x, s.max.y - 0.38 * r.y, i.z + 0.05 * r.z)),
    };
  return (
    (t.userData.heroAnchor = d),
    (t.userData.heroBounds = {
      min: l(s.min.clone()),
      max: l(s.max.clone()),
      size: r.clone(),
      center: d.center.clone(),
    }),
    (t.userData.basePosition ??= t.position.clone()),
    (t.userData.baseScale ??= t.scale.clone()),
    (t.userData.baseRotation ??= t.rotation.clone()),
    x(n, a.castShadow ?? !0, a.receiveShadow ?? !0),
    n
  );
}
function setJuniorHeroLeadVisibility(t, o, a = {}) {
  if (!t) return;
  const n = Boolean(o),
    s = a.heroHeadRoot ?? t.heroHeadRoot ?? null,
    u = a.heroCloseupModelRoot ?? t.heroCloseupModelRoot ?? null,
    r = a.runtimeModelRoot ?? t.runtimeModelRoot ?? null,
    i = a.runtimeModelReady ?? Boolean(r?.userData?.ready),
    l = Boolean(a.keepLegacyBody),
    c = Boolean(a.suppressRuntimeModel),
    h = a.showHeroHeadRoot ?? !1,
    d = (t, o) => {
      t && (t.visible = o);
    },
    p = (t) => {
      t &&
        (t.userData.baseScale ??= t.scale.clone(),
        t.userData.basePosition ??= t.position.clone(),
        t.userData.baseRotation ??= t.rotation.clone());
    };
  [
    t.head,
    t.jaw,
    t.faceSideL,
    t.faceSideR,
    t.facePlane,
    t.faceShell,
    t.frontHairStripL,
    t.frontHairStripR,
    t.frontHairInnerL,
    t.frontHairInnerR,
    t.hairCurtainL,
    t.hairCurtainR,
    t.sideLockL,
    t.sideLockR,
    t.fringe,
    t.browL,
    t.browR,
    t.eyeWhiteL,
    t.eyeWhiteR,
    t.irisL,
    t.irisR,
    t.eyeContourL,
    t.eyeContourR,
    t.eyeSparkleL,
    t.eyeSparkleR,
    t.faceFront,
    t.mouth,
    t.noseTip,
    t.noseBridge,
    t.lipGloss,
    t.closeupRefinement,
    t.referenceHairCap,
    t.headGlow,
    t.hairBack,
  ].forEach((t) => d(t, i ? !1 : !0));
  t.legacyChildren?.forEach((t) => d(t, i ? !1 : (l || !0)));
  if (s) {
    p(s);
    const o = n && h;
    (s.visible = o),
      o
        ? (s.position.copy(s.userData.basePosition),
          s.rotation.copy(s.userData.baseRotation),
          s.scale.copy(s.userData.baseScale))
        : (s.position.copy(s.userData.basePosition),
          s.rotation.copy(s.userData.baseRotation),
          s.scale.copy(s.userData.baseScale));
  }
  if (u) {
    p(u), (u.visible = !1);
  }
  if (r) {
    p(r);
    (r.visible = i && !c),
      (r.position.copy(r.userData.basePosition),
      r.rotation.copy(r.userData.baseRotation),
      r.scale.copy(r.userData.baseScale));
  }
  if (!n && !i) {
    [
      t.head,
      t.jaw,
      t.faceSideL,
      t.faceSideR,
      t.facePlane,
      t.faceShell,
      t.frontHairStripL,
      t.frontHairStripR,
      t.frontHairInnerL,
      t.frontHairInnerR,
      t.hairCurtainL,
      t.hairCurtainR,
      t.sideLockL,
      t.sideLockR,
      t.fringe,
      t.browL,
      t.browR,
      t.eyeWhiteL,
      t.eyeWhiteR,
      t.irisL,
      t.irisR,
      t.eyeContourL,
      t.eyeContourR,
      t.eyeSparkleL,
      t.eyeSparkleR,
      t.faceFront,
      t.mouth,
      t.noseTip,
      t.noseBridge,
      t.lipGloss,
      t.closeupRefinement,
      t.referenceHairCap,
      t.headGlow,
      t.hairBack,
    ].forEach((t) => t && (t.visible = !0));
    t.closeupRefinement && (t.closeupRefinement.visible = !1);
  }
}
function setJuniorGltfFaceVisibility(t, o) {
  if (!t) return;
  t.traverse((t) => {
    if (!t?.isMesh) return;
    const a = t.name || "";
    if (
      a.startsWith("head_") ||
      "chin" === a ||
      a.startsWith("cheek_") ||
      a.startsWith("ear_") ||
      a.startsWith("nose_") ||
      a.startsWith("lip_") ||
      a.startsWith("eye_") ||
      a.startsWith("brow_") ||
      a.startsWith("eyelash_") ||
      a.startsWith("hair_") ||
      "scrunchie" === a
    )
      t.visible = o;
  });
}
function resolveJuniorHeroAnchor(t, o = {}) {
  const a = t?.userData ?? {},
    n = a.heroCloseupModelRoot ?? null,
    s = a.runtimeModelRoot ?? null,
    r = a.heroHeadRoot ?? null,
    allowLegacyFallback = Boolean(o.allowLegacyFallback),
    i =
      o.forceRoot ??
      (s?.visible ? s : null) ??
      (allowLegacyFallback ? (n?.visible ? n : r?.visible ? r : null) : null),
    anchor = i?.userData?.heroAnchor ?? null,
    c =
      i?.userData?.kind ??
      (s?.visible
        ? "runtime_glb"
        : anchor
          ? n?.visible
            ? "hero_closeup_glb"
            : r?.visible
              ? "procedural_hero_head"
              : "procedural_body"
          : "runtime_glb");
  const h = i?.userData?.kind ?? c,
    d = i
      ? i.getWorldPosition(new e.Vector3())
      : t
        ? t.getWorldPosition(new e.Vector3())
        : new e.Vector3(),
    p =
      "runtime" === h || "hero_closeup" === h
        ? (i.updateMatrixWorld(!0),
          (t) => (t ? i.localToWorld(t.clone()) : d.clone()))
        : "procedural_hero_head" === h && t
          ? (o) => (o ? t.localToWorld(o.clone()) : d.clone())
          : (t) => (t ? t.clone() : d.clone());
  return (
    anchor
      ? ("runtime" === h || "hero_closeup" === h
          ? (juniorHeroAnchorCenter.copy(p(anchor.center ?? anchor.face ?? null)),
            juniorHeroAnchorFace.copy(
              p(anchor.face ?? anchor.center ?? anchor.eyes ?? anchor.chest ?? null),
            ),
            juniorHeroAnchorChest.copy(
              p(anchor.chest ?? anchor.center ?? anchor.face ?? null),
            ),
            juniorHeroAnchorEyes.copy(
              p(anchor.eyes ?? anchor.face ?? anchor.center ?? null),
            ))
          : (juniorHeroAnchorCenter.copy(p(anchor.center ?? anchor.face ?? null)),
            juniorHeroAnchorFace.copy(
              p(anchor.face ?? anchor.center ?? anchor.eyes ?? anchor.chest ?? null),
            ),
            juniorHeroAnchorChest.copy(
              p(anchor.chest ?? anchor.center ?? anchor.face ?? null),
            ),
            juniorHeroAnchorEyes.copy(
              p(anchor.eyes ?? anchor.face ?? anchor.center ?? null),
            )))
      : ((juniorHeroAnchorCenter.copy(d),
        juniorHeroAnchorFace.copy(d).add(o.faceOffset ?? new e.Vector3(0, 0.46, 0.14)),
        juniorHeroAnchorChest.copy(d).add(o.chestOffset ?? new e.Vector3(0, 0.24, 0.08)),
        juniorHeroAnchorEyes.copy(d).add(o.eyeOffset ?? new e.Vector3(0, 0.5, 0.16))),
        c === "procedural_hero_head" &&
          (juniorHeroAnchorFace.set(d.x, d.y + 0.02, d.z + 0.1),
          juniorHeroAnchorChest.set(d.x, d.y - 0.06, d.z + 0.06),
          juniorHeroAnchorEyes.set(d.x, d.y + 0.04, d.z + 0.1))),
    {
      kind: c,
      root: i,
      center: juniorHeroAnchorCenter.clone(),
      face: juniorHeroAnchorFace.clone(),
      chest: juniorHeroAnchorChest.clone(),
      eyes: juniorHeroAnchorEyes.clone(),
    }
  );
}
function hasAncestor(e, t) {
  for (let o = e; o; o = o.parent) if (o === t) return !0;
  return !1;
}
function loadGlbAsset(t, o) {
  return new Promise((a, n) => {
    t.load(
      o,
      (t) => a(t),
      void 0,
      (t) => n(t instanceof Error ? t : new Error(String(t))),
    );
  });
}
function prepareFormalCharacterAsset(t) {
  t.traverse((t) => {
    t.isMesh &&
      ((t.castShadow = !0),
      (t.receiveShadow = !0),
      t.material &&
        (Array.isArray(t.material) ? t.material : [t.material]).forEach((t) => {
          t.transparent &&
            void 0 === t.alphaTest &&
            (t.alphaTest = Math.max(t.alphaTest ?? 0, 0.04));
        }));
  });
  return t;
}
function resolveJuniorAssetUrls(e, t = "desktop") {
  const o = e?.runtimeTierPolicy?.[t] ?? {},
    a = e?.runtimeTierPolicy?.desktop ?? {},
    n = o.runtimeModelUrl ?? e?.runtimeModelUrl ?? a.runtimeModelUrl ?? null,
    s =
      o.heroCloseupModelUrl ??
      e?.heroCloseupModelUrl ??
      a.heroCloseupModelUrl ??
      null;
  return {
    deliveryMode: e?.deliveryMode ?? e?.mode ?? "procedural",
    runtimeUrl: n,
    heroCloseupUrl: s,
  };
}
export function createLm402Scene(D, runtimeOptions = {}) {
  const V = window.matchMedia("(pointer: coarse)").matches,
    juniorRuntimeManifest = resolveJuniorRuntimeManifest(
      runtimeOptions.characterAssets?.junior2005 ?? {},
    ),
    runtimeState = {
      qualityTier: runtimeOptions.qualityTier ?? (V ? "mobile" : "desktop"),
      qualityTiers: runtimeOptions.qualityTiers ?? {},
      characterAssets: runtimeOptions.characterAssets ?? {},
    };
  let renderTuning = {
    shadowMapSize:
      runtimeState.qualityTiers?.[runtimeState.qualityTier]?.shadowMapSize ??
      (V ? 896 : 2048),
    maxPixelRatio:
      runtimeState.qualityTiers?.[runtimeState.qualityTier]?.maxPixelRatio ??
      (V ? 1 : 1.5),
    dustCount:
      runtimeState.qualityTiers?.[runtimeState.qualityTier]?.dustCount ??
      (V ? 48 : 96),
    mirrorOpacity:
      runtimeState.qualityTiers?.[runtimeState.qualityTier]?.mirrorOpacity ??
      0.1,
    portraitBoost:
      runtimeState.qualityTiers?.[runtimeState.qualityTier]?.portraitBoost ?? 1,
  };
  const assetState = {
      manifestId: runtimeState.characterAssets?.junior2005?.id ?? null,
      runtimeModelUrl: juniorRuntimeManifest.runtimeModelUrl ?? null,
      heroCloseupModelUrl: juniorRuntimeManifest.heroCloseupModelUrl ?? null,
      loaderAvailable: Boolean(resolveJuniorGltfLoaderCtor()),
      qualityTier: runtimeState.qualityTier,
      status: "procedural_fallback",
      fallback: !0,
      modelMode: "procedural_fallback",
      textureStatus: "idle",
      textureFallback: !1,
      textureLastError: null,
      loadedTextures: [],
      loadedModels: [],
      lastError: null,
    },
    U = (function (t, o) {
      const a = [
          {
            label: "webgl2-hq",
            contextIds: ["webgl2"],
            antialias: !o,
            powerPreference: "high-performance",
          },
          {
            label: "webgl2-safe",
            contextIds: ["webgl2"],
            antialias: !1,
            powerPreference: "default",
          },
          {
            label: "webgl-safe",
            contextIds: ["webgl", "experimental-webgl"],
            antialias: !1,
            powerPreference: "default",
          },
        ],
        n = {
          alpha: !1,
          depth: !0,
          stencil: !1,
          premultipliedAlpha: !1,
          preserveDrawingBuffer: !1,
          failIfMajorPerformanceCaveat: !1,
          desynchronized: !0,
        };
      let s = null;
      for (const o of a) {
        const a = {
          ...n,
          antialias: o.antialias,
          powerPreference: o.powerPreference,
        };
        let r = null;
        for (const e of o.contextIds) {
          try {
            r = t.getContext(e, a);
          } catch (e) {
            s = e;
          }
          if (r) break;
        }
        if (r)
          try {
            const a = new e.WebGLRenderer({
              canvas: t,
              context: r,
              antialias: o.antialias,
              alpha: !1,
              powerPreference: o.powerPreference,
              preserveDrawingBuffer: !0, // E10 Polaroid 拍照需要：toDataURL 才能拿到 pixels
            });
            return ((a.__lm402RendererProfile = o.label), a);
          } catch (e) {
            s = e;
            try {
              const e = r.getExtension("WEBGL_lose_context");
              e?.loseContext?.();
            } catch {}
          }
      }
      try {
        const o = new e.WebGLRenderer({
          canvas: t,
          antialias: !1,
          alpha: !1,
          powerPreference: "default",
          preserveDrawingBuffer: !0, // E10 Polaroid 拍照
        });
        return ((o.__lm402RendererProfile = "three-fallback"), o);
      } catch (e) {
        s = e;
      }
      throw s || new Error("Unable to create WebGL renderer.");
    })(D, V);
  ((U.outputColorSpace = e.SRGBColorSpace),
    (U.toneMapping = e.ACESFilmicToneMapping),
    (U.toneMappingExposure = 1.14),
    (U.shadowMap.enabled = !0),
    // Tier 9.1 VSMShadowMap — variance shadow maps，距離自適應軟陰影（取代 PCFSoftShadowMap）
    (U.shadowMap.type = e.VSMShadowMap));
  const W = new e.Scene();
  ((W.background = new e.Color("#ccd8e4")),
    (W.fog = new e.Fog("#d0dce6", 12, 65)));
  const q = new e.PerspectiveCamera(74, 1, 0.03, 180);
  q.rotation.order = "YXZ";
  // === Tier 1 後製管線：黃昏 HDR IBL + 電影派 Bloom/DOF/Vignette ===
  const __sunsetEnvMap = buildSunsetEnvMap(U);
  W.environment = __sunsetEnvMap;
  const __postfx = createPostFX({ renderer: U, scene: W, camera: q });
  if (typeof window !== "undefined") {
    window.__POSTFX__ = __postfx;
    // B-3D-K item 3 (r31):NeutralToneMapping toggle(r179 新加)+ A/B compare console API
    // Usage: __TONE__.set('neutral' | 'aces' | 'reinhard' | 'cineon' | 'agx' | 'none')
    //        __TONE__.current()
    const _toneMap = {
      aces:     e.ACESFilmicToneMapping,
      neutral:  e.NeutralToneMapping,
      reinhard: e.ReinhardToneMapping,
      cineon:   e.CineonToneMapping,
      agx:      e.AgXToneMapping,
      none:     e.NoToneMapping,
    };
    window.__TONE__ = {
      set: (mode) => {
        const m = _toneMap[mode];
        if (m === undefined) {
          console.warn(`[__TONE__] unknown mode "${mode}"; valid: ${Object.keys(_toneMap).join(' | ')}`);
          return;
        }
        U.toneMapping = m;
        console.info(`[__TONE__] set to "${mode}"`);
      },
      current: () => {
        return Object.entries(_toneMap).find(([k, v]) => v === U.toneMapping)?.[0] ?? 'unknown';
      },
      list: () => Object.keys(_toneMap),
    };
    // P1.1 (r35):envmap intensity 全 material multiplier(輕量 A/B,不 rebuild envmap)
    // Usage: __ENVMAP_INTENSITY__(0.7)   // 變暗 30%
    //        __ENVMAP_INTENSITY__(1.0)   // 還原
    //        __ENVMAP_INTENSITY__(1.5)   // 變亮 50%
    window.__ENVMAP_INTENSITY__ = (mult) => {
      let count = 0;
      W.traverse((obj) => {
        if (obj.material && obj.material.envMap) {
          if (obj.material.userData._origEnvMapIntensity === undefined) {
            obj.material.userData._origEnvMapIntensity = obj.material.envMapIntensity ?? 1.0;
          }
          obj.material.envMapIntensity = obj.material.userData._origEnvMapIntensity * mult;
          obj.material.needsUpdate = true;
          count++;
        }
      });
      console.info(`[__ENVMAP_INTENSITY__] multiplied ${count} materials by ${mult}`);
      return count;
    };
    // P1.5 (r35):iridescence 全 material multiplier(微虹光,亞洲女性皮膚高光的玄機)
    // Usage: __IRIDESCENCE__(0)     // 關閉
    //        __IRIDESCENCE__(0.5)   // 加重
    //        __IRIDESCENCE__(1.0)   // 還原(default 0.22)
    window.__IRIDESCENCE__ = (mult) => {
      let count = 0;
      W.traverse((obj) => {
        if (obj.material && typeof obj.material.iridescence === 'number') {
          if (obj.material.userData._origIridescence === undefined) {
            obj.material.userData._origIridescence = obj.material.iridescence;
          }
          obj.material.iridescence = obj.material.userData._origIridescence * mult;
          obj.material.needsUpdate = true;
          count++;
        }
      });
      console.info(`[__IRIDESCENCE__] multiplied ${count} materials by ${mult}`);
      return count;
    };
    // ════════════════════════════════════════════════════════════════
    // r36 push4 美術強化 batch 1(lm402-twin 主推副本)
    // 所有 API 預設 OFF,console call 才啟用 — 避免壞掉
    // 替 toni 拍板 default 已套(rim 暖橘 / tone NeutralToneMapping 等)
    // ════════════════════════════════════════════════════════════════
    // F2 (r36) ToneMapping default 替 toni 拍板:NeutralToneMapping
    // 理由:Three.js r179 加,中性不偏紫(比 ACES 適合 portrait)
    U.toneMapping = e.NeutralToneMapping;
    U.toneMappingExposure = 1.0;
    // L2 (r36) Rim Light 強化 — 學妹後門 11:00「一眼瞬間」邊光描輪廓(暖橘 #ff9a4f)
    let _rimLight = null;
    window.__RIM_LIGHT__ = (intensity = 1.2, color = '#ff9a4f') => {
      if (_rimLight) W.remove(_rimLight);
      _rimLight = new e.DirectionalLight(new e.Color(color), intensity);
      _rimLight.position.set(0, 8, -15);
      _rimLight.target.position.set(0, 1.5, 0);
      W.add(_rimLight); W.add(_rimLight.target);
      console.info(`[__RIM_LIGHT__] intensity=${intensity} color=${color}`);
      return _rimLight;
    };
    window.__RIM_LIGHT_OFF__ = () => {
      if (_rimLight) { W.remove(_rimLight); _rimLight = null; }
      console.info('[__RIM_LIGHT__] off');
    };
    // K1 (r36) Camera Breath — 鏡頭呼吸(0.5-1Hz hand-held 感)
    let _breathRAF = null, _breathT0 = 0, _breathBaseY = null, _breathBaseX = null;
    window.__CAMERA_BREATH__ = (amp = 0.008, freq = 0.6) => {
      if (_breathRAF) cancelAnimationFrame(_breathRAF);
      _breathT0 = performance.now();
      if (_breathBaseY === null) { _breathBaseY = q.position.y; _breathBaseX = q.position.x; }
      const loop = () => {
        const t = (performance.now() - _breathT0) / 1000;
        q.position.y = _breathBaseY + Math.sin(t * freq * 2 * Math.PI) * amp;
        q.position.x = _breathBaseX + Math.cos(t * freq * 1.7 * Math.PI) * amp * 0.6;
        _breathRAF = requestAnimationFrame(loop);
      };
      loop();
      console.info(`[__CAMERA_BREATH__] amp=${amp} freq=${freq}Hz`);
    };
    window.__CAMERA_BREATH_OFF__ = () => {
      if (_breathRAF) { cancelAnimationFrame(_breathRAF); _breathRAF = null; }
      if (_breathBaseY !== null) { q.position.y = _breathBaseY; q.position.x = _breathBaseX; }
      console.info('[__CAMERA_BREATH__] off');
    };
    // K3 (r36) Dolly Zoom / Vertigo — Hitchcock 級「一眼瞬間」鏡頭語言
    window.__DOLLY_ZOOM__ = (strength = 0.5, durationMs = 1500) => {
      const startTime = performance.now();
      const startZ = q.position.z, startFov = q.fov;
      const targetZ = startZ - strength * 2, targetFov = startFov + strength * 25;
      const loop = () => {
        const t = Math.min((performance.now() - startTime) / durationMs, 1);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        q.position.z = startZ + (targetZ - startZ) * ease;
        q.fov = startFov + (targetFov - startFov) * ease;
        q.updateProjectionMatrix();
        if (t < 1) requestAnimationFrame(loop);
        else console.info('[__DOLLY_ZOOM__] complete');
      };
      loop();
      console.info(`[__DOLLY_ZOOM__] strength=${strength} duration=${durationMs}ms`);
    };
    // K2 (r36) Cinemascope 2.35:1 Letterbox — narrative beat 強制電影比例
    let _letterbox = null;
    window.__LETTERBOX__ = (ratio = 2.35, fadeMs = 800) => {
      if (typeof document === 'undefined') return;
      if (_letterbox) { _letterbox.top.remove(); _letterbox.bot.remove(); }
      const screenRatio = window.innerWidth / window.innerHeight;
      const targetH = screenRatio > ratio ? window.innerHeight : window.innerWidth / ratio;
      const barH = Math.max(0, (window.innerHeight - targetH) / 2);
      const top = document.createElement('div'), bot = document.createElement('div');
      top.style.cssText = `position:fixed;top:0;left:0;right:0;height:${barH}px;background:#000;opacity:0;transition:opacity ${fadeMs}ms ease;pointer-events:none;z-index:9999`;
      bot.style.cssText = `position:fixed;bottom:0;left:0;right:0;height:${barH}px;background:#000;opacity:0;transition:opacity ${fadeMs}ms ease;pointer-events:none;z-index:9999`;
      document.body.appendChild(top); document.body.appendChild(bot);
      requestAnimationFrame(() => { top.style.opacity = '1'; bot.style.opacity = '1'; });
      _letterbox = { top, bot };
      console.info(`[__LETTERBOX__] ratio=${ratio} fadeMs=${fadeMs}`);
    };
    window.__LETTERBOX_OFF__ = (fadeMs = 800) => {
      if (!_letterbox) return;
      _letterbox.top.style.opacity = '0'; _letterbox.bot.style.opacity = '0';
      const _lb = _letterbox; _letterbox = null;
      setTimeout(() => { _lb.top.remove(); _lb.bot.remove(); }, fadeMs);
      console.info('[__LETTERBOX__] off');
    };
    // L8 (r36) Catchlight 升 2-3 點 — 眼神光複雜化(角色「活感」)
    let _catchlights = [];
    window.__CATCHLIGHT__ = (count = 3, intensity = 0.8) => {
      _catchlights.forEach(l => W.remove(l)); _catchlights = [];
      const configs = [
        { pos: [2, 3, 3],   color: '#ffffff', i: intensity },
        { pos: [-2, 1, 2],  color: '#ffd9a8', i: intensity * 0.5 },
        { pos: [0, 2, -3],  color: '#88aacc', i: intensity * 0.3 },
      ];
      for (let i = 0; i < Math.min(count, configs.length); i++) {
        const c = configs[i];
        const light = new e.PointLight(new e.Color(c.color), c.i, 8);
        light.position.set(c.pos[0], c.pos[1], c.pos[2]);
        W.add(light); _catchlights.push(light);
      }
      console.info(`[__CATCHLIGHT__] ${count} lights added`);
    };
    window.__CATCHLIGHT_OFF__ = () => {
      _catchlights.forEach(l => W.remove(l)); _catchlights = [];
      console.info('[__CATCHLIGHT__] off');
    };
    // L4 (r36) Contact Shadow 程序近接陰影(SSAO-like 簡化版)
    let _contactShadows = [];
    window.__CONTACT_SHADOW__ = (intensity = 0.5) => {
      _contactShadows.forEach(m => W.remove(m)); _contactShadows = [];
      ['__GO__', '__CO__', '__BO__', '__KO__'].forEach(key => {
        const char = window[key];
        if (!char || !char.position) return;
        const geo = new e.CircleGeometry(0.4, 24);
        const mat = new e.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: intensity * 0.4, depthWrite: false });
        const disc = new e.Mesh(geo, mat);
        disc.rotation.x = -Math.PI / 2;
        disc.position.set(char.position.x, 0.01, char.position.z);
        W.add(disc); _contactShadows.push(disc);
      });
      console.info(`[__CONTACT_SHADOW__] ${_contactShadows.length} discs intensity=${intensity}`);
    };
    window.__CONTACT_SHADOW_OFF__ = () => {
      _contactShadows.forEach(m => W.remove(m)); _contactShadows = [];
      console.info('[__CONTACT_SHADOW__] off');
    };
    // A3 (r36) Dust Particles — 教室飄塵(陽光照射可見)
    let _dust = null;
    window.__DUST__ = (count = 200, intensity = 0.8) => {
      if (_dust) W.remove(_dust);
      const geo = new e.BufferGeometry();
      const positions = new Float32Array(count * 3), velocities = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random() - 0.5) * 16;
        positions[i*3+1] = Math.random() * 4 + 0.5;
        positions[i*3+2] = (Math.random() - 0.5) * 16;
        velocities[i*3] = (Math.random() - 0.5) * 0.001;
        velocities[i*3+1] = -0.0005;
        velocities[i*3+2] = (Math.random() - 0.5) * 0.001;
      }
      geo.setAttribute('position', new e.BufferAttribute(positions, 3));
      geo.userData.velocities = velocities;
      const mat = new e.PointsMaterial({ size: 0.012, color: 0xffe8c0, transparent: true, opacity: intensity * 0.5, sizeAttenuation: true, depthWrite: false, blending: e.AdditiveBlending });
      _dust = new e.Points(geo, mat);
      W.add(_dust);
      const tick = () => {
        if (!_dust) return;
        const p = _dust.geometry.attributes.position.array, v = _dust.geometry.userData.velocities;
        for (let i = 0; i < count; i++) {
          p[i*3] += v[i*3]; p[i*3+1] += v[i*3+1]; p[i*3+2] += v[i*3+2];
          if (p[i*3+1] < 0) p[i*3+1] = 4.5;
        }
        _dust.geometry.attributes.position.needsUpdate = true;
        requestAnimationFrame(tick);
      };
      tick();
      console.info(`[__DUST__] ${count} particles intensity=${intensity}`);
    };
    window.__DUST_OFF__ = () => {
      if (_dust) { W.remove(_dust); _dust = null; }
      console.info('[__DUST__] off');
    };
    // F10 (r36) Hue Shift per emotion — 情緒同步色溫
    window.__HUE_SHIFT__ = (mode = 'calm') => {
      const presets = {
        anxious:   { hue: 0.55, sat: 0.85, exp: 0.9  },
        expectant: { hue: 0.08, sat: 1.1,  exp: 1.05 },
        calm:      { hue: 0,    sat: 1.0,  exp: 1.0  },
        vertigo:   { hue: 0.95, sat: 1.3,  exp: 1.1  },
        nostalgia: { hue: 0.06, sat: 0.7,  exp: 0.95 },
      };
      const p = presets[mode] || presets.calm;
      if (window.__POSTFX__ && window.__POSTFX__.tuning) {
        window.__POSTFX__.tuning.colorGrade = window.__POSTFX__.tuning.colorGrade || {};
        Object.assign(window.__POSTFX__.tuning.colorGrade, p);
      }
      U.toneMappingExposure = p.exp;
      console.info(`[__HUE_SHIFT__] mode="${mode}" hue=${p.hue} sat=${p.sat} exp=${p.exp}`);
    };
    // P4 (r36) 「一眼瞬間」micro-anim sequence — pupil dilate + 嘴角 + 呼吸停
    window.__SPARK_MOMENT__ = () => {
      if (!window.__JUNIOR_RIG__ || !window.__JUNIOR_RIG__.state) {
        console.warn('[__SPARK_MOMENT__] __JUNIOR_RIG__ not ready'); return;
      }
      const s = window.__JUNIOR_RIG__.state;
      const _origBreath = s.autoBreath;
      if (s.lookDir) { s.lookDir.x = 0; s.lookDir.y = 0; }
      setTimeout(() => { s.mouthOpen = 0.18; s.browRaise = 0.6; s.smile = -0.05; }, 200);
      setTimeout(() => { s.autoBreath = false; }, 700);
      setTimeout(() => {
        s.mouthOpen = 0; s.browRaise = 0.1; s.smile = 0.05;
        s.autoBreath = _origBreath;
      }, 1500);
      console.info('[__SPARK_MOMENT__] 一眼瞬間 micro-anim triggered');
    };
    // C5 (r36) Head Wobble passive — 被動小幅頭部漂移
    window.__HEAD_WOBBLE__ = (amplitude = 0.012) => {
      if (window.__JUNIOR_RIG__ && window.__JUNIOR_RIG__.state) {
        window.__JUNIOR_RIG__.state.autoHeadWobble = true;
        window.__JUNIOR_RIG__.state.headWobbleAmplitude = amplitude;
        console.info(`[__HEAD_WOBBLE__] enabled amplitude=${amplitude}`);
      } else console.warn('[__HEAD_WOBBLE__] __JUNIOR_RIG__ not ready');
    };
    // C2 (r36) 真實眨眼節律 — 0.3-0.7Hz + asymmetric
    window.__BLINK_RHYTHM__ = (rate = 0.5, asymmetric = true) => {
      if (window.__JUNIOR_RIG__ && window.__JUNIOR_RIG__.state) {
        window.__JUNIOR_RIG__.state.blinkRate = rate;
        window.__JUNIOR_RIG__.state.blinkAsymmetric = asymmetric;
        console.info(`[__BLINK_RHYTHM__] rate=${rate}Hz asymmetric=${asymmetric}`);
      } else console.warn('[__BLINK_RHYTHM__] __JUNIOR_RIG__ not ready');
    };
    // r36 batch 1 — apply all defaults at once
    window.__ART_APPLY_ALL__ = () => {
      try { window.__RIM_LIGHT__(1.2, '#ff9a4f'); } catch(e) {}
      try { window.__CAMERA_BREATH__(0.008, 0.6); } catch(e) {}
      try { window.__CATCHLIGHT__(3, 0.8); } catch(e) {}
      try { window.__CONTACT_SHADOW__(0.5); } catch(e) {}
      try { window.__DUST__(200, 0.8); } catch(e) {}
      try { window.__HEAD_WOBBLE__(0.012); } catch(e) {}
      try { window.__BLINK_RHYTHM__(0.5, true); } catch(e) {}
      try { window.__HUE_SHIFT__('calm'); } catch(e) {}
      console.info('[__ART_APPLY_ALL__] r36 美術 batch 1 全套啟用');
    };
    window.__ART_RESET_ALL__ = () => {
      try { window.__RIM_LIGHT_OFF__(); } catch(e) {}
      try { window.__CAMERA_BREATH_OFF__(); } catch(e) {}
      try { window.__CATCHLIGHT_OFF__(); } catch(e) {}
      try { window.__CONTACT_SHADOW_OFF__(); } catch(e) {}
      try { window.__DUST_OFF__(); } catch(e) {}
      try { window.__LETTERBOX_OFF__(); } catch(e) {}
      console.info('[__ART_RESET_ALL__] r36 美術 batch 1 全套重置');
    };
  }
  // === /Tier 1 ===
  const _ = new e.Raycaster(),
    A = [],
    Z = [],
    L = new Map(),
    stairLayouts = [];
  let X = {
    camera: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 },
    viewport: { width: 0, height: 0 },
    cssViewport: { width: 0, height: 0 },
    projectedNodes: {},
    hotspotLOS: {},
    colliders: 0,
    mobileBlackRegionDetected: !1,
  };
  const j = new e.Group(),
    $ = new e.Group(),
    H = new e.Group(),
    F = new e.Group();
  W.add(j, $, H, F);
  const N = g(t.minX),
    O = g(t.maxX),
    Y = g(t.minZ),
    J = g(t.maxZ),
    K = g(t.dividerX),
    Q = N,
    ee = K,
    te = O,
    oe = K - Q,
    ae = (Q + K) / 2,
    ne = te - ee,
    se = J - Y,
    re = (Y + J) / 2,
    ie = 2.92,
    le = 0.12,
    ce = g(t.corridor.parapetHeight),
    he = g(t.board.z),
    de = g(t.board.x1),
    pe = g(t.board.x2),
    me = (de + pe) / 2,
    we = g(t.frontDoor.z1),
    Me = g(t.frontDoor.z2),
    fe = g(t.backDoor.z1),
    ue = g(t.backDoor.z2),
    ye = t.floorRooms.find((e) => e.interactive) ?? t.floorRooms[0],
    ge = g(ye.z1),
    xe = g(ye.z2),
    be = g(t.stairs.front.z1),
    Se = g(t.stairs.front.z2),
    ze = g(t.stairs.back.z1),
    Pe = g(t.stairs.back.z2),
    ve = (t, o, a) => new e.Vector3(g(t), g(o), g(a)),
    Ge = (e, t) => ({
      side: t,
      z1: g(e.z - e.width / 2 + 18),
      z2: g(e.z + e.width / 2 - 18),
      y1: g(e.y1 + 6),
      y2: g(e.y2 - 4),
    }),
    Ce = ({ x: t, zStart: o, zEnd: a, openings: n, material: s, label: r }) => {
      const i = [o, a];
      n.forEach((e) => {
        e.z2 <= o || e.z1 >= a || i.push(Math.max(o, e.z1), Math.min(a, e.z2));
      });
      const l = [...new Set(i.map((e) => Number(e.toFixed(4))))].sort(
        (e, t) => e - t,
      );
      for (let o = 0; o < l.length - 1; o += 1) {
        const a = l[o],
          i = l[o + 1];
        if (i - a <= 0.01) continue;
        const c = (a + i) / 2,
          h = n.filter((e) => c >= e.z1 && c <= e.z2),
          d = [0, ie];
        h.forEach((e) => {
          d.push(e.y1, e.y2);
        });
        const p = [...new Set(d.map((e) => Number(e.toFixed(4))))].sort(
          (e, t) => e - t,
        );
        for (let o = 0; o < p.length - 1; o += 1) {
          const n = p[o],
            l = p[o + 1];
          if (l - n <= 0.01) continue;
          const c = (n + l) / 2;
          h.some((e) => c > e.y1 && c < e.y2) ||
            R(
              j,
              A,
              new e.BoxGeometry(le, l - n, i - a),
              s,
              new e.Vector3(t, n + (l - n) / 2, a + (i - a) / 2),
              null,
              Z,
              { minX: t - 0.06, maxX: t + 0.06, minZ: a, maxZ: i, label: r },
            );
        }
      }
    },
    Be = new e.HemisphereLight(8900331, 9139029, 1);
  W.add(Be);
  const ke = new e.AmbientLight(16775408, 0.22);
  W.add(ke);
  const Te = new e.DirectionalLight(16772034, 2.8);
  (Te.position.set(-11.2, 10.8, 5.4),
    Te.target.position.set(0, 0, re),
    W.add(Te.target),
    (Te.castShadow = !0),
    Te.shadow.mapSize.set(
      renderTuning.shadowMapSize,
      renderTuning.shadowMapSize,
    ),
    (Te.shadow.camera.near = 0.5),
    (Te.shadow.camera.far = 52),
    (Te.shadow.camera.left = -18),
    (Te.shadow.camera.right = 14),
    (Te.shadow.camera.top = 14),
    (Te.shadow.camera.bottom = -14),
    (Te.shadow.bias = -3e-4),
    (Te.shadow.normalBias = 0.026),
    // Tier 9.1 VSM 軟陰影 + A7 推極限（雙時空）
    (Te.shadow.radius = 14),               // 8 → 14（更軟）
    (Te.shadow.blurSamples = 40),          // 25 → 40（更高品質）
    (Te.shadow.mapSize.set(4096, 4096)),   // 提升解析度避免 blur 出鋸齒
    W.add(Te));
  // E3 季節時間環境 — 5 preset 切換（dusk/night/rainy/snowy/day）
  // 窗戶玻璃 + 窗框材質 — 提前宣告(下方 createEnvironmentPresets 需要 glassMaterial,
  // 不可在宣告前引用 → 否則 const TDZ ReferenceError)
  const Vt = new e.MeshPhysicalMaterial({
      color: "#dce8f2",
      roughness: 0.03,
      metalness: 0.01,
      transmission: 0.95,
      thickness: 0.05,
      transparent: !0,
      opacity: 0.14,
      ior: 1.52,
      clearcoat: 1,
      clearcoatRoughness: 0.01,
      envMapIntensity: 0.5,
      reflectivity: 0.6,
      side: e.DoubleSide,
      depthWrite: !1,
    }),
    Et = new e.MeshStandardMaterial({
      color: "#beb5a5",
      roughness: 0.62,
      metalness: 0.14,
    });
  __envPresets = createEnvironmentPresets({
    scene: W,
    light: Te,
    ambientLight: ke,
    renderer: U,
    glassMaterial: Vt,                     // 窗戶玻璃 PBR — B-VIS-002 night envmap 透出修正
    sceneEnvSource: __sunsetEnvMap,        // 用於 sceneEnvIntensity lerp reference
    transitionMs: 2000,
  });
  if (typeof window !== "undefined") window.__ENV__ = __envPresets;
  // E4 場景 prop(月亮 / 雲 / 雨雪)— 鉤在 environment-presets setPreset 後
  // worldAnchor 對齊雙時空教室右牆外、中段窗戶位置
  // (data.js: rightWallWindows z=1640 / classroom right wall x≈2400 / g(e)=0.0125*e)
  __e4Props = createE4Props({
    scene: W,
    currentPreset: __envPresets.getCurrentPreset?.() || "dusk",
    worldAnchor: { x: g(2400), y: 0, z: g(1640) },   // ≈ (30, 0, 20.5)
  });
  const __envOriginalSetPreset = __envPresets.setPreset.bind(__envPresets);
  __envPresets.setPreset = function (name, transitionMs) {
    __envOriginalSetPreset(name, transitionMs);
    __e4Props.syncToPreset(name);
  };
  if (typeof window !== "undefined") window.__E4_PROPS__ = __e4Props;
  // (角色 Go/Co/Bo/ko 的 window expose 已移到下方角色宣告之後 — const 不可在宣告前引用)
  // 6 個 narrative module wire-up(round-15+ — 認 round-12 over-claim 修)
  // CLAUDE.md console API 表 line 514-519 宣稱有但實際沒接 — 1182 行 source 寫了沒 wire-up
  // ─ DOM-only / no deps(可獨立 init)─
  __narrativeOverlay = createNarrativeOverlay();           // __NARRATIVE__ H1+H3 文學旁白系統
  __transitions = createTransitions();                      // __TRANSITIONS__ H2+H4 章節 fade + 記憶閃回
  __letter = createNarrativeLetter();                       // __LETTER__ H6 書信日記
  __audioLayer = createNarrativeAudio();                    // __AUDIO_LAYER__ H7+H8 環境音 + 動態 BGM
  // ─ 依賴 __JUNIOR_RIG__ + __NARRATIVE__(必須在它們之後)─
  __initiated = createInitiatedInteractions();              // __INITIATED__ C8 學妹發起互動 6 種情緒
  // ─ 依賴 canvas(從 renderer.domElement 取)─
  __polaroid = createPolaroidCapture({
    getCanvas: () => U.domElement,
    getYear: () => "2005",
    subtitle: "LM402 · 一眼瞬間",
  });
  if (typeof window !== "undefined") {
    window.__NARRATIVE__ = __narrativeOverlay;
    window.__TRANSITIONS__ = __transitions;
    window.__LETTER__ = __letter;
    window.__AUDIO_LAYER__ = __audioLayer;
    window.__INITIATED__ = __initiated;
    window.__POLAROID__ = __polaroid;
  }
  const Ie = new e.PointLight(14215156, 1.28, 58, 2);
  (Ie.position.set(Q + 2.42, 3.64, g(t.frontDoor.center.z - 122)), W.add(Ie));
  const Re = new e.PointLight(16771512, 1.72, 68, 2);
  (Re.position.set(N - 1.72, 6.42, g(t.frontDoor.center.z - 8)), W.add(Re));
  const De = new e.PointLight(16767403, 2.2, 46, 2);
  (De.position.set(te - 1.46, 2.78, g(t.classroom.lightWellZ + 64)), W.add(De));
  const Ve = new e.PointLight(16773071, 1.9, 36, 2);
  (Ve.position.set(ee + 1.56, 2.44, g(t.backDoor.center.z + 28)), W.add(Ve));
  const Ee = new e.PointLight(16774368, 1.8, 38, 2);
  (Ee.position.set((ee + te) / 2, 1.82, ge + 1.6), W.add(Ee));
  const Ue = new e.PointLight(16775915, 1.6, 34, 2);
  (Ue.position.set((ee + te) / 2, 1.82, xe - 1.6), W.add(Ue));
  const We = new e.PointLight(16772829, 0.8, 12, 2);
  (We.position.set(g(200), 2.8, g(t.backDoor.center.z + 100)), W.add(We));
  const qe = k({ base: "#856549", dark: "#5c422d", highlight: "#b18a63" }),
    _e = B({
      base: "#bcc3cb",
      line: "rgba(245,245,250,.65)",
      speck: "rgba(120,130,140,",
    }),
    Ae = C({
      base: "#e8e1d7",
      accent: "rgba(255,255,255,.12)",
      line: "rgba(174,162,145,.22)",
      warm: !0,
    }),
    Ze = C({
      base: "#cbd4dd",
      accent: "rgba(255,255,255,.12)",
      line: "rgba(132,145,160,.22)",
    }),
    Le = C({
      base: "#ddd7cf",
      accent: "rgba(255,255,255,.12)",
      line: "rgba(126,118,104,.2)",
      warm: !0,
    }),
    Xe = k({ base: "#96704a", dark: "#5c3e26", highlight: "#b8925e" }),
    je = G(
      512,
      512,
      (e, t, o) => {
        ((e.fillStyle = "#29453a"), e.fillRect(0, 0, t, o));
        for (let a = 0; a < 120; a += 1)
          ((e.fillStyle = `rgba(255,255,255,${0.01 + 0.02 * Math.random()})`),
            e.fillRect(
              Math.random() * t,
              Math.random() * o,
              12 + 48 * Math.random(),
              1 + 2 * Math.random(),
            ));
        ((e.strokeStyle = "rgba(214,226,218,.12)"),
          (e.lineWidth = 4),
          e.beginPath(),
          e.moveTo(36, 102),
          e.lineTo(196, 114),
          e.moveTo(218, 180),
          e.lineTo(468, 162),
          e.moveTo(128, 322),
          e.lineTo(404, 336),
          e.stroke());
      },
      1.4,
      1.2,
    ),
    $e = C({
      base: "#6e8d5a",
      accent: "rgba(255,255,255,.02)",
      line: "rgba(84,112,70,.16)",
      warm: !0,
    }),
    He = B({
      base: "#cfd4d8",
      line: "rgba(248,248,252,.68)",
      speck: "rgba(134,142,152,",
    }),
    Fe = new e.MeshPhysicalMaterial({
      color: "#8a6848",
      map: qe,
      roughness: 0.65,
      metalness: 0.06,
      clearcoat: 0.08,
      clearcoatRoughness: 0.5,
    }),
    Ne = new e.MeshPhysicalMaterial({
      color: "#b8c0ca",
      map: _e,
      roughness: 0.68,
      metalness: 0.05,
      clearcoat: 0.10,
      clearcoatRoughness: 0.45,
    }),
    Oe = new e.MeshStandardMaterial({
      color: "#f0eeea",
      map: Ae,
      roughness: 0.92,
      metalness: 0.02,
    }),
    Ye = new e.MeshStandardMaterial({
      color: "#edecea",
      map: Ze,
      roughness: 0.90,
      metalness: 0.03,
    }),
    Je = new e.MeshPhysicalMaterial({
      color: "#9a6e42",
      map: Xe,
      roughness: 0.58,
      metalness: 0.06,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
    }),
    Ke = new e.MeshStandardMaterial({
      color: "#7e868e",
      roughness: 0.42,
      metalness: 0.52,
    }),
    Qe = new e.MeshPhysicalMaterial({
      color: "#1a3828",
      map: je,
      roughness: 0.68,
      metalness: 0.05,
      clearcoat: 0.22,
      clearcoatRoughness: 0.3,
    }),
    et =
      (new e.MeshStandardMaterial({
        color: "#e2dcd2",
        map: Le,
        roughness: 0.88,
        metalness: 0.03,
      }),
      new e.MeshStandardMaterial({
        color: "#f5ede0",
        map: Ae,
        roughness: 0.84,
        metalness: 0.02,
      })),
    tt =
      (new e.MeshStandardMaterial({
        color: "#7a9a64",
        map: $e,
        roughness: 0.96,
        metalness: 0.01,
      }),
      new e.MeshStandardMaterial({
        color: "#cdd3d9",
        map: He,
        roughness: 0.9,
        metalness: 0.02,
      })),
    ot = g(t.corridor.campusDepth),
    at = -12,
    nt = new e.MeshStandardMaterial({
      color: "#ccc7be",
      roughness: 0.92,
      metalness: 0.03,
    }),
    st = new e.Mesh(new e.BoxGeometry(0.15, 9, se), nt);
  (st.position.set(N - 0.08, -4.5, re), j.add(st));
  const rt = new e.MeshStandardMaterial({
    color: "#8ab4d6",
    emissive: "#4a6a8a",
    emissiveIntensity: 0.15,
    roughness: 0.3,
  });
  for (let t = 0; t < 3; t++) {
    const o = 0 - 3 * (t + 1) + 1.5;
    for (let t = 0; t < 12; t++) {
      const a = Y + (t + 0.5) * (se / 12),
        n = new e.Mesh(new e.PlaneGeometry(1.2, 1.5), rt);
      (n.position.set(N - 0.16, o, a), (n.rotation.y = -Math.PI / 2), j.add(n));
    }
  }
  const it = new e.Mesh(new e.BoxGeometry(0.44 * ot, 0.06, 0.92 * se), tt);
  (it.position.set(N - 0.26 * ot, -11.97, re + 0.26),
    (it.receiveShadow = !0),
    j.add(it));
  const lt = b("rgba(255,233,192,1)", 9.6, 6.2, 0.34);
  (lt.position.set(N - 0.5 * ot, 4.2, g(720)),
    (lt.rotation.y = Math.PI / 2),
    j.add(lt));
  const ct = b("rgba(255,240,210,1)", 8.4, 4.8, 0.18);
  (ct.position.set(N - 0.5 * ot, -4, g(1740)),
    (ct.rotation.y = Math.PI / 2),
    j.add(ct),
    R(
      j,
      A,
      new e.BoxGeometry(oe, 0.08, se),
      Ne,
      new e.Vector3(ae, -0.04, re),
      null,
      Z,
      null,
      !1,
      !0,
    ),
    R(
      j,
      A,
      new e.BoxGeometry(ne, 0.08, se),
      Fe,
      new e.Vector3((ee + te) / 2, -0.04, re),
      null,
      Z,
      null,
      !1,
      !0,
    ),
    R(
      j,
      A,
      new e.BoxGeometry(O - N, ie, le),
      Oe,
      new e.Vector3((N + O) / 2, 1.46, Y),
      null,
      Z,
      {
        minX: N,
        maxX: O,
        minZ: Y - 0.06,
        maxZ: Y + 0.06,
        label: "floor_front",
      },
    ),
    R(
      j,
      A,
      new e.BoxGeometry(O - N, ie, le),
      Oe,
      new e.Vector3((N + O) / 2, 1.46, J),
      null,
      Z,
      { minX: N, maxX: O, minZ: J - 0.06, maxZ: J + 0.06, label: "floor_back" },
    ),
    R(
      j,
      A,
      new e.BoxGeometry(le, ce, se),
      new e.MeshStandardMaterial({
        color: "#a8a29e",
        map: Le,
        roughness: 0.92,
        metalness: 0.02,
      }),
      new e.Vector3(N, ce / 2, re),
      null,
      Z,
      { minX: N - 0.06, maxX: N + 0.06, minZ: Y, maxZ: J, label: "parapet" },
    ),
    R(
      j,
      A,
      new e.BoxGeometry(0.18, 0.1, se),
      et,
      new e.Vector3(N + 0.06, ce + 0.06, re),
      null,
      Z,
      null,
    ),
    R(
      j,
      [],
      new e.BoxGeometry(0.92, 0.012, 0.98 * se),
      new e.MeshBasicMaterial({
        color: "#fff1cf",
        transparent: !0,
        opacity: 0.1,
      }),
      new e.Vector3(N + 0.48, 0.014, re),
      { x: -Math.PI / 2, y: 0, z: 0 },
      null,
      null,
      !1,
      !1,
    ));
  const ht = new e.Mesh(
    new e.PlaneGeometry(1.96, 0.98 * se),
    new e.MeshBasicMaterial({
      color: "#8694a4",
      transparent: !0,
      opacity: renderTuning.mirrorOpacity,
      side: e.DoubleSide,
    }),
  );
  (ht.position.set(N + 1.02, 0.018, re),
    (ht.rotation.x = -Math.PI / 2),
    j.add(ht));
  const dt = new e.MeshPhysicalMaterial({
      color: "#8a7a6a",
      map: Xe,
      roughness: 0.62,
      metalness: 0.06,
      clearcoat: 0.12,
      clearcoatRoughness: 0.4,
    }),
    pt = new e.MeshPhysicalMaterial({
      color: "#ded4c2",
      roughness: 0.56,
      metalness: 0.06,
      clearcoat: 0.14,
    }),
    mt = new e.MeshStandardMaterial({
      color: "#c8c0b2",
      roughness: 0.82,
      metalness: 0.02,
    }),
    wt = new e.MeshPhysicalMaterial({
      color: "#b0a898",
      roughness: 0.38,
      metalness: 0.14,
      clearcoat: 0.28,
      clearcoatRoughness: 0.2,
    });
  [
    { id: "back_stair", z1: ze, z2: Pe, direction: -1 },
    { id: "front_stair", z1: be, z2: Se, direction: -1 },
  ].forEach((t) => {
    const o = (t.z1 + t.z2) / 2,
      a = t.z2 - t.z1,
      n = new e.Mesh(new e.BoxGeometry(oe - 0.28, 0.06, a), mt);
    (n.position.set(ae, -0.03, o), (n.receiveShadow = !0), j.add(n));
    const s = ee - 1.08,
      r = Q + 0.92,
      i = s - r,
      l = 10,
      c = 0.14,
      h = i / l,
      d = 0.12,
      p = Math.min(0.28, 0.18 * a),
      m = Math.max(0.44, (a - p - 3 * d) / 2),
      w = o - (p / 2 + d + m / 2),
      M = o + (p / 2 + d + m / 2),
      f = Math.max(0.78, Math.min(1.08, 0.26 * i)),
      u = s - f / 2 + 0.08,
      y = (s + r) / 2 - 0.12,
      g = new e.Mesh(new e.BoxGeometry(f, 0.08, p), mt);
    stairLayouts.push({
      id: t.id,
      z1: t.z1,
      z2: t.z2,
      xInner: s + 0.06,
      xEntry: s + 0.02,
      xExit: r + 0.08,
      xOuter: r - 0.08,
      totalRise: l * c,
      upperFlight: { z1: w - m / 2 - 0.08, z2: w + m / 2 + 0.04 },
      landing: { z1: o - p / 2 - 0.08, z2: o + p / 2 + 0.08 },
      lowerFlight: { z1: M - m / 2 - 0.04, z2: M + m / 2 + 0.08 },
    });
    (g.position.set(u, 0, o), (g.receiveShadow = !0), j.add(g));
    const x = new e.Mesh(new e.BoxGeometry(0.22, ie, a), Ye);
    (x.position.set(ee, 1.46, o),
      (x.castShadow = !0),
      (x.receiveShadow = !0),
      j.add(x),
      I(Z, ee - 0.11, ee + 0.11, t.z1, t.z2, `${t.id}_wall`));
    const b = (o, a, n) => {
      for (let g = 0; g < l; g += 1) {
        const x = (g + 0.5) / l,
          b = s - x * i,
          S = n * (g + 0.5) * c,
          z = new e.Mesh(new e.BoxGeometry(h + 0.04, 0.10, o), dt);
        (z.position.set(b, S, a), (z.castShadow = !0), (z.receiveShadow = !0), j.add(z));
        const P = new e.Mesh(new e.BoxGeometry(h + 0.02, c, o - 0.06), mt);
        (P.position.set(b + 0.02, n * (g + 0.5) * c - 0.07 * n, a), (P.receiveShadow = !0), j.add(P));
      }
      const g = new e.Mesh(new e.BoxGeometry(0.92, 0.08, o + 0.04), mt);
      (g.position.set(r + 0.38, n * (l * c + 0.02), a),
        (g.receiveShadow = !0),
        j.add(g));
      const x = new e.Mesh(new e.BoxGeometry(i + 0.32, 0.06, 0.05), wt);
      x.position.set(y, 0.92, a - o / 2 - 0.06);
      const b = x.clone();
      b.position.z = a + o / 2 + 0.06;
      j.add(x, b);
      const hrPost = new e.BoxGeometry(0.04, 0.92, 0.04);
      const hrEndA = new e.Mesh(new e.BoxGeometry(0.06, 0.96, 0.06), wt);
      hrEndA.position.set(s - 0.08, 0.46 * n, a - o / 2 - 0.06);
      (hrEndA.castShadow = !0), j.add(hrEndA);
      const hrEndA2 = hrEndA.clone();
      hrEndA2.position.z = a + o / 2 + 0.06;
      j.add(hrEndA2);
      const hrEndB = new e.Mesh(new e.BoxGeometry(0.06, 0.96, 0.06), wt);
      hrEndB.position.set(r + 0.16, n * l * c + 0.46 * n, a - o / 2 - 0.06);
      (hrEndB.castShadow = !0), j.add(hrEndB);
      const hrEndB2 = hrEndB.clone();
      hrEndB2.position.z = a + o / 2 + 0.06;
      j.add(hrEndB2);
      const S = Math.max(3, Math.floor(i / 0.42));
      for (let o = 0; o <= S; o += 1) {
        const l = r + 0.16 + (o / S) * (i - 0.16),
          d = new e.Mesh(hrPost, wt),
          p0 = d.clone();
        (d.position.set(l, 0.43, a - m / 2 - 0.06),
          p0.position.set(l, 0.43, a + m / 2 + 0.06),
          j.add(d, p0));
      }
    };
    (b(m, w, 1), b(m, M, -1));
    const _floorThick = 0.12, _ceilH = ie, _hallW = oe + ne + 0.2, _hallCX = (Q + te) / 2;
    /* 5F 不建模（畫面美觀優先），上樓仍由蟲洞送回 4F */

    /* ── 真實 3F 樓層（在 4F 地板之下） ── */
    const _3fY = -_ceilH;
    const _3fFloor = new e.Mesh(new e.BoxGeometry(_hallW, _floorThick, se * 0.7), nt);
    _3fFloor.position.set(_hallCX, _3fY - _ceilH, re);
    (_3fFloor.receiveShadow = !0), j.add(_3fFloor);
    const _3fCeil = new e.Mesh(new e.BoxGeometry(_hallW, _floorThick, se * 0.7), nt);
    _3fCeil.position.set(_hallCX, _3fY - _floorThick / 2, re);
    (_3fCeil.receiveShadow = !0), j.add(_3fCeil);
    const _3fWallBack = new e.Mesh(new e.BoxGeometry(_hallW, _ceilH - _floorThick, 0.08), Oe);
    _3fWallBack.position.set(_hallCX, _3fY - _ceilH / 2, re - se * 0.35);
    (_3fWallBack.castShadow = !0), j.add(_3fWallBack);
    const _3fWallFront = new e.Mesh(new e.BoxGeometry(_hallW, _ceilH - _floorThick, 0.08), Oe);
    _3fWallFront.position.set(_hallCX, _3fY - _ceilH / 2, re + se * 0.35);
    (_3fWallFront.castShadow = !0), j.add(_3fWallFront);
    const _3fWallL = new e.Mesh(new e.BoxGeometry(0.08, _ceilH - _floorThick, se * 0.7), Oe);
    _3fWallL.position.set(_hallCX - _hallW / 2, _3fY - _ceilH / 2, re);
    j.add(_3fWallL);
    const _3fWallR = new e.Mesh(new e.BoxGeometry(0.08, _ceilH - _floorThick, se * 0.7), Oe);
    _3fWallR.position.set(_hallCX + _hallW / 2, _3fY - _ceilH / 2, re);
    j.add(_3fWallR);

    /* ── 3F 光源 ── */
    const _3fLight = new e.PointLight("#e8eeff", 0.4, 8);
    _3fLight.position.set(_hallCX, _3fY - 0.3, re);
    j.add(_3fLight);

    /* ── 樓層標示 ── */
    [
      { text: "3F", y: _3fY - _ceilH + 1.5, z: re },
    ].forEach((a) => {
      const n = T(a.text, 0.5, 0.2, { bg: "#5c6672", fg: "#f7f0de" });
      (n.position.set(r + 0.74, a.y, a.z),
        (n.rotation.y = Math.PI / 2),
        j.add(n));
    });
  });
  const Mt = ge,
    ft = xe,
    ut = ft - Mt,
    yt = (Mt + ft) / 2,
    gt = [
      { ...t.frontDoor, kind: "front", z1: we, z2: Me },
      { ...t.backDoor, kind: "back", z1: fe, z2: ue },
    ].sort((e, t) => e.z1 - t.z1),
    xt = g(84),
    bt = ie,
    St = bt - xt,
    zt = (xt + bt) / 2,
    Pt = 0.1,
    vt = (t, o, a, n, s) => {
      const r = new e.Mesh(new e.BoxGeometry(n, s, le), Oe);
      (r.position.set(t, o, a),
        (r.castShadow = !0),
        (r.receiveShadow = !0),
        j.add(r));
    },
    Gt = (t, o, a, n, s) => {
      const r = (n - a - Pt * (s + 1)) / s;
      for (let e = 0; e < s; e++) {
        const o = a + Pt + (r + Pt) * e + r / 2;
        (vt(o, bt + (ie - bt) / 2, t, r + 0.02, ie - bt + 0.02),
          vt(o, xt / 2, t, r + 0.02, xt + 0.01));
      }
      for (let o = 0; o <= s; o++) {
        const n = a + 0.05 + (r + Pt) * o,
          s = new e.Mesh(new e.BoxGeometry(Pt, ie, le), Oe);
        (s.position.set(n, 1.46, t), j.add(s));
      }
      I(Z, a, n, t - 0.06, t + 0.06, "end_wall");
    };
  (/* 前端牆改為實牆(不設窗戶) */
    R(j, A, new e.BoxGeometry(te - ee + 0.22, ie, le), Oe,
      new e.Vector3((ee + te) / 2, ie / 2, Mt), null, Z,
      { minX: ee - 0.12, maxX: te + 0.12, minZ: Mt - 0.06, maxZ: Mt + 0.06, label: "end_wall" }),
    /* 黑板牆兩側也改為實牆(不設窗戶) — Gt(ft,...) 已移除 */
    void 0);
  const Ct = t.leftWallWindows.map((e) => Ge(e, "left")),
    Bt = t.rightWallWindows.map((e) => Ge(e, "right")),
    kt = gt.map((e) => ({ z1: e.z1 - 0.15, z2: e.z2 + 0.15, y1: 0, y2: ie }));
  Ce({
    x: te,
    zStart: Mt,
    zEnd: ft,
    openings: Bt,
    material: Oe,
    label: "right_wall",
  });
  const Tt = [];
  (Y < Mt && Tt.push([Y, Mt]),
    ft < J && Tt.push([ft, J]),
    Tt.forEach(([t, o]) => {
      o <= t ||
        R(
          j,
          A,
          new e.BoxGeometry(le, ie, o - t),
          Ye,
          new e.Vector3(ee, 1.46, t + (o - t) / 2),
          null,
          Z,
          {
            minX: ee - 0.06,
            maxX: ee + 0.06,
            minZ: t,
            maxZ: o,
            label: "divider_wall",
          },
        );
    }),
    Ce({
      x: ee,
      zStart: Mt,
      zEnd: ft,
      openings: [...kt, ...Ct],
      material: Ye,
      label: "divider_wall",
    }));
  const It = T("LM402", 1.72, 0.42, { bg: "#4a5562", fg: "#fff6de" });
  (It.position.set(g(t.plaque.x), g(t.plaque.y), g(t.plaque.z)),
    (It.rotation.y = -Math.PI / 2),
    (It.material = It.material.clone()),
    (It.material.emissive = new e.Color("#8a7959")),
    (It.material.emissiveIntensity = 0.56),
    j.add(It));
  const Rt = new e.Mesh(
    new e.BoxGeometry(0.08, 0.58, 1.54),
    new e.MeshStandardMaterial({
      color: "#ded6cb",
      map: Ae,
      roughness: 0.9,
      metalness: 0.01,
    }),
  );
  (Rt.position.set(ee + 0.012, g(t.plaque.y) - 0.06, g(t.plaque.z)), j.add(Rt));
  const Dt = new e.PointLight(16773583, 0.34, 6, 2);
  (Dt.position.set(ee + 0.54, g(t.plaque.y) + 0.08, g(t.plaque.z)), j.add(Dt));
  var Rt2 = new e.Mesh(
    new e.BoxGeometry(0.1, 0.58, 1.54),
    new e.MeshStandardMaterial({
      color: "#ded6cb",
      roughness: 0.9,
      metalness: 0.01,
    }),
  );
  Rt2.position.set(ee + 0.16, 1.6, g(t.plaque.z));
  j.add(Rt2);
  var It2 = T("LM402", 1.72, 0.42, { bg: "#4a5562", fg: "#fff6de" });
  It2.position.set(ee + 0.12, g(t.plaque.y), g(t.plaque.z));
  It2.rotation.y = Math.PI / 2;
  It2.material = It2.material.clone();
  It2.material.emissive = new e.Color("#8a7959");
  It2.material.emissiveIntensity = 0.56;
  j.add(It2);
  var It2L = new e.PointLight(16773583, 0.5, 6, 2);
  It2L.position.set(ee + 0.5, g(t.plaque.y) + 0.08, g(t.plaque.z));
  j.add(It2L);
  // (Vt 窗戶玻璃 / Et 窗框材質已提前宣告於 createEnvironmentPresets 呼叫之前)
  (t.leftWallWindows.forEach((t) => {
    const o = Ge(t, "left"),
      a = o.z2 - o.z1,
      n = o.y2 - o.y1,
      s = (o.z1 + o.z2) / 2,
      r = (o.y1 + o.y2) / 2,
      i = new e.Mesh(new e.PlaneGeometry(a - 0.04, n - 0.04), Vt);
    (i.position.set(ee, r, s), (i.rotation.y = Math.PI / 2), j.add(i));
    const l = new e.Mesh(new e.BoxGeometry(0.04, 0.03, a + 0.02), Et);
    l.position.set(ee, o.y2 + 0.01, s);
    const c = new e.Mesh(new e.BoxGeometry(0.04, 0.05, a + 0.02), Et);
    c.position.set(ee, o.y1 - 0.02, s);
    const h = new e.Mesh(new e.BoxGeometry(0.04, n + 0.06, 0.03), Et);
    h.position.set(ee, r, o.z1 - 0.01);
    const d = h.clone();
    d.position.z = o.z2 + 0.01;
    const p = new e.Mesh(new e.BoxGeometry(0.04, 0.025, a - 0.02), Et);
    (p.position.set(ee, r, s), j.add(l, c, h, d, p));
  }),
    t.rightWallWindows.forEach((t) => {
      const o = Ge(t, "right"),
        a = o.z2 - o.z1,
        n = o.y2 - o.y1,
        s = (o.z1 + o.z2) / 2,
        r = (o.y1 + o.y2) / 2,
        i = new e.Mesh(new e.PlaneGeometry(a - 0.04, n - 0.04), Vt);
      (i.position.set(te, r, s), (i.rotation.y = Math.PI / 2), j.add(i));
      const l = new e.Mesh(new e.BoxGeometry(0.04, 0.03, a + 0.02), Et);
      l.position.set(te, o.y2 + 0.01, s);
      const c = new e.Mesh(new e.BoxGeometry(0.04, 0.05, a + 0.02), Et);
      c.position.set(te, o.y1 - 0.02, s);
      const h = new e.Mesh(new e.BoxGeometry(0.04, n + 0.06, 0.03), Et);
      h.position.set(te, r, o.z1 - 0.01);
      const d = h.clone();
      d.position.z = o.z2 + 0.01;
      const p = new e.Mesh(new e.BoxGeometry(0.04, 0.025, a - 0.02), Et);
      (p.position.set(te, r, s), j.add(l, c, h, d, p));
    }));
  const Ut = (t, o, a, n) => {
    const s = (a - o - Pt * (n + 1)) / n;
    for (let a = 0; a < n; a++) {
      const n = o + Pt + (s + Pt) * a + s / 2,
        r = new e.Mesh(new e.PlaneGeometry(s - 0.04, St - 0.04), Vt);
      (r.position.set(n, zt, t), j.add(r));
      const i = new e.Mesh(new e.BoxGeometry(s + 0.02, 0.03, 0.04), Et);
      i.position.set(n, bt + 0.01, t);
      const l = new e.Mesh(new e.BoxGeometry(s + 0.02, 0.05, 0.04), Et);
      (l.position.set(n, xt - 0.02, t), j.add(i, l));
    }
  };
  (/* 前端牆與黑板牆皆改為實牆，不建窗玻璃 */
    void 0,
    R(
      j,
      A,
      new e.BoxGeometry(te - ee + 0.22, ie, le),
      Oe,
      new e.Vector3((ee + te) / 2, ie / 2, ft),
      null,
      Z,
      {
        minX: ee - 0.12,
        maxX: te + 0.12,
        minZ: ft - 0.06,
        maxZ: ft + 0.06,
        label: "board_wall",
      },
    ),
    R(
      j,
      A,
      new e.BoxGeometry(pe - de, g(t.board.y2 - t.board.y1), 0.06),
      Qe,
      new e.Vector3(me, g((t.board.y1 + t.board.y2) / 2), he - 0.02),
      null,
      Z,
      null,
    ),
    R(
      j,
      A,
      new e.BoxGeometry(pe - de + 0.18, 0.07, 0.16),
      et,
      new e.Vector3(me, g(t.board.y1) - 0.12, he - 0.1),
      null,
      Z,
      null,
    ));
  const Wt = new e.Mesh(new e.BoxGeometry(0.96, 0.98, 0.72), Je);
  (Wt.position.set(me - 4.2, 0.49, he - 0.86),
    (Wt.castShadow = !0),
    (Wt.receiveShadow = !0),
    j.add(Wt),
    I(
      Z,
      Wt.position.x - 0.36,
      Wt.position.x + 0.36,
      Wt.position.z - 0.31,
      Wt.position.z + 0.31,
      "lectern",
    ));
  const qt = new e.Mesh(
    new e.CylinderGeometry(0.22, 0.22, 0.05, 32),
    new e.MeshStandardMaterial({
      color: "#f6efe5",
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  ((qt.rotation.z = Math.PI / 2),
    qt.position.set(me + 6.1, 2.14, he - 0.02),
    j.add(qt),
    t.lightBeams.forEach((t, o) => {
      const a = new e.MeshBasicMaterial({
          color: "right" === t.side ? "#ffd79f" : "#f7e2be",
          transparent: !0,
          opacity: 1.25 * t.alpha,
          depthWrite: !1,
          side: e.DoubleSide,
        }),
        n = new e.Mesh(new e.PlaneGeometry(g(t.width), g(t.reach)), a);
      ("right" === t.side
        ? (n.position.set(te - 0.18, 1.3, g(t.z)),
          (n.rotation.x = -Math.PI / 2.76),
          (n.rotation.z = 0.12))
        : (n.position.set(ee + 0.44, 1.24, g(t.z)),
          (n.rotation.x = Math.PI / 2.7),
          (n.rotation.z = -0.12)),
        (n.rotation.y = o % 2 ? 0.06 : -0.06),
        j.add(n));
    }));
  const _t = b("rgba(255,228,168,1)", 9.2, 4.4, 0.76);
  (_t.position.set(N + 1.96, 0.018, g(t.frontDoor.center.z - 28)),
    (_t.rotation.x = -Math.PI / 2),
    (_t.rotation.z = 0.12),
    j.add(_t));
  const At = b("rgba(255,236,195,1)", 9.6, 4.8, 0.66);
  (At.position.set(N + 0.72, 1.56, g(t.frontDoor.center.z + 44)),
    (At.rotation.y = Math.PI / 2),
    (At.rotation.z = 0.04),
    j.add(At));
  const Zt = b("rgba(255,232,182,1)", 4.8, 3.2, 0.44);
  (Zt.position.set(ee + 0.12, 1.74, g(t.frontDoor.center.z - 32)),
    (Zt.rotation.y = Math.PI / 2),
    j.add(Zt));
  const Lt = b("rgba(255,241,210,1)", 3.6, 2.8, 0.46);
  (Lt.position.set(ee + 0.48, 1.52, g(t.frontDoor.center.z + 8)),
    (Lt.rotation.y = Math.PI / 2),
    j.add(Lt));
  const Xt = b("rgba(255,220,162,1)", 9.4, 4, 0.66);
  (Xt.position.set(te - 3.18, 0.019, g(t.classroom.lightWellZ + 84)),
    (Xt.rotation.x = -Math.PI / 2),
    (Xt.rotation.z = -0.16),
    j.add(Xt));
  const jt = b("rgba(255,232,186,1)", 7, 3.4, 0.48);
  (jt.position.set(ee + 2.16, 0.018, g(t.classroom.lightWellZ - 104)),
    (jt.rotation.x = -Math.PI / 2),
    (jt.rotation.z = 0.14),
    j.add(jt));
  const $t = b("rgba(255,240,198,1)", 3.8, 2.1, 0.34);
  ($t.position.set(ee + 1.12, 0.018, g(t.backDoor.center.z)),
    ($t.rotation.x = -Math.PI / 2),
    ($t.rotation.z = 0.08),
    j.add($t));
  const Ht = b("rgba(255,220,172,1)", 5.2, 2.8, 0.50);
  (Ht.position.set(g(1896), 0.02, g(2058)),
    (Ht.rotation.x = -Math.PI / 2),
    (Ht.rotation.z = -0.22),
    j.add(Ht),
    t.desks.forEach((t, o) => {
      const a = g(t.x),
        n = g(t.z),
        s = new e.Group();
      s.position.set(a, 0, n);
      const r = new e.Mesh(new e.BoxGeometry(0.68, 0.08, 0.84), Je);
      r.position.set(0, 0.78, 0.08);
      const i = new e.Mesh(new e.BoxGeometry(0.38, 0.05, 0.24), Je);
      i.position.set(0, 0.48, 0.1);
      const l = new e.Mesh(new e.BoxGeometry(0.46, 0.24, 0.04), Je);
      l.position.set(0, 0.64, -0.16);
      const c = new e.Mesh(new e.BoxGeometry(0.28, 0.05, 0.3), Je);
      c.position.set(0, 0.49, -0.42);
      const h = new e.Mesh(new e.BoxGeometry(0.28, 0.44, 0.05), Je);
      if (
        (h.position.set(0, 0.78, -0.56),
        s.add(r, i, l, c, h),
        [
          [-0.24, -0.2],
          [0.24, -0.2],
          [-0.24, 0.28],
          [0.24, 0.28],
        ].forEach(([t, o]) => {
          const a = new e.Mesh(new e.BoxGeometry(0.06, 0.78, 0.06), Ke);
          (a.position.set(t, 0.39, o), s.add(a));
        }),
        [
          [-0.12, -0.54],
          [0.12, -0.54],
          [-0.12, -0.3],
          [0.12, -0.3],
        ].forEach(([t, o]) => {
          const a = new e.Mesh(new e.BoxGeometry(0.04, 0.46, 0.04), Ke);
          (a.position.set(t, 0.23, o), s.add(a));
        }),
        o % 4 == 2)
      ) {
        const t = new e.Mesh(
          new e.BoxGeometry(0.19, 0.018, 0.14),
          new e.MeshStandardMaterial({
            color: "#f2eee8",
            roughness: 0.94,
            metalness: 0.01,
          }),
        );
        (t.position.set(0.1, 0.83, 0.14), (t.rotation.y = 0.26), s.add(t));
      }
      (x(s, !1, !0),
        j.add(s),
        I(Z, a - 0.38, a + 0.38, n - 0.66, n + 0.5, `desk_${o}`));
    }),
    t.notes.forEach((t) => {
      const o = new e.Mesh(
        new e.PlaneGeometry(0.22, 0.18),
        new e.MeshStandardMaterial({
          color: "#f4efe6",
          roughness: 0.96,
          metalness: 0.01,
          side: e.DoubleSide,
        }),
      );
      ((o.rotation.x = -Math.PI / 2),
        o.position.set(g(t.x), g(t.y) + 0.01, g(t.z)),
        j.add(o));
    }),
    t.campusTrees.forEach((t, o) => {
      const a = (function ({ scale: t = 1, colorVariant: o = 0 }) {
        const a = new e.Group(),
          n = new e.Mesh(
            new e.CylinderGeometry(0.07 * t, 0.22 * t, 2.4 * t, 14),
            new e.MeshStandardMaterial({
              color: "#5e3f28",
              roughness: 0.94,
              metalness: 0.02,
            }),
          );
        ((n.position.y = 1.2 * t), a.add(n));
        const s = new e.Mesh(
          new e.CylinderGeometry(0.05 * t, 0.08 * t, 1.9 * t, 10),
          new e.MeshStandardMaterial({
            color: "#7a5638",
            roughness: 0.84,
            metalness: 0.02,
            transparent: !0,
            opacity: 0.32,
          }),
        );
        (s.position.set(-0.02 * t, 1.24 * t, 0.08 * t), a.add(s));
        const r = new e.MeshStandardMaterial({
            color: "#5e3f28",
            roughness: 0.92,
            metalness: 0.02,
          }),
          i = new e.Mesh(
            new e.CylinderGeometry(0.02 * t, 0.04 * t, 0.8 * t, 6),
            r,
          );
        (i.position.set(0.2 * t, 1.9 * t, 0.1 * t),
          (i.rotation.z = -0.7),
          a.add(i));
        const l = new e.Mesh(
          new e.CylinderGeometry(0.018 * t, 0.035 * t, 0.7 * t, 6),
          r,
        );
        (l.position.set(-0.18 * t, 2.1 * t, -0.12 * t),
          (l.rotation.z = 0.65),
          a.add(l));
        const c = ["#4a7040", "#567a48", "#628c4e", "#3e6338", "#5a8244"],
          h = c[o % c.length],
          d = parseInt(h.slice(1, 3), 16),
          p = parseInt(h.slice(3, 5), 16),
          m = parseInt(h.slice(5, 7), 16),
          w = `#${Math.min(255, d + 22)
            .toString(16)
            .padStart(2, "0")}${Math.min(255, p + 18)
            .toString(16)
            .padStart(2, "0")}${Math.min(255, m + 14)
            .toString(16)
            .padStart(2, "0")}`,
          M = `#${Math.max(0, d - 16)
            .toString(16)
            .padStart(2, "0")}${Math.max(0, p - 12)
            .toString(16)
            .padStart(2, "0")}${Math.max(0, m - 10)
            .toString(16)
            .padStart(2, "0")}`,
          f = [
            new e.MeshStandardMaterial({
              color: h,
              roughness: 0.94,
              metalness: 0.01,
            }),
            new e.MeshStandardMaterial({
              color: w,
              roughness: 0.92,
              metalness: 0.01,
            }),
            new e.MeshStandardMaterial({
              color: M,
              roughness: 0.96,
              metalness: 0.01,
            }),
          ];
        return (
          [
            [0, 2.9, 0, 1.1, 1.24, 1, 0],
            [-0.38, 2.5, 0.2, 0.9, 0.96, 0.78, 1],
            [0.44, 2.56, -0.16, 0.94, 1.06, 0.82, 2],
            [0.06, 3.42, -0.14, 0.86, 0.88, 0.76, 1],
            [-0.56, 2.76, -0.2, 0.8, 0.84, 0.7, 2],
            [0.12, 3.56, 0.08, 0.58, 0.6, 0.52, 0],
          ].forEach(([o, n, s, r, i, l, c]) => {
            const h = new e.Mesh(new e.SphereGeometry(0.52 * t, 10, 10), f[c]);
            (h.position.set(o * t, n * t, s * t),
              h.scale.set(r, i, l),
              a.add(h));
          }),
          x(a),
          a
        );
      })({ scale: 2.5 * t.scale, colorVariant: o });
      (a.position.set(g(t.x), at, g(t.z)),
        (a.rotation.y = 0.6 * o),
        x(a, !1, !0),
        j.add(a));
    }));
  const Ft = new e.Mesh(
    new e.BoxGeometry(4.8, 6, 0.54 * se),
    new e.MeshStandardMaterial({
      color: "#b7bec7",
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  (Ft.position.set(N - 0.34 * ot, -9, re + 0.2),
    (Ft.receiveShadow = !0),
    j.add(Ft));
  const Nt = document.createElement("canvas");
  ((Nt.width = 512), (Nt.height = 512));
  const Ot = Nt.getContext("2d");
  ((Ot.fillStyle = "#5a7a48"), Ot.fillRect(0, 0, 512, 512));
  for (let e = 0; e < 120; e++) {
    const e = 512 * Math.random(),
      t = 512 * Math.random(),
      o = 8 + 20 * Math.random();
    (Ot.beginPath(),
      Ot.arc(e, t, o, 0, 2 * Math.PI),
      (Ot.fillStyle =
        Math.random() > 0.5 ? "rgba(80,120,60,0.15)" : "rgba(50,90,40,0.12)"),
      Ot.fill());
  }
  ((Ot.fillStyle = "#b8b0a4"),
    Ot.fillRect(80, 0, 18, 512),
    Ot.fillRect(320, 0, 14, 512),
    Ot.fillRect(0, 240, 512, 16),
    Ot.save(),
    Ot.translate(256, 256),
    Ot.rotate(0.4),
    Ot.fillRect(-300, -7, 600, 14),
    Ot.restore(),
    (Ot.strokeStyle = "rgba(100,90,78,0.3)"),
    (Ot.lineWidth = 1),
    Ot.strokeRect(80, 0, 18, 512),
    Ot.strokeRect(320, 0, 14, 512),
    Ot.strokeRect(0, 240, 512, 16));
  const Yt = [
    "rgba(140,80,60,0.25)",
    "rgba(120,60,80,0.2)",
    "rgba(90,110,50,0.22)",
  ];
  [
    [140, 100, 30, 22],
    [380, 340, 26, 18],
    [200, 420, 24, 20],
    [440, 140, 20, 28],
  ].forEach(([e, t, o, a]) => {
    ((Ot.fillStyle = Yt[Math.floor(Math.random() * Yt.length)]),
      Ot.beginPath(),
      Ot.ellipse(e, t, o, a, 0, 0, 2 * Math.PI),
      Ot.fill());
    for (let n = 0; n < 6; n++)
      (Ot.beginPath(),
        Ot.arc(
          e + (Math.random() - 0.5) * o * 1.4,
          t + (Math.random() - 0.5) * a * 1.4,
          2 + 2 * Math.random(),
          0,
          2 * Math.PI,
        ),
        (Ot.fillStyle = [
          "rgba(220,60,80,0.5)",
          "rgba(240,200,60,0.5)",
          "rgba(220,120,200,0.4)",
        ][n % 3]),
        Ot.fill());
  });
  const Jt = new e.CanvasTexture(Nt);
  ((Jt.colorSpace = e.SRGBColorSpace),
    (Jt.wrapS = e.RepeatWrapping),
    (Jt.wrapT = e.RepeatWrapping),
    Jt.repeat.set(3, 3));
  const Kt = new e.MeshStandardMaterial({
      color: "#5a7a48",
      map: Jt,
      roughness: 0.92,
      metalness: 0.01,
    }),
    Qt = new e.Mesh(new e.PlaneGeometry(4 * ot, 3 * se), Kt);
  ((Qt.rotation.x = -Math.PI / 2),
    Qt.position.set(N - 0.8 * ot, at, re),
    (Qt.receiveShadow = !0),
    j.add(Qt));
  [
    {
      wall: "#c4bfb6",
      w: 3.6,
      h: g(520),
      d: 8.4,
      px: 0.72,
      pz: 900,
      wr: 6,
      wc: 5,
      roof: "flat",
    },
    {
      wall: "#b8c2ca",
      w: 5.2,
      h: g(440),
      d: 6.8,
      px: 0.88,
      pz: 1800,
      wr: 5,
      wc: 7,
      roof: "ledge",
    },
    {
      wall: "#d2ccc4",
      w: 4.4,
      h: g(280),
      d: 10.2,
      px: 0.64,
      pz: 2700,
      wr: 3,
      wc: 6,
      roof: "flat",
    },
    {
      wall: "#c8bfb0",
      w: 3,
      h: g(480),
      d: 5.6,
      px: 0.82,
      pz: 1350,
      wr: 5,
      wc: 4,
      roof: "ledge",
    },
    {
      wall: "#d4c8bc",
      w: 6,
      h: g(240),
      d: 7.4,
      px: 0.56,
      pz: 3200,
      wr: 2,
      wc: 8,
      roof: "flat",
    },
  ].forEach((t) => {
    const o = (function (t, o, a, n, s) {
        const r = document.createElement("canvas");
        ((r.width = n || 192), (r.height = s || 128));
        const i = r.getContext("2d");
        ((i.fillStyle = t), i.fillRect(0, 0, r.width, r.height));
        for (let e = 0; e < 30; e++)
          ((i.fillStyle = `rgba(${128 + 40 * Math.random()},${128 + 40 * Math.random()},${128 + 40 * Math.random()},0.06)`),
            i.fillRect(
              Math.random() * r.width,
              Math.random() * r.height,
              4 + 12 * Math.random(),
              2 + 6 * Math.random(),
            ));
        const l = 0.08 * r.width,
          c = 0.06 * r.height,
          h = (r.width - 2 * l) / a,
          d = (r.height - 2 * c) / o,
          p = 0.55 * h,
          m = 0.52 * d;
        for (let e = 0; e < o; e++)
          for (let t = 0; t < a; t++) {
            const o = l + t * h + (h - p) / 2,
              a = c + e * d + (d - m) / 2;
            ((i.fillStyle = "rgba(60,70,80,0.4)"),
              i.fillRect(o - 1, a - 1, p + 2, m + 2));
            const n = Math.random() > 0.4;
            ((i.fillStyle = n
              ? "rgba(180,210,230,0.7)"
              : "rgba(90,110,130,0.6)"),
              i.fillRect(o, a, p, m),
              n &&
                ((i.fillStyle = "rgba(255,255,255,0.15)"),
                i.fillRect(o + 1, a + 1, 0.3 * p, 0.4 * m)));
          }
        const w = new e.CanvasTexture(r);
        return ((w.colorSpace = e.SRGBColorSpace), w);
      })(t.wall, t.wr, t.wc, 192, 128),
      a = t.px,
      n = parseInt(t.wall.slice(1, 3), 16),
      s = parseInt(t.wall.slice(3, 5), 16),
      r = parseInt(t.wall.slice(5, 7), 16),
      i = Math.round(n + (212 - n) * a * 0.3),
      l = Math.round(s + (232 - s) * a * 0.3),
      c = Math.round(r + (240 - r) * a * 0.3),
      h = `#${i.toString(16).padStart(2, "0")}${l.toString(16).padStart(2, "0")}${c.toString(16).padStart(2, "0")}`,
      d = new e.MeshStandardMaterial({
        color: h,
        map: o,
        roughness: 0.9,
        metalness: 0.03,
      }),
      p = new e.Mesh(new e.BoxGeometry(t.w, t.h, t.d), d);
    if (
      (p.position.set(N - ot * t.px, at + t.h / 2, g(t.pz)),
      (p.receiveShadow = !0),
      (p.castShadow = !0),
      j.add(p),
      "ledge" === t.roof)
    ) {
      const o = new e.Mesh(
        new e.BoxGeometry(t.w + 0.2, 0.08, t.d + 0.2),
        new e.MeshStandardMaterial({
          color: "#a0988e",
          roughness: 0.88,
          metalness: 0.04,
        }),
      );
      (o.position.set(N - ot * t.px, at + t.h + 0.04, g(t.pz)), j.add(o));
      const a = new e.Mesh(
        new e.BoxGeometry(t.w + 0.16, 0.18, t.d + 0.16),
        new e.MeshStandardMaterial({
          color: "#b8b0a6",
          roughness: 0.9,
          metalness: 0.02,
        }),
      );
      (a.position.set(N - ot * t.px, at + t.h + 0.12, g(t.pz)), j.add(a));
    } else {
      const o = new e.Mesh(
        new e.BoxGeometry(t.w + 0.1, 0.06, t.d + 0.1),
        new e.MeshStandardMaterial({
          color: "#8a8480",
          roughness: 0.92,
          metalness: 0.03,
        }),
      );
      (o.position.set(N - ot * t.px, at + t.h + 0.03, g(t.pz)), j.add(o));
    }
  });
  const eo = new e.SphereGeometry(120, 32, 16, 0, 2 * Math.PI, 0, Math.PI / 2),
    to = document.createElement("canvas");
  ((to.width = 512), (to.height = 512));
  const oo = to.getContext("2d"),
    ao = oo.createLinearGradient(0, 0, 0, 512);
  (ao.addColorStop(0, "#4a7ab5"),
    ao.addColorStop(0.25, "#6a9ec8"),
    ao.addColorStop(0.45, "#87CEEB"),
    ao.addColorStop(0.65, "#a8d8f0"),
    ao.addColorStop(0.8, "#d4e8f0"),
    ao.addColorStop(0.92, "#e8f0f4"),
    ao.addColorStop(1, "#eef4f7"),
    (oo.fillStyle = ao),
    oo.fillRect(0, 0, 512, 512));
  const no = 380,
    so = 60,
    ro = oo.createRadialGradient(no, so, 0, no, so, 80);
  (ro.addColorStop(0, "rgba(255,255,240,0.95)"),
    ro.addColorStop(0.1, "rgba(255,250,220,0.8)"),
    ro.addColorStop(0.3, "rgba(255,240,180,0.4)"),
    ro.addColorStop(0.6, "rgba(255,220,150,0.15)"),
    ro.addColorStop(1, "rgba(255,200,120,0)"),
    (oo.fillStyle = ro),
    oo.beginPath(),
    oo.arc(no, so, 80, 0, 2 * Math.PI),
    oo.fill());
  const io = oo.createRadialGradient(no, so, 0, no, so, 18);
  (io.addColorStop(0, "rgba(255,255,255,1)"),
    io.addColorStop(0.5, "rgba(255,255,240,0.9)"),
    io.addColorStop(1, "rgba(255,250,220,0)"),
    (oo.fillStyle = io),
    oo.beginPath(),
    oo.arc(no, so, 18, 0, 2 * Math.PI),
    oo.fill(),
    [
      [120, 100, 50, 18, 0.5],
      [140, 96, 40, 14, 0.4],
      [100, 104, 35, 12, 0.35],
      [300, 140, 60, 20, 0.45],
      [320, 136, 45, 16, 0.4],
      [280, 145, 38, 14, 0.35],
      [420, 80, 44, 16, 0.42],
      [440, 76, 36, 14, 0.38],
      [200, 200, 55, 18, 0.3],
      [220, 196, 42, 14, 0.28],
      [380, 220, 48, 16, 0.32],
      [60, 180, 40, 14, 0.34],
      [460, 160, 52, 18, 0.36],
      [470, 156, 38, 12, 0.3],
    ].forEach(([e, t, o, a, n]) => {
      const s = oo.createRadialGradient(e, t, 0, e, t, Math.max(o, a));
      (s.addColorStop(0, `rgba(255,255,255,${n})`),
        s.addColorStop(0.5, `rgba(255,255,255,${0.6 * n})`),
        s.addColorStop(1, "rgba(255,255,255,0)"),
        (oo.fillStyle = s),
        oo.beginPath(),
        oo.ellipse(e, t, o, a, 0, 0, 2 * Math.PI),
        oo.fill());
    }));
  const lo = new e.CanvasTexture(to);
  lo.colorSpace = e.SRGBColorSpace;
  const co = new e.MeshBasicMaterial({
      map: lo,
      side: e.BackSide,
      fog: !1,
      depthWrite: !1,
    }),
    ho = new e.Mesh(eo, co);
  (ho.position.set(N - 0.3 * ot, at, re), j.add(ho));
  const po = new e.Mesh(
    new e.SphereGeometry(3.6, 24, 24),
    new e.MeshBasicMaterial({ color: "#fffbe8", fog: !1 }),
  );
  (po.position.set(-11.2, 10.8, 5.4), j.add(po));
  const mo = new e.Mesh(
    new e.SphereGeometry(6, 16, 16),
    new e.MeshBasicMaterial({
      color: "#fff4d0",
      transparent: !0,
      opacity: 0.25,
      fog: !1,
      depthWrite: !1,
    }),
  );
  (mo.position.copy(po.position), j.add(mo));
  const wo = N - 0.3 * ot,
    Mo = re,
    fo = [];
  [
    { x: -20, y: 38, z: -30, w: 12, h: 4 },
    { x: 15, y: 42, z: -20, w: 10, h: 3 },
    { x: -35, y: 35, z: 10, w: 14, h: 5 },
    { x: 25, y: 40, z: 25, w: 11, h: 3.5 },
    { x: -10, y: 44, z: -40, w: 9, h: 3 },
    { x: 40, y: 36, z: 5, w: 13, h: 4.5 },
  ].forEach((t) => {
    const o = document.createElement("canvas");
    ((o.width = 256), (o.height = 128));
    const a = o.getContext("2d"),
      n = a.createRadialGradient(128, 64, 10, 128, 64, 100);
    (n.addColorStop(0, "rgba(255,255,255,0.7)"),
      n.addColorStop(0.4, "rgba(255,255,255,0.35)"),
      n.addColorStop(1, "rgba(255,255,255,0)"),
      (a.fillStyle = n),
      a.fillRect(0, 0, 256, 128),
      [
        [90, 58, 60],
        [166, 58, 55],
        [128, 48, 50],
      ].forEach(([e, t, o]) => {
        const n = a.createRadialGradient(e, t, 4, e, t, o);
        (n.addColorStop(0, "rgba(255,255,255,0.5)"),
          n.addColorStop(1, "rgba(255,255,255,0)"),
          (a.fillStyle = n),
          a.beginPath(),
          a.arc(e, t, o, 0, 2 * Math.PI),
          a.fill());
      }));
    const s = new e.CanvasTexture(o);
    s.colorSpace = e.SRGBColorSpace;
    const r = new e.Mesh(
      new e.PlaneGeometry(t.w, t.h),
      new e.MeshBasicMaterial({
        map: s,
        transparent: !0,
        opacity: 0.6,
        depthWrite: !1,
        side: e.DoubleSide,
        fog: !1,
      }),
    );
    (r.position.set(wo + t.x, at + t.y, Mo + t.z),
      (r.rotation.x = -0.15),
      (r.userData.startX = r.position.x),
      (r.userData.speed = 0.15 + 0.2 * Math.random()),
      j.add(r),
      fo.push(r));
  });
  const uo = [];
  for (let t = 0; t < 4; t++) {
    const o = new e.Group(),
      a = new e.MeshBasicMaterial({
        color: "#2a2a2a",
        side: e.DoubleSide,
        fog: !1,
      }),
      n = new e.Mesh(new e.PlaneGeometry(0.4, 0.08), a);
    (n.position.set(-0.18, 0, 0), (n.rotation.z = 0.3));
    const s = new e.Mesh(new e.PlaneGeometry(0.4, 0.08), a);
    (s.position.set(0.18, 0, 0),
      (s.rotation.z = -0.3),
      o.add(n, s),
      o.position.set(wo - 30 + 18 * t, 20 + 3 * t, Mo - 20 + 12 * t),
      (o.userData.startX = o.position.x),
      (o.userData.startZ = o.position.z),
      (o.userData.wingL = n),
      (o.userData.wingR = s),
      (o.userData.speed = 0.6 + 0.4 * Math.random()),
      (o.userData.phase = Math.random() * Math.PI * 2),
      j.add(o),
      uo.push(o));
  }
  const yo = new e.BufferGeometry(),
    go = [];
  for (let t = 0; t < renderTuning.dustCount; t += 1)
    go.push(
      e.MathUtils.lerp(N + 0.24, O - 0.2, Math.random()),
      e.MathUtils.lerp(0.26, 2.84, Math.random()),
      e.MathUtils.lerp(Y + 0.2, J - 0.2, Math.random()),
    );
  yo.setAttribute("position", new e.Float32BufferAttribute(go, 3));
  const xo = new e.PointsMaterial({
      color: "#ffe8b0",
      size: 0.055,
      transparent: !0,
      opacity: 0.36,
      depthWrite: !1,
    }),
    bo = new e.Points(yo, xo);
  j.add(bo);
  const So = new e.Mesh(
    new e.BoxGeometry(ne, 0.08, ut),
    new e.MeshStandardMaterial({ color: "#f3f1ed", roughness: 0.94, metalness: 0.01 }),
  );
  (So.position.set((ee + te) / 2, 2.88, yt),
    (So.receiveShadow = !0),
    j.add(So));
  const zo = new e.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 0.5,
    }),
    Po = new e.BoxGeometry(0.3, 0.04, 0.3);
  t.desks.forEach((t, o) => {
    if (o % 4 != 0) return;
    const a = new e.Mesh(Po, zo);
    (a.position.set(g(t.x), 2.86, g(t.z)), j.add(a));
  });
  const vo = {
      senior: new e.Vector3(),
      junior: new e.Vector3(),
      frontDoor: ve(
        t.frontDoor.center.x,
        t.frontDoor.center.y,
        t.frontDoor.center.z,
      ),
      backDoor: ve(
        t.backDoor.center.x,
        t.backDoor.center.y,
        t.backDoor.center.z,
      ),
      doorPlaque: ve(t.plaque.x, t.plaque.y, t.plaque.z),
      parapetBand: new e.Vector3(
        N + 0.22,
        g(t.corridor.parapetHeight) + 0.32,
        g(t.frontDoor.center.z - 8),
      ),
      boardWall: new e.Vector3(me, g((t.board.y1 + t.board.y2) / 2), he - 0.02),
    },
    Go = S({
      torso: "#f8f8f8",
      torsoAccent: "#f2f2f2",
      legs: "#3d5c8a",
      skin: "#f2d8c8",
      hair: "#1a1214",
      shoes: "#f4f4f4",
      iris: "#4a3830",
      female: !1,
      phone: !0,
      highlight: !0,
      scale: 1.08,
      pompadour: !0,
    }),
    Co = S({
      torso: "#f6f4f0",
      torsoAccent: "#faf8f4",
      legs: "#1c2e46",
      skin: "#fce4d4",
      hair: "#7a5842",
      shoes: "#f6f6f4",
      iris: "#7a5a42",
      female: !0,
      highlight: !0,
      referenceJunior: !0,
      scale: 0.91,
      ponytail: !0,
      ponytailLength: 0.42,
      ponytailCurve: 0.14,
      skinGlow: 0.22,
      hairSheen: 0.35,
    }),
    Bo = S({
      torso: "#f2c49e",
      torsoAccent: "#ffd8b8",
      legs: "#ffe9d5",
      skin: "#f0c7ab",
      hair: "#533f3c",
      shoes: "#4b4040",
      female: !1,
      echo: !0,
      echoOpacity: 0.28,
      echoColor: "#ffd5b0",
      scale: 0.98,
    }),
    ko = S({
      torso: "#ffd8e4",
      torsoAccent: "#ffe8ef",
      legs: "#ffd8e4",
      skin: "#f0cab4",
      hair: "#5a4648",
      shoes: "#5a4749",
      female: !0,
      echo: !0,
      echoOpacity: 0.26,
      echoColor: "#ffc0d6",
      scale: 1,
  });
  $.add(Go, Co, Bo, ko);
  Co.userData.legacyChildren = [...Co.children];
  // 雙時空 B3 意識菜市場 · 光柱派 — 5 盞不同年紀色彩的 SpotLight 跟著學妹
  // fix toni 反映「光蓋過學妹」：baseIntensity 1.4 → 0.45
  __conscLights = createConsciousnessLights({
    parent: Co,
    anchor: { x: 0, y: 1.4, z: 0 },   // Co local 座標（學妹頭頂上方）
    baseIntensity: 0.45,
    orbitRadius: 0.55,
    heightAbove: 1.7,
  });
  // 雙時空 B2 意識菜市場 · 粒子派 — 150 個記憶碎片飄動（5 種年紀色彩）
  __conscParticles = createConsciousnessParticles({
    parent: Co,
    anchor: { x: 0, y: 1.45, z: 0 },  // 學妹頭部位置
    radius: 0.55,
    heightRange: 1.4,
  });
  // 雙時空 B4 意識菜市場 · 文字派 — 12 個 sprite 漂浮詩意短句（5 個年紀內心話）
  __conscText = createConsciousnessText({
    parent: Co,
    anchor: { x: 0, y: 1.5, z: 0 },
    radius: 0.7,
    heightRange: 1.0,
  });
  // 過曝白塊修正後預設關鎖 — B2/B3/B4 三派疊加成白塊問題
  // 預設關閉，console 想開個別 effect 自己開：
  //   __CONSC_LIGHTS__.setIntensity(0.5)     // 5 盞光柱（不同年紀色彩）
  //   __CONSC_PARTICLES__.setIntensity(0.4)  // 150 個記憶粒子
  //   __CONSC_TEXT__.setIntensity(0.6)       // 12 個 toni 原文短句飄浮
  // B3 預設 0.30 啟用意識光柱
  // 安全分析:疊加效果預設關鎖紀律是「B2+B3+B4 同 anchor+AdditiveBlending 疊加會白塊」
  // → 單獨 B3=0.30 不會疊加(B2/B4 仍 0),不違反紀律
  // → 5 盞 SpotLight 不同年紀色彩(暖橙/暖白/淡綠/淡紫/月光藍)有最弱「七嘴八舌」暗示
  // 嫌弱 → __TWIN_BALANCE__('mid') 一鍵升級;嫌過 → __TWIN_BALANCE__('off') 復原預設關鎖
  __conscLights.setIntensity(0.30);
  __conscParticles.setIntensity(0);
  __conscText.setIntensity(0);
  if (typeof window !== "undefined") {
    // B-VIS-001 debug expose:console __INSPECT_CHARS__() / __INSPECT_LEGS__('Go')
    // (從函式前段移到此處 — Go/Co/Bo/ko 是 const,須在宣告後才能引用,否則 TDZ ReferenceError)
    window.__GO__ = Go;
    window.__CO__ = Co;
    window.__BO__ = Bo;
    window.__KO__ = ko;
    window.__CONSC_LIGHTS__ = __conscLights;
    window.__CONSC_PARTICLES__ = __conscParticles;
    window.__CONSC_TEXT__ = __conscText;
    // __TWIN_BALANCE__:一鍵切換 B2/B3/B4 平衡 preset
    // 找「能感受到意識菜市場但不過曝」的甜蜜點 — 三派 0.2/0.3/0.4 漸進測試
    // 設計:預設仍 0(疊加效果預設關鎖紀律),preset 工具一鍵試
    window.__TWIN_BALANCE__ = function(preset) {
      const presets = {
        off:  { lights: 0,    particles: 0,    text: 0    },  // 預設關鎖
        low:  { lights: 0.15, particles: 0.10, text: 0.20 },  // 弱可見 — 試起點
        mid:  { lights: 0.30, particles: 0.20, text: 0.40 },  // 中等 — 主推測試
        high: { lights: 0.50, particles: 0.40, text: 0.60 },  // 原 console 註解建議值
      };
      const p = presets[preset];
      if (!p) {
        console.warn("[__TWIN_BALANCE__] 未知 preset:", preset, "— 可選: off / low / mid / high");
        return;
      }
      __conscLights.setIntensity(p.lights);
      __conscParticles.setIntensity(p.particles);
      __conscText.setIntensity(p.text);
      console.info(
        "%c[雙時空] 平衡 preset 切換:" + preset,
        "color:#ffd49c;font-weight:bold;",
        "\n  __CONSC_LIGHTS__:    " + p.lights +
        "\n  __CONSC_PARTICLES__: " + p.particles +
        "\n  __CONSC_TEXT__:      " + p.text
      );
    };
    console.info(
      "%c[雙時空] 意識菜市場 B2/B3/B4 預設關閉",
      "color:#ffd49c;font-weight:bold;",
      "\n一鍵試 preset(推薦 toni 從 low 試起):" +
      "\n  __TWIN_BALANCE__('low')   // 弱可見起點" +
      "\n  __TWIN_BALANCE__('mid')   // 中等" +
      "\n  __TWIN_BALANCE__('high')  // 原建議值" +
      "\n  __TWIN_BALANCE__('off')   // 復原預設關鎖" +
      "\n\n或單獨微調:" +
      "\n  __CONSC_LIGHTS__.setIntensity(0.5)" +
      "\n  __CONSC_PARTICLES__.setIntensity(0.4)" +
      "\n  __CONSC_TEXT__.setIntensity(0.6)"
    );
  }
  const juniorRuntimeModelRoot = new e.Group(),
    juniorHeroCloseupModelRoot = new e.Group();
  (juniorRuntimeModelRoot.name = "junior-runtime-model-root",
    (juniorRuntimeModelRoot.visible = !1),
    (juniorRuntimeModelRoot.userData.ready = !1),
    (juniorRuntimeModelRoot.userData.kind = "runtime"),
    (juniorHeroCloseupModelRoot.name = "junior-hero-closeup-model-root"),
    (juniorHeroCloseupModelRoot.visible = !1),
    (juniorHeroCloseupModelRoot.userData.ready = !1),
    (juniorHeroCloseupModelRoot.userData.kind = "hero_closeup"),
    Co.add(juniorRuntimeModelRoot, juniorHeroCloseupModelRoot));
  Co.userData.runtimeModelRoot = juniorRuntimeModelRoot;
  Co.userData.heroCloseupModelRoot = juniorHeroCloseupModelRoot;
  Co.userData.pose &&
    ((Co.userData.pose.runtimeModelRoot = juniorRuntimeModelRoot),
    (Co.userData.pose.heroCloseupModelRoot = juniorHeroCloseupModelRoot));
  const juniorHeroLight = new e.SpotLight(16772596, 3.2, 22, 0.38, 0.45, 0.9);
  (juniorHeroLight.position.set(ee + 3.8, 4.3, g(t.backDoor.center.z + 96)),
    juniorHeroLight.target.position.set(
      g(120),
      1.44,
      g(t.backDoor.center.z + 6),
    ),
    W.add(juniorHeroLight.target),
    W.add(juniorHeroLight));
  const juniorRimLight = new e.PointLight(16774134, 2.2, 18, 1.6);
  (juniorRimLight.position.set(ee + 0.84, 2.08, g(t.backDoor.center.z + 14)),
    W.add(juniorRimLight));
  const juniorPortraitShell = new e.Group();
  ((juniorPortraitShell.name = "junior-portrait-shell"),
    (juniorPortraitShell.visible = !1),
    (juniorPortraitShell.userData.loaded = !1),
    Co.add(juniorPortraitShell),
    (Co.userData.portraitShell = juniorPortraitShell));
  (function () {
    const t = runtimeState.characterAssets?.junior2005;
    if (!t?.textures?.front && !t?.textures?.frontClose) return;
    const o = new e.TextureLoader();
    assetState.textureStatus = "loading";
    Promise.all(
      Object.entries(t.textures ?? {})
        .filter(([, e]) => Boolean(e))
        .map(([t, a]) =>
          loadLm402Texture(o, a)
            .then((e) => [t, e])
            .catch((o) => {
              if ("front" === t || "frontClose" === t) throw o;
              return [t, null];
            }),
        ),
    )
      .then((t) => {
        const o = Object.fromEntries(t.filter(([, e]) => e)),
          a = buildJuniorPortraitShell(o, {
            scaleX: renderTuning.portraitBoost,
            scaleY: renderTuning.portraitBoost,
          });
        (juniorPortraitShell.add(...a.children),
        (juniorPortraitShell.userData.planes = a.userData.planes),
          (juniorPortraitShell.userData.glow = a.userData.glow),
          (juniorPortraitShell.visible = !juniorRuntimeModelRoot.userData.ready),
          (juniorPortraitShell.userData.loaded = !0),
          (assetState.textureStatus = "ready"),
          (assetState.textureFallback = !1),
          (assetState.loadedTextures = Object.keys(o)));
      })
      .catch((e) => {
        ((assetState.textureStatus = "fallback"),
          (assetState.textureFallback = !0),
          (assetState.textureLastError =
            e instanceof Error ? e.message : String(e).slice(0, 180)));
      });
  })();
  (function () {
    const t = juniorRuntimeManifest,
      o = resolveJuniorGltfLoaderCtor();
    if (!t.runtimeModelUrl && !t.heroCloseupModelUrl) return;
    if (!o) {
      (assetState.loaderAvailable = !1,
        assetState.status = "procedural_fallback",
        assetState.modelMode = "procedural_fallback",
        assetState.lastError ??=
          "GLTFLoader unavailable for junior runtime asset.");
      return;
    }
    (assetState.loaderAvailable = !0,
      assetState.status = "loading_model",
      assetState.modelMode = "loading_model");
    const a = [];
    t.runtimeModelUrl &&
      a.push(
        loadJuniorGltfModel(t.runtimeModelUrl, {
          crossOrigin: "anonymous",
        })
          .then((t) => ({
            kind: "runtime",
            gltf: t,
            root: juniorRuntimeModelRoot,
          }))
          .catch((t) => ({
            kind: "runtime",
            error: t,
            root: juniorRuntimeModelRoot,
          })),
      );
    t.heroCloseupModelUrl &&
      a.push(
        loadJuniorGltfModel(t.heroCloseupModelUrl, {
          crossOrigin: "anonymous",
        })
          .then((t) => ({
            kind: "hero_closeup",
            gltf: t,
            root: juniorHeroCloseupModelRoot,
          }))
          .catch((t) => ({
            kind: "hero_closeup",
            error: t,
            root: juniorHeroCloseupModelRoot,
          })),
      );
    Promise.all(a)
      .then((t) => {
        const o = [];
        t.forEach((t) => {
          if (t?.gltf && t.root) {
            const a = attachJuniorGltfModel(t.root, t.gltf, {
              scale: "hero_closeup" === t.kind ? 0.7696 : 0.7488,
            });
            a &&
              ((t.root.userData.ready = !0),
              (t.root.userData.assetKind = t.kind),
              (t.root.userData.sourceUrl =
                "hero_closeup" === t.kind
                  ? juniorRuntimeManifest.heroCloseupModelUrl
                  : juniorRuntimeManifest.runtimeModelUrl),
              o.push(t.kind));
            if ("runtime" === t.kind && juniorPortraitShell) juniorPortraitShell.visible = !1;
          } else
            t?.error &&
              o.push(
                `${t.kind}: ${
                  t.error instanceof Error ? t.error.message : String(t.error)
                }`,
              );
        });
        const n = t.some((t) => Boolean(t?.gltf));
        n
          ? ((assetState.status = "ready"),
            (assetState.fallback = !1),
            (assetState.modelMode = "runtime_model"),
            (assetState.loadedModels = t
              .filter((t) => Boolean(t?.gltf))
              .map((t) => t.kind)),
            (assetState.lastError = null))
          : ((assetState.status = "fallback"),
            (assetState.fallback = !0),
            (assetState.modelMode = "procedural_fallback"),
            (assetState.lastError = "No junior GLB asset loaded."));
      })
      .catch((t) => {
        ((assetState.status = "fallback"),
          (assetState.fallback = !0),
          (assetState.modelMode = "procedural_fallback"),
          (assetState.lastError =
            t instanceof Error ? t.message : String(t).slice(0, 180)));
      });
  })();
  const To = { scene: 16507832, memory: 10148095 };
  [
    { id: "front_call", type: "scene" },
    { id: "plaque", type: "memory" },
    { id: "board", type: "memory" },
    { id: "seat", type: "memory" },
    { id: "notes", type: "memory" },
    { id: "junior", type: "scene" },
    { id: "backdoor", type: "scene" },
  ].forEach((t) => {
    const o = (function (t = 16507832) {
      const o = new e.Group(),
        a = new e.Mesh(
          new e.TorusGeometry(0.18, 0.014, 12, 32),
          new e.MeshBasicMaterial({ color: t, transparent: !0, opacity: 0.14 }),
        );
      a.rotation.x = Math.PI / 2;
      const n = new e.Mesh(
        new e.SphereGeometry(0.05, 12, 12),
        new e.MeshStandardMaterial({
          color: 16777215,
          emissive: t,
          emissiveIntensity: 0.6,
          transparent: !0,
          opacity: 0.18,
        }),
      );
      return (o.add(a, n), (o.visible = !1), o);
    })(To[t.type]);
    (L.set(t.id, o), F.add(o));
  });
  const Io = new e.CatmullRomCurve3([
      new e.Vector3(N - 0.74 * ot, 12.2, g(3050)),
      new e.Vector3(N - 0.62 * ot, 11, g(2820)),
      new e.Vector3(N - 0.52 * ot, 9.8, g(2520)),
      new e.Vector3(N - 0.42 * ot, 8.8, g(2140)),
      new e.Vector3(N - 0.32 * ot, 7.6, g(1780)),
      new e.Vector3(N - 0.2 * ot, 6.6, g(1430)),
      new e.Vector3(N - 0.1 * ot, 5.6, g(1100)),
      new e.Vector3(N + 0.08, 4.7, g(860)),
      new e.Vector3(N + 0.62, 3.94, g(1380)),
      new e.Vector3(Q + 1.42, 3.14, g(1780)),
      new e.Vector3(Q + 2.28, 2.42, g(t.frontDoor.center.z - 214)),
      new e.Vector3(Q + 2.06, 2.06, g(t.frontDoor.center.z - 146)),
    ]),
    Ro = new e.Mesh(
      new e.TubeGeometry(Io, 220, 0.074, 12, !1),
      new e.MeshStandardMaterial({
        color: "#f1627d",
        emissive: "#f1627d",
        emissiveIntensity: 1.72,
        roughness: 0.2,
        metalness: 0.08,
        transparent: !0,
        opacity: 0.96,
      }),
    );
  H.add(Ro);
  const Do = b("rgba(255,116,142,1)", 1.8, 2.4, 0.44),
    Vo = b("rgba(255,223,176,1)", 5.8, 4.6, 0.28),
    Eo = new e.Mesh(
      new e.SphereGeometry(0.1, 16, 16),
      new e.MeshBasicMaterial({ color: "#ffd8e6" }),
    ),
    Uo = b("rgba(255,157,182,1)", 3.2, 1.8, 0.22);
  H.add(Do, Vo, Eo, Uo);
  const Wo = b("rgba(255,100,136,1)", 4.8, 2.2, 0.18);
  function qo() {
    const e = (D.parentElement ?? D).getBoundingClientRect(),
      t = Math.max(
        1,
        Math.round(e.width || D.clientWidth || window.innerWidth || 1),
      ),
      o = Math.max(
        1,
        Math.round(e.height || D.clientHeight || window.innerHeight || 1),
      );
    (U.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, renderTuning.maxPixelRatio),
    ),
      U.setSize(t, o, !1),
      U.setViewport(0, 0, t, o),
      U.setScissor(0, 0, t, o),
      U.setScissorTest(!1),
      (U.domElement.style.width = `${t}px`),
      (U.domElement.style.height = `${o}px`),
      (q.aspect = t / o),
      q.updateProjectionMatrix());
    __postfx?.setSize?.(t, o);
  }
  const _isMobile = () => window.innerWidth <= 1080;
  function _o(e, t = 0, o = !0) {
    const a = Math.hypot(e.velocity?.x || 0, e.velocity?.z || 0),
      mobScale = _isMobile() ? 0.5 : 1,
      n = o ? Math.min(0.048, 0.014 * a) * mobScale : 0,
      s = n ? Math.sin(8.4 * t) * n : 0,
      r = n ? Math.cos(4.2 * t) * n * 0.35 : 0,
      i = n ? Math.sin(4.2 * t) * n * 0.4 : 0,
      idleAmp = o && a < 0.02 ? 0.006 * mobScale : 0,
      idleY = idleAmp * Math.sin(1.4 * t),
      idleR = idleAmp * 0.3 * Math.sin(0.9 * t + 0.5);
    (q.position.set(e.x + r, 1.62 + s + idleY + (e.stairY || 0), e.z),
      (q.rotation.y = e.yaw),
      (q.rotation.x = e.pitch),
      (q.rotation.z = i + idleR));
  }
  function Ao(e) {
    return e < (o.perfectOrbitEnd ?? 14.2)
      ? "orbit"
      : e < (o.perfectTransitionEnd ?? 17.4)
        ? "transition"
        : e < (o.perfectSeniorPovEnd ?? 27.6)
          ? "senior_pov"
          : e < (o.perfectOverlayAt ?? 34.8)
            ? "eyes"
            : "overlay";
  }
  function Zo(e, t, o, a) {
    return (
      s.copy(t).project(q),
      {
        name: e,
        visible:
          s.z >= -1 && s.z <= 1 && Math.abs(s.x) <= 1.2 && Math.abs(s.y) <= 1.2,
        ndcX: Number(s.x.toFixed(4)),
        ndcY: Number(s.y.toFixed(4)),
        screenX: Math.round((0.5 * s.x + 0.5) * o),
        screenY: Math.round((0.5 * -s.y + 0.5) * a),
      }
    );
  }
  function Lo(t) {
    const o = {};
    return (
      (t.hotspots || []).forEach((t) => {
        t.visible
          ? (o[t.id] = (function (e) {
              n.copy(e).sub(q.position);
              const t = n.length(),
                o = n.normalize();
              _.set(q.position, o);
              const a = _.intersectObjects(A, !1);
              return !a.length || a[0].distance >= t - 0.12;
            })(new e.Vector3(t.x, t.y, t.z)))
          : (o[t.id] = !1);
      }),
      o
    );
  }
  H.add(Wo);
  let Xo = null,
    jo = 0;
  /* ── 光線隧道蟲洞系統 ── */
  var _wormholeActive = false,
    _wormholeTime = 0,
    _wormholeDuration = 2.2,
    _wormholeGroup = null;
  function initWormhole() {
    if (_wormholeGroup) return;
    _wormholeGroup = new e.Group();
    _wormholeGroup.visible = false;
    /* 隧道圓柱體 — 從外觀看是一個向前拉伸的光管 */
    var tunnelGeo = new e.CylinderGeometry(0.38, 0.52, 12, 24, 1, true);
    var tunnelMat = new e.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0,
      side: e.DoubleSide,
      blending: e.AdditiveBlending,
    });
    var tunnel = new e.Mesh(tunnelGeo, tunnelMat);
    tunnel.rotation.x = Math.PI / 2;
    tunnel.userData.isTunnel = true;
    _wormholeGroup.add(tunnel);
    /* 速度光線 — 向前延伸的光條 */
    var NUM_STREAKS = 28;
    for (var si = 0; si < NUM_STREAKS; si++) {
      var angle = (si / NUM_STREAKS) * Math.PI * 2;
      var radius = 0.18 + Math.random() * 0.32;
      var streakLen = 1.4 + Math.random() * 2.2;
      var pts = [
        new e.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0),
        new e.Vector3(Math.cos(angle) * radius * 0.4, Math.sin(angle) * radius * 0.4, -streakLen),
      ];
      var streakGeo = new e.BufferGeometry().setFromPoints(pts);
      var hue = 0.54 + si * 0.012;
      var streakMat = new e.LineBasicMaterial({
        color: new e.Color().setHSL(hue % 1, 1, 0.82),
        transparent: true,
        opacity: 0,
        blending: e.AdditiveBlending,
        linewidth: 1,
      });
      var streak = new e.Line(streakGeo, streakMat);
      streak.userData.isStreak = true;
      streak.userData.baseOpacity = 0.5 + Math.random() * 0.4;
      streak.userData.phase = Math.random() * Math.PI * 2;
      _wormholeGroup.add(streak);
    }
    /* 中央爆發光核 */
    var coreGeo = new e.SphereGeometry(0.12, 12, 12);
    var coreMat = new e.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: e.AdditiveBlending,
    });
    var core = new e.Mesh(coreGeo, coreMat);
    core.userData.isCore = true;
    _wormholeGroup.add(core);
    /* 外圍光暈環 */
    for (var ri = 0; ri < 3; ri++) {
      var haloGeo = new e.TorusGeometry(0.28 + ri * 0.22, 0.014, 8, 32);
      var haloMat = new e.MeshBasicMaterial({
        color: new e.Color().setHSL(0.56 + ri * 0.06, 1, 0.7),
        transparent: true,
        opacity: 0,
        blending: e.AdditiveBlending,
      });
      var halo = new e.Mesh(haloGeo, haloMat);
      halo.userData.isHalo = true;
      halo.userData.haloIdx = ri;
      _wormholeGroup.add(halo);
    }
    j.add(_wormholeGroup);
  }
  function triggerWormhole(px, py, pz) {
    initWormhole();
    _wormholeActive = true;
    _wormholeTime = 0;
    _wormholeGroup.position.set(px, (py || 0) + 1.4, pz);
    _wormholeGroup.visible = true;
  }
  function updateWormhole(dt) {
    if (!_wormholeActive || !_wormholeGroup) return;
    _wormholeTime += dt;
    var t = _wormholeTime / _wormholeDuration;
    if (t >= 1) {
      _wormholeActive = false;
      _wormholeGroup.visible = false;
      return;
    }
    /* 包絡：0→快速爆發→維持→漸出 */
    var peak = t < 0.18 ? t / 0.18 : t < 0.72 ? 1 : (1 - t) / 0.28;
    peak = Math.max(0, Math.min(1, peak));
    /* 讓整個群組面向攝影機 (billboard Y) */
    _wormholeGroup.rotation.y = Math.atan2(
      q.position.x - _wormholeGroup.position.x,
      q.position.z - _wormholeGroup.position.z,
    );
    _wormholeGroup.children.forEach(function (c) {
      if (c.userData.isTunnel) {
        c.material.opacity = peak * 0.22;
        /* 隧道向前拉伸感 */
        c.scale.z = 1 + t * 2.4;
        return;
      }
      if (c.userData.isCore) {
        var corePulse = 1 + Math.sin(t * 18) * 0.22 * peak;
        c.scale.setScalar(corePulse * (0.8 + peak * 1.6));
        c.material.opacity = peak * 0.9;
        return;
      }
      if (c.userData.isHalo) {
        var hi = c.userData.haloIdx;
        var hPhase = t * 5 - hi * 0.5;
        var hEnv = Math.max(0, Math.sin(hPhase * Math.PI * 0.6)) * peak;
        c.material.opacity = hEnv * (0.7 - hi * 0.14);
        c.scale.setScalar(1 + hPhase * 0.18);
        c.rotation.z = t * 2.2 + hi * 1.2;
        return;
      }
      if (c.userData.isStreak) {
        var sp = c.userData.phase;
        /* 速度線閃爍，模擬穿越感 */
        var streakPulse = Math.abs(Math.sin(t * 9 + sp));
        c.material.opacity = peak * c.userData.baseOpacity * streakPulse;
        /* 讓速度線向前射出 */
        c.scale.z = 1 + t * 3.2 * peak;
        return;
      }
    });
  }
  function getStairY(t, o) {
    for (const stair of stairLayouts) {
      if (t < stair.xOuter || t > stair.xInner || o < stair.z1 || o > stair.z2)
        continue;
      if (o >= stair.landing.z1 && o <= stair.landing.z2) return 0;
      const a = e.MathUtils.clamp(
          (stair.xEntry - t) / Math.max(0.001, stair.xEntry - stair.xExit),
          0,
          1,
        ),
        n = e.MathUtils.smoothstep(a, 0, 1);
      return o < stair.landing.z1 ? stair.totalRise * n : -stair.totalRise * n;
    }
    return 0;
  }
  /* D1: atmosphere time-shift — progress 0 (10:40 cool morning) → 1 (11:00+ warm) */
  const _atmosBase = {
    fogColor: new e.Color("#d0dce6"),
    bgColor: new e.Color("#ccd8e4"),
    dirColor: new e.Color(16772034),
    dirIntensity: 2.8,
    hemiSky: new e.Color(8900331),
    hemiGround: new e.Color(9139029),
    ambColor: new e.Color(16775408),
    ambIntensity: 0.22,
    exposure: 1.14,
  };
  const _atmosWarm = {
    fogColor: new e.Color("#e2d0b8"),
    bgColor: new e.Color("#dcc8b0"),
    dirColor: new e.Color("#ffd080"),
    dirIntensity: 3.6,
    hemiSky: new e.Color("#b8d4e8"),
    hemiGround: new e.Color("#d8c8a0"),
    ambColor: new e.Color("#ffe8b8"),
    ambIntensity: 0.32,
    exposure: 1.28,
  };
  const _tmpColor = new e.Color();
  function updateAtmosphere(progress) {
    const p = e.MathUtils.clamp(progress, 0, 1);
    W.fog.color.copy(_atmosBase.fogColor).lerp(_atmosWarm.fogColor, p);
    W.background.copy(_atmosBase.bgColor).lerp(_atmosWarm.bgColor, p);
    Te.color.copy(_atmosBase.dirColor).lerp(_atmosWarm.dirColor, p);
    Te.intensity = e.MathUtils.lerp(_atmosBase.dirIntensity, _atmosWarm.dirIntensity, p);
    Be.color.copy(_atmosBase.hemiSky).lerp(_atmosWarm.hemiSky, p);
    Be.groundColor.copy(_atmosBase.hemiGround).lerp(_atmosWarm.hemiGround, p);
    ke.color.copy(_atmosBase.ambColor).lerp(_atmosWarm.ambColor, p);
    ke.intensity = e.MathUtils.lerp(_atmosBase.ambIntensity, _atmosWarm.ambIntensity, p);
    U.toneMappingExposure = e.MathUtils.lerp(_atmosBase.exposure, _atmosWarm.exposure, p);
  }
  return {
    getStairY: getStairY,
    triggerWormhole: triggerWormhole,
    updateAtmosphere: updateAtmosphere,
    _worldGroup: j,
    _scene: W,
    render: function (s) {
      qo();
      const sceneTime = s.time ?? 0;
      const perfectType = s.endingSequence?.type ?? s.ending,
        perfectPhase = "perfect" === perfectType ? Ao(s.endingSequence?.time ?? 0) : null,
        juniorHeroLead =
          "rear_wait" === s.phase ||
          "eye_contact" === s.phase ||
          ("perfect" === perfectType &&
            ("senior_pov" === perfectPhase ||
              "eyes" === perfectPhase ||
              "overlay" === perfectPhase));
      (!(function (t) {
        const isIntro = "intro" === t.mode;
        if (
          ((Go.visible = !isIntro && (t.characters.senior.alpha ?? 1) > 0.02),
          (Co.visible = !isIntro),
          (Bo.visible = !isIntro && t.characters.fatherEcho.alpha > 0.02),
          (ko.visible = !isIntro && t.characters.auntEcho.alpha > 0.02),
          (Do.visible = isIntro),
          (Vo.visible = isIntro),
          (Eo.visible = isIntro),
          (Uo.visible = isIntro),
          (Wo.visible = isIntro),
          Go.position.set(t.characters.senior.x, 0, t.characters.senior.z),
          (Go.rotation.y = t.characters.senior.rotationY ?? 0),
          (t.characters.senior.alpha ?? 1) < 1 &&
            Go.traverse((e) => {
              e.material && (e.material.opacity = t.characters.senior.alpha);
            }),
          Co.position.set(t.characters.junior.x, 0, t.characters.junior.z),
          (Co.rotation.y = t.characters.junior.rotationY ?? 0),
          juniorHeroLight.position.set(Co.position.x + 3.8, 4.3, Co.position.z),
          juniorRimLight.position.set(Co.position.x + 0.84, 2.08, Co.position.z + g(8)),
          juniorHeroLight.target.position.set(
            Co.position.x + 0.03,
            1.54,
            Co.position.z + 0.06,
          ),
          Bo.position.set(
            t.characters.fatherEcho.x,
            0,
            t.characters.fatherEcho.z,
          ),
          ko.position.set(t.characters.auntEcho.x, 0, t.characters.auntEcho.z),
          Bo.traverse((e) => {
            e.material && (e.material.opacity = t.characters.fatherEcho.alpha);
          }),
	          ko.traverse((e) => {
	            e.material && (e.material.opacity = t.characters.auntEcho.alpha);
	          }),
          (() => {
            const e = Co.userData.runtimeModelRoot ?? null,
              o = Co.userData.heroCloseupModelRoot ?? null,
              a = Boolean(e?.userData?.ready),
              s = !1,
              r = a,
              i = r;
	            e &&
	              (e.userData.basePosition ??= e.position.clone(),
	              e.userData.baseScale ??= e.scale.clone(),
	              e.userData.baseRotation ??= e.rotation.clone());
	            o &&
	              (o.userData.basePosition ??= o.position.clone(),
	              o.userData.baseScale ??= o.scale.clone(),
	              o.userData.baseRotation ??= o.rotation.clone());
	            Co.userData.legacyChildren?.forEach((e) => {
	              e.visible = !i;
	            }),
	              e &&
	                ((e.visible = r),
	                r
	                  ? (e.position.copy(e.userData.basePosition),
	                    e.scale.copy(e.userData.baseScale),
	                    e.rotation.copy(e.userData.baseRotation))
	                  : e.visible ||
	                    (e.position.copy(e.userData.basePosition),
	                    e.scale.copy(e.userData.baseScale),
	                    e.rotation.copy(e.userData.baseRotation))),
              r && e?.userData?.ready && (() => {
                e.updateMatrixWorld(!0);
                juniorHeroAnchorBox.setFromObject(e);
                const footY = juniorHeroAnchorBox.min.y;
                if (Number.isFinite(footY) && Math.abs(footY) > 0.001) {
                  e.position.y -= footY;
                }
              })(),
              o &&
                ((o.visible = s),
                  s
                    ? (o.position.copy(o.userData.basePosition),
                      o.scale.copy(o.userData.baseScale),
                      o.rotation.copy(o.userData.baseRotation),
                      setJuniorGltfFaceVisibility(o, !0))
                    : (o.position.copy(o.userData.basePosition),
                      o.scale.copy(o.userData.baseScale),
                      o.rotation.copy(o.userData.baseRotation),
                      setJuniorGltfFaceVisibility(o, !0))),
              (assetState.currentVariant = r
                ? "runtime_glb"
                : "procedural_fallback");
          })(),
	          Co.userData.glow &&
	            (Co.userData.glow.material.opacity =
	              "eye_contact" === t.phase ||
	              "perfect" === (t.endingSequence?.type ?? t.ending)
	                ? 0.5 + 0.2 * t.cinematicGlow
	                : 0.18),
	          Co.userData.pose?.referenceJunior &&
	            (() => {
              const e = Co.userData.pose,
                o = "perfect" === (t.endingSequence?.type ?? t.ending),
                s = o ? Ao(t.endingSequence?.time ?? 0) : null,
                a =
                  "rear_wait" === t.phase ||
                  "eye_contact" === t.phase ||
                  (o &&
                    ("senior_pov" === s ||
                      "eyes" === s ||
                      "overlay" === s));
              setJuniorHeroLeadVisibility(e, a, {
                heroHeadRoot: e.heroHeadRoot,
                keepLegacyBody: !1,
                suppressRuntimeModel: !1,
                showHeroHeadRoot: !1,
              });
              if (e.head?.material && e.jaw?.material) {
                [e.head.material, e.jaw.material].forEach((t) => {
                  if (!t?.isMaterial) return;
                  t.userData.baseRoughness ??= t.roughness;
                  t.userData.baseClearcoat ??= t.clearcoat ?? 0;
                  t.userData.baseSheen ??= t.sheen ?? 0;
                  t.userData.baseOpacity ??= t.opacity ?? 1;
                  t.userData.baseTransparent ??= t.transparent;
                  t.userData.baseDepthWrite ??= t.depthWrite;
                  t.roughness = a ? 0.44 : t.userData.baseRoughness;
                  "clearcoat" in t &&
                    (t.clearcoat = a ? 0.04 : t.userData.baseClearcoat);
                  "sheen" in t && (t.sheen = a ? 0.06 : t.userData.baseSheen);
                  (t.transparent = t.userData.baseTransparent),
                    (t.opacity = t.userData.baseOpacity),
                    (t.depthWrite = t.userData.baseDepthWrite);
                });
              }
              e.blushL?.material &&
                (e.blushL.material.opacity = a ? 0.1 : e.blushL.material.userData.baseOpacity ?? e.blushL.material.opacity);
              e.blushR?.material &&
                (e.blushR.material.opacity = a ? 0.1 : e.blushR.material.userData.baseOpacity ?? e.blushR.material.opacity);
            })(),
          Co.userData.portraitShell &&
            (() => {
              const a = Co.userData.portraitShell,
                n = Boolean(a.userData.loaded) && !isIntro,
                p = "perfect" === (t.endingSequence?.type ?? t.ending),
                s =
                  p
                    ? e.MathUtils.lerp(
                        0.46,
                        0.94,
                        e.MathUtils.smoothstep(
                          t.endingSequence?.time ?? 0,
                          o.perfectTransitionEnd ?? 17.4,
                          o.perfectEyesEnd ?? 35,
                        ),
                      )
                  : "eye_contact" === t.phase
                      ? 0.82
                      : "rear_wait" === t.phase
                        ? 0.16
                        : 0,
                r =
                  n &&
                  !p &&
                  !1 &&
                  s > 0.02 &&
                  ("rear_wait" === t.phase ||
                    "eye_contact" === t.phase ||
                    "perfect" === (t.endingSequence?.type ?? t.ending)),
                i = !1;
              a.userData.planes?.forEach((e) => {
                e.visible = !1;
              }),
                a.userData.glow && (a.userData.glow.visible = r),
                a.userData.heroFaceCard &&
                  updateJuniorHeroFaceCard(
                    Co,
                    a,
                    q,
                    i ? Math.min(0.92, Math.max(0.68, 0.72 * s)) : 0,
                  ),
                (a.visible = r && !p),
                r && updateJuniorPortraitShell(Co, a, q, s);
            })(),
          z(Go),
          z(Co),
          isIntro)
        )
          v(Co, 0.4 * t.time, 0.4);
        else if ("perfect" === t.endingSequence?.type) {
          const a = e.MathUtils.smoothstep(
              t.endingSequence.time,
              0.24,
              o.perfectSeniorPovEnd ?? 27.6,
            ),
            n = e.MathUtils.smoothstep(
              t.endingSequence.time,
              0.48,
              o.perfectOrbitEnd ?? 14.2,
            );
          (t.endingSequence.time < (o.perfectSeniorPovEnd ?? 27.6)
            ? P(Go, 0.9 * Math.sin(3.53 * t.endingSequence.time), 0.9)
            : v(Go, t.time, 0.8),
            t.endingSequence.time < (o.perfectOrbitEnd ?? 14.2)
              ? P(Co, 0.84 * Math.sin(3.23 * t.endingSequence.time + 0.8), 0.7)
              : v(Co, 0.84 * t.time, 0.92),
            (Go.position.y += 0.01 * a),
            (Co.position.y += 0.014 * n));
        } else if ("front_call" === t.phase)
          (t.phaseClock < 7.2
            ? P(Go, 0.82 * Math.sin(7.4 * t.time), 0.82)
            : v(Go, 0.9 * t.time, 0.76),
            v(Co, 0.72 * t.time, 0.9));
        else if ("rear_wait" === t.phase) {
          const e = Math.sin(7.1 * t.time);
          (P(Go, 0.76 * e, 0.8),
            P(Co, 0.68 * Math.sin(6.4 * t.time + 0.7), 0.66),
            v(Co, t.time, 0.58));
        } else
          (P(Go, 0.34 * Math.sin(6.2 * t.time), 0.5), v(Co, 0.9 * t.time, 1));
        ((juniorHeroLight.intensity =
          "perfect" === (t.endingSequence?.type ?? t.ending)
            ? 3.6
            : "eye_contact" === t.phase
              ? 3.02
              : "rear_wait" === t.phase
                ? 2.58
                : 1.76),
          (juniorRimLight.intensity =
            "perfect" === (t.endingSequence?.type ?? t.ending)
              ? 2.34
              : "eye_contact" === t.phase
                ? 1.98
                : 1.32));
        (vo.senior.copy(Go.position).add(new e.Vector3(0, 1.34, 0)),
          vo.junior.copy(Co.position).add(new e.Vector3(0, 1.34, 0)));
      })(s),
        (function (e, t, o) {
          e.forEach((e) => {
            const a = L.get(e.id);
            a &&
              ((a.visible = e.visible),
              a.position.set(e.x, e.y, e.z),
              (a.position.y += 0.04 * Math.sin(1.6 * o + 0.18 * e.z) + 0.16),
              a.scale.setScalar(e.id === t ? 0.98 : 0.72),
              (a.children[0].material.opacity = e.id === t ? 0.34 : 0.08),
              (a.children[1].material.opacity = e.id === t ? 0.22 : 0.06),
              a.children[1].material.emissiveIntensity !== void 0 &&
                (a.children[1].material.emissiveIntensity =
                  e.id === t ? 0.8 + 0.4 * Math.sin(3.2 * o) : 0.3 + 0.2 * Math.sin(1.6 * o)));
          });
        })(s.hotspots, s.activeHotspotId, sceneTime));
      const x = "intro" === s.mode;
      if (x)
        !(function (t) {
          const o = e.MathUtils.clamp(t.progress, 0, 1),
            a = 0.5 + 0.5 * Math.sin(o * Math.PI * 2.6 - 0.5 * Math.PI),
            s =
              o < 0.18
                ? 1.22 * o
                : o < 0.46
                  ? 0.2196 + 0.96 * (o - 0.18)
                  : 0.4884 + 0.9 * (o - 0.46),
            r = e.MathUtils.clamp(s, 0, 1),
            i = e.MathUtils.smoothstep(
              e.MathUtils.clamp(r * (0.7 + 0.3 * a), 0, 1),
              0.02,
              0.98,
            ),
            w = Io.getPoint(i),
            M = Io.getPoint(e.MathUtils.clamp(i + 0.12, 0, 1)),
            f = Math.sin(o * Math.PI * 4.2) * Math.exp(2.0 * -o) * 2.5,
            u = e.MathUtils.lerp(
              104,
              42,
              e.MathUtils.smoothstep(o, 0.02, 0.88),
            ),
            y =
              o > 0.3 && o < 0.4
                ? 12 * Math.sin(((o - 0.3) / 0.1) * Math.PI)
                : 0;
          ((q.fov = u + f + y),
            q.updateProjectionMatrix(),
            q.position
              .copy(w)
              .add(
                n.set(
                  0.28 * (1 - o) * Math.sin(0.8 + o * Math.PI * 2.8),
                  0.22 * Math.sin(o * Math.PI * 1.16) +
                    0.08 * Math.sin(o * Math.PI * 5.2) * (1 - 0.45 * o),
                  -0.64 * (1 - o) * (0.3 + 0.7 * o),
                ),
              ));
          const g = new e.Vector3(
              0.22 * vo.senior.x +
                0.38 * vo.doorPlaque.x +
                0.18 * vo.frontDoor.x +
                0.22 * vo.parapetBand.x,
              e.MathUtils.lerp(3.8, 1.46, o),
              0.22 * vo.senior.z +
                0.34 * vo.doorPlaque.z +
                0.18 * vo.frontDoor.z +
                0.26 * vo.parapetBand.z,
            ),
            x = e.MathUtils.smoothstep(o, 0.12, 0.78),
            b = new e.Vector3(
              e.MathUtils.lerp(M.x + e.MathUtils.lerp(1.8, 0.12, o), g.x, x),
              e.MathUtils.lerp(4.02, g.y, x),
              e.MathUtils.lerp(M.z - e.MathUtils.lerp(0.42, 0.1, o), g.z, x),
            );
          q.lookAt(b);
          const S =
              Math.sin(o * Math.PI * 1.8) * e.MathUtils.lerp(0.24, 0.002, o),
            z =
              Math.sin(o * Math.PI * 10) * e.MathUtils.lerp(0.01, 0, o) * 0.2,
            P =
              o > 0.24 && o < 0.34
                ? 0.004 * Math.sin(80 * (o - 0.24)) * (1 - (o - 0.24) / 0.1)
                : 0;
          (q.rotateZ(S + z + P), (H.visible = !0));
          const v = 0.5 + 0.5 * Math.sin(o * Math.PI * 6.2),
            G =
              o > 0.28 && o < 0.36
                ? 1.4 + 0.6 * Math.sin(((o - 0.28) / 0.08) * Math.PI * 4)
                : 1;
          ((Ro.material.opacity =
            e.MathUtils.lerp(1, 0.2, o) * (0.9 + 0.18 * v) * G),
            (Ro.material.emissiveIntensity =
              e.MathUtils.lerp(4.2, 0.72, o) * (0.88 + 0.24 * v) * G));
          const C = e.MathUtils.clamp(r + 0.03, 0, 1),
            B = Io.getPoint(C);
          (Do.position.copy(B).add(l),
            Do.lookAt(q.position),
            (Do.material.opacity =
              e.MathUtils.lerp(0.96, 0.22, o) * (0.8 + 0.2 * v)),
            Vo.position.copy(B).add(c),
            Vo.lookAt(q.position));
          const k = o > 0.29 && o < 0.37 ? 1.6 : 1;
          ((Vo.material.opacity = e.MathUtils.lerp(0.72, 0.16, o) * k),
            Wo.position.copy(B).add(h),
            Wo.lookAt(q.position),
            (Wo.material.opacity = e.MathUtils.lerp(0.48, 0.04, o)),
            Eo.position.copy(Io.getPoint(e.MathUtils.clamp(r + 0.08, 0, 1))),
            Eo.scale.setScalar(1 + 0.5 * Math.sin(o * Math.PI * 6)),
            Eo.material.color.lerpColors(
              p,
              m,
              e.MathUtils.smoothstep(o, 0.5, 0.9),
            ),
            Uo.position.copy(B).add(d),
            Uo.lookAt(q.position),
            (Uo.material.opacity = e.MathUtils.lerp(0.46, 0.06, o)));
        })(s.intro);
      else if ("perfect" === s.endingSequence?.type)
        /* ── perfect：跟拍學妹 → 停門口拍臉 5 秒 → 金句 ── */
        ((H.visible = !1),
          (function (t) {
            const et = t.endingSequence?.time ?? 0;
            const WALK_END = 45.0;            // 學妹走路 45 秒到達後門
            const FACE_TRANS_END = WALK_END + 1.0; // 1 秒過渡到拍臉鏡頭
            const heroAnchor = resolveJuniorHeroAnchor(Co, {
              forceRoot: Co.userData.runtimeModelRoot ?? null,
              allowLegacyFallback: !1,
            });
            const facePos = heroAnchor.face;
            const eyePos  = heroAnchor.eyes;
            const fwd = new e.Vector3(Math.sin(Co.rotation.y), 0, Math.cos(Co.rotation.y));
            // ── 跟拍鏡頭：位在學妹背後偏上，望著學妹上半身 ──
            const followPos = Co.position.clone()
              .add(fwd.clone().multiplyScalar(-2.5))
              .add(new e.Vector3(0, 1.8, 0));
            const lookTgt = Co.position.clone().add(new e.Vector3(0, 1.4, 0));
            if (et < WALK_END) {
              q.position.copy(followPos);
              q.fov = 46;
              q.updateProjectionMatrix();
              q.lookAt(lookTgt);
              return;
            }
            // ── 拍臉鏡頭：過渡到學妹正前方，對準眼睛 ──
            const tFace = e.MathUtils.smoothstep(et, WALK_END, FACE_TRANS_END);
            const faceShot = new e.Vector3(
              Co.position.x + fwd.x * 0.9,
              eyePos.y + 3e-4 * Math.sin(0.5 * et),
              Co.position.z + fwd.z * 0.9
            );
            const camPos = followPos.clone().lerp(faceShot, tFace);
            q.position.copy(camPos);
            q.fov = e.MathUtils.lerp(46, 36, tFace);
            q.updateProjectionMatrix();
            q.lookAt(facePos.x, facePos.y, facePos.z);
          })(s));
      else if ("perfect_eye" === s.endingSequence?.type)
        /* ── perfect_eye：靜態臉部特寫，攝影機在學妹正前方 ── */
        ((H.visible = false),
          (function(t) {
            const heroAnchor = resolveJuniorHeroAnchor(Co, {
              forceRoot: Co.userData.runtimeModelRoot?.visible ? Co.userData.runtimeModelRoot : null,
              allowLegacyFallback: !0,
            });
            const facePos = heroAnchor.face;
            const eyeY = heroAnchor.eyes.y > Co.position.y + 1.0 ? heroAnchor.eyes.y : Co.position.y + 1.52;
            const fwd = new e.Vector3(Math.sin(Co.rotation.y), 0, Math.cos(Co.rotation.y));
            q.position.set(
              Co.position.x + fwd.x * 0.9,
              eyeY,
              Co.position.z + fwd.z * 0.9
            );
            q.fov = 36;
            q.updateProjectionMatrix();
            const lookY = facePos.y > Co.position.y + 1.0 ? facePos.y : Co.position.y + 1.53;
            q.lookAt(facePos.x, lookY, facePos.z);
          })(s))
      else if ("one_gaze" === s.endingSequence?.type)
        /* ── one_gaze：學妹臉部正前方靜態特寫（同 perfect_eye 角度） ── */
        ((H.visible = false),
          (function(t) {
            const heroAnchor = resolveJuniorHeroAnchor(Co, {
              forceRoot: Co.userData.runtimeModelRoot?.visible ? Co.userData.runtimeModelRoot : null,
              allowLegacyFallback: !0,
            });
            const facePos = heroAnchor.face;
            const eyeY = heroAnchor.eyes.y > Co.position.y + 1.0 ? heroAnchor.eyes.y : Co.position.y + 1.52;
            const fwd = new e.Vector3(Math.sin(Co.rotation.y), 0, Math.cos(Co.rotation.y));
            q.position.set(
              Co.position.x + fwd.x * 0.9,
              eyeY,
              Co.position.z + fwd.z * 0.9
            );
            q.fov = 36;
            q.updateProjectionMatrix();
            const lookY2 = facePos.y > Co.position.y + 1.0 ? facePos.y : Co.position.y + 1.53;
            q.lookAt(facePos.x, lookY2, facePos.z);
          })(s));
      else if ("rear_wait" === s.phase && s.phaseClock > 3.0 && "ghost" === s.controlMode) {
        // rear_wait 過場：跟拍鏡頭跟著學妹走向後門（腳本模式）
        H.visible = !1;
        const fwd = new e.Vector3(Math.sin(Co.rotation.y), 0, Math.cos(Co.rotation.y));
        const followPos = Co.position.clone()
          .add(fwd.clone().multiplyScalar(-2.5))
          .add(new e.Vector3(0, 1.8, 0));
        q.fov = 46;
        q.updateProjectionMatrix();
        q.position.copy(followPos);
        q.lookAt(Co.position.clone().add(new e.Vector3(0, 1.4, 0)));
      } else {
        H.visible = !1;
        /* 第一人稱控制學妹時隱藏學妹模型（攝影機在模型內部） */
        Co.visible = "junior" !== s.controlMode;
        const fov =
          "front_call" === s.phase ? 42 : "eye_contact" === s.phase ? 46 : 56;
        (q.fov !== fov && ((q.fov = fov), q.updateProjectionMatrix()),
          _o(s.player, sceneTime, !0));
      }
      const b = x ? e.MathUtils.lerp(0.34, 1, s.intro.progress) : 1;
      if (
        ((Te.intensity =
          1.96 * b +
          ("eye_contact" === s.phase ||
          "perfect" === (s.endingSequence?.type ?? s.ending)
            ? 0.68
            : "front_call" === s.phase
              ? 0.26
              : 0.12)),
        (ke.intensity = 0.28 + 0.2 * b),
        (Ie.intensity = x ? 0.66 : 0.98),
        (Re.intensity =
          "perfect" === s.ending
            ? 2.02
            : "front_call" === s.phase
              ? 2.28
              : 1.32),
        (De.intensity =
          "eye_contact" === s.phase || "perfect" === s.ending
            ? 2.04
            : "front_call" === s.phase
              ? 1.64
              : 1.18),
        (Ve.intensity =
          "eye_contact" === s.phase || "perfect" === s.ending ? 1.34 : 0.8),
        (_t.material.opacity =
          "perfect" === s.ending
            ? 0.72
            : "front_call" === s.phase
              ? 0.94
              : 0.36),
        (At.material.opacity =
          "front_call" === s.phase
            ? 0.82
            : "perfect" === s.ending
              ? 0.54
              : 0.24),
        (Xt.material.opacity =
          "eye_contact" === s.phase || "perfect" === s.ending ? 0.86 : 0.54),
        (jt.material.opacity =
          "eye_contact" === s.phase || "perfect" === s.ending ? 0.66 : 0.34),
        (Ht.material.opacity =
          "perfect" === s.ending
            ? 0.72
            : "eye_contact" === s.phase
              ? 0.48
              : 0.26),
        ($t.material.opacity =
          "perfect" === s.ending
            ? 0.58
            : "eye_contact" === s.phase
              ? 0.4
              : 0.2),
        W.background.setStyle(x ? "#090d16" : "#dde8f2"),
        W.fog.color.setStyle(x ? "#121722" : "#d6e1eb"),
        (W.fog.near = x ? 3 : 16),
        (W.fog.far = x ? 20 : 68),
        (bo.visible = "perfect" !== s.endingSequence?.type),
        (bo.rotation.y = 0.018 * sceneTime),
        (bo.position.x = 0.08 * Math.sin(0.12 * sceneTime)),
        fo.forEach((e) => {
          e.position.x =
            e.userData.startX +
            8 * Math.sin(0.02 * sceneTime * e.userData.speed) +
            sceneTime * e.userData.speed * 0.1;
        }),
        uo.forEach((e) => {
          const t = sceneTime * e.userData.speed;
          ((e.position.x = e.userData.startX + 2 * t),
            (e.position.z =
              e.userData.startZ + 6 * Math.sin(0.5 * t + e.userData.phase)),
            (e.position.y += 0.002 * Math.sin(t + e.userData.phase)),
            (e.userData.wingL.rotation.z =
              0.3 + 0.4 * Math.sin(6 * t + e.userData.phase)),
            (e.userData.wingR.rotation.z =
              -0.3 - 0.4 * Math.sin(6 * t + e.userData.phase)),
            e.position.x > e.userData.startX + 120 &&
              (e.position.x = e.userData.startX - 40));
        }),
        Xo)
      ) {
        const e = sceneTime - jo;
        let t = 0;
        (e > 5 && e <= 6
          ? (t = 0.8 * (6 - e))
          : e > 1 && e <= 5
            ? (t = 0.8 + 0.12 * Math.sin(4 * sceneTime))
            : e >= 0 && e <= 1
              ? (t = 0.8 * e)
              : e > 6 && (W.remove(Xo), (Xo = null)),
          Xo &&
            ((Xo.position.y = 0.02 * Math.sin(2 * sceneTime)),
            Xo.traverse((e) => {
              e.material && (e.material.opacity = t);
            })));
      }
      const S = (D.parentElement ?? D).getBoundingClientRect(),
        G = D.getBoundingClientRect(),
        C = U.getSize(r),
        B = U.getDrawingBufferSize(i),
        k = U.domElement.width || B.x || 0,
        T = U.domElement.height || B.y || 0,
        I = Math.round(G.width),
        R = Math.round(G.height),
        V = Math.round(S.width),
        E = Math.round(S.height),
        _ =
          (V > 0 && I > 0 && Math.abs(V - I) > 4) ||
          (E > 0 && R > 0 && Math.abs(E - R) > 4) ||
          Math.abs(I - D.clientWidth) > 4 ||
          Math.abs(R - D.clientHeight) > 4 ||
          Math.abs(Math.round(C.x) - V) > 4 ||
          Math.abs(Math.round(C.y) - E) > 4;
      ((X = {
        camera: {
          x: Number(q.position.x.toFixed(3)),
          y: Number(q.position.y.toFixed(3)),
          z: Number(q.position.z.toFixed(3)),
          yaw: Number(q.rotation.y.toFixed(3)),
          pitch: Number(q.rotation.x.toFixed(3)),
        },
        viewport: { width: k, height: T },
        cssViewport: { width: I, height: R },
        stageViewport: { width: V, height: E },
        webglViewport: { width: Math.round(C.x), height: Math.round(C.y) },
        projectedNodes: {
          senior: Zo("senior", vo.senior, k, T),
          junior: Zo("junior", vo.junior, k, T),
          frontDoor: Zo("frontDoor", vo.frontDoor, k, T),
          backDoor: Zo("backDoor", vo.backDoor, k, T),
          doorPlaque: Zo("doorPlaque", vo.doorPlaque, k, T),
          parapetBand: Zo("parapetBand", vo.parapetBand, k, T),
          boardWall: Zo("boardWall", vo.boardWall, k, T),
        },
        hotspotLOS: Lo(s),
        currentRoomIds: t.floorRooms.map((e) => e.id),
        endingShotPhase:
          "perfect" === s.endingSequence?.type
            ? Ao(s.endingSequence.time)
            : null,
        heroCloseupTarget: Co.userData.heroCloseupTarget ?? null,
        portraitShellVisible: juniorPortraitShell?.visible ?? null,
        juniorGrounded: (() => {
          const rm = Co.userData.runtimeModelRoot;
          if (!rm?.visible || !rm.userData?.ready) return null;
          rm.updateMatrixWorld(!0);
          const bb = new e.Box3().setFromObject(rm);
          return Number.isFinite(bb.min.y) ? Math.abs(bb.min.y) < 0.05 : null;
        })(),
        heroCloseupRoots: {
          runtime: Co.userData.runtimeModelRoot
            ? {
                visible: Co.userData.runtimeModelRoot.visible,
                ready: Co.userData.runtimeModelRoot.userData?.ready ?? !1,
                kind: Co.userData.runtimeModelRoot.userData?.kind ?? null,
              }
            : null,
          closeup: Co.userData.heroCloseupModelRoot
            ? {
                visible: Co.userData.heroCloseupModelRoot.visible,
                ready: Co.userData.heroCloseupModelRoot.userData?.ready ?? !1,
                kind: Co.userData.heroCloseupModelRoot.userData?.kind ?? null,
              }
            : null,
          procedural: Co.userData.pose?.heroHeadRoot
            ? {
                visible: Co.userData.pose.heroHeadRoot.visible,
                kind: "procedural_hero_head",
              }
            : null,
        },
        colliders: Z.length,
        mobileBlackRegionDetected: _,
        qualityTier: runtimeState.qualityTier,
        rendererProfile: U.__lm402RendererProfile ?? "unknown",
        assetState: { ...assetState },
      }),
        updateWormhole(0.016),
        __juniorRig?.update?.(performance.now() / 1000),
        __clothRig?.update?.(performance.now() / 1000),
        __conscLights?.update?.(performance.now() / 1000),
        __conscParticles?.update?.(performance.now() / 1000),
        __conscText?.update?.(performance.now() / 1000),
        // Tier 7：每幀計算太陽 NDC 位置（god rays + lens flare 用）
        __sunFar.copy(SUNSET_SUN_DIR).multiplyScalar(1000).add(q.position).project(q),
        __sunUv.set(__sunFar.x * 0.5 + 0.5, __sunFar.y * 0.5 + 0.5),
        (__postfx ? __postfx.render(performance.now() / 1000, __sunUv) : U.render(W, q)));
    },
    resize: qo,
    resolveMotion: function (t, o, a = 0.28) {
      let n = o.x,
        s = o.z,
        r = !1,
        i = null;
      const l = N + 0.26,
        c = O - 0.22,
        h = Y + 0.22,
        d = J - 0.22;
      ((n < l || n > c || s < h || s > d) && ((r = !0), (i = "boundary_wall")),
        (n = e.MathUtils.clamp(n, l, c)),
        (s = e.MathUtils.clamp(s, h, d)));
      for (let t = 0; t < 2; t += 1)
        (Z.forEach((t) => {
          const o = e.MathUtils.clamp(n, t.minX, t.maxX),
            l = e.MathUtils.clamp(s, t.minZ, t.maxZ),
            c = n - o,
            h = s - l,
            d = c * c + h * h;
          if (d >= a * a) return;
          if (((r = !0), (i = t.label), d > 1e-5)) {
            const e = Math.sqrt(d),
              t = a - e + 0.001;
            return ((n += (c / e) * t), void (s += (h / e) * t));
          }
          const p = Math.abs(n - t.minX),
            m = Math.abs(t.maxX - n),
            w = Math.abs(s - t.minZ),
            M = Math.abs(t.maxZ - s),
            f = Math.min(p, m, w, M);
          f === p
            ? (n = t.minX - a)
            : f === m
              ? (n = t.maxX + a)
              : (s = f === w ? t.minZ - a : t.maxZ + a);
        }),
          (n = e.MathUtils.clamp(n, l, c)),
          (s = e.MathUtils.clamp(s, h, d)));
      return { x: n, z: s, collided: r, label: i };
    },
    pickHotspot: function (e, t, o) {
      (_o(t), q.updateMatrixWorld());
      const s = q.getWorldDirection(a);
      let r = null;
      return (
        e.forEach((e) => {
          const t = L.get(e.id);
          if (!t || !e.visible) return;
          const a = q.position.distanceTo(t.position);
          if (a > e.radius) return;
          const i = n.copy(t.position).sub(q.position).normalize(),
            l = s.dot(i);
          if (l < 0.75) return;
          _.set(q.position, i);
          const c = _.intersectObjects(A, !1);
          if (c.length && c[0].distance < a - 0.16) return;
          const h = 2.12 * l - a;
          (!r || h > r.score || (e.id === o && h > r.score - 0.18)) &&
            (r = {
              id: e.id,
              score: h,
              distance: a,
              label: e.label,
              prompt: e.prompt,
            });
        }),
        r
      );
    },
    setRuntimeConfig: function (e = {}) {
      const t = resolveJuniorRuntimeManifest(
        e.characterAssets?.junior2005 ?? runtimeState.characterAssets?.junior2005 ?? {},
      );
      ((runtimeState.qualityTier = e.qualityTier ?? runtimeState.qualityTier),
        (runtimeState.qualityTiers =
          e.qualityTiers ?? runtimeState.qualityTiers),
        (runtimeState.characterAssets =
          e.characterAssets ?? runtimeState.characterAssets),
        (renderTuning = {
          shadowMapSize:
            runtimeState.qualityTiers?.[runtimeState.qualityTier]
              ?.shadowMapSize ?? renderTuning.shadowMapSize,
          maxPixelRatio:
            runtimeState.qualityTiers?.[runtimeState.qualityTier]
              ?.maxPixelRatio ?? renderTuning.maxPixelRatio,
          dustCount:
            runtimeState.qualityTiers?.[runtimeState.qualityTier]?.dustCount ??
            renderTuning.dustCount,
          mirrorOpacity:
            runtimeState.qualityTiers?.[runtimeState.qualityTier]
              ?.mirrorOpacity ?? renderTuning.mirrorOpacity,
          portraitBoost:
            runtimeState.qualityTiers?.[runtimeState.qualityTier]
              ?.portraitBoost ?? renderTuning.portraitBoost,
        }),
        (assetState.qualityTier = runtimeState.qualityTier),
        (assetState.runtimeModelUrl = t.runtimeModelUrl ?? null),
        (assetState.heroCloseupModelUrl = t.heroCloseupModelUrl ?? null),
        (assetState.loaderAvailable = Boolean(resolveJuniorGltfLoaderCtor())),
        !assetState.loaderAvailable &&
          (assetState.status = "procedural_fallback"),
        ht.material && (ht.material.opacity = renderTuning.mirrorOpacity),
        Co.userData.portraitShell?.scale.setScalar(renderTuning.portraitBoost),
        Co.userData.runtimeModelRoot?.scale.setScalar(renderTuning.portraitBoost),
        Co.userData.heroCloseupModelRoot?.scale.setScalar(
          renderTuning.portraitBoost,
        ),
        Te.shadow.mapSize.set(
          renderTuning.shadowMapSize,
          renderTuning.shadowMapSize,
        ),
        qo());
    },
    getDebugSnapshot: function () {
      return X;
    },
    spawnHologram: function (t, o) {
      (Xo &&
        (Xo.traverse((e) => {
          (e.geometry && e.geometry.dispose(),
            e.material &&
              (Array.isArray(e.material) ? e.material : [e.material]).forEach(
                (e) => {
                  (e.map && e.map.dispose(), e.dispose());
                },
              ));
        }),
        W.remove(Xo),
        (Xo = null)),
        "seat" === t || "notes" === t
          ? ((Xo = (function () {
              const t = new e.Group();
              t.userData.baseY = 0;
              const o = new e.MeshPhysicalMaterial({
                color: 16777215,
                metalness: 0.1,
                roughness: 0.2,
                transparent: !0,
                opacity: 0.85,
                blending: e.AdditiveBlending,
                emissive: 2250154,
                emissiveIntensity: 0.6,
                clearcoat: 1,
                side: e.DoubleSide,
              });
              o.onBeforeCompile = (e) => {
                ((e.fragmentShader = e.fragmentShader.replace(
                  "#include <dithering_fragment>",
                  "\n      #include <dithering_fragment>\n      float slice = sin(vWorldPosition.y * 120.0 - cameraPosition.y * 10.0) * 0.5 + 0.5;\n      slice = pow(slice, 8.0);\n      gl_FragColor.rgb += vec3(0.2, 0.5, 1.0) * slice * 0.8;\n      gl_FragColor.a *= (0.7 + slice * 0.3);\n      ",
                )),
                  (e.vertexShader =
                    "varying vec3 vWorldPosition;\n" + e.vertexShader),
                  (e.vertexShader = e.vertexShader.replace(
                    "#include <worldpos_vertex>",
                    "\n      #include <worldpos_vertex>\n      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;\n      ",
                  )));
              };
              const a = o.clone();
              (a.color.setHex(2232593), a.emissive.setHex(1122884));
              const n = o.clone();
              (n.color.setHex(16772064), n.emissive.setHex(3346705));
              const s = o.clone();
              (s.color.setHex(16777215), (s.opacity = 0.9));
              const r = o.clone();
              (r.color.setHex(2045005), (r.opacity = 0.95));
              const i = o.clone();
              i.color.setHex(15658734);
              const l = new e.Group();
              l.position.set(0, 1.54, 0);
              const c = new e.Mesh(new e.SphereGeometry(0.105, 32, 32), n);
              (c.scale.set(1, 1.15, 1.05), l.add(c));
              const h = new e.Mesh(new e.SphereGeometry(0.11, 32, 32), a);
              (h.scale.set(1.02, 1.1, 1.05),
                h.position.set(0, 0.02, -0.01),
                l.add(h));
              for (let t = 0; t < 8; t++) {
                const o = new e.Mesh(
                  new e.CapsuleGeometry(0.015, 0.06, 8, 8),
                  a,
                );
                (o.position.set(
                  0.02 * t - 0.07,
                  0.06 - 0.005 * Math.abs(t - 3.5),
                  0.1,
                ),
                  (o.rotation.z = 0.1 * (t - 3.5)),
                  (o.rotation.x = 0.2),
                  l.add(o));
              }
              const d = new e.Mesh(
                new e.CapsuleGeometry(0.035, 0.25, 16, 16),
                a,
              );
              (d.position.set(0, -0.05, -0.15), (d.rotation.x = 0.3));
              const p = new e.Mesh(new e.TorusGeometry(0.04, 0.015, 16, 32), r);
              (p.position.set(0, 0.05, -0.12),
                (p.rotation.x = 1.2),
                l.add(d, p),
                t.add(l),
                (t.userData.head = l));
              const m = new e.Group();
              m.position.set(0, 1.15, 0);
              const w = new e.Mesh(
                new e.CylinderGeometry(0.11, 0.1, 0.25, 32),
                s,
              );
              (w.position.set(0, 0.15, 0), w.scale.set(1, 1, 0.7), m.add(w));
              const M = new e.Mesh(
                new e.CylinderGeometry(0.1, 0.12, 0.2, 32),
                s,
              );
              (M.position.set(0, -0.05, 0), M.scale.set(1, 1, 0.75), m.add(M));
              const f = new e.Mesh(
                new e.TorusGeometry(0.065, 0.015, 16, 32),
                s,
              );
              (f.position.set(0, 0.27, 0.02),
                (f.rotation.x = 1.3),
                m.add(f),
                t.add(m));
              const u = new e.Group();
              u.position.set(0, 0.95, 0);
              const y = new e.Mesh(
                new e.CylinderGeometry(0.125, 0.135, 0.18, 32),
                r,
              );
              function g(t, o, a, n) {
                const s = new e.Mesh(new e.CylinderGeometry(t, o, a, 32), n);
                s.position.y = -a / 2;
                const r = new e.Group();
                return (r.add(s), { pivot: r, mesh: s });
              }
              (y.scale.set(1, 1, 0.8), u.add(y), t.add(u));
              const x = g(0.035, 0.025, 0.25, s);
              (x.pivot.position.set(-0.15, 1.35, 0),
                (x.pivot.rotation.z = 0.2));
              const b = g(0.025, 0.02, 0.22, n);
              (b.pivot.position.set(0, -0.25, 0),
                (b.pivot.rotation.x = -0.1),
                x.mesh.add(b.pivot),
                t.add(x.pivot),
                (t.userData.armL = x.pivot));
              const S = g(0.035, 0.025, 0.25, s);
              (S.pivot.position.set(0.15, 1.35, 0),
                (S.pivot.rotation.z = -0.2));
              const z = g(0.025, 0.02, 0.22, n);
              (z.pivot.position.set(0, -0.25, 0),
                (z.pivot.rotation.x = -0.1),
                S.mesh.add(z.pivot),
                t.add(S.pivot),
                (t.userData.armR = S.pivot));
              const P = g(0.06, 0.045, 0.45, n);
              P.pivot.position.set(-0.06, 0.85, 0);
              const v = g(0.04, 0.03, 0.4, n);
              (v.pivot.position.set(0, -0.45, 0), P.mesh.add(v.pivot));
              const G = new e.Mesh(new e.BoxGeometry(0.06, 0.05, 0.11), i);
              (G.position.set(0, -0.4, 0.02),
                v.mesh.add(G),
                t.add(P.pivot),
                (t.userData.legL = P.pivot));
              const C = g(0.06, 0.045, 0.45, n);
              C.pivot.position.set(0.06, 0.85, 0);
              const B = g(0.04, 0.03, 0.4, n);
              (B.pivot.position.set(0, -0.45, 0), C.mesh.add(B.pivot));
              const k = new e.Mesh(new e.BoxGeometry(0.06, 0.05, 0.11), i);
              return (
                k.position.set(0, -0.4, 0.02),
                B.mesh.add(k),
                t.add(C.pivot),
                (t.userData.legR = C.pivot),
                t
              );
            })()),
            "seat" === t
              ? (Xo.position.set(23.7, 0, 25.72),
                (Xo.rotation.y = 0.03),
                v(Xo, 0, 1))
              : "notes" === t &&
                (Xo.position.set(23.7, 0, 25.72),
                (Xo.rotation.y = -Math.PI / 2),
                v(Xo, 0, 1)))
          : "board" === t &&
            ((Xo = createSilhouette({
              phone: !0,
              hairColor: "#11100f",
              shirtColor: "#323846",
              pantsColor: "#1d222a",
              shoesColor: "#383634",
              echo: !0,
              echoOpacity: 0.8,
              echoColor: "#88ccff",
              scale: 1.05,
            })),
            Xo.position.set(-4.2, 0, 28.65),
            (Xo.rotation.y = Math.PI / 2),
            v(Xo, 0, 1)),
        Xo && (W.add(Xo), (jo = o)));
    },
    worldBounds: {
      minX: N + 0.26,
      maxX: O - 0.22,
      minZ: Y + 0.22,
      maxZ: J - 0.22,
    },
  };
}
