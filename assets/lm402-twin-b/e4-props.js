/**
 * e4-props.js — 場景變換 prop mesh(simplified 版 v2)
 *
 * LM402 雙時空專用 — 教室場景固定,「窗外」prop 配合 environment-presets 切換。
 *   night → 月亮顯示
 *   rainy → 雨粒子 + 灰雲
 *   dusk/day → 暖雲
 *   snowy → 雪粒子 + 灰雲
 *
 * 整合方式(跟 environment-presets 鉤):
 *   1. import { createE4Props } from "./e4-props.js";
 *   2. const e4 = createE4Props({
 *        scene,
 *        currentPreset: env.getCurrentPreset(),
 *        worldAnchor: { x: 30, y: 0, z: 20.5 },  // 教室右牆外、中段窗戶位置
 *      });
 *   3. environment-presets.js setPreset() 結尾呼叫 e4.syncToPreset(name)
 *   4. window.__E4_PROPS__ = e4;  (console API)
 *
 * 預設行為:所有 prop 預設 visible=false(避免疊加過曝)。
 * 動畫:每 frame 呼叫 e4.update(delta) 讓雨/雪粒子持續落下。
 *
 * v2 變更(2026-05-05 round-10 toni 抓 e4 prop 看不到 bug):
 *   - 加 worldAnchor 參數 — 對齊雙時空教室實際 world coordinate
 *   - prop 內部 position 改成「相對 anchor 的合理 offset」(原本寫死 small-scale 假設教室在 z=0 附近)
 *   - 用 propGroup 統一管理 anchor offset(scene.add(propGroup),group.add(prop))
 */

import * as THREE from "./vendor-three.module.js";

export function createE4Props({
  scene,
  currentPreset = "dusk",
  worldAnchor = { x: 0, y: 0, z: 0 },
}) {
  if (!scene) throw new Error("[e4-props] scene is required");

  // 統一 anchor offset 用 group 管理
  const propGroup = new THREE.Group();
  propGroup.name = "e4-props-group";
  propGroup.position.set(worldAnchor.x, worldAnchor.y, worldAnchor.z);
  scene.add(propGroup);

  const props = {
    moon:    createMoon(),         // night
    rain:    createRain(),          // rainy
    snow:    createSnow(),          // snowy
    cloudA:  createCloud("warm"),   // dusk / day
    cloudB:  createCloud("gray"),   // rainy / snowy
  };

  // 加進 group(而非 scene)+ 預設隱藏
  Object.values(props).forEach(p => {
    p.visible = false;
    propGroup.add(p);
  });

  /**
   * 跟 E3 environment-presets 鉤的 sync 函數
   * @param {'dusk'|'night'|'rainy'|'snowy'|'day'} preset
   */
  function syncToPreset(preset) {
    Object.values(props).forEach(p => p.visible = false);

    switch (preset) {
      case "night":
        props.moon.visible = true;
        break;
      case "rainy":
        props.rain.visible = true;
        props.cloudB.visible = true;
        break;
      case "snowy":
        props.snow.visible = true;
        props.cloudB.visible = true;
        break;
      case "dusk":
      case "day":
        props.cloudA.visible = true;
        break;
      default:
        console.warn(`[e4-props] unknown preset: ${preset}`);
    }

    console.info(
      "%c[e4-props] sync to preset:" + preset,
      "color:#a8c5ff;font-weight:bold;",
      "\n  visible:",
      Object.entries(props).filter(([_, p]) => p.visible).map(([k]) => k).join(", ") || "(none)"
    );
  }

  syncToPreset(currentPreset);

  /**
   * 主迴圈呼叫 — 雨雪粒子下落動畫
   * @param {number} delta - 距上次 frame 秒數
   */
  function update(delta) {
    if (props.rain.visible) {
      const positions = props.rain.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 5.0 * delta;
        if (positions[i] < 0) positions[i] = 18;
      }
      props.rain.geometry.attributes.position.needsUpdate = true;
    }

    if (props.snow.visible) {
      const positions = props.snow.geometry.attributes.position.array;
      const time = performance.now() * 0.001;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.6 * delta;
        positions[i] += Math.sin(time + i) * 0.001;
        if (positions[i + 1] < 0) {
          positions[i + 1] = 16;
          positions[i] = (Math.random() - 0.5) * 20;
        }
      }
      props.snow.geometry.attributes.position.needsUpdate = true;
    }
  }

  function dispose() {
    Object.values(props).forEach(p => {
      p.geometry?.dispose();
      p.material?.dispose();
    });
    scene.remove(propGroup);
  }

  function setAnchor(x, y, z) {
    propGroup.position.set(x, y, z);
  }

  return {
    syncToPreset,
    setVisibility: (name, visible) => {
      if (props[name]) props[name].visible = visible;
    },
    setAnchor,        // debug:console 動態調 anchor 試位置
    update,
    dispose,
    _props: props,
    _group: propGroup,
  };
}

// ─── prop factory 函數 ───
// 全部 position 改成「相對 anchor 的小 offset」(以 anchor 為原點 0,0,0)
// anchor 由 createE4Props worldAnchor 參數決定 world 真實位置

// — Moon:emissive sphere 月光藍 —
function createMoon() {
  const geo = new THREE.SphereGeometry(1.5, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfafdff,
    emissive: 0x9cb8e0,
    emissiveIntensity: 0.7,
    roughness: 0.85,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 14, 0);   // anchor 正上方 14 m(夜空中央)
  mesh.name = "e4-moon";
  return mesh;
}

// — Rain particles:Points + 慢落 —
function createRain() {
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;    // ±10:籠罩 anchor 周圍
    positions[i * 3 + 1] = Math.random() * 18;            // 0..18:從地面到雲層
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;    // ±10
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xa0b0c0,
    size: 0.08,         // 0.05 → 0.08 略大,雙時空尺度看得清楚
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.name = "e4-rain";
  return points;
}

// — Snow particles:Points + 更慢落 + 搖晃 —
function createSnow() {
  const count = 150;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = Math.random() * 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfafcff,
    size: 0.12,         // 0.08 → 0.12 雪片大些
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.name = "e4-snow";
  return points;
}

// — Cloud:plane + alpha + 暖/灰兩色 —
function createCloud(tone /* 'warm' | 'gray' */) {
  const geo = new THREE.PlaneGeometry(40, 8, 1, 1);
  const color = tone === "warm" ? 0xffe8c8 : 0x9098a0;
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 18, 0);   // anchor 正上方 18 m(雲層)
  mesh.rotation.x = -Math.PI / 12;
  mesh.name = `e4-cloud-${tone}`;
  return mesh;
}
