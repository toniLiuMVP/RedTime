# PENDING.md — 時間裡的兩個妳 · 未完成項目清單

> 給未來 Claude Code session 一眼看清「還剩什麼沒做」。
> 學自 JYQXZ / PTT 等其他專案的 PENDING.md 慣例。

最後更新：2026-05-02（晚間：跨專案 lessons 整理 + LESSONS.md 建立）

---

## 🟢 已完成（不再列出）

詳見 [ROADMAP.md](ROADMAP.md) 跟 commit history。
累計 **35+ commits**，三線分工建置完成：
- 正本 LM402（穩定）
- 雙時空 LM402-twin（最豐富 + 第 3 輪 nuclear default 修復白塊）
- 平行世界 LM402-parallel（F1.1 detection 完成）

**最近 (2026-05-01)**：雙時空白塊修復 3 輪（commit `bf0e0c4` → `f284d3d` → `da94815` → `41ab5ed`）— 最終採 nuclear default：所有「可能造成過曝」的 effect 預設值 = 0，console opt-in。

---

## 🟡 雙時空 LM402-twin · 待做

### B2/B3/B4 平衡點調校（**新增 2026-05-02**）

| 項目 | 詳情 |
|---|---|
| **狀態** | 預設 0（不會蓋學妹），但「七嘴八舌」效果完全感受不到 |
| **目標** | 找「能感受到意識菜市場但不過曝」的甜蜜點 |
| **建議測試方法** | 三派分別 0.2/0.3/0.4 漸進測試，找學妹仍清晰可見的最高值 |
| **工程量** | 0.5 天（純調參數 + toni 實機反饋） |
| **優先級** | 高（影響雙時空核心體驗） |

### A6 真實 Motion Blur

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做（simplified 也沒做） |
| **真做需要** | prev viewProj matrix uniform + motion vector G-buffer + sample-along-vector blur |
| **工程量** | 5-7 天 |
| **simplified 替代** | accumulation blend（每幀混 30% 前一幀，有「拖影」感）— 1-2 天 |
| **建議** | 對學妹靜止場景效果不顯著，**可以不做** |

### E4 場景變換（教室外 / 月台 / 咖啡廳）

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **真做需要** | 建新場景 mesh（教室外走廊、月台、咖啡廳）+ 切換邏輯 |
| **工程量** | 每場景 5-10 天 |
| **simplified 替代** | 加幾個 prop mesh（雲、月亮、雨）配合 E3 環境 preset 切換 — 2-3 天 |
| **建議** | 配合劇情需要時再做（目前 LM402 場景固定教室） |

---

## 🔴 平行世界 LM402-parallel · 真 WebGPU 改造

> ⚠️ **最大工程**。F1.1 偵測 + fallback 完成（commit `b90b3fa`），剩下需要 dedicated sprint。

### F1.2 Vendor Three.js WebGPURenderer

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **需要** | 從 Three.js examples/jsm/renderers/webgpu/ 複製 WebGPURenderer.js + 全部依賴到 `assets/lm402-parallel/webgpu/` |
| **工程量** | 3 天 |
| **風險** | r179 WebGPURenderer 仍 alpha，依賴複雜（10+ 檔） |

### F2 切換 WebGLRenderer → WebGPURenderer

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **需要** | renderer.js 內所有 `new e.WebGLRenderer({...})` 改成 `new WebGPURenderer({...})`，處理 API 差異 |
| **工程量** | 5 天 |
| **風險** | **極高** — postfx.js 全部失效（GLSL ShaderMaterial 不能跑 WebGPU） |

### F3 重寫所有 ShaderMaterial GLSL → WGSL

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **需要** | postfx.js 內 5+ ShaderMaterial、envmap-sunset.js sky shader、consciousness-particles.js 全部 GLSL 重寫成 WGSL |
| **工程量** | 7-10 天 |
| **風險** | WGSL 語法跟 GLSL 不同，每個 shader 重寫 + 測試 |

### F4 整合 compute shader 特效

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **需要** | 用 WebGPU compute shader 做 SSGI / GPU cloth solver / particle physics |
| **工程量** | 14-21 天 |
| **價值** | 真正 WebGPU 才能做的事 — 否則跟 WebGL2 沒差 |

### E 一眼瞬間極致精雕

| 項目 | 詳情 |
|---|---|
| **狀態** | 未做 |
| **需要** | 11:00 鐘響「他看見她了」場景：學妹學長兩人對視，dedicated camera + 4K-level PBR + ML lip-sync（如可能） |
| **工程量** | 7 天（依賴 F2-F4 完成） |
| **重要性** | **這是整個專案的情感核心** — 「他看見她了——整個人被釘在原地那種看見」 |

---

## ⚪ 正本 LM402 · 待做

### C7 Idle pose 變化

| 項目 | 詳情 |
|---|---|
| **狀態** | 跳過真做 |
| **架構限制** | 學妹是「程式積木 N 個 primitives」，不是 SkinnedMesh，無法切換姿勢 |
| **真做需要** | 重做學妹成統一 mesh + skeleton + skin weights（Blender 工程） |
| **工程量** | 1-2 週 |
| **建議** | 留待「美術流程切換」討論（會破壞「程式生成」優勢） |

### E4 場景變換

同雙時空 E4。

---

## 🛠 工程改進建議（從跨專案吸取）

> 完整跨專案 patterns + mistakes 詳見 [LESSONS.md](LESSONS.md)。本段只列「對 RedTime 有具體可執行價值的新項目」。

### 從 PAL_2026（仙劍）學到 — 新增（2026-05-02）

- 🆕 **`health_check.sh` 8 類 62 項 pre-pack 自檢** — 檢查 GLB 存在、postFX uniform 沒漏、console API 接好（高 ROI，1 天可建初版）
- 🆕 **`啟動.command --diagnose` 環境探測** — probe Three.js 版本、GPU tier、GLB 檔案 — 玩家自己看跑得動跑不動（半天）
- ✅ ~~跨平台啟動腳本~~（已建 `啟動.command` / `啟動.bat`）
- ✅ ~~預設埠分配~~（已用 8200-8210）

### 從 JYQXZ（金庸）學到 — 新增（2026-05-02）

- 🆕 **🔥 Master + Work 雙位置 + sync.sh 雙向同步**（高 ROI，**Claude 跑 RedTime 速度 5-50x**）
  - 現況：RedTime 純 SMB（`/Volumes/Mac Mini M4/Red Time/`），所有檔案 I/O 都過網路 → SMB
  - 目標：建 `/Volumes/Work/RedTime/` APFS 副本 + `sync.sh` 雙向同步
  - 工程量：半天（cp -r 複製 + 寫 .sync.conf + 寫 sync.sh + 測試 + 啟動腳本 hook）
  - 效益：`git status` 從 5s → 0.2s（25x）、Glob 30s → 0.5s（60x）、ALLRM 整流程 5-10 分鐘 → 1-2 分鐘
  - 範本：直接抄 JYQXZ `/Volumes/Work/JYQXZ/sync.sh` + `.sync.conf`
- 🆕 **`.sync.conf` 驅動的通用 sync.sh** — 把 dev-tools/ 各 ad-hoc 收斂到 conf-driven runner（半天）
- 🆕 **mtime ±2s tolerance** — 未來 Mac Mini M4（SMB）→ NAS（SMB）sync 時用上
- ✅ ~~PENDING.md~~（已有）

### 從 LD（俠客遊 II）學到 — 新增（2026-05-02）

- 🆕 **`pre_commit_check.sh` 把規則 codify** — 「永遠不可改故事文本」做成 pre-commit grep 擋 commit（高 ROI，0.5 天）
- 🆕 **`_build_*.py` 文件自動生成** — `_build_pending.py` 掃 data.js 場景數注入 PENDING.md / ROADMAP.md（1 天）
- 🆕 **「三層備份」auto-tm enforcement** — 動任何檔案前自動 tm（已有 backup.sh，加自動觸發 hook 1 天）
- 🆕 **`PUBLISHING.md` 內容分級 A/B/C** — 「正本不動 / 副本實驗」+「故事文本不能改」軸 codify（半天）
- 🆕 **特殊資料夾名 = 規則本身** — `Backup/` 改 `Backup_僅供資料參考_勿改/`（10 分鐘）
- ✅ ~~「絕對規則」CLAUDE.md~~（已加）

### 從 PTT（旗艦）學到 — 新增（2026-05-02）

- 🆕 **`QUALITY_BAR.md` 量化紅線** — fps、首次進畫面、CSP、a11y 標準（1 天）
- 🆕 **ARCHITECTURE.md「70/30 法則」+ 依賴方向 ASCII 圖** — `data.js → renderer.js / app.js → ui-panels.js` 寫死方向（半天）
- 🆕 **ROADMAP phases Exit conditions** — 每個 milestone 加可量測 Exit 條件（M1-M18 改寫，1 天）
- ✅ ~~ROADMAP.md~~（已有）

### 從 MVP_Baseball 學到 — 新增（2026-05-02）

- 🆕 **`README_讀者看這裡.md`** — 對外發布時面向「不懂技術的故事讀者」（半天）

### 從 SWDA_2026（軒轅劍）學到 — 新增（2026-05-02）

- 🆕 **idempotent injector + marker tag** — 對已生成 HTML 加 enhancement 用 `createElement` + `ADDED MANUALLY` marker（半天，未來需要時）
- 🆕 **`_Mac首次執行_先點我.command` ice-breaker** — zip 分發給玩家試玩時必備（10 分鐘）

---

## 📝 立即可做的小工程（1 天內可完成）

按 ROI 排序：

1. ✏️ **README.md** — 主檔，給 toni 自己 + 訪客看（半天）
2. ✏️ **ROADMAP.md** — 路線圖（已完成 + 進行中 + 未來）
3. ✏️ **CHANGELOG.md** — commit history 整理成 user-facing changelog
4. 🛠 **backup.sh** — 自動化 GO + All Backup 腳本（取代手動跑 rsync）
5. 🛠 **啟動.command / 啟動.bat** — 跨平台啟動腳本（雙擊跑 server + 開 lm402）
6. ✏️ **USAGE.md** — 玩家使用手冊（如何啟動 / 如何操作 / 如何回報問題）

---

## 🎯 推薦工作流

### 短期（1-2 週）：文件補強 + 工具自動化

1. README + ROADMAP + CHANGELOG（半天）
2. backup.sh（半天）
3. 跨平台啟動腳本（1 天）
4. USAGE / FAQ（1 天）

### 中期（1-3 個月）：簡化版「未來 sprint」項目

1. A6 simplified motion blur（accumulation blend）
2. E4 simplified（prop mesh + E3 環境配套）
3. F1.2 vendor WebGPURenderer（為 F2 鋪路）

### 長期（3-6 個月）：真實 WebGPU 改造

F2-F4 + E = 完整平行世界 — 4-6 週 dedicated sprint。

---

## 📞 給 future Claude session 的提示

打開新 session 時：

1. 先讀 [CLAUDE.md](CLAUDE.md) 故事核心 + 三線分工 + 動工紀律
2. 再讀本檔 PENDING.md 知道剩下什麼
3. 看 git log 知道最近進度
4. **任何 narrative 工程動工前先 grep 故事文本**（CLAUDE.md 動工紀律第 2 條）
