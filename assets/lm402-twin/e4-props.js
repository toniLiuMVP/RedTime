/**
 * e4-props.js — 場景變換 prop mesh(simplified 版)
 *
 * LM402 雙時空專用 — 教室場景固定,「窗外」prop 配合 environment-presets 切換。
 *   night → 月亮顯示
 *   rainy → 雨粒子 + 灰雲
 *   dusk/day → 暖雲
 *   snowy → 雪粒子 + 灰雲
 *
 * 整合方式(跟 environment-presets 鉤):
 *   1. import { createE4Props } from "./e4-props.js";
 *   2. const e4 = createE4Props({ scene, currentPreset: env.getCurrentPreset() });
 *   3. environment-presets.js setPreset() 結尾呼叫 e4.syncToPreset(name)
 *   4. window.__E4_PROPS__ = e4;  (console API)
 *
 * 預設行為:所有 prop 預設 visible=false(避免疊加過曝)。
 * 動畫:每 frame 呼叫 e4.update(delta) 讓雨/雪粒子持續落下。
 *
 * NOT YET WIRED to lm402-twin/renderer.js — 獨立檔避免 break runtime。
 */

import * as THREE from "./vendor-three.module.js";

export function createE4Props({ scene, currentPreset = "dusk" }) {
  if (!scene) throw new Error("[e4-props] scene is required");

  const props = {
    moon:    createMoon(),         // night
    rain:    createRain(),          // rainy
    snow:    createSnow(),          // snowy
    cloudA:  createCloud("warm"),   // dusk / day
    cloudB:  createCloud("gray"),   // rainy / snowy
  };

  // 加進 scene + 預設隱藏
  Object.values(props).forEach(p => {
    p.visible = false;
    scene.add(p);
  });

  /**
   * 跟 E3 environment-presets 鉤的 sync 函數
   * @param {'dusk'|'night'|'rainy'|'snowy'|'day'} preset
   */
  function syncToPreset(preset) {
    // 全部隱藏
    Object.values(props).forEach(p => p.visible = false);

    // 按 preset 顯示
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

  // 初始 sync
  syncToPreset(currentPreset);

  /**
   * 主迴圈呼叫 — 雨雪粒子下落動畫
   * @param {number} delta - 距上次 frame 秒數
   */
  function update(delta) {
    // 雨粒子下落(快)
    if (props.rain.visible) {
      const positions = props.rain.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 5.0 * delta;  // y 方向 -5 m/s
        if (positions[i] < -2) positions[i] = 18;  // 落到地面 reset 到天空
      }
      props.rain.geometry.attributes.position.needsUpdate = true;
    }

    // 雪粒子下落(慢)+ 微搖晃
    if (props.snow.visible) {
      const positions = props.snow.geometry.attributes.position.array;
      const time = performance.now() * 0.001;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 0.6 * delta;  // y -0.6 m/s
        positions[i] += Math.sin(time + i) * 0.001;  // x 微搖晃
        if (positions[i + 1] < -2) {
          positions[i + 1] = 16;
          positions[i] = (Math.random() - 0.5) * 30;
        }
      }
      props.snow.geometry.attributes.position.needsUpdate = true;
    }

    // 雲微飄(可選 — 暫不做避免複雜)
  }

  function dispose() {
    Object.values(props).forEach(p => {
      p.geometry?.dispose();
      p.material?.dispose();
      scene.remove(p);
    });
  }

  return {
    syncToPreset,
    setVisibility: (name, visible) => {
      if (props[name]) props[name].visible = visible;
    },
    update,
    dispose,
    // debug
    _props: props,
  };
}

// — Moon:emissive sphere 月光藍 —
// 對齊 environment-presets night.lightColor —
function createMoon() {
  const geo = new THREE.SphereGeometry(1.5, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfafdff,
    emissive: 0x9cb8e0,    // 對齊 environment-presets night.lightColor
    emissiveIntensity: 0.7,
    roughness: 0.85,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(8, 12, -25);   // 教室窗外右上
  mesh.name = "e4-moon";
  return mesh;
}

// — Rain particles:Points + 慢落 —
function createRain() {
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = Math.random() * 18;
    positions[i * 3 + 2] = -10 - Math.random() * 15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xa0b0c0,
    size: 0.05,
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
    positions[i * 3]     = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = Math.random() * 16;
    positions[i * 3 + 2] = -10 - Math.random() * 15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xfafcff,
    size: 0.08,
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
  mesh.position.set(0, 16, -28);
  mesh.rotation.x = -Math.PI / 12;
  mesh.name = `e4-cloud-${tone}`;
  return mesh;
}
