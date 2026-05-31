// junior-head-hd.js — 平行世界 A(Three.js)· 學妹「連續雕刻 mesh 頭」實驗
// 2026-05-31 r67 toni 選項1(高細節程序學妹)的唯一真 headroom:
//   把臉從「primitive 拼裝」(N 個 sphere/capsule 相交,硬接縫)升級成「連續雕刻」
//   (單一 IcosahedronGeometry + 頂點高斯位移場,五官是同一張皮上長出來的,過渡連續)。
//
// 紀律:可逆 + 零回歸。預設「不」動現有 primitive 臉;toni 從 console opt-in 比較:
//   __JUNIOR_HEAD_HD__.show()   → 隱藏 primitive hero head 的子件,顯示連續雕刻頭(同位置/比例)
//   __JUNIOR_HEAD_HD__.hide()   → 還原 primitive 版
//   __JUNIOR_HEAD_HD__.tune(feature, amp)  → 調單一特徵位移量(真機雕)
//   __JUNIOR_HEAD_HD__.setStrength(k)       → 整體位移強度(0=光滑蛋形,1=預設)
//   __JUNIOR_HEAD_HD__.rebuild()            → 套用新參數重建
//
// 座標系:全部在「hero head group」local space(該 group 有 scale 0.62 + y1.55),
//   錨點貼合 buildReferenceJuniorHeroHead 既有比例(眼 x±0.041/z0.082、鼻尖 -0.048/0.088、
//   唇 -0.09、下巴 -0.108、顴骨 x±0.054)。頭橢球:radius 0.114 × scale(0.72,0.92,0.68) @ (0,-0.004,-0.01)。
//
// headless 無 GPU 驗不了「好不好看」(交 toni 真機),此檔綠燈 = 載入無 error + 幾何正確生成。

import * as THREE from "./vendor-three.module.js";
import { createSkinMaterialHR } from "./junior-materials-hr.js";

// 頭橢球參數(對齊 primitive head sphere `w`)
const HEAD = { radius: 0.114, scale: [0.72, 0.92, 0.68], offset: [0, -0.004, -0.01], detail: 7 };  // detail 7≈3840 verts(closeup silhouette 夠圓;toni 可 setDetail() 再調)
const HEAD_CENTER = new THREE.Vector3(HEAD.offset[0], HEAD.offset[1], HEAD.offset[2]);

// 特徵位移場(group-space 座標)。amp 正=外凸 / 負=內凹;sigma=影響半徑;dir=位移方向。
// dir: "z"=向前(0,0,1) / "normal"=橢球外法線(徑向) / 或自訂 [x,y,z]。
// 數值是「貼合比例的初版盲設」,toni 真機 tune。對稱特徵 L/R 成對。
function defaultFeatures() {
  return [
    // 眼窩內凹(一眼瞬間焦點 — 眼神要有深度;加深讓眼眶讀得出來)
    { k: "eyeSocketL", pos: [-0.040, -0.002, 0.072], sigma: 0.024, amp: -0.026, dir: "z" },
    { k: "eyeSocketR", pos: [0.040, -0.002, 0.072], sigma: 0.024, amp: -0.026, dir: "z" },
    // 眼球微凸(眼窩內的眼球弧度)
    { k: "eyeBallL", pos: [-0.040, -0.004, 0.066], sigma: 0.014, amp: 0.010, dir: "z" },
    { k: "eyeBallR", pos: [0.040, -0.004, 0.066], sigma: 0.014, amp: 0.010, dir: "z" },
    // 眉骨脊(eye socket 上緣的骨脊,臉立體關鍵)+ 眉間
    { k: "browL", pos: [-0.036, 0.020, 0.078], sigma: 0.020, amp: 0.013, dir: "z" },
    { k: "browR", pos: [0.036, 0.020, 0.078], sigma: 0.020, amp: 0.013, dir: "z" },
    { k: "glabella", pos: [0, 0.010, 0.082], sigma: 0.016, amp: 0.008, dir: "z" },
    // 鼻樑 → 鼻尖(連續隆起,大幅加強讓鼻子立體)
    { k: "noseBridge", pos: [0, -0.014, 0.090], sigma: 0.014, amp: 0.030, dir: "z" },
    { k: "noseTip", pos: [0, -0.048, 0.100], sigma: 0.012, amp: 0.048, dir: "z" },
    { k: "noseWingL", pos: [-0.014, -0.052, 0.090], sigma: 0.010, amp: 0.016, dir: "z" },
    { k: "noseWingR", pos: [0.014, -0.052, 0.090], sigma: 0.010, amp: 0.016, dir: "z" },
    // 顴骨外擴(側光立體感)
    { k: "cheekL", pos: [-0.050, -0.020, 0.062], sigma: 0.028, amp: 0.013, dir: "normal" },
    { k: "cheekR", pos: [0.050, -0.020, 0.062], sigma: 0.028, amp: 0.013, dir: "normal" },
    // 眼下到鼻翼的凹(淚溝/法令過渡,讓中臉有結構)
    { k: "underEyeL", pos: [-0.030, -0.034, 0.082], sigma: 0.016, amp: -0.008, dir: "z" },
    { k: "underEyeR", pos: [0.030, -0.034, 0.082], sigma: 0.016, amp: -0.008, dir: "z" },
    // 唇部飽滿 + 唇縫內凹
    { k: "upperLip", pos: [0, -0.084, 0.096], sigma: 0.011, amp: 0.013, dir: "z" },
    { k: "lowerLip", pos: [0, -0.100, 0.094], sigma: 0.012, amp: 0.016, dir: "z" },
    { k: "mouthSeam", pos: [0, -0.092, 0.099], sigma: 0.006, amp: -0.009, dir: "z" },
    // 下巴前突(圓潤有定義,非尖)
    { k: "chin", pos: [0, -0.116, 0.052], sigma: 0.020, amp: 0.018, dir: [0, -0.3, 1] },
    // 下顎收窄(瓜子臉)+ 太陽穴微凹
    { k: "jawL", pos: [-0.064, -0.074, 0.022], sigma: 0.028, amp: -0.015, dir: "normal" },
    { k: "jawR", pos: [0.064, -0.074, 0.022], sigma: 0.028, amp: -0.015, dir: "normal" },
    { k: "templeL", pos: [-0.072, 0.030, 0.028], sigma: 0.024, amp: -0.009, dir: "normal" },
    { k: "templeR", pos: [0.072, 0.030, 0.028], sigma: 0.024, amp: -0.009, dir: "normal" },
    // 人中淺溝
    { k: "philtrum", pos: [0, -0.074, 0.096], sigma: 0.006, amp: -0.005, dir: "z" },
  ];
}

let _features = defaultFeatures();
let _strength = 1.0;
let _opts = { detail: HEAD.detail };   // F3:持久化 build options(含 detail override),rebuild 沿用

function dirVec(dir, vertex) {
  if (dir === "z") return new THREE.Vector3(0, 0, 1);
  if (dir === "normal") return vertex.clone().sub(HEAD_CENTER).normalize();
  if (Array.isArray(dir)) return new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  return new THREE.Vector3(0, 0, 1);
}

// 焊接重複頂點:IcosahedronGeometry 是 non-indexed(每三角獨立頂點)→ computeVertexNormals 只得面法線=平面著色。
// 量化位置去重 → indexed(共享頂點)→ 算出的是平滑頂點法線 → 消 faceting。
function weldGeometry(geo) {
  const pos = geo.attributes.position, map = new Map(), out = [], idx = [], P = 1e4;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const key = Math.round(x * P) + "_" + Math.round(y * P) + "_" + Math.round(z * P);
    let j = map.get(key);
    if (j === undefined) { j = out.length / 3; map.set(key, j); out.push(x, y, z); }
    idx.push(j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  g.setIndex(idx);
  return g;
}

// 建連續雕刻頭(geometry 已在 group-space,可直接 add 進 hero head group)
export function buildContinuousHead(opts = {}) {
  const skinColor = opts.skinColor || "#f9e7da";
  let geo = new THREE.IcosahedronGeometry(HEAD.radius, opts.detail ?? HEAD.detail);
  geo.scale(HEAD.scale[0], HEAD.scale[1], HEAD.scale[2]);          // 橢球
  geo.translate(HEAD.offset[0], HEAD.offset[1], HEAD.offset[2]);    // 移到 group-space 頭位置
  geo = weldGeometry(geo);   // 焊接 → indexed → 下面 computeVertexNormals 得平滑著色(消 faceting)

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const feats = _features.map((f) => ({
    p: new THREE.Vector3(f.pos[0], f.pos[1], f.pos[2]),
    twoSigma2: 2 * f.sigma * f.sigma,
    amp: f.amp,
    dir: f.dir,
  }));
  const disp = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    disp.set(0, 0, 0);
    for (let j = 0; j < feats.length; j++) {
      const f = feats[j];
      const d2 = v.distanceToSquared(f.p);
      const g = Math.exp(-d2 / f.twoSigma2);       // 高斯衰減
      if (g < 0.0015) continue;                     // 影響太小跳過(省算)
      const dv = dirVec(f.dir, v).multiplyScalar(f.amp * g * _strength);
      disp.add(dv);
    }
    v.add(disp);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();                       // 位移後重算法線 → 正確光照

  const mat = createSkinMaterialHR(skinColor);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = "junior-continuous-head-hd";
  mesh.userData.kind = "continuous_head_hd";
  return mesh;
}

// 預覽頁用的純 state setter(只改模組 state,呼叫端自己 rebuild,不觸發 hero head 查找/warn)
export function setFeatureAmp(k, amp) { const f = _features.find((x) => x.k === k); if (f) f.amp = amp; return !!f; }
export function setSculptStrength(s) { _strength = s; }
export function listFeatureKeys() { return _features.map((x) => x.k); }

// ── console toggle:在 hero head group 內,連續頭 ↔ primitive 子件 切換比較 ──
function findHeroHead() {
  if (typeof window === "undefined") return null;
  // 主路徑:renderer.js 在 hero head builder 直接曝露的 ref(最可靠)
  if (window.__JUNIOR_HERO_HEAD__ && window.__JUNIOR_HERO_HEAD__.children) return window.__JUNIOR_HERO_HEAD__;
  // fallback:從 __CO__ 學妹 group traverse(若 debug 模式有曝露)
  const co = window.__CO__;
  if (co && co.traverse) {
    let hero = null;
    co.traverse((o) => { if (o.userData && o.userData.kind === "procedural_hero_head") hero = o; });
    return hero;
  }
  return null;
}

let _hdMesh = null;
let _hiddenList = null;   // [{mesh, prevVisible}] 記錄被隱藏的 primitive 子件,供 hide() 還原
let _prevHeroVisible = null;   // 記錄 hero head group 原 visible(pose 預設可能隱藏),供 hide() 還原

function install() {
  if (typeof window === "undefined") return;
  window.__JUNIOR_HEAD_HD__ = {
    get features() { return _features; },
    show(opts = {}) {
      const hero = findHeroHead();
      if (!hero) { console.warn("[junior-head-hd] 找不到 hero head（請先進一眼瞬間 closeup 模式，或確認已建）"); return false; }
      if (opts && Object.keys(opts).length) _opts = Object.assign(_opts, opts);
      // F2 guard(Codex 抓):已 shown 就 no-op,避免重複 show() 污染 _hiddenList → 否則 hide() 無法還原 primitive 臉
      if (_hiddenList) { console.info("[junior-head-hd] 已在連續頭模式(no-op);要重建請先 hide()"); return true; }
      if (!_hdMesh) _hdMesh = buildContinuousHead(_opts);
      // 隱藏 primitive 子件(記錄原 visible)
      _hiddenList = [];
      hero.children.forEach((c) => {
        if (c === _hdMesh) return;
        _hiddenList.push({ mesh: c, prevVisible: c.visible });
        c.visible = false;
      });
      if (_hdMesh.parent !== hero) hero.add(_hdMesh);
      _hdMesh.visible = true;
      _prevHeroVisible = hero.visible;
      hero.visible = true;   // 強制 hero head group 可見(pose 預設可能隱藏 → 否則連續頭父級隱藏＝不 render)
      console.info("[junior-head-hd] ✅ 連續雕刻頭 ON(primitive 子件已暫隱)· hide() 還原 · tune(k,amp) 調");
      return true;
    },
    hide() {
      if (_hdMesh) _hdMesh.visible = false;
      if (_hiddenList) { _hiddenList.forEach(({ mesh, prevVisible }) => (mesh.visible = prevVisible)); _hiddenList = null; }
      const hero = findHeroHead();
      if (hero && _prevHeroVisible !== null) { hero.visible = _prevHeroVisible; _prevHeroVisible = null; }
      console.info("[junior-head-hd] 連續頭 OFF,primitive 版還原");
    },
    tune(k, amp) {
      const f = _features.find((x) => x.k === k);
      if (!f) { console.warn("[junior-head-hd] 無此特徵:", k, "· 可用:", _features.map((x) => x.k).join(",")); return; }
      f.amp = amp; this.rebuild();
    },
    setStrength(s) { _strength = s; this.rebuild(); },
    setDetail(d) { _opts.detail = d; this.rebuild(); },   // F4:closeup 怕 faceted 時調高頂點密度
    rebuild() {
      const hero = findHeroHead();
      const wasShown = _hdMesh && _hdMesh.visible;
      if (_hdMesh && _hdMesh.parent) _hdMesh.parent.remove(_hdMesh);
      if (_hdMesh) {
        _hdMesh.geometry.dispose();
        if (_hdMesh.material && _hdMesh.material.dispose) _hdMesh.material.dispose();  // F1(Codex):dispose 舊材質,避免反覆 tune 累積 material/program
        _hdMesh = null;
      }
      _hdMesh = buildContinuousHead(_opts);   // F3:沿用 _opts(含 detail override)
      if (hero && wasShown) { hero.add(_hdMesh); _hdMesh.visible = true; }
      console.info("[junior-head-hd] rebuilt · strength=" + _strength + " · detail=" + (_opts.detail ?? HEAD.detail));
    },
  };
  console.info("[junior-head-hd] ready · __JUNIOR_HEAD_HD__.show() 開連續雕刻頭實驗（預設關，零回歸）");
}

install();
