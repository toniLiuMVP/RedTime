# reader.html — Best Practices 診斷報告

> 診斷日期：2026-04-09  
> 報告來源：`reader-desktop.report.json`（Lighthouse desktop 模擬）  
> **診斷僅供參考，等 toni 確認後再修**

---

## 整體 Best Practices 分數

| 項目 | 數值 |
|------|------|
| **總分** | **81 / 100**（0.81）|
| 計分方式 | 加權平均（僅計算 weight > 0 的審計項） |
| 有效總權重 | 26 |
| 加權得分 | 21 |
| 實際分數計算 | 21 ÷ 26 = **0.8077 ≈ 81** |

---

## 根本原因分析

### 扣分元兇：只有一個

| 審計 ID | 說明 | 分數 | 權重 | 扣分 |
|---------|------|------|------|------|
| `deprecations` | 使用了已棄用的 CSS/JS API | **0**（失敗） | 5 | -5 分（共 26 權重中損失 5） |

- 其他所有有效權重的審計項**全部通過**（score = 1）
- 沒有 console error、沒有 inspector issues、沒有第三方 cookies 問題
- **score 81 = 100% 由 `deprecations` 的失敗造成**

---

## 通過的審計項（score = 1）

| 審計 ID | 標題 | 權重 | 群組 |
|---------|------|------|------|
| `is-on-https` | 使用 HTTPS | 5 | trust-safety |
| `geolocation-on-start` | 不在載入時要求地理位置權限 | 1 | trust-safety |
| `notification-on-start` | 不在載入時要求通知權限 | 1 | trust-safety |
| `paste-preventing-inputs` | 允許使用者貼上文字到輸入框 | 3 | ux |
| `image-aspect-ratio` | 圖片顯示比例正確 | 1 | ux |
| `image-size-responsive` | 圖片解析度適當 | 1 | ux |
| `doctype` | HTML 有正確 doctype | 1 | browser-compat |
| `charset` | charset 定義正確 | 1 | browser-compat |
| `third-party-cookies` | 無第三方 cookies | 5 | general |
| `errors-in-console` | 無 console 錯誤 | 1 | general |
| `inspector-issues` | Chrome DevTools Issues 面板無問題 | 1 | general |

---

## 不計分的審計項（weight = 0 或 notApplicable）

| 審計 ID | 標題 | 狀態 |
|---------|------|------|
| `redirects-http` | HTTP 重導至 HTTPS | notApplicable（GitHub Pages 自動處理）|
| `csp-xss` | CSP 防 XSS | informative（分數 1，僅參考）|
| `has-hsts` | HSTS 政策 | informative |
| `origin-isolation` | COOP 原始碼隔離 | informative |
| `clickjacking-mitigation` | XFO/CSP 防 clickjacking | informative |
| `trusted-types-xss` | Trusted Types | informative |
| `baseline` | Baseline 功能 | informative |
| `js-libraries` | 偵測到的 JS 函式庫 | notApplicable（無偵測到函式庫）|
| `valid-source-maps` | Source maps 有效性 | 通過（不計分）|

---

## 失敗審計詳情

### `deprecations` — 使用了已棄用的 API

- **標題**：Uses deprecated APIs
- **分數**：0（失敗）
- **權重**：5
- **顯示訊息**：`1 warning found`
- **Lighthouse 說明**：已棄用的 API 將在未來版本的瀏覽器中移除。

#### 失敗項目詳細資訊

| 欄位 | 內容 |
|------|------|
| **警告訊息** | `CSS appearance value slider-vertical is not standardized and will be removed.` |
| **來源頁面** | `https://toniliumvp.github.io/RedTime/reader.html` |
| **來源行號** | 第 **4154** 行（column: -1，表示為行內整行問題）|
| **相關規格** | CSS `appearance: slider-vertical`（非標準值）|
| **Chrome 狀態頁** | https://chromestatus.com/feature/6001359429566464 |

#### 問題說明

`appearance: slider-vertical` 是一個**非標準的 CSS 屬性值**，曾被 WebKit/Blink 瀏覽器支援，用於讓 `<input type="range">` 顯示為垂直滑桿。

該值從未進入 CSS 標準，Chrome 已計劃移除此支援（詳見 chromestatus feature 6001359429566464）。

**正確的替代做法**（等 toni 確認後再修）：
```css
/* 舊（已棄用）*/
input[type="range"] {
  -webkit-appearance: slider-vertical;
  appearance: slider-vertical;
}

/* 新（標準做法）*/
input[type="range"] {
  writing-mode: vertical-lr; /* 或 vertical-rl */
  direction: rtl;
}
```

---

## 其他無問題的重點審計（供參考）

### `errors-in-console`（通過，score = 1）
- 無任何 console 錯誤或警告被 Lighthouse 偵測到
- `items` 陣列為空

### `js-libraries`（不適用，notApplicable）
- Lighthouse 未偵測到任何已知的前端 JavaScript 函式庫
- 無脆弱版本問題

### `inspector-issues`（通過，score = 1）
- Chrome DevTools Issues 面板無任何問題
- `items` 陣列為空

---

## 結論

**81 分的原因只有一個：`appearance: slider-vertical` 這個已棄用的 CSS 非標準值。**

修復後預期分數可達 **100 / 100**（26/26 加權得分）。

修復位置：`reader.html` 第 4154 行附近（需確認確切的 CSS 規則位置）。

> **診斷僅供參考，等 toni 確認後再修**
