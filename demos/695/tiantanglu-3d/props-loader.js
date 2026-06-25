/* ──────────────────────────────────────────────────────────────────────────
   Blender 寫實道具載入器(天堂路)
   - Draco 壓縮 GLB → GLTFLoader + DRACOLoader(decoder 共用 assets/lm402/draco/)
   - 非阻塞:dynamic import + 逐一鏈式載入,任何失敗只 console.warn,不影響場景
   - raycast 關閉:道具是裝飾,不擋射擊/互動/碰撞
   - 預設開;window.__SCENE_PROPS__.show(false) 可隱藏,.list() 看已載入
   ────────────────────────────────────────────────────────────────────────── */
import { GLTFLoader } from "../../_vendor/GLTFLoader.js";
import { DRACOLoader } from "../../_vendor/DRACOLoader.js";

export function loadSceneProps(THREE, parent, opts) {
  const base = (opts && opts.base) || "./props/";
  const items = (opts && opts.items) || [];
  const loaded = [];
  let loader;
  try {
    loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath(new URL("../../../assets/lm402/draco/", import.meta.url).href);
    loader.setDRACOLoader(draco);
  }
  catch (e) { console.warn("[props] GLTFLoader init failed:", e && e.message); return { loaded }; }

  const group = new THREE.Group();
  group.name = "blenderProps";
  group.visible = !opts || opts.visible !== false;
  try { parent.add(group); } catch (e) { console.warn("[props] parent.add failed:", e && e.message); return { loaded }; }

  const cache = {};                                 // 同檔只抓一次,重複的用 clone(咾咕石×4 只抓 1 次)
  function place(template, it) {
    const o = template.clone(true);
    o.position.set(it.pos[0], it.pos[1], it.pos[2]);
    if (typeof it.rot === "number") o.rotation.y = it.rot;
    o.scale.setScalar(it.scale || 1);
    o.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        // 不再關 raycast:道具是實體,子彈/視線該被擋(寫實掩體)
        if (c.material) { const ms = Array.isArray(c.material) ? c.material : [c.material]; for (const m of ms) if (m) m.envMapIntensity = 1.0; }   // 多材質 GLB:c.material 可能是陣列,要逐一寫(否則反射全失=扁平)
      }
    });
    group.add(o);
    try {
      o.updateWorldMatrix(true, true);
      // 手動算世界 AABB(逐 mesh 取 geometry.boundingBox 8 角過 matrixWorld;比 setFromObject 穩)
      let minY = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      o.traverse((c) => {
        if (c.isMesh && c.geometry) {
          let bb = c.geometry.boundingBox;
          if (!bb || !bb.min) { try { c.geometry.computeBoundingBox(); } catch (e) {} bb = c.geometry.boundingBox; }   // GLTFLoader 有時設了 truthy 但壞掉的 boundingBox(無 .min)→ 強制重算
          if (!bb || !bb.min) return;
          const m = c.matrixWorld.elements;
          for (const X of [bb.min.x, bb.max.x]) for (const Y of [bb.min.y, bb.max.y]) for (const Z of [bb.min.z, bb.max.z]) {
            const w = m[3]*X + m[7]*Y + m[11]*Z + m[15] || 1;
            const wx = (m[0]*X + m[4]*Y + m[8]*Z + m[12]) / w;
            const wy = (m[1]*X + m[5]*Y + m[9]*Z + m[13]) / w;
            const wz = (m[2]*X + m[6]*Y + m[10]*Z + m[14]) / w;
            if (wy < minY) minY = wy; if (wx < minX) minX = wx; if (wx > maxX) maxX = wx; if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
          }
        }
      });
      // 自動托起:最低點沉到地面(groundY,預設 0)以下就上移貼地 → 修「物件沉在地板裡」
      if (isFinite(minY)) {
        const sink = minY - (it.groundY || 0);
        if (sink < -0.01) { o.position.y -= sink; }
        // 註冊碰撞 AABB(walkable=地面路徑不擋)→ 玩家/敵人不可穿越(point 2)
        if (!it.walkable && typeof opts.onPlaced === "function") { try { opts.onPlaced({ minX, maxX, minZ, maxZ }, it); } catch (e) { console.warn("[props] onPlaced failed", it.file, e && e.message); } }
      }
    } catch (e) { console.warn("[props] bbox/collider failed", it.file, e && e.message); }
    loaded.push(o);
  }
  let i = 0;
  function next() {
    if (i >= items.length) return;
    const it = items[i++];
    if (cache[it.file]) { try { place(cache[it.file], it); } catch (e) { console.warn("[props] place failed", it.file, e && e.message); } next(); return; }
    loader.load(
      base + it.file + ".glb",
      (gltf) => {
        try { cache[it.file] = gltf.scene; place(gltf.scene, it); }
        catch (e) { console.warn("[props] place failed", it.file, e && e.message); }
        next();                                     // 鏈式:一個載完才載下一個(溫和不爆量)
      },
      undefined,
      (err) => { console.warn("[props] load failed", it.file, err && err.message); next(); }
    );
  }
  next();

  if (typeof window !== "undefined") {
    window.__SCENE_PROPS__ = {
      group,
      show: (v) => { group.visible = v !== false; },
      list: () => loaded.map((o) => o.name || "(prop)"),
      count: () => loaded.length,
    };
  }
  return { group, loaded };
}
