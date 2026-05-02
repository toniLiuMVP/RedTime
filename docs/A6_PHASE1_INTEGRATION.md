# A6 Motion Blur Phase 1 整合指南

> **狀態**:Phase 1 模組寫好(2026-05-02 22:00,本 session),整合進 postfx.js 留 dedicated session
> **檔案**:[../assets/lm402-twin/motion-blur.js](../assets/lm402-twin/motion-blur.js)

## 為什麼分開 module + 不馬上整合

motion-blur.js 是 self-contained 模組,但要看到視覺效果需要 wire-up 進 postfx.js 主管線。**避免本 session 整合的理由**:

- postfx.js 735 行,加 RT swap + uniform + render order 改動風險高
- 本 session 已動 4 個 ALLRM 輪次 + 多 commit,再動主渲染管線是疲勞 zone
- 改 postfx 該 dedicated session,有 fresh 注意力 + 視覺驗證時間

→ 本 session 完成 motion-blur.js 模組(可 unit test)+ 整合 instructions。
→ 下次 dedicated session:跟著本 doc 整合進 postfx.js + console verify。

## 整合 SOP(下次 session,30-60 分鐘工程)

### Step 1:在 renderer.js 內 init motion blur(找 createPostFX 呼叫處附近)

```js
import { createMotionBlur } from "./motion-blur.js";

// ... 在現有 createPostFX 呼叫後加:
const motionBlur = createMotionBlur({
  renderer,
  width: canvas.width,
  height: canvas.height,
  defaultIntensity: 0.0,  // M18 nuclear default
});

// 暴露 console API
if (typeof window !== "undefined") {
  window.__MOTION_BLUR__ = motionBlur;
}
```

### Step 2:在 postfx 渲染完後串聯 motion blur

postfx.js 的 createPostFX 回傳的 `render(scene, camera)` 函數會把場景渲染到 canvas。要插入 motion blur:

**選 A(乾淨,需改 postfx.js)**:postfx 改回傳 final RT 而非直接寫 canvas,renderer.js 接 motion blur 後再寫 canvas

**選 B(輕量,在 renderer.js 內 wrap)**:

```js
// renderer.js 主 render loop
function render() {
  postfx.render(scene, camera);  // postfx 直接寫 canvas
  if (motionBlur.isEnabled()) {
    // 已寫 canvas,但 motion blur 需要 input tex
    // → 需要改 postfx 改寫 RT 才能 hook(回到選 A)
  }
}
```

→ **建議選 A** — 改 postfx.js createPostFX 回 RT,renderer.js 主導最終 composite。

### Step 3:測試 console API

```javascript
// 開 lm402-twin.html,F12 console:
__MOTION_BLUR__.enable();           // 預設 intensity 0.3
__MOTION_BLUR__.setIntensity(0.5);  // 加強拖影
__MOTION_BLUR__.disable();          // 復原 nuclear default
__MOTION_BLUR__.isEnabled();        // false
```

驗證 case:
- ✅ 學妹 idle 呼吸 — 髮絲端輕微拖影
- ✅ 鏡頭慢慢轉 — 整個場景拖影
- ❌ 不該炸顏色 — intensity 0.3 應該維持暗部 / 中性灰過渡

### Step 4:整合進 __POSTFX__.tuning(對齊現有 console API)

```js
// 在 postfx.js createPostFX 內,tuning 物件加:
tuning.motionBlur = false;       // boolean enable/disable
tuning.motionBlurAmount = 0.3;   // intensity

// 主 render 時:
if (tuning.motionBlur) {
  motionBlur.enable();
  motionBlur.setIntensity(tuning.motionBlurAmount);
} else {
  motionBlur.disable();
}
```

→ console API 對齊 `__POSTFX__.tuning.motionBlur = true` 模式(玩家熟悉)。

## Phase 1 vs Phase 2 視覺差異

### Phase 1(本實作 — accumulation blend)

```
相機慢轉    → 整個畫面均勻拖影     ✅ 自然
學妹頭髮    → 髮絲拖影              ✅ 期望效果
靜止背景    → ⚠️ 也跟著糊(副作用)
快速 camera → 整個畫面糊到看不清     ⚠️ 強度高時明顯
```

### Phase 2(motion vector G-buffer,真做 5-7 天)

```
相機慢轉    → 移動物件拖影,靜止背景清楚  ✅ 真實
學妹頭髮    → 髮絲拖影                    ✅
靜止背景    → 不糊                         ✅
快速 camera → 場景元素各自糊              ✅ 電影級
```

**Phase 1 → Phase 2 升級條件**:toni 看 phase 1 視覺效果後決定是否值 5-7 天工程升級。

## 跟其他系統的對齊

- **LESSONS §3.13 round-4**:寫工具與工具同步紀律 — motion-blur.js intensity range(0-1) 對齊 __POSTFX__.tuning 慣例
- **M18 nuclear default 紀律**:預設 disabled,console opt-in
- **B3 0.30 預設**:本 session 改的;motion blur 跟 B3 共存無衝突(不同 anchor / 非 AdditiveBlending)
- **F sprint Phase 3**:F3 GLSL→WGSL 時,本 motion-blur.js 的 GLSL shader 一起 WGSL 化

## 當前狀態(2026-05-02 22:00)

- ✅ motion-blur.js 寫好(180 行,self-contained)
- ⏳ 整合進 postfx.js / renderer.js — 留 dedicated session
- ⏳ 視覺驗證 — toni 跑 console API 後反饋
- ⏳ Phase 2 G-buffer — 留更後 dedicated session
