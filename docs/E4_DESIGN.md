# E4 場景變換 simplified 設計

> **狀態**:設計骨架 + 框架(2026-05-02 17:50 round-3+1 啟動)
> **工程量**:2-3 天 simplified(完整新場景 5-10 天/場景跳過)
> **目標**:LM402 場景固定教室,但「窗外 prop」配合 E3 環境 preset 切換 → 暗示天氣/時間/季節

---

## 設計核心

E3 已實做 5 個 preset(dusk/night/rainy/snowy/day),只切 fog/light/bgColor/exposure。**E4 simplified 加 prop mesh,跟 E3 preset 鉤起來**:

| preset | 該顯示 prop | 該隱藏 prop |
|---|---|---|
| **dusk**(預設黃昏) | 雲層(暖橙邊) | 月亮 / 雨 / 雪 |
| **night** | **月亮**(月光藍 emissive) | 雲 / 雨 / 雪 |
| **rainy** | **雨粒子**(window 玻璃外)+ 灰雲 | 月亮 / 雪 |
| **snowy** | **雪粒子**(慢落)+ 灰白雲 | 月亮 / 雨 |
| **day** | 雲層(白色) | 月亮 / 雨 / 雪 |

---

## 模組設計

### 新模組:`assets/lm402-twin/e4-props.js`

```js
/**
 * e4-props.js — E4 場景 prop mesh(simplified 版)
 * 跟 E3 environment-presets 鉤起來:setPreset 切換時 prop 跟著 visibility
 */

import * as THREE from "./vendor-three.module.js";

export function createE4Props({ scene, currentPreset = "dusk" }) {
  const props = {
    moon:   createMoon(),       // night
    rain:   createRain(),        // rainy
    snow:   createSnow(),        // snowy
    cloudA: createCloud("warm"), // dusk / day
    cloudB: createCloud("gray"), // rainy / snowy
  };
  Object.values(props).forEach(p => {
    p.visible = false;
    scene.add(p);
  });

  function syncToPreset(preset) {
    // 1. 全部隱藏
    Object.values(props).forEach(p => p.visible = false);
    // 2. 按 preset 顯示對應 prop
    switch (preset) {
      case "night":  props.moon.visible = true; break;
      case "rainy":  props.rain.visible = true; props.cloudB.visible = true; break;
      case "snowy":  props.snow.visible = true; props.cloudB.visible = true; break;
      case "dusk":
      case "day":   props.cloudA.visible = true; break;
    }
  }
  syncToPreset(currentPreset);

  return {
    syncToPreset,
    setVisibility: (name, visible) => { if (props[name]) props[name].visible = visible; },
    dispose: () => Object.values(props).forEach(p => { p.geometry?.dispose(); p.material?.dispose(); scene.remove(p); }),
  };
}

// — 月亮:sphere mesh + emissive 月光藍 —
function createMoon() {
  const geo = new THREE.SphereGeometry(1.5, 32, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xfafdff,
    emissive: 0x9cb8e0,    // 跟 night preset 月光藍對齊
    emissiveIntensity: 0.6,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(8, 12, -25);   // 教室窗外右上
  mesh.name = "e4-moon";
  return mesh;
}

// — 雨粒子:Points + 慢速 fall —
function createRain() {
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 30;
    positions[i*3+1] = Math.random() * 20;
    positions[i*3+2] = -10 - Math.random() * 15;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xa0b0c0, size: 0.05, transparent: true, opacity: 0.6,
  });
  const points = new THREE.Points(geo, mat);
  points.name = "e4-rain";
  // TODO:在 renderer 主迴圈加 update 函數讓 y -= 0.1 / frame,接近地面 reset 到天空
  return points;
}

// — 雪粒子:Points + 慢搖晃 fall —
function createSnow() { /* 同 rain 但 size 0.08 / opacity 0.85 / 速度更慢 */ }

// — 雲:plane mesh + procedural alpha texture —
function createCloud(tone /* 'warm' | 'gray' */) {
  const geo = new THREE.PlaneGeometry(40, 8);
  const color = tone === "warm" ? 0xffe8c8 : 0x9098a0;
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 16, -28);
  mesh.rotation.x = -Math.PI / 12;
  mesh.name = `e4-cloud-${tone}`;
  return mesh;
}
```

### renderer.js 整合(在 createEnvironmentPresets() 後)

```js
import { createE4Props } from "./e4-props.js";

const e4 = createE4Props({ scene, currentPreset: env.getCurrentPreset() });

// 改 environment-presets.js 的 setPreset() 結尾呼叫:
//   e4.syncToPreset(presetName)
// 或 renderer.js 內監聽 env.setPreset 並 chain 呼叫 e4.syncToPreset

// console API
window.__E4_PROPS__ = e4;
```

### 新 preset 切換流程

```
toni 跑 __ENV__.setPreset('night', 2000)
  ↓
environment-presets.js lerp fog/light/bgColor/exposure 到 night
  ↓ (尾端 chain)
e4-props.js syncToPreset('night')
  ↓
moon 顯示, cloudA / cloudB / rain / snow 隱藏
```

---

## 工程量分解(2-3 天)

| 段 | 內容 | 時間 |
|---|---|---|
| **1** | e4-props.js 寫 createMoon / createCloud(基本 mesh) | 0.5 天 |
| **2** | createRain / createSnow + 主迴圈 update(慢落動畫) | 0.5 天 |
| **3** | renderer.js 整合 + chain 到 setPreset | 0.5 天 |
| **4** | E3 preset 對應 prop visibility 微調 | 0.3 天 |
| **5** | 月光從月亮位置射出(SpotLight 配合 prop)| 0.5 天 |
| **6** | 玻璃面接到雨打效果(F7 lens rain 已有 — 配合) | 0.3 天 |
| **共** | | 2.6 天 |

---

## 跳過真做的部分(完整新場景 vs simplified)

| 完整版需要 | simplified 跳過 |
|---|---|
| 教室外走廊 mesh(每場景 5 天) | ✅ 跳過 — 場景固定教室 |
| 月台 mesh + 火車 / 候車人 | ✅ 跳過 |
| 咖啡廳 mesh + 燈光 | ✅ 跳過 |
| 場景切換 transition(camera move + scene swap) | ✅ 跳過 |
| 不同場景的角色姿勢 | ✅ 跳過 |

---

## 為什麼 simplified ROI 高

- **整個 narrative 在 LM402 教室發生**(11:00 一眼瞬間是教室 LM402 的事)
- 「場景變換」原意是「劇情場景切換」,但本專案只有教室一個核心場景
- 加窗外 prop 暗示天氣/時間,**達到「場景氛圍變化」需求 90%**,工程量降到 simplified 1/10

---

## 跟其他系統的關係

- **跟 E3 environment-presets 鉤** — 看 preset 切 prop visibility
- **跟 F7 Lens Rain 配合** — rainy preset 雨粒子 + lens 雨打效果一起
- **跟 H7 environment audio 配合** — rainy 雨聲 / snowy 風聲 / night 蟬鳴
- **不影響正本 lm402.html** — 只在 lm402-twin 實作

---

## 下一步

實作 sequence 建議:
1. 先做 createMoon (最簡單,1 個 sphere)+ console API → 看視覺效果
2. 跑 `__ENV__.setPreset('night')` + `__E4_PROPS__.setVisibility('moon', true)`
3. 確認月亮位置/亮度 OK 後做 createRain/Snow
4. 最後做 renderer.js 整合 chain

**toni 確認此設計後,future session 可實作**(本 session 不真寫代碼避免死代碼)。
