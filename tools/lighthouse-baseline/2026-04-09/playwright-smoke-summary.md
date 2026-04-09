# Playwright 三瀏覽器 Smoke Test 報告

> 最後更新：2026-04-09（Task 1 revert + Task 2 sandbox fix + Task 3 LCP 優化後）
> 執行指令：`npx playwright test tools/smoke-tests/smoke.spec.js --config tools/smoke-tests/playwright.config.js`
> 目標網址：https://toniliumvp.github.io/RedTime/

---

## 最終結果

**10 通過 / 2 失敗**（2 個均為 Chromium headless WebGL 環境限制，非生產 bug）

| 頁面 | Chromium | Firefox | WebKit |
|------|----------|---------|--------|
| index | ✅ | ✅ | ✅ |
| reader | ✅ | ✅ | ✅ |
| **lm402** | ❌ WebGL | **✅** | **✅** |
| platform-run | ❌ canvas timeout | **✅** | **✅** |

---

## 歷次結果對比

| 版本 | Firefox lm402 | WebKit lm402 | WebKit index sandbox |
|------|---------------|--------------|----------------------|
| 初次（有 regression） | ❌ `t is not defined` | ❌ `Can't find variable: t` | ⚠️ allow-presentation 警告 |
| 本次（revert 後） | ✅ 通過 | ✅ 通過 | ✅ 警告已消除 |

---

## 本次任務執行的修改

### Task 1 — Revert `2a9c4bb`（renderer.js 去壓縮化）

- **根因**：`2a9c4bb` 將 `import { WORLD as t }` 改為 `import { WORLD as WORLD_DATA }`，但 `createLm402Scene()` 函數體內 30+ 個 `t.frontDoor`、`t.backDoor`、`t.classroom` 參考未同步更新，Firefox/WebKit 嚴格模式下直接報 `t is not defined`
- **修復**：`git revert 2a9c4bb`（產生新 commit `fb4d98d`，保留歷史）
- **驗證**：Firefox ✅ WebKit ✅

### Task 2 — 移除 iframe sandbox 中無效的 `allow-presentation`

- **位置**：`index.html` 兩個 YouTube iframe（一眼瞬間微電影 + 原聲帶，第 2365、2418 行）
- **症狀**：WebKit console `Error while parsing the 'sandbox' attribute: 'allow-presentation' is an invalid sandbox flag.`
- **修復**：從兩個 iframe 的 `sandbox` 屬性中移除 `allow-presentation`，保留 `allow-scripts allow-same-origin allow-popups`
- **commit**：`6bd0f7b`

### Task 3 — LCP 保守優化（lm402.html）

#### 3A — font-display: swap
- `fonts/fonts.css` 已全部設定 `font-display: swap`，**無需修改** ✓

#### 3B — 關鍵字體 preload（commits `a325589` + `45fc6f2`）
- 在 `lm402.html` `<head>` 加入兩個首屏 loader 字體 preload：
  1. **Cormorant Garamond 300 normal latin**（loader title "LM402 · " 的 Latin 字元）
     → `fonts/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtKky2F7g.woff2`
  2. **Noto Sans TC 300 common-CJK subset**（loader tip 提示文字的常用中文字元，`.119` 子集）
     → `fonts/-nF7OG829Oofr2wohFbTp9iFOisNA_cTyNromxqQuEMQ2wHYwbnmy1R1jDujLebozBXCo2qYhRo.119.woff2`

#### 3C — ES module 載入時機
- `<script type="module">` 已內建 deferred，**無需修改** ✓

#### 3D — Loader skeleton 確認
- `lm402.html` 的 loader div（line 67-82）為純 HTML/CSS，不依賴 Three.js，開頁即顯示，**無需修改** ✓

---

## Chromium headless WebGL 失敗說明（既有問題，非 regression）

```
THREE.WebGLRenderer: A WebGL context could not be created.
Reason: BindToCurrentSequence failed (SwiftShader software renderer)
pageerror: Error creating WebGL context.
```

- **根本原因**：Playwright headless Chromium 使用 SwiftShader 軟體渲染器，WebGL context 建立失敗
- **真實瀏覽器行為**：有 GPU 的 Chrome 正常運作，不影響生產環境
- platform-run 的 canvas timeout 也是 WebGL 失敗的連鎖效應

---

## Commit 總覽

| Commit | 說明 |
|--------|------|
| `fb4d98d` | Revert "refactor: renderer.js 去壓縮化" — Task 1 |
| `6bd0f7b` | fix: 移除 iframe sandbox 中無效的 allow-presentation 旗標 — Task 2 |
| `a325589` | perf(lm402): 加入 Cormorant Garamond 300 latin woff2 preload — Task 3B |
| `45fc6f2` | perf(lm402): 修正 font preload — Cormorant Garamond 300 + Noto Sans TC 300 — Task 3B |
