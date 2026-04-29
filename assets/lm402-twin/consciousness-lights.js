/**
 * consciousness-lights.js — 意識菜市場 · 光柱派（雙時空 B3）
 *
 * 「教室裡不同年紀的自己七嘴八舌」的視覺暗示：
 *   學妹頭頂上方 5 個 SpotLight，每個顏色代表不同年紀的「聲音」。
 *   每個光呼吸節奏錯開 → 「不同年紀的意識此起彼落」。
 *
 * 不畫具體年輕/老年版本的學妹輪廓（toni 否決了 B1 殘影派），
 * 改用顏色 + 節奏的抽象表達。
 *
 * 公開 API：
 *   const lights = createConsciousnessLights({ parent, anchor });
 *   lights.update(time);  // 每幀呼叫，做呼吸節奏
 *   lights.setIntensity(0.5);  // 整體強度 0~1
 *   lights.dispose();
 *
 * 預設 parent = scene、anchor = 學妹位置；可選 attach 到 character group
 * 讓燈跟著學妹移動。
 */

import * as THREE from "./vendor-three.module.js";

// 5 個年紀對應的色彩（暖到冷的時間軸：青春 → 老年）
const VOICE_PRESETS = [
  { name: "young",   color: "#ffd49c", phaseOffset: 0.0 }, // 青春暖橙
  { name: "now",     color: "#fff5e8", phaseOffset: 1.3 }, // 現在暖白
  { name: "memory",  color: "#bff0c5", phaseOffset: 2.5 }, // 記憶淡綠
  { name: "dream",   color: "#d8b8ff", phaseOffset: 3.8 }, // 夢境淡紫
  { name: "future",  color: "#a8c5ff", phaseOffset: 5.0 }, // 未來月光藍
];

export function createConsciousnessLights(options = {}) {
  const parent = options.parent;          // 通常是 character group（光跟人移動）
  const anchor = options.anchor || { x: 0, y: 0, z: 0 }; // 學妹相對位置
  if (!parent) {
    console.warn("[consciousness-lights] no parent provided, lights won't be visible");
    return makeNoOp();
  }

  const lights = [];
  const baseIntensity = options.baseIntensity ?? 1.6;
  const orbitRadius = options.orbitRadius ?? 0.6;
  const heightAbove = options.heightAbove ?? 1.6;

  VOICE_PRESETS.forEach((preset, i) => {
    const angle = (i / VOICE_PRESETS.length) * Math.PI * 2;
    const x = anchor.x + Math.cos(angle) * orbitRadius;
    const z = anchor.z + Math.sin(angle) * orbitRadius;
    const y = anchor.y + heightAbove;

    // SpotLight: (color, intensity, distance, angle, penumbra, decay)
    const light = new THREE.SpotLight(
      new THREE.Color(preset.color),
      baseIntensity,
      4.5,           // 照射距離
      Math.PI / 6,   // 角度（30 度錐）
      0.55,          // penumbra 軟邊
      1.5            // decay
    );
    light.position.set(x, y, z);

    // target 在學妹位置（光柱朝下打）
    const target = new THREE.Object3D();
    target.position.set(anchor.x, anchor.y, anchor.z);
    parent.add(target);
    light.target = target;
    light.userData.preset = preset;
    light.userData.target = target; // dispose 時用

    parent.add(light);
    lights.push(light);
  });

  // 整體 intensity 控制（可動態縮放，例如劇情外段落可調暗）
  let masterIntensity = 1.0;

  function update(time) {
    // 5 盞各自呼吸（phase 錯開，避免同步閃爍）
    lights.forEach((light) => {
      const phase = light.userData.preset.phaseOffset;
      // 0.6~1.4 倍 base intensity，0.3 Hz 呼吸
      const breath = 1.0 + Math.sin(time * 0.45 + phase) * 0.42;
      light.intensity = baseIntensity * breath * masterIntensity;
    });
  }

  function setIntensity(v) {
    masterIntensity = Math.max(0, Math.min(1, v));
  }

  function dispose() {
    lights.forEach((light) => {
      parent.remove(light);
      if (light.userData.target) parent.remove(light.userData.target);
      light.dispose?.();
    });
    lights.length = 0;
  }

  return {
    update,
    setIntensity,
    dispose,
    lights,
    inspectVoices: () => VOICE_PRESETS.map((p) => p.name),
  };
}

function makeNoOp() {
  return {
    update: () => {},
    setIntensity: () => {},
    dispose: () => {},
    lights: [],
    inspectVoices: () => [],
  };
}
