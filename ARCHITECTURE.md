# ARCHITECTURE.md — 時間裡的兩個妳 · 架構與依賴方向

> 學自 PTT「70/30 法則 + 嚴格依賴方向」+ ASCII 箭頭圖。
> 寫死依賴方向避免未來循環依賴。
> 變更需要 ADR(本檔最後 § 變更原則)。
>
> 最後更新:2026-05-02(round-3 follow-up #4)

---

## 🎯 70/30 法則(本專案配置)

| 比例 | 內容 |
|---|---|
| **70%** | **WebGL2 渲染管線 + Three.js 組裝**(三線共用核心) |
| **30%** | **Narrative / 互動 / UI / 跨線分工** |

不應該突破 70/30 的場景:**任何「炫技為主」改動超過 70% 預算 → 該重新評估是否該做**。

---

## 🏗 三線分工架構

```
                    ┌─────────────────────────────┐
                    │   index.html(入口 hub)       │
                    │   reader.html(故事完整版)    │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
        ┌───────▼────────┐ ┌──────▼─────────┐ ┌─────▼──────────┐
        │  lm402.html    │ │ lm402-twin.html│ │ lm402-parallel │
        │  (正本)         │ │  (雙時空)       │ │  .html         │
        │  穩定保守升級    │ │  WebGL2 走極限  │ │  (平行世界)     │
        │  半寫實         │ │  意識菜市場     │ │  WebGPU 改造    │
        └───────┬────────┘ └──────┬─────────┘ └─────┬──────────┘
                │                  │                  │
        ┌───────▼────────┐ ┌──────▼─────────┐ ┌─────▼──────────┐
        │ assets/lm402/  │ │assets/         │ │assets/         │
        │   (12 模組)     │ │ lm402-twin/   │ │ lm402-parallel/│
        │                │ │  (16 模組)     │ │  (12 模組)      │
        └────────────────┘ └────────────────┘ └────────────────┘
```

每線 assets 目錄獨立,可平行演化(toni 規則「正本不動,新功能先副本實驗」)。

---

## 📐 模組依賴方向(嚴格,不可違反)

### LM402 正本(assets/lm402/)

```
┌─────────────────────────────────────────────────────────┐
│  data.js          (場景資料 + 劇情對話 — toni 親寫)        │
└──────────────────────┬──────────────────────────────────┘
                       │ 唯讀載入
                       ▼
┌─────────────────────────────────────────────────────────┐
│  three.core.js     (Three.js 核心 — vendor,勿動)         │
│  envmap-sunset.js  (HDR IBL)                             │
│  GLTFLoader.js     (vendor)                              │
│  junior-materials-hr.js                                  │
│  expression-rig.js                                       │
│  cloth-rig.js                                            │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  postfx.js         (Tier 5/6/7 後製管線)                  │
│  postfx-focus.js   (Hex bokeh)                           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  renderer.js       (場景組裝 + 渲染主迴圈)                 │
│  polaroid.js                                             │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  app.js            (應用程式邏輯 + UI 整合)                │
└─────────────────────────────────────────────────────────┘
```

**規則(嚴格)**:
1. `data.js` 不依賴任何其他模組(純資料 + 文字)
2. Three.js / vendor 不依賴專案模組
3. `renderer.js` 可以 import 上層所有模組,但不可被 `data.js` 反向依賴
4. `app.js` 是 top of stack,只 import 不被其他模組 import

### LM402-twin 雙時空(assets/lm402-twin/)

正本所有 + 額外:
- `consciousness-lights.js`(B3 5 盞光柱)
- `consciousness-particles.js`(B2 150 粒子)
- `consciousness-text.js`(B4 12 sprite)
- `narrative-audio.js`(H7+H8 BGM)
- `narrative-letter.js`(H6 書信日記)
- `initiated-interactions.js`(C8 學妹發起)
- `environment-presets.js`(E3 季節時間)

依賴方向同正本,意識菜市場/敘事/互動模組層級 = `postfx.js` 同層。

### LM402-parallel 平行世界(assets/lm402-parallel/)

正本所有,但渲染管線將改為:
- `three.core.js` → `three-webgpu.js`(F1.2)
- `postfx.js`(GLSL ShaderMaterial)→ `postfx-wgsl.js`(F3)
- 新增 `compute-shaders/`(F4)

當前狀態:F1.1 偵測 + fallback 完成,F1.2-F4 待 sprint。

---

## 🔐 安全 + 紀律不變式

### 1. 故事文本只讀
- `data.js` / `reader.html` / `index.html` 故事段落 — **永遠不可自行修改**(CLAUDE.md 動工紀律 #2)
- pre-commit hook(`.githooks/pre-commit`)會擋
- toni 本人改 → `git commit --no-verify`

### 2. innerHTML 條件式安全(reader.html L6668)
- ✅ 安全前提:`ep.html` 編譯期從 `data.js` 載入
- ❌ 危險前提:未來改 fetch / API / postMessage / CMS
- 如未來改動態 → 必引入 DOMPurify + ALLOWED_TAGS 白名單

### 3. CSP unsafe-inline 收斂
- `default-src 'self'`(無 unsafe-inline)
- `script-src 'self' 'unsafe-inline' https://www.youtube.com`
- `style-src 'self' 'unsafe-inline'`
- 加 `base-uri 'self'` / `form-action 'self'` / `object-src 'none'`

### 4. nuclear default(M18 教訓)
- 多 effect 共用同 anchor + AdditiveBlending → 預設值 = 0
- console opt-in(`__TWIN_BALANCE__('low')` 一鍵試起點)

---

## 🎚 console API 邊界

跨三線都支援:
- `__POSTFX__.tuning` — 後製管線
- `__JUNIOR_RIG__.state` — 表情 + 互動
- `__CLOTH_RIG__.tuning` — 布料

雙時空 only:
- `__CONSC_LIGHTS__` / `__CONSC_PARTICLES__` / `__CONSC_TEXT__` — 意識菜市場
- `__TWIN_BALANCE__('off'|'low'|'mid'|'high')` — 一鍵 preset(round-3 follow-up #3)
- `__NARRATIVE__` / `__TRANSITIONS__` / `__LETTER__` / `__AUDIO_LAYER__` / `__INITIATED__` / `__ENV__` — 各 H/C/E 系列

console API 是「玩家/debug 工具」,不應該替代 source code 邏輯。

---

## 🛠 sync + daemon 基礎架構

```
┌──────────────────────────────┐
│  Mac Mini M4(SMB,副本)       │
│  /Volumes/Mac Mini M4/Red Time│
└──────────────┬───────────────┘
               │ 60s 自動雙向 sync
               │ (multi-PROBE max mtime + 30min force-sync 雙保險)
               ▼
┌──────────────────────────────┐
│  /Volumes/Work/RedTime(APFS) │
│  主開發位置(commit + push)    │
└──────────────┬───────────────┘
               │ git push
               ▼
┌──────────────────────────────┐
│  GitHub origin/main          │
│  toniLiuMVP/RedTime          │
│  → GitHub Pages 部署          │
└──────────────────────────────┘
```

工具:
- `bash sync.sh status / both / pull / push`
- `bash sync.sh --daemon-status / --audit`(round-3 follow-up #2)
- `~/Library/Scripts/redtime_autosync/sync_daemon.sh`(部署版 daemon,不在 repo)

---

## 📝 變更原則(輕量 ADR)

任何架構級改動都該:
1. 先 grep / read 確認當前狀態
2. 在 PENDING.md 加 🆕 標記討論
3. 動工前 commit(基準點)+ 動工後 commit(變動點)— 兩 commit 之間是「architectural diff」
4. 動工後更新本檔(ARCHITECTURE.md)

不需要正式 ADR 文件(本專案規模),但 commit message 該寫「為什麼」(學自 PTT 70/30 法則精神)。

---

## 🔗 跨專案參考

學自:
- **PTT 70/30 法則 + 嚴格依賴方向 ASCII 圖**
- **LD pre_commit_check.sh 規則 codify**
- **PAL launchd daemon trio 設計**

被 RedTime 倒流到廣場的:
- 廣場 lessons/macos_tcc_daemon_subtleties.md case (c) PROBE 設計盲點(round-3)
- ALLRM_PROTOCOL.md Step 1 daemon health probe(採納 CPBL2 提案)
