# CLAUDE.md — 時間裡的兩個妳 專案規則

## 基本資訊

- **專案名稱**：時間裡的兩個妳（RedTime）
- **主目錄**：`/Users/toni/Downloads/時間裡的兩個妳`
- **GitHub Repo**：`toniLiuMVP/RedTime`（GitHub Pages 部署）
- **網站類型**：互動式小說 / 遊戲網站

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

- **1994 年學妹定稿**：`/Users/toni/Downloads/時間裡的兩個妳/1994年學妹定稿/`
- **2005 年學妹定稿**：`/Users/toni/Downloads/時間裡的兩個妳/2005年學妹定稿/`
- **2025 年學妹定稿**：`/Users/toni/Downloads/時間裡的兩個妳/2025年學妹定稿/`

## 絕對禁止

⛔ **永遠不可自行修改故事文本**（reader.html 中的小說內容）
⛔ **不可修改 index.html 中的故事文字**
⛔ **不可更動 data.js 中的劇情對話內容**
⛔ 除非 toni 本人明確指示，否則故事文字一字不能改

## Git 工作流程規則

### 核心原則：直接在 main 工作

```bash
# 正確做法：直接在主 repo 修改
cd /Users/toni/Downloads/時間裡的兩個妳
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
cd /Users/toni/Downloads/時間裡的兩個妳
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
cd /Users/toni/Downloads/時間裡的兩個妳
git --git-dir=.git --work-tree=. checkout .claude/worktrees/<name> -- . 2>/dev/null || true
```
確保 preview worktree（通常是 `.claude/worktrees/` 中正在使用的那個）反映最新的 main 狀態。

## 開發注意事項

- 這是 **GitHub Pages** 靜態部署，所有路徑必須相對路徑
- Three.js 使用 ES Module 方式載入，注意 import 路徑
- GLB 模型存放於 `assets/lm402/characters/junior/exports/`
- 工具腳本存放於 `tools/`（不部署到 GitHub Pages）
- `Backup/` 目錄保存原始備份，**不要修改**
- `.playwright-cli/`、`output/`、`test-results/` 不需要 commit
