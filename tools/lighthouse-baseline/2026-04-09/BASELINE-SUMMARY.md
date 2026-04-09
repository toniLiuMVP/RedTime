# Lighthouse Baseline — 時間裡的兩個妳
> 測量日期：2026-04-09  
> 工具：npx lighthouse 13.1.0（Headless Chrome）  
> 網址基底：https://toniliumvp.github.io/RedTime/

---

## 分數總覽

### Desktop（桌面）

| 頁面 | Performance | Accessibility | Best Practices | SEO | PWA |
|------|:-----------:|:-------------:|:--------------:|:---:|:---:|
| index.html（首頁）| 58 🔴 | 100 ✅ | 96 ✅ | 100 ✅ | — |
| reader.html（閱讀頁）| 75 🔴 | 94 🔴 | 81 🔴 | 100 ✅ | — |
| lm402.html（LM402 3D）| 44 🔴 | 100 ✅ | 96 ✅ | 100 ✅ | — |
| demos/platform-run/（遊戲）| 68 🔴 | 91 🔴 | 96 ✅ | 100 ✅ | — |

### Mobile（行動裝置）

| 頁面 | Performance | Accessibility | Best Practices | SEO | PWA |
|------|:-----------:|:-------------:|:--------------:|:---:|:---:|
| index.html（首頁）| 55 🔴 | 100 ✅ | 96 ✅ | 100 ✅ | — |
| reader.html（閱讀頁）| 55 🔴 | 89 🔴 | 81 🔴 | 100 ✅ | — |
| lm402.html（LM402 3D）| 69 🔴 | 100 ✅ | 96 ✅ | 100 ✅ | — |
| demos/platform-run/（遊戲）| 44 🔴 | 91 🔴 | 96 ✅ | 100 ✅ | — |

> 🔴 = 低於門檻（Performance < 90，Accessibility < 95）  
> ✅ = 通過  
> — = PWA 未設定（manifest/service worker 缺失）

---

## 關鍵指標摘要（Desktop）

| 頁面 | FCP | LCP | TBT | CLS | SI |
|------|-----|-----|-----|-----|----|
| index.html | 4.0 s | 4.9 s | 0 ms | 0 | 4.8 s |
| reader.html | ~2.x s | — | — | — | — |
| lm402.html | — | — | TBT 重（主執行緒 5.6 s）| — | — |
| platform-run | — | — | — | — | — |

---

## 紅點分析

### 所有頁面 Performance 均低於 90
Performance 全軍覆沒，共同問題：

| 問題 | 影響頁面 | 可節省 |
|------|----------|--------|
| Reduce unused CSS | 全部 4 頁 | 236–252 KiB |
| Minify CSS | 全部 4 頁 | 30–36 KiB |
| Reduce unused JavaScript | lm402 / platform-run | 133–309 KiB |
| Minify JavaScript | platform-run | ~79 KiB |
| Main-thread work / JS execution | lm402（最嚴重） | 5.6 s / 5.2 s |
| LCP 過慢 | index（4.9 s） | — |

### Accessibility 紅點

| 頁面 | Desktop | Mobile | 可能原因 |
|------|---------|--------|---------|
| reader.html | 94 🔴 | 89 🔴 | 元素 contrast / aria 屬性缺失（待查）|
| platform-run | 91 🔴 | 91 🔴 | canvas 或遊戲 UI 缺少 aria label |

### Best Practices 紅點

| 頁面 | 分數 | 可能原因 |
|------|------|---------|
| reader.html | 81 🔴 | console 錯誤 / deprecated API / HTTP 請求 |

---

## 建議修復清單（未動手，等 toni 確認）

優先度高（影響 Performance，改了分數最明顯）：
1. **CSS 未使用規則清理** — 跨四頁共同問題，可用 PurgeCSS 或手動移除
2. **CSS / JS 壓縮（minify）** — 靜態網站建置時加一步壓縮即可
3. **lm402：延遲載入 Three.js** — 將 GLTFLoader / vendor-three 改為動態 import 或 defer

優先度中（Accessibility）：
4. **reader.html**：補缺失的 `alt` 屬性、`aria-label`，提高 contrast ratio
5. **platform-run**：canvas 元素加 `aria-label`，按鈕補 accessible name

優先度低（Best Practices）：
6. **reader.html**：排查 console 錯誤（分數 81 偏低，通常是 JS 錯誤或 deprecated API）

---

## 原始報告檔案

```
tools/lighthouse-baseline/2026-04-09/
├── index-desktop.report.html / .json
├── index-mobile.report.html  / .json
├── reader-desktop.report.html / .json
├── reader-mobile.report.html  / .json
├── lm402-desktop.report.html / .json
├── lm402-mobile.report.html  / .json
├── platform-desktop.report.html / .json
└── platform-mobile.report.html  / .json
```

> 原始報告已加入 `.gitignore`，不上傳 GitHub。僅此 summary 進版本控制。
