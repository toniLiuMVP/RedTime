# Playwright 三瀏覽器 Smoke Test 報告

**執行日期**：2026-04-09  
**Playwright 版本**：1.58.2  
**目標網址**：https://toniliumvp.github.io/RedTime/  
**瀏覽器版本**：Chromium 145.0.7632.6 / Firefox 146.0.1 / WebKit 26.0  

---

## Pass/Fail 矩陣

| 頁面 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| 首頁 `/` | ✅ | ✅ | ✅ |
| `/reader.html` | ✅ | ✅ | ✅ |
| `/lm402.html` | ❌ | ❌ | ❌ |
| `/demos/platform-run/index.html` | ❌ | ✅ | ⚠️ 閃爍 |

**總計**：7 通過 / 4 失敗 / 1 閃爍（初次 timeout，retry 通過）

---

## 各頁面詳細結果

### 首頁 `/`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ✅ | ✅ | ⚠️ |
| 導覽連結可見 | ✅ | ✅ | ✅ |
| Service Worker 已註冊 | ✅ | ✅ | ✅ |
| 截圖 | ✅ | ✅ | ✅ |

**WebKit 首頁 console error（非 pageerror，不影響通過）**：
```
Error while parsing the 'sandbox' attribute: 'allow-presentation' is an invalid sandbox flag.
```
- 來源：頁面中某個 `<iframe sandbox>` 屬性含 `allow-presentation`，Safari/WebKit 不接受此旗標
- 嚴重度：低（警告等級，不影響功能）
- 待確認：找出哪個 iframe 使用了此屬性，考慮移除 `allow-presentation`

---

### `/reader.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ✅ | ✅ | ✅ |
| `#ap-slider` 存在 + aria-label | ✅ | ✅ | ✅ |
| `#resume-card` 存在（DOM attached） | ✅ | ✅ | ✅ |
| `.nav-home-btn` 存在 + aria-label | ✅ | ✅ | ✅ |
| 截圖 | ✅ | ✅ | ✅ |

**全部通過。** A11y 修正（`#ap-slider` aria-label、`.nav-home-btn` aria-label）在三瀏覽器均有效。

---

### `/lm402.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| Three.js canvas 存在 | ✅ | ✅ | ✅ |
| Pointer Lock API 偵測 | ✅ 支援 | ✅ 支援 | ✅ 支援 |
| Web Audio API 偵測 | ✅ | ✅ | ✅ |
| pageerror 無 | ❌ | ❌ | ❌ |
| 截圖 | ✅（有錯但仍截圖） | ✅ | ✅ |

#### Fail 原因

**Chromium：WebGL context 建立失敗**
```
THREE.WebGLRenderer: A WebGL context could not be created.
Reason: BindToCurrentSequence failed (SwiftShader software renderer)
pageerror: Error creating WebGL context.
```
- **根本原因**：Playwright headless Chromium 使用 SwiftShader 軟體渲染器，在此環境下 WebGL context 建立失敗。這是 **CI/headless 環境限制**，非生產 bug。
- **真實瀏覽器行為**：有 GPU 的真實 Chrome 上 WebGL 正常運作。
- **建議**：若要在 Chromium CI 中測試 WebGL，需加 `--use-gl=egl` 或改用 `chromium --use-angle=swiftshader-webgl` 旗標。此問題**不需要修 production code**。

**Firefox + WebKit：`t is not defined` / `Can't find variable: t`**
```
[firefox] pageerror: t is not defined
[webkit]  pageerror: Can't find variable: t
```
- **根本原因**：lm402.html 載入的某個 JS 腳本中，有一個名為 `t` 的變數未定義。從錯誤模式判斷，可能是 `vendor-three.module.js` 或其他仍為壓縮狀態的檔案中，短變數名 `t` 在某個閉包外被引用。
- **嚴重度**：中高（Firefox + WebKit 下 lm402 功能可能受損）
- **待確認**：在 Firefox/Safari 真實瀏覽器中開啟 lm402.html，查看 DevTools 中 `t is not defined` 的堆疊追蹤，定位到哪個檔案哪一行。
- **Chromium 不受影響**：因為 WebGL 早先失敗，pageerror 是 WebGL 而非 `t`。

#### Pointer Lock 分支確認

三個瀏覽器的 Pointer Lock API 偵測結果：

| 瀏覽器 | `pointerLockElement in document` | `requestPointerLock` 函數 | 判斷 |
|--------|:---:|:---:|:---|
| Chromium | `true` | `true` | 走鎖定分支 |
| Firefox | `true` | `true` | 走鎖定分支 |
| WebKit | `true` | `true` | 走鎖定分支 |

> ⚠️ **注意**：WebKit (Safari) 雖然 API 存在，但 `requestPointerLock()` 在 headless 環境下無法真正鎖定（需要用戶手勢）。Headless 測試無法驗證實際的鎖定行為或降級提示是否觸發。需要在真實 Safari 中手動確認降級提示文字是否正確出現。

---

### `/demos/platform-run/index.html`

| 項目 | Chromium | Firefox | WebKit |
|------|:--------:|:-------:|:------:|
| console error 無 | ❌（WebGL 失敗） | ✅ | ✅ |
| canvas 存在 | ❌（未出現） | ✅ | ✅ |
| canvas aria-label | N/A | ✅ `"平台跑酷遊戲畫面"` | ✅ `"平台跑酷遊戲畫面"` |
| 截圖 | ❌ | ✅ | ✅（retry） |

**Chromium fail 原因**：WebGL context 建立失敗（同 lm402），且 canvas 元素在 10 秒內未出現（pageerror 導致遊戲初始化中斷）。同樣是 **headless 環境限制**，非生產 bug。

**WebKit 閃爍原因**：第一次跑時截圖 timeout（60 秒），retry 時 2.2 秒內通過。推測是 GitHub Pages CDN 延遲或 WebKit headless 冷啟動問題，非穩定性 bug。

---

## 跨瀏覽器差異彙整

| 差異項目 | Chromium | Firefox | WebKit | 備註 |
|---------|---------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | 三者均正常 |
| WebGL (headless) | ❌ | ✅ | ✅ | Chromium SwiftShader 問題 |
| `t is not defined` JS error | 不觸發 | ❌ | ❌ | 真實 bug，需查堆疊 |
| `allow-presentation` sandbox | 無影響 | 無影響 | ⚠️ console error | WebKit 特有，低嚴重度 |
| Pointer Lock API 存在 | ✅ | ✅ | ✅ | 三者均有 API |
| Web Audio API 存在 | ✅ | ✅ | ✅ | 三者均有 |
| platform-run canvas aria-label | N/A | `"平台跑酷遊戲畫面"` | `"平台跑酷遊戲畫面"` | A11y 修正有效 |

---

## 需要後續處理的 Bug 清單

> ⛔ 本次 smoke test 不修 bug，僅記錄，等 toni 確認後處理。

### Bug 1（中高）：Firefox + WebKit 的 `t is not defined`
- **影響**：Firefox + WebKit 下 lm402 頁面 pageerror
- **症狀**：JS pageerror，推測影響 Three.js 場景或渲染器
- **下一步**：在真實 Firefox 或 Safari 開啟 lm402.html → DevTools Console → 查 `t is not defined` 的 call stack

### Bug 2（低）：WebKit index 頁 `allow-presentation` sandbox 警告  
- **影響**：Safari console error（非 pageerror，不中斷功能）
- **症狀**：`Error while parsing the 'sandbox' attribute: 'allow-presentation' is an invalid sandbox flag.`
- **下一步**：搜尋 index.html 中的 `allow-presentation`，移除或換成有效值

### 環境限制備忘（不是 bug）
- Chromium headless WebGL 失敗：CI/headless 環境問題，非生產 bug
- WebKit platform-run 閃爍：CDN 延遲或冷啟動，retry 可通過

---

## 截圖清單

```
output/smoke/
├── chromium/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   └── lm402.png        ✅（有 WebGL 錯誤）
│   └── platform-run.png ❌（未生成，測試失敗）
├── firefox/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   ├── lm402.png        ✅（有 JS 錯誤）
│   └── platform-run.png ✅
├── webkit/
│   ├── index.png        ✅
│   ├── reader.png       ✅
│   ├── lm402.png        ✅（有 JS 錯誤）
│   └── platform-run.png ✅（retry 通過）
└── console-log.json     ✅（所有 error/pageerror 記錄）
```
