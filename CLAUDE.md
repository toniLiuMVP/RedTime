# CLAUDE.md — 時間裡的兩個妳 專案規則

## 基本資訊

- **專案名稱**：時間裡的兩個妳（RedTime）
- **主目錄**：`/Volumes/Mac Mini M4/Red Time`（2026-04-15 搬遷，SMB：`smb://toni/Mac Mini M4/Red Time`）
- **舊主目錄**（已淘汰）：`/Users/toni/Downloads/時間裡的兩個妳`
- **GitHub Repo**：`toniLiuMVP/RedTime`（GitHub Pages 部署）
- **網站類型**：互動式小說 / 遊戲網站

### 自動掛載 Mac Mini M4（本機專案 SMB）
```bash
if [ ! -d "/Volumes/Mac Mini M4" ]; then
  osascript -e 'tell application "Finder" to open location "smb://toni/Mac%20Mini%20M4"'
  sleep 8
fi
```

### 搬遷後注意事項
- SMB 檔案權限預設 `700`，git 需設定 `core.fileMode false` 避免誤判 modified
- 新位置已執行 `git config core.fileMode false`

## ⛔ NAS 備份（重要！不要用 Toni-NAS！）

> NAS 名稱是 **toniLiuMVP**，不是 Toni-NAS！
> 掛載路徑是 **/Volumes/918 資料夾/**，不是 /Volumes/Toni-NAS/！

### 自動掛載

```bash
if [ ! -d "/Volumes/918 資料夾" ]; then
  osascript -e 'tell application "Finder" to open location "smb://toniLiuMVP._smb._tcp.local/918%20%E8%B3%87%E6%96%99%E5%A4%BE"'
  sleep 8
fi
```

### rsync 備份

```bash
rsync -av --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.claude' \
  --exclude='test-results' --exclude='output' --exclude='.playwright-cli' \
  "/Volumes/Mac Mini M4/Red Time/" \
  "/Volumes/918 資料夾/晴晴/時間裡的兩個妳/解析/EP0~EP40修訂二版/網站/"
```

---

## 重要檔案

```
lm402.html                              ← 主遊戲頁面入口
assets/lm402/renderer.js               ← 3D 場景渲染核心
assets/lm402/app.js                    ← 應用程式邏輯
assets/lm402/data.js                   ← 場景資料與劇情資料
assets/lm402/lm402.css                 ← 樣式
assets/lm402/GLTFLoader.js             ← GLTF 模型載入器
assets/lm402/ui-panels.js              ← UI 面板元件
assets/lm402/characters/junior/        ← 學妹角色 GLB 模型目錄
assets/lm402/three.core.js             ← Three.js 核心（勿隨意更新版本）
assets/lm402/vendor-three.module.js    ← Three.js 模組版本
```

## 學妹參考圖

- **1994 年學妹定稿**：`/Volumes/Mac Mini M4/Red Time/1994年學妹定稿/`
- **2005 年學妹定稿**：`/Volumes/Mac Mini M4/Red Time/2005年學妹定稿/`
- **2025 年學妹定稿**：`/Volumes/Mac Mini M4/Red Time/2025年學妹定稿/`

## 絕對禁止

⛔ **永遠不可自行修改故事文本**（reader.html 中的小說內容）
⛔ **不可修改 index.html 中的故事文字**
⛔ **不可更動 data.js 中的劇情對話內容**
⛔ 除非 toni 本人明確指示，否則故事文字一字不能改

## Git 工作流程規則

### 核心原則：直接在 main 工作

```bash
# 正確做法：直接在主 repo 修改
cd /Volumes/Mac Mini M4/Red Time
git add <files>
git commit -m "說明改動內容"
```

### 使用 Worktree 時的規定

如果 Claude Code 自動建立了 worktree，**必須**在任務完成前將改動合併回 main：

```bash
# 1. 在 worktree 內提交改動
git add <files>
git commit -m "改動說明"

# 2. 切回 main 並合併
cd /Volumes/Mac Mini M4/Red Time
git merge claude/<worktree-name>

# 3. 清理 worktree
git worktree remove .claude/worktrees/<worktree-name>
git branch -d claude/<worktree-name>
```

### 嚴格禁止的行為

⛔ 任務完成後留下未合併的 worktree
⛔ 在 worktree 裡留下未提交的改動就結束任務
⛔ 忘記把 worktree 的 branch 合併回 main

### 任務完成後的同步

任務完成後，自動執行：
```bash
cd /Volumes/Mac Mini M4/Red Time
git --git-dir=.git --work-tree=. checkout .claude/worktrees/<name> -- . 2>/dev/null || true
```
確保 preview worktree（通常是 `.claude/worktrees/` 中正在使用的那個）反映最新的 main 狀態。

## NAS 備份流程

備份目標：`/Volumes/918 資料夾/晴晴/時間裡的兩個妳/解析/EP0~EP40修訂二版/網站/`

### 自動掛載 + 備份指令（GO 指令備份步驟使用）

```bash
# 1. 確認是否已掛載，未掛載則自動掛載
if [ ! -d "/Volumes/918 資料夾" ]; then
  osascript -e 'tell application "Finder" to open location "smb://toniLiuMVP._smb._tcp.local/918%20%E8%B3%87%E6%96%99%E5%A4%BE"'
  sleep 8
fi

# 2. 確認掛載成功
ls "/Volumes/918 資料夾/"

# 3. rsync 備份（排除不必要目錄）
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.claude' \
  --exclude='test-results' \
  --exclude='output' \
  --exclude='.playwright-cli' \
  "/Volumes/Mac Mini M4/Red Time/" \
  "/Volumes/918 資料夾/晴晴/時間裡的兩個妳/解析/EP0~EP40修訂二版/網站/"
```

**重要**：NAS 未掛載時，絕對不要叫 toni 手動掛載，直接用上方 osascript 自動掛載。

## 開發注意事項

- 這是 **GitHub Pages** 靜態部署，所有路徑必須相對路徑
- Three.js 使用 ES Module 方式載入，注意 import 路徑
- GLB 模型存放於 `assets/lm402/characters/junior/exports/`
- 工具腳本存放於 `tools/`（不部署到 GitHub Pages）
- `Backup/` 目錄保存原始備份，**不要修改**
- `.playwright-cli/`、`output/`、`test-results/` 不需要 commit

---

## 🎬 故事核心設定（永遠不再搞錯！）

> **重要**：動 narrative 相關功能前先 `grep` 故事文本，不能憑技術熟練度推理。

### 角色身份

| 角色 | 設定 | 在程式碼的位置 |
|---|---|---|
| **玩家視角** | **女兒**（不是學長！不是學妹！） | data.js 行 638「女兒化作意識，潛入學長的視角」 |
| **學妹（阿姨）** | 2005 年 **29 歲實體**，一個版本（不要做三代切換） | renderer.js `Co = S({referenceJunior:!0, female:!0, ...})` 行 4881 |
| **學長** | 21 歲、飛機頭、白 T、藍牛仔褲、**粗框眼鏡**、11:00 從 LM401 樓梯走上來打電話 | renderer.js `Go = S({pompadour:!0, phone:!0, legs:"#3d5c8a", torso:"#f8f8f8"})` 行 4867；眼鏡 mesh renderer.js 行 1224 / 1280-1303 (Torus 鏡片 + Box 鼻樑/鏡腳) |

### 「兩個妳」的真實含義

**不是**「兩個年代版本的學妹切換」（toni 三次訂正過）。

**是**：同一個 29 歲學妹，**意識中不同年紀的自己「七嘴八舌」**（內心眾聲喧嘩，純文學概念）。

### 關鍵 narrative beats

```
10:40 ─── 意識菜市場
        「教室裡不同年紀的自己正在七嘴八舌」（學妹一人，多重內心聲音）

11:00 ─── 前門來電
        鐘響，學長從 LM401 樓梯走過來，站 LM402 前門外打電話

       ─── 後門等待
        學妹穿過教室站到後門旁，「又燙又美的等待」

       ─── 一眼瞬間
        「他看見她了——不是餘光、不是恍惚，是整個人被釘在原地那種看見」
```

「LM402 一眼瞬間」= 2005 年 11:00 的這一秒，**所有後製/材質/表情都為這一秒服務**。

### 「意識菜市場」視覺方向（雙時空專屬）

- ❌ **不畫**具體年紀的學妹輪廓（殘影派 B1 已否決）
- ✅ **抽象視覺化**：光柱（B3）+ 粒子（B2）+ 文字（B4）三派混合
- 5 個年紀色彩：暖橙（青春）/ 暖白（現在）/ 淡綠（記憶）/ 淡紫（夢境）/ 月光藍（未來）

---

## 🌳 三線分工架構（toni 決策）

| 版本 | URL | 中文名 | 技術路線 | 狀態 |
|---|---|---|---|---|
| **正本** | `lm402.html` | LM402 | WebGL2 + 程式生成 + 半寫實 | 穩定，繼續保守升級 |
| **副本 1** | `lm402-twin.html` | **LM402 雙時空** | WebGL2 走極限 + 意識菜市場 | 主推路線 |
| **副本 2** | `lm402-parallel.html` | **LM402 平行世界** | WebGPU 全新繪製，學妹學長精緻 | 探索並行（80/20） |

對應資源：
```
assets/lm402/              ← 正本資源
assets/lm402-twin/         ← 雙時空資源（cp 自正本，獨立演化）
assets/lm402-parallel/     ← 平行世界資源（cp 自正本，待 WebGPU 改造）
```

副本 HTML 內路徑前綴用 sed 替換對應資料夾。`index.html` hero-actions 已加 ⏳ 雙時空 + 🌌 平行世界 入口。

---

## 🛡️ 動工紀律（避免重蹈覆轍）

1. **正本不動**：toni 明確要求穩定，新功能 / 大改動先在副本實驗
2. **動 narrative 之前必先 grep 故事文本**：data.js / reader.html / progress.md
3. **核實 > 推理**：「這個功能存不存在」、「這個角色設定是什麼」**永遠 grep 確認**，不要憑經驗推測
4. **每個 Tier 完成後讓 toni 實機測試**：syntax check 通過 ≠ GPU 跑得起來
5. **commit 後做 GO + All Backup**，**push 等批次或 toni 明確要求**

---

## 🎛️ console API（玩家 / debug 工具）

主場景內可從 console 控制：

| 全域變數 | 用途 | 範圍 |
|---|---|---|
| `window.__POSTFX__.tuning` | 後製管線（Bloom / DOF / CA / Grain / Color Grade / Lens Dirt / Rain / God Rays / Lens Flare / Volumetric Fog） | 三線都有 |
| `window.__JUNIOR_RIG__.state` | 表情 + 互動（blink/mouthOpen/smile/browRaise/lookDir + autoEyeTrack/Saccade/Micro/HeadWobble/GazeAI + blush/sweat） | 三線都有 |
| `window.__CLOTH_RIG__.tuning` | 布料動態（spring/damping/wind） | 三線都有 |
| `window.__CONSC_LIGHTS__` | 意識菜市場光柱 B3（setIntensity / inspectVoices） | **雙時空 only** |
| `window.__CONSC_PARTICLES__` | 意識菜市場粒子 B2（150 個記憶碎片） | **雙時空 only** |
| `window.__CONSC_TEXT__` | 意識菜市場文字 B4（12 sprite toni 原文短句） | **雙時空 only** |
| `window.__NARRATIVE__` | 文學旁白系統 H1+H3（show/preset/hide） | **雙時空 only** |
| `window.__TRANSITIONS__` | 章節 fade + 記憶閃回 H2+H4 | **雙時空 only** |
| `window.__LETTER__` | 書信日記 H6 | **雙時空 only** |
| `window.__AUDIO_LAYER__` | 環境音 + 動態 BGM H7+H8 | **雙時空 only** |
| `window.__INITIATED__` | 學妹發起互動 C8（6 種情緒） | **雙時空 only** |
| `window.__ENV__` | 季節時間 5 preset E3（dusk/night/rainy/snowy/day） | **雙時空 only** |
| `window.__LM402_YEAR__` | 預留變數（目前固定 "2005"，未來支援動態） | 三線都有 |

---

## 📚 文件結構（學自跨專案）

| 檔案 | 用途 |
|---|---|
| `CLAUDE.md`（本檔） | 專案規則 + 故事核心 + 動工紀律 |
| [PENDING.md](PENDING.md) | 未完成項目清楚清單 + 工程量估算 |
| [ROADMAP.md](ROADMAP.md) | milestone 級進度路線圖（從 M1 渲染管線到 M17 文件補強） |
| `progress.md` | 開發進度紀錄（既有檔案） |

### 跨專案 lessons（已內化）

從 toni 其他專案吸取的優點 + 教訓：

- **PAL_2026 仙劍**：跨平台 .command/.bat/.sh 啟動腳本、4 層安全、預設埠分配避衝突 → LM402 之後可加跨平台啟動腳本
- **JYQXZ 金庸**：雙向同步 sync.sh、PENDING.md 慣例、版本標記 v1.1 → LM402 已加 PENDING + ROADMAP
- **LD 俠客遊 II**：「絕對規則」段在 CLAUDE.md 最前面、PUBLISHING.md 公開規則、_build_*.py 自動產生文件 → LM402 已加動工紀律
- **PTT 旗艦專案**：ARCHITECTURE / ROADMAP / SECURITY / QUALITY_BAR 文件分立 → LM402 採輕量版（CLAUDE + ROADMAP + PENDING 三檔）

### 跨專案位置參考

- 工作專案總覽：[`/Volumes/Work/Work-Projects.md`](file:///Volumes/Work/Work-Projects.md)
- 各專案：`/Volumes/Work/{PTT,MVP_Baseball,LD,JYQXZ,CPBL2,MacOS}/`
- 懷舊三部曲：`/Volumes/Mac Mini M4/{PAL_2026,WS,SWDA_2026}/`
