/* ──────────────────────────────────────────────────────────────────────────
   Blender 寫實道具載入器(月台上的狂奔)
   - decoder-free GLB → plain GLTFLoader,不需 DRACOLoader
   - 非阻塞 dynamic import;失敗只 warn,不影響場景
   - 可選 replace:隱藏同名程序物件,用 GLB 取代(非破壞,只切 visible)
   - 預設開;window.__SCENE_PROPS__.show(false) 可隱藏
   ────────────────────────────────────────────────────────────────────────── */
import { GLTFLoader } from "../_vendor/GLTFLoader.js";

export function loadSceneProps(THREE, scene, parent, opts) {
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

  const cache = {};                                 // 同檔只抓一次,重複的用 clone
  function place(template, it) {
    const o = template.clone(true);
    o.position.set(it.pos[0], it.pos[1], it.pos[2]);
    if (typeof it.rot === "number") o.rotation.y = it.rot;
    o.scale.setScalar(it.scale || 1);
    o.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.raycast = () => {};
        if (c.material) { const ms = Array.isArray(c.material) ? c.material : [c.material]; for (const m of ms) if (m) m.envMapIntensity = 1.0; }   // 多材質 GLB:c.material 可能是陣列,要逐一寫(否則反射全失=扁平)
      }
    });
    group.add(o);
    loaded.push(o);
  }
  let i = 0;
  function next() {
    if (i >= items.length) return;
    const it = items[i++];
    // optional: hide a procedural object this GLB replaces (non-destructive)
    if (it.replace && scene) {
      try { const old = scene.getObjectByName(it.replace); if (old) old.visible = false; } catch (e) {}
    }
    if (cache[it.file]) { try { place(cache[it.file], it); } catch (e) { console.warn("[props] place failed", it.file, e && e.message); } next(); return; }
    loader.load(
      base + it.file + ".glb",
      (gltf) => {
        try { cache[it.file] = gltf.scene; place(gltf.scene, it); }
        catch (e) { console.warn("[props] place failed", it.file, e && e.message); }
        next();
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
