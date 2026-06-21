/* ──────────────────────────────────────────────────────────────────────────
   Blender 寫實道具載入器(天堂路)
   - decoder-free GLB → 用 plain GLTFLoader,不需 DRACOLoader
   - 非阻塞:dynamic import + 逐一鏈式載入,任何失敗只 console.warn,不影響場景
   - raycast 關閉:道具是裝飾,不擋射擊/互動/碰撞
   - 預設開;window.__SCENE_PROPS__.show(false) 可隱藏,.list() 看已載入
   ────────────────────────────────────────────────────────────────────────── */
import { GLTFLoader } from "../../_vendor/GLTFLoader.js";

export function loadSceneProps(THREE, parent, opts) {
  const base = (opts && opts.base) || "./props/";
  const items = (opts && opts.items) || [];
  const loaded = [];
  let loader;
  try { loader = new GLTFLoader(); }
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
        c.raycast = () => {};                       // 裝飾:不擋射擊/互動/碰撞
        if (c.material) c.material.envMapIntensity = 1.0;
      }
    });
    group.add(o);
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
