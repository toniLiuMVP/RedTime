# 時間裡的兩個妳 · RedTime

> 一眼只有一秒，卻用了二十年才讀懂它為什麼亮著。
>
> 互動式文學作品 + 3D 場景遊戲 · 由 toni 創作

---

## 線上版

| 版本 | 網址 |
|---|---|
| 首頁 | https://toniliumvp.github.io/RedTime/ |
| LM402 正本 | https://toniliumvp.github.io/RedTime/lm402.html |
| LM402 雙時空 | https://toniliumvp.github.io/RedTime/lm402-twin.html |
| LM402 平行世界 | https://toniliumvp.github.io/RedTime/lm402-parallel.html |

---

## 快速開始（本機）

### macOS

```bash
bash 啟動.command
```

或從 Finder 雙擊 `啟動.command`。

### Linux

```bash
bash 啟動.command
```

### Windows

雙擊 `啟動.bat`（或 `bash 啟動.command` 在 Git Bash / WSL）。

啟動腳本會：
1. 找一個 8200-8210 的空 port
2. 啟動 Python HTTP server
3. 1.5 秒後自動打開瀏覽器到首頁
4. `Ctrl+C` 結束

---

## 三線分工

```
LM402 正本（穩定保守）  ───── WebGL2 + 程式生成 + 半寫實
LM402 雙時空（最豐富）  ───── + 意識菜市場（光柱+粒子+文字）+ 文學擴充
LM402 平行世界（探索）  ───── WebGPU 改造（建置中）
```

詳見 [CLAUDE.md](CLAUDE.md) 的「三線分工架構」段。

---

## 故事核心

- **女兒**（玩家視角）在意識中目睹 / 重訪媽媽（學妹）2005 年 11:00 那一秒
- **學妹**：2005 年 29 歲，意識中有不同年紀（18/29/33/39/49）的自己「七嘴八舌」
- **學長**：21 歲，飛機頭白 T 藍牛仔褲粗框眼鏡，11:00 從 LM401 樓梯走上來打電話
- **一眼瞬間**：「他看見她了——不是餘光、不是恍惚，是整個人被釘在原地那種看見」

「**時間裡的兩個妳**」= 同一個學妹，意識中不同年紀的多重聲音 — **不是視覺切換**，是純文學概念。

---

## 文件結構

| 檔案 | 用途 |
|---|---|
| [CLAUDE.md](CLAUDE.md) | 專案規則 + 故事核心 + 動工紀律（必讀） |
| [PENDING.md](PENDING.md) | 未完成項目清楚清單 + 工程量估算 |
| [ROADMAP.md](ROADMAP.md) | milestone 級進度路線圖（M1 → M17） |
| [CHANGELOG.md](CHANGELOG.md) | 版本變動歷史 |
| `progress.md` | 開發進度紀錄 |

---

## 技術棧

- **Three.js r179** + WebGL2（正本 / 雙時空）
- **Three.js WebGPURenderer**（平行世界，計畫中）
- **GitHub Pages 靜態部署**（純前端，所有路徑相對）
- **程式生成低 poly 角色**（無 sculpt + 無 SkinnedMesh，純 primitives）
- **PWA**（含 service worker + audio auto-stop hook）

---

## 開發指令

```bash
# 啟動本機 server
bash 啟動.command

# GO（同步晴晴 NAS）
bash backup.sh go

# All Backup（時間戳快照）
bash backup.sh all

# 一次跑兩個
bash backup.sh both

# 查看備份歷史
bash backup.sh status

# git workflow
git add <files>
git commit -m "feat: ..."
git push origin main
```

---

## 互動 Console API（雙時空 only）

```js
window.__POSTFX__.tuning           // 後製管線
window.__JUNIOR_RIG__.state         // 表情 + 互動
window.__CLOTH_RIG__.tuning         // 布料動態
window.__CONSC_LIGHTS__             // 意識光柱
window.__CONSC_PARTICLES__          // 意識粒子
window.__CONSC_TEXT__               // 意識文字
window.__NARRATIVE__                // 字幕系統
window.__TRANSITIONS__              // 章節 fade + 記憶閃回
window.__LETTER__                   // 書信日記
window.__AUDIO_LAYER__              // 環境音 + 動態 BGM
window.__INITIATED__                // 學妹發起互動
window.__ENV__                      // 季節時間 5 preset
```

完整 API 文件見 [CLAUDE.md](CLAUDE.md#-console-api玩家--debug-工具)。

---

## 跨專案參考

LM402 受 toni 其他專案啟發：

- **PAL_2026 仙劍** — 跨平台啟動腳本、4 層安全、預設埠分配
- **JYQXZ 金庸** — 雙向同步、PENDING.md 慣例、版本標記
- **LD 俠客遊 II** — 「絕對規則」CLAUDE.md 模式
- **PTT 旗艦** — ARCHITECTURE / SECURITY / QUALITY_BAR 文件分立

詳見 [`/Volumes/Work/Work-Projects.md`](file:///Volumes/Work/Work-Projects.md)。

---

## 版權

- 故事文本 © toni
- 程式碼 © toni（個人專案）
- 仙劍奇俠傳 / 金庸群俠傳 / 軒轅劍 等懷舊遊戲：詳見對應姊妹專案說明
