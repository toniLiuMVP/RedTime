# F1~F4 + E 平行世界 WebGPU 改造 sprint plan

> **狀態**:Sprint plan(2026-05-02 17:50 round-3+1 啟動)
> **總工程量**:**4-6 週 dedicated sprint**
> **本 session 動作**:寫 sprint plan,不真做 vendor copy(F1.2)— 避免半成品 break runtime
>
> ✅ **toni 確認:F 全做(2026-05-02 18:00)** — 原話「F 全做,因為是平行世界」
> ⚠️ **加學妹 GLB 化前置 → 完整 sprint 8-12 週**(原 4-6 週估計只算 F1-F4+E,沒含學妹 mesh 重做)
> 學妹重設計詳見 [JUNIOR_REDESIGN.md](JUNIOR_REDESIGN.md)
> **F1.1 已完成**:`commit b90b3fa` WebGPU detection + fallback overlay

---

## ⚠️ 工程量誠實聲明

**這不是單 session 能做完的工程**。F1~F4 + E 是「平行世界」整套 WebGPU 改造,涉及:

- vendor 一整套 WebGPURenderer + 依賴(F1.2,3 天)
- 切換 WebGLRenderer → WebGPURenderer + API 差異處理(F2,5 天)
- 重寫所有 GLSL shader 為 WGSL(F3,7-10 天)
- compute shader 特效(F4,14-21 天)
- 一眼瞬間極致精雕(E,7 天,依賴 F2-F4)

**最少 36 天,中位估計 46 天 = 4-6 週 full-time sprint**。

---

## 階段(phase)分解

### Phase 0:F1.1 偵測(已完成,2026-04-30)
- `commit b90b3fa` WebGPU detection + fallback overlay
- 進入 lm402-parallel.html 時偵測瀏覽器 WebGPU 支援
- 無支援 → 顯示 fallback 訊息 + 自動跳回 lm402.html

### Phase 1:F1.2 vendor Three.js WebGPURenderer(3 天)

**目的**:把 Three.js examples/jsm/renderers/webgpu/ 完整 vendor 進 lm402-parallel/webgpu/。

**步驟**:
1. `npm install three@latest` 在臨時目錄(讓 npm 解依賴)
2. 從 `node_modules/three/examples/jsm/renderers/webgpu/` 拷:
   - `WebGPURenderer.js`
   - `WebGPUTextureUtils.js`
   - `WebGPUBackgroundUtils.js`
   - 約 10+ 依賴檔
3. 拷貝到 `assets/lm402-parallel/webgpu/`
4. 改 import 路徑(從 `'three/...'` 改成 `'./'` 相對路徑)
5. 寫 `webgpu-bootstrap.js` 包裝(把 vendor 暴露為 single-import)
6. 測試:`assets/lm402-parallel/webgpu-test.html` 跑簡單 cube 確認 vendor 完整

**風險**:r179 WebGPURenderer 仍 alpha,可能有破壞性更新

**Exit criteria**:`new WebGPURenderer({ canvas })` 跑得起來,渲染一個 cube

### Phase 2:F2 切換 WebGLRenderer → WebGPURenderer(5 天)

**步驟**:
1. renderer.js 把 `new WebGLRenderer({...})` 改 `new WebGPURenderer({...})`
2. 處理 API 差異:
   - `renderer.outputColorSpace` 是否仍工作
   - `renderer.toneMapping` enum 對應
   - shadowMap 設定
3. **postfx.js 全部失效**(GLSL ShaderMaterial 不能跑 WebGPU)→ 暫時停用,F3 才修

**Exit criteria**:
- 學妹模型可見
- 無 postfx 但 base 渲染正常
- VRAM / FPS 跟 WebGL 比基準(預期略勝)

**風險**:**極高** — postfx.js 是核心視覺,F2 完成那刻畫面會「降級」到 Tier 1 狀態,要 toni 同意

### Phase 3:F3 GLSL → WGSL 重寫(7-10 天)

**清單**:
1. `postfx.js` 5+ ShaderMaterial:
   - Bloom
   - DOF (Hex bokeh)
   - Chromatic Aberration
   - Grain
   - Color Grade
   - Lens Dirt
   - God Rays
   - Lens Flare
   - Volumetric Fog (A5)
2. `envmap-sunset.js` sky shader
3. `consciousness-particles.js` particle vertex shader
4. `junior-materials-hr.js` 任何 onBeforeCompile 客製化

**WGSL vs GLSL 差異**:
- 語法 `fn` vs `void main()`
- bind group 取代 uniform
- texture sample 寫法
- swizzle 支援差異

**測試**:每個 shader 重寫後 visually compare WebGL 版

**Exit criteria**:lm402-parallel 視覺 = lm402-twin 完全一致(無視覺退步)

### Phase 4:F4 compute shader 特效(14-21 天)

**這是真 WebGPU 才能做的事**。如果只是視覺一樣那 F2+F3 就夠了。

**新增功能**:
- **SSGI**(screen-space global illumination)— 教室間接光
- **GPU cloth solver** — 學妹頭髮 / 制服布料用 compute shader 模擬,取代 cloth-rig.js CPU 版
- **Particle physics** — 意識粒子 B2 用 compute shader 模擬慣性 / 集群行為
- **Hair strands** — 髮絲級渲染(取代 mesh hair)

**選擇性**:F4 是「投資 vs 回報」 — toni 視時間決定全做或選做

### Phase 5:E 一眼瞬間極致精雕(7 天)

**依賴 F2-F4 完成**。

**內容**:
- 11:00 鐘響「他看見她了」場景 dedicated camera
- 4K-level PBR 學妹/學長
- ML lip-sync(可能 — 需評估技術可行性)
- 高解析度光線追蹤
- 微表情 amplification(眼神聚焦 / 呼吸暫停)

**Exit criteria**:這一秒視覺品質達「劇場級」,情感衝擊量化(toni 看哭算過)

---

## Session 切割建議

如果 toni 要做這個 sprint,**建議切成 6 個 dedicated session**:

| Session | Phase | 工程量 | Exit |
|---|---|---|---|
| 1 | F1.2 vendor | 3 天 | webgpu-test.html cube 跑得起 |
| 2 | F2 切換 | 5 天 | 學妹可見,postfx 暫停 |
| 3 | F3a 簡單 shader | 4 天 | Bloom / Vignette / Grain 對齊 |
| 4 | F3b 複雜 shader | 4-6 天 | DOF / Volumetric Fog / God Rays 對齊 |
| 5 | F4 compute(選擇性)| 14-21 天 | 1-2 個 compute 特效 demo |
| 6 | E 精雕 | 7 天 | 一眼瞬間 dedicated camera + 4K |

**全做完最少 4-6 週 full-time**。

---

## 風險評估

| 風險 | 嚴重度 | 緩解 |
|---|---|---|
| Three.js r179 WebGPURenderer 仍 alpha,API 破壞變更 | 🔴 高 | F1.2 用固定版本 vendor,不跟隨 upgrade |
| postfx.js 全部失效期(F2 完成 → F3 完成中間)| 🔴 高 | 期間禁止對外發布 lm402-parallel,只 dev 用 |
| WGSL 學習曲線 + debug 工具不成熟 | 🟡 中 | 預留 buffer,單 shader 卡住超過 1 天就跳到下個 |
| compute shader 性能可能不如預期 | 🟡 中 | F4 是 optional,fallback 用 WebGL2 cloth-rig |
| 瀏覽器 WebGPU 支援不一(Safari 仍 partial)| 🟡 中 | F1.1 fallback overlay 已 cover |
| 4-6 週投入時間 | 🔴 高 | toni 決定 |

---

## ROI 評估

**做 F1~F4+E 的價值**:
- ✅ **整個專案的情感核心**(11:00 一眼瞬間 dedicated 精雕)
- ✅ 技術 showcase(可能讓 RedTime 進入 web 視覺界討論)
- ✅ compute shader 真特效(SSGI / GPU cloth)— Web 上少見

**不做(維持 lm402-twin 現狀)的後果**:
- ❌ 平行世界路線停滯,但 lm402-twin 已是 WebGL2 走極限,視覺距離可接受
- ❌ 「一眼瞬間」用 lm402-twin 也能傳達情感(只是不到「劇場級」)

**toni 該決定的問題**:
1. 「一眼瞬間 11:00」這個情感點值 4-6 週 sprint 嗎?
2. F4 compute shader 是否太遠(可只做 F1.2 + F2 + F3 = 4 週簡化版)?
3. 是否願意接受 F2 完成那刻畫面短暫降級?

---

## 本 session 為什麼不真做 F1.2

我之前的 plan 寫「F1.2 起步:從 Three.js 拷 vendor」**3 天工程量**。即使「起步」也要花本 session 1+ 小時 + 風險高:

- 拷一半 break 整個 lm402-parallel.html runtime
- 依賴沒拷全 → import error
- 路徑改不對 → 載入失敗
- 留下半成品 → 下次 session 還要整理

**比較好的做法**:
1. toni 看本 plan 確認方向
2. toni 確認後 dedicated session 做 F1.2(3 天 sprint)
3. 不在「日常 ALLRM session」夾雜「sprint 級工程」

---

## 中間方案:不全做的選擇

如果 toni 不想 4-6 週,有 3 個 hybrid 選擇:

### 選 A:只做 F1.2 + F2(8 天)→ 視覺退步但 WebGPU 起來
- vendor + 切換,postfx 全部停
- 結果:跟 lm402.html Tier 1 視覺一樣但跑 WebGPU
- **不建議** — 視覺降級換 WebGPU,ROI 負

### 選 B:做 F1.2 + F2 + F3(16-19 天)→ 視覺 = lm402-twin 但跑 WebGPU
- 視覺持平,引擎切換
- 為 F4 鋪路
- **可考慮** — 平行世界 sprint MVP

### 選 C:只做 E 精雕在 lm402-twin(2-3 週)
- 不切 WebGPU,直接在 lm402-twin 做 11:00 dedicated camera + 高 quality
- 跳過所有 F1.2-F4 風險
- **最務實** — 達到「情感核心」目標,放棄 WebGPU showcase

我**個人建議選 C**,但這是 toni 決定。

---

## 下一步

1. toni 看本 plan + E4_DESIGN.md 後決定方向
2. 如選 F sprint(B/C 任一)→ 開 dedicated session 跑
3. 如不選 → 持續維護 lm402-twin,F sprint 留長期 backlog

**本 session 不真做這個 sprint**,只給 plan。
