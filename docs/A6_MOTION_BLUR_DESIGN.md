# A6 Motion Blur 真做設計

> **狀態**:設計 + 工程 plan(2026-05-02 18:00 toni 確認真做)
> **toni 原話**:「A6 我們真做,因為是雙時空」
> **適用線**:LM402-twin 雙時空(non-blocking 對 LM402 原始時間線)
> **工程量**:5-7 天 dedicated work(simplified 替代不採用)

---

## toni 已確認 ❤️

A6 從 PENDING「跳過真做」→ **「真做」**。理由:雙時空走 WebGL2 極限,motion blur 是電影級 web 視覺的標配。

---

## 技術設計(真做版,不是 simplified accumulation blend)

### 核心:Motion Vector G-buffer

**目標**:每像素的 screen-space velocity 向量(2D),代表「上一幀在哪 → 這一幀在哪」。

```
┌─────────────────────────────────────────┐
│  prevViewProjMatrix(uniform,前一幀)     │
│  currentViewProjMatrix(uniform,當前)    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Motion Vector pass(額外 render target)│
│  vec2 velocity = currScreenPos - prevScreenPos │
│  寫入 RG16F texture                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Motion Blur post pass                  │
│  texture lookup velocity → sample N 次   │
│  blur 沿 velocity 向量(預設 N=8)        │
└─────────────────────────────────────────┘
```

### 實作 file plan

```
assets/lm402-twin/
├── motion-blur.js          (新 — 主模組)
├── postfx.js               (改 — 加 motion blur pass)
└── renderer.js             (改 — 加 prev matrix uniform)
```

### motion-blur.js 模組設計

```js
import * as THREE from "./vendor-three.module.js";

export function createMotionBlur({ scene, camera, renderer, samples = 8 }) {
  // 1. 額外 render target:RG16F format 存 velocity
  const velocityRT = new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGFormat,
    type: THREE.HalfFloatType,
  });

  // 2. Velocity ShaderMaterial(per-mesh override,寫入 velocityRT)
  const velocityMat = new THREE.ShaderMaterial({
    uniforms: {
      prevViewProjMatrix: { value: new THREE.Matrix4() },
      currentViewProjMatrix: { value: new THREE.Matrix4() },
      prevModelMatrix: { value: new THREE.Matrix4() },
    },
    vertexShader: VELOCITY_VERTEX,
    fragmentShader: VELOCITY_FRAGMENT,
  });

  // 3. Blur ShaderMaterial(讀 velocityRT + scene color → 沿 velocity blur)
  const blurMat = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null },
      tVelocity: { value: velocityRT.texture },
      uSamples: { value: samples },
      uIntensity: { value: 0.5 },
    },
    vertexShader: BLUR_VERTEX,
    fragmentShader: BLUR_FRAGMENT,
  });

  let prevViewProj = new THREE.Matrix4();

  function render(currentTarget) {
    // Pass 1: 寫 velocity buffer
    scene.overrideMaterial = velocityMat;
    velocityMat.uniforms.prevViewProjMatrix.value.copy(prevViewProj);
    velocityMat.uniforms.currentViewProjMatrix.value
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    renderer.setRenderTarget(velocityRT);
    renderer.render(scene, camera);

    // Pass 2: blur scene color
    scene.overrideMaterial = null;
    // ... composite to currentTarget

    // Save current ViewProj for next frame
    prevViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  }

  return {
    render,
    setIntensity: (v) => { blurMat.uniforms.uIntensity.value = v; },
    dispose: () => { velocityRT.dispose(); velocityMat.dispose(); blurMat.dispose(); },
  };
}
```

### 整合 postfx.js

```js
// 在現有 postfx 管線結尾加 motion blur(在 bloom 之後 / vignette 之前)
const motionBlur = createMotionBlur({ scene, camera, renderer, samples: 8 });
postfxChain.push({
  name: 'motionBlur',
  render: (input, output) => motionBlur.render(output),
  enabled: false,   // M18 nuclear default — 預設關
});
```

### console API

```js
window.__MOTION_BLUR__ = {
  setIntensity: motionBlur.setIntensity,
  setSamples: (n) => { motionBlur.uniforms.uSamples.value = n; },
  enable: () => { postfx.tuning.motionBlur = true; },
  disable: () => { postfx.tuning.motionBlur = false; },
};
```

預設關(M18 nuclear default 紀律 — 雖 motion blur 不會跟 B2/B3/B4 疊加,但「行為活感」effect 該 toni opt-in)。

---

## 工程量分解(5-7 天)

| 段 | 內容 | 時間 |
|---|---|---|
| **1** | velocity ShaderMaterial GLSL(vertex + fragment) | 1 天 |
| **2** | velocityRT 設置 + per-mesh override material | 0.5 天 |
| **3** | blur ShaderMaterial GLSL(N-tap 沿 velocity 採樣) | 1 天 |
| **4** | 整合 postfx 管線 + uniform 接 frame loop | 0.5 天 |
| **5** | prevModelMatrix per-mesh tracking(學妹頭髮 / 衣服變動)| 1 天 |
| **6** | console API + tuning 整合到 __POSTFX__ | 0.3 天 |
| **7** | 視覺微調 + edge case(快速旋轉 / 衣襬飄逸)| 1 天 |
| **8** | 測試(三模式:idle / 學長走進 / 學妹發起互動 C8) | 0.5-1 天 |
| **共** | | **5.8-6.3 天** |

---

## 跟 F sprint 的關係

⚠️ **F sprint phase 3 GLSL → WGSL 重寫時,motion-blur.js 也要一起重寫**(motion blur 的 velocity / blur shader 都是 GLSL ShaderMaterial)。

時序建議:
- **方案 A**:**先 A6 真做**(WebGL2 上)→ F sprint 時連 motion-blur 一起 WGSL 化
- **方案 B**:F sprint 完成後再做 A6(直接 WGSL)— 但 lm402-twin 中間期沒 motion blur

**建議方案 A** — A6 先在 lm402-twin 跑 1-2 個月,toni 試用 + 微調,驗證設計後 F sprint 時順手 WGSL 化。

---

## 跟 GLB 學妹化(JUNIOR_REDESIGN)的關係

⚠️ **若學妹改 SkinnedMesh(GLB 載入後),motion blur 的 velocity pass 要支援 SkinnedMesh**(skinned vertex 變動需 prev bones matrix tracking)。

時序建議:
- A6 真做 phase 1 — 先 static mesh + camera motion(學妹 idle 站著也有頭微動,夠用)
- A6 phase 2(GLB 化後)— 加 SkinnedMesh velocity 支援(額外 1-2 天)

---

## 視覺驗證 case

A6 完成後該驗證的場景:
- ✅ **學妹 idle 呼吸**:微弱頭髮搖晃 → 髮絲端輕微 motion blur
- ✅ **學長走進場景**(11:00 從 LM401 走過來):衣襬 / 步伐節奏 motion blur
- ✅ **C8 學妹發起互動**(6 種情緒觸發動作):動作那刻 motion blur
- ✅ **鏡頭慢慢轉**(camera dolly):整個場景背景 motion blur
- ❌ **不該有 motion blur**:靜止對話、學妹站著看書這類

驗證 toni 滿意 → A6 完成。

---

## 下一步

1. toni 看本 doc 確認方向 + 排優先級
2. dedicated session 跑 5-7 天工程
3. 完成後 commit + push + LESSONS 加 §3.13「A6 真做完成 + WebGL2 motion blur 心得」

**本 session 不真做** — 5-7 天工程不該在日常 session 啟動半成品。給設計骨架 + 等 toni 確認。
