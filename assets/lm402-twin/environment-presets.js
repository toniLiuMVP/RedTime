/**
 * environment-presets.js — 季節時間環境（E3）
 *
 * 5 個預設氛圍：
 *   dusk  黃昏（預設，原本 Tier 1 的氣質）
 *   night 夜晚（深藍 + 月光）
 *   rainy 雨天（灰藍冷色 + 低彩度）
 *   snowy 雪天（白藍 + 高霧）
 *   day   白天（暖白 + 低霧）
 *
 * Simplified 設計：
 *   - 只切 fog color / light color & intensity / scene background
 *   - envMap 不動（避免 PMREM 重建成本）
 *   - 仍能營造強烈氣質差異
 *
 * 公開 API：
 *   const e = createEnvironmentPresets({ scene, light, transitionMs: 2000 });
 *   e.setPreset('night', 1500);  // 1.5s 內 lerp 到夜晚
 *   e.getCurrentPreset();
 *   e.dispose();
 */

import * as THREE from "./vendor-three.module.js";

const PRESETS = {
  dusk: {
    fogColor: "#d0dce6",
    fogNear: 12,
    fogFar: 65,
    bgColor: "#ccd8e4",
    lightColor: "#fff8e1",  // 16772034
    lightIntensity: 2.8,
    ambientLightColor: "#fff8d0", // 16775408
    ambientLightIntensity: 0.22,
    exposure: 1.14,
    glassEnvIntensity: 0.5,    // 窗戶玻璃 envMap reflection 強度(0-1)
    sceneEnvIntensity: 1.0,    // 整體 PBR IBL 強度(透過 scene.environment 投在所有 mesh)
    glassColor: "#dce8f2",     // 窗戶玻璃本色
    glassTransmission: 0.95,   // 窗戶透光度(night 降低 → 少透出室外暖光)
  },
  night: {
    fogColor: "#0a0e1a",
    fogNear: 6,
    fogFar: 38,
    bgColor: "#070a14",
    lightColor: "#9cb8e0",  // 月光藍
    lightIntensity: 1.0,
    ambientLightColor: "#5878a0",
    ambientLightIntensity: 0.18,
    exposure: 0.85,
    glassEnvIntensity: 0.02,   // 夜晚玻璃幾乎不反射(避免透出 sunset envmap)
    sceneEnvIntensity: 0.15,   // 夜晚 IBL 大幅壓低(避免 PBR 物件透出 sunset 暖光)
    glassColor: "#0a0e1a",     // 夜晚玻璃本色轉深(窗戶看起來像夜玻璃,非亮天空)
    glassTransmission: 0.45,   // 夜晚透光度降低(少透出室外環境光)
  },
  rainy: {
    fogColor: "#7c8694",
    fogNear: 8,
    fogFar: 45,
    bgColor: "#5e6878",
    lightColor: "#c0c8d0",  // 灰白
    lightIntensity: 1.6,
    ambientLightColor: "#a8b0bc",
    ambientLightIntensity: 0.32,
    exposure: 0.95,
    glassEnvIntensity: 0.3,
    sceneEnvIntensity: 0.6,
    glassColor: "#aab4c0",
    glassTransmission: 0.78,
  },
  snowy: {
    fogColor: "#dde6f0",
    fogNear: 10,
    fogFar: 55,
    bgColor: "#e8eef6",
    lightColor: "#fafcff",  // 純白偏冷
    lightIntensity: 2.4,
    ambientLightColor: "#d8e2ee",
    ambientLightIntensity: 0.4,
    exposure: 1.05,
    glassEnvIntensity: 0.4,
    sceneEnvIntensity: 0.7,
    glassColor: "#eef4fa",
    glassTransmission: 0.86,
  },
  day: {
    fogColor: "#e8d8c0",
    fogNear: 18,
    fogFar: 78,
    bgColor: "#dcc8a8",
    lightColor: "#ffffe0",  // 白天暖白
    lightIntensity: 3.4,
    ambientLightColor: "#fff5d8",
    ambientLightIntensity: 0.32,
    exposure: 1.22,
    glassEnvIntensity: 0.6,
    sceneEnvIntensity: 1.1,
    glassColor: "#eaf2f8",
    glassTransmission: 0.95,
  },
};

export function createEnvironmentPresets(options = {}) {
  const scene = options.scene;
  const light = options.light;                  // directional light Te
  const ambientLight = options.ambientLight;    // ambient light ke
  const renderer = options.renderer;
  const glassMaterial = options.glassMaterial;  // 窗戶玻璃 PBR material(Vt)— B-VIS-002 修
  const sceneEnvSource = options.sceneEnvSource; // sunset envmap 原始 reference(用於 sceneEnvIntensity lerp)
  const defaultTransitionMs = options.transitionMs ?? 2000;

  if (!scene) {
    console.warn("[environment-presets] scene required");
    return makeNoOp();
  }

  let currentPresetName = "dusk";
  let currentValues = null;
  let transitionRaf = null;

  // 初始化 currentValues 從場景當前狀態（也可從 dusk preset 取）
  function snapshotCurrent() {
    return {
      fogColor: scene.fog ? new THREE.Color().copy(scene.fog.color) : new THREE.Color("#d0dce6"),
      fogNear: scene.fog?.near ?? 12,
      fogFar: scene.fog?.far ?? 65,
      bgColor: scene.background instanceof THREE.Color
        ? new THREE.Color().copy(scene.background)
        : new THREE.Color("#ccd8e4"),
      lightColor: light ? new THREE.Color().copy(light.color) : new THREE.Color("#fff8e1"),
      lightIntensity: light?.intensity ?? 2.8,
      ambientLightColor: ambientLight
        ? new THREE.Color().copy(ambientLight.color)
        : new THREE.Color("#fff8d0"),
      ambientLightIntensity: ambientLight?.intensity ?? 0.22,
      exposure: renderer?.toneMappingExposure ?? 1.14,
      glassEnvIntensity: glassMaterial?.envMapIntensity ?? 0.5,
      sceneEnvIntensity: scene?.environmentIntensity ?? 1.0,
      glassColor: glassMaterial
        ? new THREE.Color().copy(glassMaterial.color)
        : new THREE.Color("#dce8f2"),
      glassTransmission: glassMaterial?.transmission ?? 0.95,
    };
  }
  currentValues = snapshotCurrent();

  function setPreset(name, transitionMs) {
    const target = PRESETS[name];
    if (!target) {
      console.warn("[environment-presets] unknown preset:", name, "available:", Object.keys(PRESETS));
      return;
    }
    if (transitionRaf) cancelAnimationFrame(transitionRaf);

    const duration = transitionMs ?? defaultTransitionMs;
    const startTime = performance.now();
    const startValues = snapshotCurrent();
    const targetValues = {
      fogColor: new THREE.Color(target.fogColor),
      fogNear: target.fogNear,
      fogFar: target.fogFar,
      bgColor: new THREE.Color(target.bgColor),
      lightColor: new THREE.Color(target.lightColor),
      lightIntensity: target.lightIntensity,
      ambientLightColor: new THREE.Color(target.ambientLightColor),
      ambientLightIntensity: target.ambientLightIntensity,
      exposure: target.exposure,
      glassEnvIntensity: target.glassEnvIntensity ?? 0.5,
      sceneEnvIntensity: target.sceneEnvIntensity ?? 1.0,
      glassColor: new THREE.Color(target.glassColor ?? "#dce8f2"),
      glassTransmission: target.glassTransmission ?? 0.95,
    };

    function step() {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      // ease-in-out
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // fog color & range
      if (scene.fog) {
        scene.fog.color.copy(startValues.fogColor).lerp(targetValues.fogColor, e);
        scene.fog.near = startValues.fogNear + (targetValues.fogNear - startValues.fogNear) * e;
        scene.fog.far = startValues.fogFar + (targetValues.fogFar - startValues.fogFar) * e;
      }
      // background
      if (scene.background instanceof THREE.Color) {
        scene.background.copy(startValues.bgColor).lerp(targetValues.bgColor, e);
      }
      // directional light
      if (light) {
        light.color.copy(startValues.lightColor).lerp(targetValues.lightColor, e);
        light.intensity = startValues.lightIntensity + (targetValues.lightIntensity - startValues.lightIntensity) * e;
      }
      // ambient light
      if (ambientLight) {
        ambientLight.color.copy(startValues.ambientLightColor).lerp(targetValues.ambientLightColor, e);
        ambientLight.intensity = startValues.ambientLightIntensity + (targetValues.ambientLightIntensity - startValues.ambientLightIntensity) * e;
      }
      // tone mapping exposure
      if (renderer) {
        renderer.toneMappingExposure = startValues.exposure + (targetValues.exposure - startValues.exposure) * e;
      }
      // 窗戶玻璃 envMap reflection 強度 + 本色 + 透光度
      // night 玻璃轉深、透光度降低 → 窗戶不再透出 sunset 暖橘天空
      if (glassMaterial) {
        glassMaterial.envMapIntensity =
          startValues.glassEnvIntensity + (targetValues.glassEnvIntensity - startValues.glassEnvIntensity) * e;
        glassMaterial.color.copy(startValues.glassColor).lerp(targetValues.glassColor, e);
        glassMaterial.transmission =
          startValues.glassTransmission + (targetValues.glassTransmission - startValues.glassTransmission) * e;
      }
      // 整體 PBR IBL 強度 — 控制 scene.environment 投在所有 PBR mesh 的反射量
      // night 時降到 0.15 → PBR 物件失去 sunset 暖色反射,看起來更夜晚
      if (scene) {
        scene.environmentIntensity =
          startValues.sceneEnvIntensity + (targetValues.sceneEnvIntensity - startValues.sceneEnvIntensity) * e;
      }

      if (t < 1) {
        transitionRaf = requestAnimationFrame(step);
      } else {
        transitionRaf = null;
        currentPresetName = name;
        currentValues = snapshotCurrent();
      }
    }
    transitionRaf = requestAnimationFrame(step);
  }

  function getCurrentPreset() {
    return currentPresetName;
  }

  function inspect() {
    return {
      current: currentPresetName,
      available: Object.keys(PRESETS),
    };
  }

  function dispose() {
    if (transitionRaf) cancelAnimationFrame(transitionRaf);
  }

  return { setPreset, getCurrentPreset, inspect, dispose, PRESETS };
}

function makeNoOp() {
  return {
    setPreset: () => {},
    getCurrentPreset: () => "dusk",
    inspect: () => ({ current: "dusk", available: [] }),
    dispose: () => {},
    PRESETS: {},
  };
}
