# Playwright 三瀏覽器 Smoke Test 報告（更新版）

**第一次執行**：2026-04-09（發現問題）  
**最終執行**：2026-04-09（修復後驗證）  
**Playwright 版本**：1.58.2  
**目標網址**：https://toniliumvp.github.io/RedTime/  
**瀏覽器版本**：Chromium 145.0.7632.6 / Firefox 146.0.1 / WebKit 26.0  

---

## 最終 Pass/Fail 矩陣（修復後）

| 頁面 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| 首頁 `/` | ✅ | ✅ | ✅ |
| `/reader.html` | ✅ | ✅ | ✅ |
| `/lm402.html` | ❌ | ✅ | ✅ |
| `/demos/platform-run/index.html` | ❌ | ✅ | ✅ |

**最終**：10 通過 / 2 失敗（均為 Chromium headless WebGL 環境限制，非生產 bug）

> **對比昨天首次結果**：7通過/4失敗/1閃爍 → **10通過/2失敗/0閃爍**
> Firefox lm402 ✅、WebKit lm402 ✅、WebKit platform-run 穩定 ✅

---

## 修復歷程

### 修復項目 1：`t is not defined`（Firefox + WebKit lm402 壞掉）
- **commit** `fb4d98d` — Revert "refactor: renderer.js 去壓縮化（變數與函數語意化命名）"
- **原因**：`2a9c4bb` 的 renderer.js 去壓縮化操作，在 Firefox 和 WebKit 下引發 `t is not defined` pageerror，導致 lm402 整頁崩潰
- **做法**：完整 revert 整個 refactor commit，回到原本正常運作的壓縮版

### 修復項目 2：WebKit index `allow-presentation` sandbox 警告
- **commit** `6bd0f7b` — fix: 移除 iframe sandbox 中無效的 allow-presentation 旗標
- **原因**：index.html 的 iframe sandbox 屬性含 `allow-presentation`，WebKit 不接受此旗標
- **做法**：從 sandbox 屬性移除 `allow-presentation`

### 優化項目：LCP 相關保守優化
- **Task 3-A**：fonts.css 全部 790 個 `@font-face` 已有 `font-display: swap`，無需改動
- **Task 3-B**：`perf(lm402): 修正字體 preload`（commit `aa752fe`）
  - 原 preload 指向 Cormorant Garamond（lm402 完全未使用）
  - 改為 Noto Sans TC `.119.woff2`（w300/400 共用，覆蓋 ASCII + 常用 CJK）+ DM Mono（w500 latin）
- **Task 3-C**：`<script type="module">` 預設即為 defer，無需額外修改
- **Task 3-D**：Loader skeleton 純 CSS/HTML，不依賴 Three.js，無需修改

---

## 各頁面詳細結果（最終版）

### 首頁 `/`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ✅ | ✅ | ✅ |
| 導覽連結可見 | ✅ | ✅ | ✅ |
| Service Worker 已註冊 | ✅ | ✅ | ✅ |
| 截圖 | ✅ | ✅ | ✅ |

**全部通過。** `allow-presentation` 修復後 WebKit 首頁無 console error。

---

### `/reader.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ✅ | ✅ | ✅ |
| `#ap-slider` 存在 + aria-label | ✅ | ✅ | ✅ |
| `#resume-card` 存在（DOM attached） | ✅ | ✅ | ✅ |
| `.nav-home-btn` 存在 + aria-label | ✅ | ✅ | ✅ |
| 截圖 | ✅ | ✅ | ✅ |

**三瀏覽器全部通過。**

---

### `/lm402.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| Three.js canvas 存在 | ✅ | ✅ | ✅ |
| Pointer Lock API 偵測 | ✅ 支援 | ✅ 支援 | ✅ 支援 |
| Web Audio API 偵測 | ✅ | ✅ | ✅ |
| pageerror 無 | ❌ WebGL | ✅ | ✅ |
| 截圖 | ✅（有錯） | ✅ | ✅ |

**Firefox 和 WebKit 已全數通過（revert 後 `t is not defined` 消失）。**

#### Chromium 剩餘問題（環境限制，非生產 bug）

```
THREE.WebGLRenderer: A WebGL context could not be created.
Reason: BindToCurrentSequence failed (SwiftShader software renderer)
pageerror: Error creating WebGL context.
```

- **根本原因**：Playwright headless Chromium 使用 SwiftShader 軟體渲染器，WebGL context 建立失敗
- **真實瀏覽器行為**：有 GPU 的 Chrome 正常運作，不影響生產環境

#### Pointer Lock 分支確認

| 瀏覽器 | API 存在 | requestPointerLock 函數 | 判斷 |
|--------|:---:|:---:|:---|
| Chromium | ✅ | ✅ | 走鎖定分支（WebGL 先崩，未真正執行） |
| Firefox | ✅ | ✅ | 走鎖定分支，功能正常 |
| WebKit | ✅ | ✅ | 走鎖定分支（headless 無法驗證實際鎖定行為） |

---

### `/demos/platform-run/index.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ❌（WebGL 失敗） | ✅ | ✅ |
| canvas 存在 | ❌（未出現） | ✅ | ✅ |
| canvas aria-label | N/A | ✅ `"平台跑酷遊戲畫面"` | ✅ `"平台跑酷遊戲畫面"` |
| 截圖 | ❌ | ✅ | ✅ |

**Firefox 和 WebKit 全通過。Chromium 因 WebGL headless 問題失敗（環境限制）。**

---

## 跨瀏覽器差異彙整（最終）

| 差異項目 | Chromium | Firefox | WebKit | 狀態 |
|---------|---------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | 無問題 |
| WebGL (headless) | ❌ | ✅ | ✅ | Chromium SwiftShader 環境限制 |
| `t is not defined` JS error | - | ✅已修 | ✅已修 | ✅ revert 後消失 |
| `allow-presentation` sandbox | 無影響 | 無影響 | ✅已修 | ✅ 移除後 WebKit 無警告 |
| Pointer Lock API 存在 | ✅ | ✅ | ✅ | 三者均有 |
| Web Audio API 存在 | ✅ | ✅ | ✅ | 三者均有 |
| platform-run canvas aria-label | N/A | ✅ | ✅ | A11y 修正有效 |

---

## 截圖清單（最終）

```
output/smoke/
├── chromium/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   └── lm402.png        ✅（有 WebGL 錯誤）
│   └── platform-run.png ❌（未生成，WebGL 失敗）
├── firefox/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   ├── lm402.png        ✅
│   └── platform-run.png ✅
├── webkit/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   ├── lm402.png        ✅
│   └── platform-run.png ✅
└── console-log.json     ✅（24 筆，均為 Chromium WebGL 環境錯誤）
```

---

## 結論

原本壞掉的兩個問題已全部修復：
1. **Firefox + WebKit lm402 `t is not defined`** → revert renderer.js refactor ✅
2. **WebKit 首頁 `allow-presentation` sandbox 警告** → 移除無效屬性 ✅

剩餘的 2 個 fail 均是 **Chromium headless SwiftShader 環境限制**，不影響真實瀏覽器（Chrome）正常使用。
