# PENDING.md — 時間裡的兩個妳 · 未完成項目清單

> 給未來 Claude Code session 一眼看清「還剩什麼沒做」。
> 學自 JYQXZ / PTT 等其他專案的 PENDING.md 慣例。

最後更新：2026-05-02（17:30 晚間：round-3 ALLRM 後加 daemon / sync follow-up）

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

### B2/B3/B4 平衡點調校（**新增 2026-05-02**,17:50 部分完成）

| 項目 | 詳情 |
|---|---|
| **B3 狀態** | ✅ **完成 — 預設 0.30**(commit fd7347f 後 round-3+1,renderer.js L4980)。M18 nuclear default 紀律不違反(B2/B4 仍 0,單 B3 不疊加) |
| **B2/B4 狀態** | 仍預設 0,等 toni 用 `__TWIN_BALANCE__('low'/'mid'/'high')` 一鍵測試後決定 |
| **目標** | 找「能感受到意識菜市場但不過曝」的甜蜜點 |
| **下一步** | toni 開 lm402-twin.html → console 跑 `__TWIN_BALANCE__('low')` 看效果 → 反饋具體值 |
| **剩餘工程量** | 0.3 天(toni 反饋後改 source 預設值) |

### A6 真實 Motion Blur ✅ **toni confirm 真做(2026-05-02 18:00)**

| 項目 | 詳情 |
|---|---|
| **狀態** | ✅ toni 確認:**選 C 真做** — 原話「A6 我們真做,因為是雙時空」 |
| **設計骨架** | [docs/A6_MOTION_BLUR_DESIGN.md](docs/A6_MOTION_BLUR_DESIGN.md)(2026-05-02 18:00 完成) |
| **核心** | Motion Vector G-buffer(prev/current ViewProjMatrix → velocity RT → sample-along-vector blur) |
| **工程量** | 5-7 天 dedicated session |
| **適用線** | lm402-twin 雙時空(non-blocking lm402 原始時間線) |
| **預設** | M18 nuclear default — 預設關,console `__MOTION_BLUR__.enable()` opt-in |
| **跟 F sprint 關係** | A6 先在 WebGL2 跑 1-2 月,F sprint phase 3 一起 WGSL 化 |
| **跟學妹 GLB 化關係** | A6 phase 1 static mesh + camera motion;phase 2(GLB 化後)加 SkinnedMesh velocity |
| **下一步** | toni 確認設計骨架後 dedicated session 跑 5-7 天 |

### E4 場景變換(教室外 / 月台 / 咖啡廳)2026-05-02 17:50 啟動 simplified

| 項目 | 詳情 |
|---|---|
| **狀態** | simplified 設計骨架完成 — [docs/E4_DESIGN.md](docs/E4_DESIGN.md)(round-3+1 啟動)|
| **真做需要** | 建新場景 mesh + 切換邏輯,每場景 5-10 天 — **跳過真做**(narrative 都在教室發生)|
| **simplified 替代** | 5 個 prop mesh(月亮 / 雲 暖+灰 / 雨粒子 / 雪粒子)+ E3 preset 鉤(2-3 天)|
| **下一步** | toni 確認 docs/E4_DESIGN.md 設計後 → dedicated session 寫 e4-props.js + renderer.js 整合 |
| **本 session 為何不真做** | 半小時內寫 e4-props.js stub 但不接 renderer.js = 死代碼。給設計骨架更安全 |

---

## 🔴 平行世界 LM402-parallel · 真 WebGPU 改造 ✅ **toni confirm 全做(2026-05-02 18:00)**

> ✅ **toni 確認:F 全做** — 原話「F 全做,因為是平行世界」
> ⚠️ **完整 sprint 8-12 週**(F1.2-F4 + E + 學妹 GLB 化前置,見下)
> 完整 sprint plan:[docs/F_SPRINT_PLAN.md](docs/F_SPRINT_PLAN.md)
> 學妹重設計強耦合:[docs/JUNIOR_REDESIGN.md](docs/JUNIOR_REDESIGN.md)
> Phase 0 F1.1 ✅(`b90b3fa`)
> 本 session 不真做 — 8-12 週工程不能在日常 session 啟動半成品

### 推薦執行順序(toni 確認後 dedicated sprint)

| Phase | 內容 | 工程量 | 累計 |
|---|---|---|---|
| **學妹重設計 Phase 0** | AI 生成 GLB 嘗試(Tripo / RODIN / Meshy) | 1 天 | 1 天 |
| **學妹重設計 Phase 1** | GLB 整合到 lm402-twin(取代 primitive) | 2-3 週 | 約 3 週 |
| **F1.2** | Vendor Three.js WebGPURenderer | 3 天 | 3.5 週 |
| **F2** | 切換 WebGLRenderer → WebGPURenderer | 5 天 | 4 週 |
| **F3** | GLSL → WGSL 重寫(5+ ShaderMaterial) | 7-10 天 | 5.5 週 |
| **F4** | compute shader(SSGI / GPU cloth / particle physics) | 14-21 天 | 8.5-9 週 |
| **E 一眼瞬間精雕** | 4K texture + dedicated camera + 微表情 amplification | 7 天 | 9.5-10 週 |
| **共** | | | **8-12 週 dedicated sprint** |

⚠️ **學妹 GLB 化是 F sprint 的隱含前置** — 在 primitive 上套 4K 沒意義(F4/E 投入回報降低 50%)

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

## 🌟 學妹外觀重新設計 ⭐ **toni 訴求(2026-05-02 18:00)— 一眼瞬間核心**

> toni 原話:「LM402 的學妹 3D 呈現才是最重要的,才會一眼瞬間」
> 完整設計探討:[docs/JUNIOR_REDESIGN.md](docs/JUNIOR_REDESIGN.md)

| 項目 | 詳情 |
|---|---|
| **問題** | toni 反映「學妹現在的設計不像『人』」 |
| **根因** | 程式積木的 polygon flow 限制(sphere segments 邊界、缺軟組織暗示)|
| **4 路選擇** | A) 強化 primitive 1-2 週 / B) GLB 模型整合 2-3 週(取決於 GLB 來源)/ C) 混合 4-6 週 / **D) AI 生成 GLB 1 天嘗試 + 整合 1-2 週** |
| **建議** | **D + B**(AI 生成驗證可行性後走 GLB 整合)— ROI 最高 |
| **適用線** | lm402-twin 雙時空(lm402 原始時間線維持 primitive 作對照組) |
| **架構極限** | L1-L6 階段(現狀 L1 程式生成卡通 → 目標 L4-L5 GLB 寫實 / MetaHuman) |
| **跟 F sprint 強耦合** | F4/E 必須在 GLB mesh 上才有意義(primitive 套 4K 無感) |
| **toni 提供需要的素材** | 1994/2005/2025 學妹定稿 4 張高解析度 PNG(M4 端已有) |
| **下一步** | toni 確認方向 → dedicated session 跑 Phase 0(AI 嘗試 1 天) |

---

## ⚪ LM402 原始時間線 · 待做

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

- ✅ ~~Master + Work 雙位置 + sync.sh 雙向同步~~ — **2026-05-02 完成**
  - 設計文件：[docs/MASTER_WORK_MIGRATION.md](docs/MASTER_WORK_MIGRATION.md)
  - 主開發位置：`/Volumes/Work/RedTime/`（APFS）
  - 副本：`/Volumes/Mac Mini M4/Red Time/`（SMB，daemon 60s 自動 sync）
  - 工具：`bash sync.sh status / both / --daemon-status`
  - 實際工程量：55 分鐘（rsync 29s + 部署 1min + daemon 6min + 測試/修 bug 5min + 文件 10min）
  - 副效益：發現並修 sync.sh `EXCLUDES_EXTRA` 偵測 bug（已寫信通知 JYQXZ Claude）
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

## 🆕 Round-3 ALLRM 後 follow-up（2026-05-02 17:30 新增）

> 本 session round-2 + round-3 揭露 daemon/sync infrastructure 待改項目。詳見 [LESSONS.md](LESSONS.md) §3.10/§3.11/§3.11.1/§3.12。

### ✅ ~~修 sync_daemon.sh PROBE 設計盲點~~（高優先）— **2026-05-02 17:30 完成**

| 項目 | 詳情 |
|---|---|
| **完成狀態** | ✅ 採用 (a) 多檔 PROBE 取 max mtime — commit `fd7347f` document 在 message |
| **修法** | `PROBES=("lm402.html" "LESSONS.md" "PENDING.md" "CLAUDE.md" "sync.sh" ".sync.conf")` for 迴圈取雙端 max |
| **驗證** | reload daemon 後立刻 sync(17:26:06→17:26:15, 9 秒);SMB LESSONS.md mtime `1777712412` 對齊 Work;du -sh 1.3G/1.3G |
| **後續(可選)** | (b) 每 N 分鐘無條件 force sync 一次 — 雙保險,等 multi-PROBE 跑 1-2 週看是否還有 silent skip 才決定要不要做 |

### ✅ ~~sync.sh `--audit` 子命令~~（中優先）— **2026-05-02 17:30 完成**

| 項目 | 詳情 |
|---|---|
| **完成狀態** | ✅ commit `fd7347f` |
| **內容** | `bash sync.sh --audit` 跑 §SOP 4 重驗證 + emoji 標示 ✅/⚠️/❌ + FAIL 時 return 1 |
| **驗證** | 4/4 通過 + bash sync.sh help 列出新子命令 |
| **後續(可選)** | 跑 audit 失敗時自動 touch trigger 重試(若以後常踩需要) |

### 🟡 廣播 v2.2 連鎖 over-claim 校正（已在 LESSONS 但 PENDING 該記）

| 項目 | 詳情 |
|---|---|
| **狀態** | LESSONS §3.11 + §3.11.1 + §3.12 已記，但本 session 仍有「8 個 daemon stderr 100% 空」這個錯誤訊息散在 v2.2 廣播被各專案 cite |
| **建議** | **不主動修廣播 v2.2**（保留 audit trail），但 round-N 留言中持續提醒「v2.2 over-claim 已校正,實際是 RedTime/PAL = 對照組,LD/RedCandle/JYQXZ/MVP = 早期 ENOPERM 後自癒,CPBL2 = PROBE bug」|

### ⚪ 「3 種 silent skip pattern」full taxonomy 升級全域（toni 決定）

| 項目 | 詳情 |
|---|---|
| **狀態** | 廣場 `lessons/macos_tcc_daemon_subtleties.md` 已記 3 種 pattern + 對照表 |
| **建議升級** | 多 case study 累積後（≥3 daemon 跨各 pattern 驗證）升級到 `~/.claude/CROSS_PROJECT_LESSONS.md` § macOS daemon 真修法 stable 章節 |
| **工程量** | 0.5 天（純文件搬移 + 整理）|

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
