# PENDING.md — 時間裡的兩個妳 · 未完成項目清單

> 給未來 Claude Code session 一眼看清「還剩什麼沒做」。
> 學自 JYQXZ / PTT 等其他專案的 PENDING.md 慣例。

最後更新：2026-05-02

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

### 從 PAL_2026（仙劍）學到

- ⏳ **加 4 層安全檢查到本機 server**（如果未來做 .command 啟動）
- ⏳ **加跨平台啟動腳本**（`啟動.command` / `啟動.bat`）— 玩家雙擊就跑 server + 開 lm402
- ⏳ **預設埠分配**：8200-8210 給 LM402 三線（避免跟仙劍 8180-8183 / 金庸 8186-8189 / 軒轅劍 8192-8193 衝突）

### 從 JYQXZ（金庸）學到

- ⏳ **加 sync.sh 雙向同步**（如果 toni 在 Windows 也開發）
- ⏳ **加 USAGE.md / FAQ.md**（給玩家看）
- ⏳ **明確版本標記**（v0.1, v1.0...）
- ⏳ **PENDING.md**（這個檔！從 JYQXZ 學的）

### 從 LD（俠客遊 II）學到

- ⏳ **加 PUBLISHING.md**（公開發布規則 — 哪些可放線上、哪些不能）
- ⏳ **資料夾標記**：明確標記哪些不備份、不上傳（隱私資料）
- ⏳ **「絕對規則」段在 CLAUDE.md 最前面**（已加 ✅）
- ⏳ **自動產生文件**（_build_readme.py 等）

### 從 PTT（旗艦專案）學到

- ⏳ **拆分 ARCHITECTURE.md / SECURITY.md / QUALITY_BAR.md / THREAT_MODEL.md**（單一 CLAUDE.md 不夠）
- ⏳ **加 ROADMAP.md 明確 milestone**（這個檔！）

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
