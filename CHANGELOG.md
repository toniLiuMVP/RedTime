# CHANGELOG.md — 時間裡的兩個妳 · 變動歷史

> 學自 JYQXZ 等姊妹專案的 CHANGELOG 慣例。
> 詳細 commit 級進度看 git log；本檔給「user-facing」變動摘要。

---

## [Unreleased] — 2026-04-30

### 加入

- **三線分工架構**：正本 LM402 / 雙時空 LM402-twin / 平行世界 LM402-parallel
- **跨平台啟動腳本**：`啟動.command`（Mac/Linux）+ `啟動.bat`（Windows），預設埠 8200-8210 避衝突
- **自動化備份**：`backup.sh` 取代手動 GO + All Backup
- **文件補強**：README / PENDING / ROADMAP / CHANGELOG（從 PAL_2026 / JYQXZ / LD / PTT 等姊妹專案學到）

### 變更

- CLAUDE.md 加跨專案 lessons 段 + console API 表格擴充

---

## v1.0 雙時空全套 — 2026-04-30

### 加入

#### 雙時空意識菜市場 · 三派齊全
- **B3 光柱派**：5 盞不同年紀色彩 SpotLight（暖橙青春 / 暖白現在 / 淡綠記憶 / 淡紫夢境 / 月光藍未來）
- **B2 粒子派**：150 個記憶碎片 Three.js Points + 自訂 ShaderMaterial
- **B4 文字派**：12 sprite 漂浮 toni 原文短句（5 個年紀 15 句精選）

#### 雙時空 A 系列 · 視覺極限 6/7
- **A1** Skin SSS 強化（simplified dual-SSS approximation）
- **A2** Hair Marschner approximation（雙層高光 PBR）
- **A3** Iris parallax（凸面 normal map 球面深度感）
- **A4** Skin pore detail（512 解析度 + 280 毛孔窩 + 多層 noise）
- **A5** Volumetric Fog（後製大氣體積感）
- **A7** PCSS simplified（VSM 軟陰影推極限）
- A6 Motion blur 跳過（真做 5-7 天，效果有限）

#### 雙時空 H 系列 · 文學擴充 7/7
- **H1+H3** 字幕系統 + 打字機效果（含 8 個 narrative preset）
- **H2+H4** 章節 fade + 記憶閃回特效
- **H6** 書信日記模式（米色紙 + 多頁翻頁）
- **H7+H8** 環境音（程式生成風聲 + 鐘聲）+ 動態 BGM crossfade

#### 雙時空 C8 + E3
- **C8** 學妹發起互動（6 種情緒：greet/nervous/longing/shy/sigh/remember）
- **E3** 季節時間 5 preset（dusk/night/rainy/snowy/day，2s 平滑 lerp）

#### 平行世界 F1.1
- WebGPU detection + fallback overlay（Chrome 113+/Safari 17.4+ 引導）

---

## v0.9 短期擴充 — 2026-04-29

### 加入
- **C6** Hover/click 反應（surprise/shy/happy 三種點擊情緒）
- **C5** Gaze focus AI（player/world/daydream 三模式注視）
- **B8** Sweat/blush dynamic（情緒驅動皮膚變化）
- **F7** Rain on lens（鏡頭上 60 個雨滴 + 5 條流痕）
- **E10** Polaroid 拍照（拍立得樣式 + 年份戳記）

### 修復
- 關瀏覽器自動停音樂（`pagehide` + `visibilitychange` + `beforeunload` 三層 hook）
- Lens dirt 預設關閉（玩家反映白點干擾）

---

## v0.8 行為活感 + 軟陰影 — 2026-04-29

### 加入
- **Tier 8** 行為活感（Eye tracking + Saccade + Micro-expressions + Head wobble）
- **Tier 9.1** VSM 軟陰影（取代 PCFSoftShadowMap）

---

## v0.7 視覺終局 — 2026-04-28

### 加入
- **Tier 7** God Rays（screen-space）+ Lens Flare ghost + sun NDC 連動
- **Tier 6** Iridescence（cornea + iris + hair）+ Skin Emissive + Lens Dirt
- **Tier 5** 電影級後製（Hex bokeh / CA / Grain / Color Grade / MSAA）
- **Tier 4** 布料動態（spring + 風 + mass 漸減馬尾）
- **Tier 3** 表情系統（眨眼/嘴/微笑/揚眉/視線 + 自動 idle）
- **Tier 2** 半寫實升級（8 種材質 + 17 處 mesh 細節）
- **Tier 1** 渲染管線（黃昏 HDR IBL + Bloom/DOF/Vignette）

---

## v0.1 初始狀態 — 2026-04 之前

- LM402 場景 + 程式生成學妹（純 primitives 拼接）
- data.js 劇情文本完整
- reader.html 小說閱讀
- index.html 首頁

---

## 版本對應 commit

| 版本 | git commit |
|---|---|
| v1.0 雙時空全套 | `64decb6` 三線分工 → `b90b3fa` F1.1 |
| v0.9 短期擴充 | `c85c861` C6 → `e73e3b4` E10 |
| v0.8 行為活感 | `9299606` Tier 8 + 9.1 |
| v0.7 視覺終局 | `0c03e15` Tier 1-3 → `f2b735e` Tier 7 |

---

## 跨專案版本對齊

| LM402 | 對應姊妹專案版本 |
|---|---|
| v0.7 視覺終局 | PAL_2026 v1.0 / JYQXZ v1.0 |
| v1.0 雙時空全套 | JYQXZ v1.1（2026-04 同期） |
