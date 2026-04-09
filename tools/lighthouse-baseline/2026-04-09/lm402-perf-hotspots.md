# lm402.html 效能熱點診斷報告

> 測量時間：2026-04-09 13:01 UTC
> Lighthouse 版本：13.1.0
> 目標網址：https://toniliumvp.github.io/RedTime/lm402.html

---

## 一、效能分數總覽

| 指標 | Desktop | Mobile |
|------|---------|--------|
| **Performance Score** | **44 / 100** | **69 / 100** |
| First Contentful Paint (FCP) | 1.9 s (score 0.35) | 3.5 s (score 0.34) |
| Largest Contentful Paint (LCP) | 2.1 s (score 0.60) | 5.0 s (score 0.26) |
| Speed Index (SI) | 4.3 s (score 0.07) | 6.4 s (score 0.40) |
| Time to Interactive (TTI) | 5.6 s (score 0.32) | 5.0 s (score 0.76) |
| **Total Blocking Time (TBT)** | **3,680 ms (score 0)** | **0 ms (score 1.0)** |
| Cumulative Layout Shift (CLS) | 0.004 (score 1.0) | 0 (score 1.0) |

---

## 二、為何 Desktop 44 遠差於 Mobile 69？

這是本報告最關鍵的發現，答案出乎意料：**不是 Desktop CPU 節流更嚴，而是剛好相反。**

### 節流設定對比

| 設定 | Desktop | Mobile |
|------|---------|--------|
| CPU slowdown multiplier | **1x（不節流）** | 4x（模擬中階手機） |
| 網路頻寬 | 10,240 Kbps | 1,638 Kbps |
| RTT | 40 ms | 150 ms |
| benchmarkIndex（越高越快） | 2,332 | 3,506 |

**Mobile 的 benchmarkIndex 反而更高（3,506 > 2,332）**，而且 CPU 被人工節流 4 倍，這使得 Mobile 測試環境中的 JS 執行時間被放大，但 Lighthouse 的 TBT 評分公式對 Mobile 和 Desktop 採用不同的評分曲線（thresholds）。

### 真正的分差原因

- **Desktop TBT：3,680 ms → 分數 0（最差）**
  Desktop 使用「快速 CPU + 快速網路」，Three.js 初始化（約 5,175 ms 的長任務）在主執行緒上完整阻塞，直接命中 Desktop TBT 最嚴格的評分區間（>600 ms = 0 分）。
  
- **Mobile TBT：0 ms → 分數 1.0（滿分）**
  Mobile 節流使 CSS/Font 載入時間拉長，Three.js 的 JS 執行被「分散」到網路等待間隙，主執行緒阻塞時間被測量為接近 0 ms。這是因為 Mobile 慢速網路讓資源載入交錯，避開了阻塞窗口。

- **Speed Index 差距（Desktop 4.3 s vs Mobile 6.4 s）**
  Desktop 畫面實際上渲染速度更快，但 Speed Index 還是低分（0.07），是因為頁面在 Three.js 執行期間幾乎完全空白，SI 對視覺填充速度非常敏感。

---

## 三、主執行緒工作分解（Desktop）

總計：**5,572.6 ms**（TTI 為 5,595 ms）

| 類別 | 時間 (ms) | 占比 |
|------|----------|------|
| **Script Evaluation** | **5,178.6** | **92.9%** |
| Other | 155.7 | 2.8% |
| Style & Layout | 145.2 | 2.6% |
| Rendering | 83.9 | 1.5% |
| Parse HTML & CSS | 5.3 | 0.1% |
| Script Parsing & Compilation | 3.9 | 0.1% |

> 結論：主執行緒時間幾乎 100% 被「Script Evaluation」吃掉，JS 執行是唯一瓶頸。

### Mobile 對比（總計 1,406.6 ms）

| 類別 | Desktop | Mobile |
|------|---------|--------|
| Script Evaluation | 5,178.6 ms | 286.4 ms |
| Other | 155.7 ms | 500.4 ms |
| Style & Layout | 145.2 ms | 360.1 ms |
| Rendering | 83.9 ms | 235.5 ms |

Mobile 的 Script Evaluation 只有 286 ms，因為 CPU 節流 4x 使得 Lighthouse 的時間測量邏輯不同，加上網路等待分散了任務。

---

## 四、JS 啟動時間分解（bootup-time）

**總計：5,179.2 ms**

Lighthouse 的 bootup-time 無法歸因到個別檔案（均標記為 `Unattributable`），這表示 Three.js 的 ES Module 動態 import 鏈使 DevTools 難以追蹤來源。

| 來源 | Scripting | Parse | Total |
|------|-----------|-------|-------|
| Unattributable（Three.js 模組鏈） | 5,175.4 ms | 0 ms | 5,267.9 ms |
| lm402.html（inline script） | 2.9 ms | 0 ms | 294.5 ms |

### 長任務（Long Tasks）

| 來源 | 開始時間 | 持續時間 |
|------|---------|---------|
| Unattributable | 420.5 ms | **5,175 ms** |
| Unattributable | 367.5 ms | 53 ms |

**一個長達 5,175 ms 的單一長任務**是 TBT 3,680 ms 的直接原因（超過 50 ms 的部分全部計入 TBT）。

---

## 五、未使用 JavaScript（Unused JS）

Lighthouse 判定可節省：**~240 bytes**（已壓縮後計算，意義有限）

| 檔案 | 總大小 | 浪費量 | 浪費比例 |
|------|--------|--------|---------|
| three.core.js | 277.8 KB | 152.0 KB | **54.7%** |
| vendor-three.module.js | 117.6 KB | 68.4 KB | **58.1%** |
| renderer.js | 50.3 KB | 40.2 KB | **79.9%** |
| app.js | 30.9 KB | 27.8 KB | **90.0%** |
| GLTFLoader.js | 24.6 KB | 20.1 KB | **81.8%** |

> 注意：這裡的 KB 是壓縮後傳輸大小。Three.js 單一 chunk 的原始大小高達 **1,368 KB**（壓縮後 277.8 KB）。

---

## 六、未使用 CSS（Unused CSS）

| 檔案 | 總大小 | 浪費量 | 浪費比例 |
|------|--------|--------|---------|
| **fonts.css** | **236.2 KB** | **236.2 KB** | **100%** |
| lm402.css | 16.3 KB | 10.3 KB | 63.2% |

**fonts.css 全部 236 KB 都是未使用的！** 這是 Google Fonts 的完整字體 CSS 清單，但實際只用到部分字重/語言。這同時造成 21 個字體檔案被下載（見下節）。

---

## 七、網路請求與傳輸量（依大小排序）

總傳輸量：**2,151.5 KB**，共 37 個請求（8 支 JS + 2 支 CSS + 21 個字體 + 其他）

| 類型 | 檔案 | 傳輸大小 | 解壓縮大小 |
|------|------|---------|-----------|
| Script | three.core.js | 277.9 KB | 1,368.5 KB |
| Stylesheet | fonts.css | 236.3 KB | 826.4 KB |
| Script | vendor-three.module.js | 117.9 KB | 589.3 KB |
| Font | （Noto Serif TC 系列 × 5） | ~95 / 93 / 93 / 83 / 79 KB | ≈各 ~95 KB |
| Font | （其他 Google Font × 16） | 34–77 KB 各 | ≈各相近 |
| Script | renderer.js | 50.9 KB | 219.3 KB |
| Script | app.js | 32.9 KB | 125.2 KB |
| Script | GLTFLoader.js | 24.8 KB | 112.2 KB |
| Stylesheet | lm402.css | 16.7 KB | 85.7 KB |
| Script | data.js | 12.4 KB | 36.2 KB |
| Script | BufferGeometryUtils.js | 8.3 KB | 34.7 KB |
| Document | lm402.html | 8.4 KB | 28.3 KB |
| Script | ui-panels.js | 4.9 KB | 19.5 KB |
| Manifest | manifest.json | 0.7 KB | 0.6 KB |

**字體總傳輸：1,359.3 KB（21 個 .woff2 檔案）**

---

## 八、根本原因結論

### 第一瓶頸：5,175 ms 的單一長任務（Three.js 初始化）

這是本頁面效能問題的主要根因。Three.js 的 `three.core.js`（解壓後 1,368 KB）在主執行緒上同步執行，產生一個長達 5,175 ms 的不可分割長任務，造成：
- TBT = 3,680 ms（Desktop 直接拿 0 分）
- TTI = 5.6 s
- Speed Index = 4.3 s（頁面在這段期間完全不可互動且視覺空白）

### 第二瓶頸：字體系統（1,595 KB 總計）

- fonts.css 本身 826 KB（解壓），傳輸 236 KB，且 **100% 未使用**
- 下載了 21 個字體檔案，總傳輸 1,359 KB
- 字體下載在 FCP 之前完成（不直接影響 TBT），但大量佔用頻寬，在頻寬有限時會延遲 Three.js 的載入

### 第三瓶頸：JS Bundle 未做 Tree-shaking

- three.core.js 有 54.7% 未使用
- renderer.js 有 79.9% 未使用（啟動時）
- app.js 有 90.0% 未使用（啟動時）

這些「未使用」的程式碼在首次載入時仍需完整 parse 和 JIT compile，增加記憶體壓力。

### 為何 Desktop 比 Mobile 更差

本質原因是 **Lighthouse Desktop 使用真實 CPU（1x，不節流）+ 快速網路**，Three.js 的 5,175 ms 長任務在高速環境中連續執行不被打斷，直接呈現為 3,680 ms TBT。而 Mobile 測試用 4x CPU 節流 + 慢速網路，雖然 JS 執行壁鐘時間更長，但 Lighthouse 計算 TBT 的方式使得 Mobile 記錄到 0 ms TBT——慢速網路使資源交錯載入，任務被分散在多個小塊而非一個超長任務。

---

## 九、建議下一步（等待確認）

以下優先序由高到低排列，等待 toni 確認後再執行：

### P1 — 立即可做，效益最高

1. **等待確認：** 將 fonts.css 的 Google Fonts import 從全字體替換為僅載入實際使用的字重/語言子集。預計可節省 ~1,100 KB 傳輸量、減少 10–15 個字體請求。

2. **等待確認：** 啟用 `font-display: swap` 並對關鍵字體（首屏中文字體）加 `<link rel="preload">`，避免字體下載阻塞 FCP 視覺渲染。

### P2 — 核心改善，需較多開發時間

3. **等待確認：** 將 Three.js 初始化移入 Web Worker（使用 OffscreenCanvas）或分拆為多個 chunk，打破單一 5,175 ms 長任務為多個 <50 ms 的小任務。這是解決 TBT 3,680 ms 的唯一根本方法。

4. **等待確認：** 對 three.core.js 和 vendor-three.module.js 做 Tree-shaking，只打包 renderer.js 實際使用的 Three.js 模組，預計可將 JS 體積縮小 40–55%。

### P3 — 進階優化

5. **等待確認：** 對 renderer.js、app.js、GLTFLoader.js 實施 lazy loading（動態 import），將非首屏所需的程式碼延遲到使用者互動後才載入。

6. **等待確認：** 在 lm402.html 加入 `<link rel="modulepreload">` 預載入 Three.js 核心模組，讓瀏覽器在 HTML parse 完成後立即開始載入，減少網路等待時間。

---

> 本報告為純診斷分析，未修改任何源碼。
> 基準數據來源：`lm402-desktop.report.json` + `lm402-mobile.report.json`（2026-04-09）
