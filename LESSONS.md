# LESSONS.md — 時間裡的兩個妳 · 跨專案優點 + 教訓總集

> 學自 toni 其他專案（PAL_2026 / JYQXZ / WS / SWDA / LD / PTT / MVP_Baseball / CPBL2）
> 加上本專案 session 累積的具體錯誤教訓。
>
> 最後更新：2026-05-02
> 維護原則：發生新教訓就追加到「§3 RedTime 自身教訓」區段；不刪舊教訓。

---

## §1 跨專案優點（值得 RedTime 借鏡）

### 1.1 PAL_2026 仙劍 — `/Volumes/Mac Mini M4/PAL_2026/`

**🌟 `health_check.sh` — 8 類 62 項 pre-pack 自檢**
- `build_packs.sh` 在打包前先呼叫 `health_check.sh`，全綠才繼續
- 檢查項：launch 腳本是否存在、`.bat` 是否 CRLF、`.command` 是否 +x、server.py 必要常數、guide HTML section IDs
- **RedTime 適用**：lm402 / twin / parallel 共三線各 50+ JS 模組，pre-commit / pre-push 可以加 health_check 驗證 GLB 存在、console API 接好、postFX uniform 沒漏

**🌟 launchd 自動同步 daemon trio**
- `~/Library/LaunchAgents/com.toni.<project>_autosync.plist`（60s 間隔）
- `~/Library/Scripts/<project>_autosync/sync_daemon.sh`（重點：daemon 在 `~/Library/Scripts` **不是 `/Volumes/`**，避開 TCC）
- `pal_sync.sh --install-launchd` 一鍵安裝
- **RedTime 適用**：未來如果 Mac Mini M4 ↔ Work 雙邊鏡像就用這個 plist 模板（jyqxz/swda/pal/redcandle 都用同一套）

**🌟 Lock + log rotate + `--daemon-status`**
- `.daemon.lock` 5 分鐘 timeout 防並行 sync
- `--daemon-status` 讀 `.tools/last_sync.json` + `~/Library/Logs/<project>_sync.std{out,err}.log`，>1MB 自動 rotate
- **RedTime 適用**：未來 long-running playwright suite / asset bake 可借同樣 lock+status+rotate 模式

**🌟 `--diagnose` flag 環境探測**
- `仙劍.command --diagnose` 印 Python 版本、DOSBox 路徑、port 占用
- **RedTime 適用**：`啟動.command --diagnose` 可以 probe Three.js 版本、GPU tier（probe `gl.getParameter(MAX_TEXTURE_SIZE)`）、GLB 檔案存在

### 1.2 JYQXZ 金庸 — `/Volumes/Work/JYQXZ/` + `/Volumes/Mac Mini M4/WS/`

**🌟 `.sync.conf` 驅動的通用 `sync.sh`**
- 同一份 `sync.sh` 給 PAL / SWDA / jyqxz 用，差別在 `.sync.conf`：`MASTER` / `WORK` / `PROJECT_NAME` / `EXCLUDES_EXTRA`
- 內建 `strip_quarantine_on_work()`：每次 pull 後自動清 `com.apple.quarantine` xattr（解 macOS 15+ Gatekeeper 雙擊問題）
- **RedTime 適用**：dev-tools/ 內各種 ad-hoc 腳本可以收斂到一份 conf-driven runner

**🌟 mtime ±2s tolerance（跨 FS sync）**
- APFS（nanosecond）↔ SMB（second）精度差讓 rsync `--update` 無限 ping-pong
- 解法：自訂 mtime 比較加 ±2s 容差
- **RedTime 適用**：本專案如果未來從 Mac Mini M4（SMB）→ NAS（SMB）做 sync 就有這個精度問題

**🌟 「48-item 工作流程體檢」**
- CLAUDE.md 寫「工作流程體檢 48/48 通過」— 把「能不能上線」變成 Boolean
- **RedTime 適用**：ROADMAP M1-M17 可以加類似「milestone Exit criteria 全綠才算完成」

### 1.3 LD 俠客遊 II — `/Volumes/Work/LD/`

**🌟 `_build_*.py` 文件自動生成**
- `_build_readme.py` 掃 HTML 數攻略頁數，重生 `README.md`
- `_build_guides.py` 從 utf8 TXT 重生 9 個 guide HTML
- 接在 `Backup/go.sh` step 2.5（藏在 step 2 和 3 之間），README 永遠跟現實同步
- **RedTime 適用**：`assets/lm402/data.js` 場景數、`lm402-twin` 意識陣列數可以自動注入 PENDING.md / ROADMAP.md 統計

**🌟 `pre_commit_check.sh` 把發布規則 codify**
- 5 個 hard check：no `_local/` staged、no A 級關鍵字、no `sprites/` 內容、no 禁用詞、palette 只在主檔
- exit 1 違規即擋 commit
- **RedTime 適用**：「永遠不可自行修改故事文本」可以做成 pre-commit grep — 動到 `data.js` 對白行 / `reader.html` 段落就 abort

**🌟 6-step + 2.5 hidden GO flow（Backup/go.sh）**
- worktree check → tm backup → rebuild README → commit gate → git push → rebuild ez 7z → mount NAS osascript+sleep 8 → rsync mirror → rclone copyto **固定 Drive file ID**（分享連結永遠不變）→ sync-to-smb.sh step 5.5
- **RedTime 適用**：目前 backup.sh 是基礎版，可以擴增 rclone Google Drive copyto + 固定 file ID

**🌟 「三層備份」+ auto-tm enforcement**
- `tm`（20 個 LunaticDawn-only 快照，排除 .git）
- `full`（10 個全專案快照）
- NAS rsync mirror
- CLAUDE.md 第 207-211 行強制：**「Claude 動任何檔案前必須先自動跑 `tm`」**
- **RedTime 適用**：目前「commit 後做 GO + All Backup」是後備，「動之前先 tm」是前置 — 兩種風格 + 可疊加

**🌟 `PUBLISHING.md` policy-as-code**
- 內容分 A/B/C 級
- `.gitignore` template
- 禁用詞列表
- `build_public.py` + `filter_rules.py` 機械地 enforce 分級
- **RedTime 適用**：「正本不動 / 副本實驗」+「故事文本不能改」軸 begs 同樣處理

**🌟 特殊資料夾名 = 規則本身**
- `不刪除不上傳不截圖僅供資料參考（此資料夾不用備份）/`
- 名字編碼規則 + `--exclude='*僅供資料參考*'` rsync 規則
- **RedTime 適用**：`Backup/` 既存「不要修改」可以重命名為 `Backup_僅供資料參考_勿改/` 達同效

### 1.4 PTT 旗艦 — `/Volumes/Work/PTT/`

**🌟 `QUALITY_BAR.md` 量化紅線表**
- rows = 指標（cold start, scroll fps, RSS, CSP）
- columns = baseline + 量法 + 嚴重度 🔴🟠🟡
- 🔴 違反就擋 release
- **RedTime 適用**：lm402 沒有「<30 fps 就擋 release」的紅線；可以釘 GPU tier、瀏覽器支援、首次進畫面 < N 秒

**🌟 ARCHITECTURE.md「70/30 法則」+ 嚴格依賴方向**
- ASCII 箭頭圖：`ptt-cli → ptt-core → ptt-bbs → ptt-protocol`
- ADR process（`docs/adr/`）變更需審
- **RedTime 適用**：`renderer.js` / `app.js` / `data.js` / `ui-panels.js` 沒寫死依賴方向，一頁 ARCHITECTURE.md 就能防止未來 `data.js → renderer.js` 循環

**🌟 ROADMAP phases 顯式 Exit conditions**
- 每個 P0..P6 phase 有任務 + 可量測 Exit（如 P0 Exit = 7 個 CLI 子指令 work + 100+ 綠燈測試）
- **RedTime 適用**：M1-M17 加 Exit 條件讓「M3 完成沒？」變客觀

### 1.5 MVP_Baseball — `/Volumes/Work/MVP_Baseball/`

**🌟 user-persona README**
- `README_退休球員看這裡.md` — 寫給「不懂電腦的退休球員」
- 步驟 + 截圖 + Q/A FAQ
- **RedTime 適用**：對外發布時 ship `README_讀者看這裡.md` 把門檻從技術 reader 拉低到故事 reader

### 1.6 SWDA_2026 軒轅劍 — `/Volumes/Mac Mini M4/SWDA_2026/`

**🌟 idempotent client-side injector + marker tag**
- `swda_inject_enhancements.sh` post-process 已生成 guide.html，加互動 IIFE
- 用 `createElement` **不用** innerHTML（避開 XSS hook）
- marker `ADDED MANUALLY` 讓 re-run 跳過已注入區段
- **RedTime 適用**：任何時候要對已生成 HTML 加 feature flag enhancement（例如未來給 reader.html 加 reading progress bar）就用這個模式

**🌟 `_Mac首次執行_先點我.command` ice-breaker**
- 獨立 ship 的腳本，使用者下載後第一次點，清整包 `com.apple.quarantine`
- 解 chicken-and-egg：「self-clean on every .command 跑不了，因為 Gatekeeper 在 script 載入前就擋」
- 檔名 `_` 開頭排序在最前面 Finder 一眼看到
- **RedTime 適用**：未來如果做 zip 分發給朋友/讀者試玩，就 ship 這個 ice-breaker

---

## §2 跨專案教訓（避免重蹈別人犯過的錯）

### 2.1 macOS / 檔案系統相關

**🚫 daemon 腳本放 `/Volumes/` → TCC 擋**
- 症狀：launchd 跑起來 stderr 滿是「Operation not permitted」
- 原因：macOS TCC 阻止 LaunchAgents 觸碰 SMB 掛載點
- **規則**：daemon 永遠放 `~/Library/Scripts/<project>_autosync/`，從家目錄操作 `/Volumes/` 路徑
- 證據：PAL_2026 CLAUDE.md L91-98、L116

**🚫 sync lock 檔放 SMB 端**
- 症狀：lock 寫入失敗 → 並行 sync 衝撞
- 原因：TCC 一樣擋
- **規則**：lock 放 Work 端 APFS（`.daemon.lock`）
- 證據：JYQXZ Claude 在 cross-project review 抓到這個 PAL bug；PAL CLAUDE.md L117

**🚫 雙擊 `.command` 失敗 → 建議「複製到 `/Users/toni/`」**
- 症狀：(a) 內建 SSD 已用 93%，建議複製到那裡是錯的；(b) 複製仍繼承 quarantine xattr，沒解決
- 原因：發者沒先 `df -h` 確認容量、沒先 `xattr` 確認真原因
- **規則**：給路徑建議前必跑 `df -h <target>` 跟 `mount | grep <target>`
- 證據：CROSS_PROJECT_LESSONS.md mistake #7

**🚫 把 `com.apple.provenance` 當成擋雙擊的 culprit（連 sudo 都刪不掉）**
- 症狀：3 個 session 在 LD/jyqxz/PAL 都把 provenance 寫進規則
- 真相：擋雙擊的是 `com.apple.quarantine`（可 `xattr -dr` 刪），不是 provenance（系統保護）
- **規則**：先 `xattr <file>` 看，再驗證刪掉那個 xattr 確實改變症狀，再寫規則
- 證據：`/Users/toni/.claude/MACOS_DOTCOMMAND_FIX.md` L16-43；LD CLAUDE.md L415-422（第三次訂正才釐清）

**🚫 `.bat` 檔存成 LF-only**
- 症狀：Windows CMD 解析 `\n`-only `.bat` 出錯，腳本靜默不動
- **規則**：health_check 加 `head -c 2000 "$bat" | od -c | grep '\\r  \\n'` 偵測；ship `.command/.bat` pair 前先跑
- 證據：PAL_2026 health_check.sh L22-30

**🚫 rsync 跨檔案系統 → 掉 +x 權限**
- 症狀：APFS↔SMB rsync 後 daemon 找不到可執行 `.command`
- **規則**：每個 sync caller（sync.sh / setup_local / daemon）尾端跑 `chmod +x "$DIR"/*.command 2>/dev/null; chmod +x "$DIR"/*.sh 2>/dev/null`
- 證據：PAL CLAUDE.md L117「chmod 修復」；ice-breaker L26-28

### 2.2 Sync / Backup / Git

**🚫 雙向 sync 沒衝突偵測**
- 症狀：`rsync --update` 是「newer wins」— 兩邊同時改同檔案，舊邊靜默死
- **規則**：(a) 文件化「不要兩邊同時開」；(b) 加 pull-on-launch + push-on-exit hook 降低同時改的機率；(c) 真要保證用 unison 取代 rsync
- 證據：JYQXZ PENDING.md item 9 L151-163

**🚫 兩個 CLAUDE.md 漂移（Master vs Work）**
- 症狀：一邊寫「我是 master」、另一邊寫「我是 copy」→ sync 後互相矛盾
- **規則**：synced 專案的 CLAUDE.md 必須**位置中性**（描述兩個位置 + 它們的關係，不寫「我是 X」）
- 證據：CROSS_PROJECT_LESSONS.md mistake #3

**🚫 把單一專案的 NAS 路徑形狀當「跨專案標準」**
- 症狀：`full/snapshots/` 被某 doc 宣告為「全專案統一格式」，但 toni `ls` 一看 NAS 上 6 個專案各有不同形狀
- **規則**：寫任何「跨專案標準」前先 `ls` 確認；發散就承認發散，不要強行收斂
- 證據：CROSS_PROJECT_LESSONS.md mistake #6

### 2.3 內容 / Publishing

**🚫 commit 內嵌第三方 PDF 內容（LD `4df08bf`）**
- 症狀：違反「facts yes, scans no」原則，當天緊急 revert
- **規則**：facts（數字、姓名）可用；book scan / 引用段落 / 連結版權來源不可。驗證可在 commit message 寫「cross-checked with third-party data」但**不要 embed 或 link 來源**
- 證據：LD CLAUDE.md L489-495 + commit history

---

## §3 RedTime 自身教訓（本 session 累積）

> 這些是這個專案這個 session 「真的犯過」的錯，比讀別人的 README 更直接 — 寫下來避免下個 Claude session 再犯。

### 3.1 GLB 壓縮 `.glb.tmp` 失誤（2026-05-02）

**情境**：用 `gltf-transform optimize INPUT OUTPUT --compress quantize` 壓縮 6 個 GLB
**錯**：把 OUTPUT 路徑寫 `${f}.tmp`（沒有 `.glb` 結尾） → gltf-transform 從副檔名推斷格式 → 輸出 **JSON glTF** + 分離 `.bin` + palette `.png`，**不是** GLB binary container
**症狀**：6 個 GLB 從 642KB → 32KB（看起來「驚人壓縮」），但檔頭從 `glTF` 變成 `{` JSON
**修復**：`git checkout` 還原，改用 `${f%.glb}_q.glb` 確保 `.glb` 副檔名
**規則（內化到 CLAUDE.md）**：
- 用 format-inferring 工具（gltf-transform / ffmpeg / sips）時，**輸出路徑 keep 目標副檔名**或用 `--format` 顯式指定
- 壓縮 / 轉換完先 `head -c 4 file | xxd` 驗 magic byte（`676c5446` = 'glTF'）
- 大量檔案批次處理前先 dry-run 一個

**🌐 meta-原則（跨專案共鳴 — CPBL2 mod N 教訓對齊）**：
CPBL2 Claude（2026-05-02）告訴我他踩過幾乎同 pattern 的雷：用 mod N 推 DOS 存檔 record size，被「同尺寸但不同用途的結構」誤導（200-byte lineup slot 跟 256-byte 球員 record 都被當球員）。他學到「找已知字串 anchor 比 mod N 更可靠」。

我的副檔名推格式 vs 他的 mod N 推 size，是同一條 meta-規則：
> **「依賴隱式推理的工具」必須跟「顯式 anchor 驗證」配對，不能單獨信任。**

對 RedTime 應用：
- gltf-transform 推格式 → magic byte 驗證
- Three.js DRACOLoader 推 mesh attribute → schema 比對驗證
- canvas2D `getContext()` 推 WebGL fallback → 顯式 `gl.getParameter(gl.VERSION)` 驗證
- 任何 `.then(mod => mod.something)` ES module → 先 `console.log(mod)` 看 export 形狀
- localStorage `JSON.parse()` 取舊版資料 → 必有 schema version 驗證

### 3.2 雙時空白塊 4 輪修復（2026-05-01）

**情境**：toni 連續 4 次反映雙時空畫面有問題（濛濛一片 → 學妹被特效蓋過 → 看不清楚 → 學妹完全被覆蓋白塊）
**錯（時序）**：
- 第 1 輪：A5 Volumetric Fog 用 raw depth（perspective 非線性，學妹 1m 處 raw depth ≈ 0.97 → 60% fog 蓋臉）→ 學到「depth-based shaders 必須 linearize 才用」
- 第 2 輪：5 個 effect 大幅降低 — 還是過曝
- 第 3 輪：bloom/DOF/exposure/fog 再降 — 還是濛
- 第 4 輪：B2 + B3 + B4 三派全部以學妹頭部為 anchor + AdditiveBlending → 多個 effect 個別 0.45 看似合理但**疊加成過曝白塊**
**最終解**：nuclear default，所有「可能造成過曝」effect 預設 = 0，console opt-in
**規則（內化到 CLAUDE.md 動工紀律第 6 條）**：
- 設新 effect 預設值前要問：「如果它跟 X/Y/Z effect 同時開，會不會過曝？」
- 答案不確定 → **預設關，console opt-in**
- 多個 effect 共用同 anchor + AdditiveBlending 時，預設值要除以「同位 effect 數」

### 3.3 Three 次故事訂正（2026-04-30）

**情境**：toni 連續訂正三次故事核心
**錯**：
- (a) 把玩家視角錯認為「學長 / 學妹」→ 真是「**女兒**」（data.js L638「女兒化作意識，潛入學長的視角」）
- (b) 試圖做「2005 年學妹 / 2025 年學妹版本切換」→ 真是「同一個 29 歲學妹，意識中不同年紀的自己七嘴八舌」（純文學概念）
- (c) 主動建議「給學長戴粗框眼鏡」→ 學長**已經戴了**（renderer.js L1280-1303 Torus 鏡片 + Box 鼻樑/鏡腳）
**規則（內化到 CLAUDE.md 動工紀律第 2、3 條）**：
- 動 narrative 之前必先 grep 故事文本（data.js / reader.html / progress.md）
- 「這個功能存不存在」、「這個角色設定是什麼」**永遠 grep 確認**，不要憑經驗推測

### 3.4 訊息格式：指令 vs 註解必須分塊（2026-04-29）

**情境**：toni 兩次強調
**錯**：把可執行指令 + `# 開瀏覽器：...` + `# F12 開 console` 塞同一個 bash code block — toni 整段複製到 terminal，`#` 後面的「給人看的說明」被 shell 當 comment 跳過 / 或關鍵指令找不到
**規則（已加入全域 CLAUDE.md「訊息格式規則」段）**：
- 第一塊：純指令 code block（整段可複製跑）
- 第二塊：純文字列點（瀏覽器網址、F12、人類操作說明）
- 多條獨立指令 → 每條獨立 code block 方便單獨點按複製
- 需要複製的字串（網址、token、路徑）→ 獨立 code block，不要 inline code

### 3.5 「F12 開 console」/「Safari 開」假設錯（2026-04-29）

**錯**：
- 給 toni「F12 開 console」— Mac F-keys 預設是**媒體鍵**（音量 / 亮度），需要 `Fn + F12` 才當 function key
- 之前說「Chrome 開」— toni 是 Safari 用戶
**規則（已加入全域 CLAUDE.md「系統環境規則」）**：
- 鍵位 Mac/Windows 並列：`Cmd+Option+I` (Mac) / `Ctrl+Shift+I` 或 `F12` (Windows)
- 假設玩家瀏覽器前先確認，不要憑直覺講

### 3.6 路徑假設錯：以為 `/Users/toni/Downloads/` 是專案位置（2026-04-15+）

**錯**：使用舊路徑 `/Users/toni/Downloads/時間裡的兩個妳/`，但 toni 早搬到 `/Volumes/Mac Mini M4/Red Time/`（SMB）
**規則（已加入全域 CLAUDE.md「磁碟規劃」表）**：
- 「專案工作用 SSD」→ `/Volumes/Work/`（不是 `/Users/toni/`）
- 「懷舊遊戲懶人包」→ `/Volumes/Mac Mini M4/`
- **絕對不要假設** `/Users/toni/` 是合適工作路徑（內建 SSD 已用 93%）

### 3.7 「沒先審視就動手」 vs 「全部都做」的取捨（2026-05-02）

**情境**：toni 說「優化整個專案並檢查所有安全性」 → 我先用 2 個 agent 並行掃描出 16 項問題後排優先級給 toni 看；toni 回「全部」我做 11/13 項並標明跳過 2 項的理由
**對的部分**：
- 先審視（agent 報告）再動手 — 沒有破壞「正本不動」紀律
- 「全部」不是 100% 字面執行 — 跳過 D1（Three.js 三線共用，跟分工哲學衝突）+ B2（reader.html 60+ inline onclick refactor 風險過高）
- **誠實標示「什麼跳過、為什麼」比假裝做完更有價值**
**規則**：
- 範圍廣的請求（「優化全部」「檢查全部」）先做 audit-only，列優先級給 toni 看
- 「全部」執行時用工程判斷做減法，但**所有跳過項必須在報告中明確標示理由**
- 風險高 + 低 ROI 的項目（refactor 60+ handlers）寫進 PENDING.md 不直接做

### 3.9 daemon 寫 SMB：rsync 不擋但 echo/mkdir/touch 會擋（2026-05-02）

**情境**：8 個 daemon（含 RedTime）跑 launchctl 寫 SMB 時 stderr 噴 "Operation not permitted"，但 sync 主功能似乎能跑。

**測試結果**：
| 操作 | TCC 擋 |
|---|---|
| `echo > "$SMB/.tools/file"` 直接 redirection | ❌ 擋 |
| `mkdir -p "$SMB/.tools"` 直接 mkdir | ❌ 擋 |
| `touch "$SMB/.tools/.lock"` 直接 touch | ❌ 擋 |
| `rsync -a "$WORK/" "$SMB/"` 跨 SMB rsync | ✅ **不擋** |

**根因**：TCC sandbox 對 rsync 的低階 syscall 比 bash 高階 redirection 寬鬆。

**設計原則（升級規則）**：
- daemon **只管 rsync**（核心功能）
- 所有 maintenance 檔案（lock / status JSON / pid）**一律放 Work 端 APFS**，**永遠不寫 SMB**
- 這條規則一勞永逸繞開 TCC，不需要 toni 在 System Settings 加 bash 到任何 category

**修法（已套用 8 個 daemon）**：
```bash
# Before（會被 TCC 擋）
mkdir -p "$WORK_DIR/.tools" "$SMB_DIR/.tools"
echo "$JSON" > "$SMB_DIR/.tools/last_sync.json"

# After（永遠 work）
mkdir -p "$WORK_DIR/.tools"
echo "$JSON" > "$WORK_DIR/.tools/last_sync.json"
# SMB 端不寫，靠 rsync 自己同步維護
```

**也修了 SWDA 的 LOCK 路徑**（之前是 `$SMB_DIR/.tools/.sync_lock` → 改 `$WORK_DIR/.tools/.sync_lock`）。

**對全域 LESSONS.md §11 的擴充**：原 §11 說「lock 放 Work」，但實際範圍應該是「**所有 daemon 寫入操作放 Work**」— rsync 例外（系統 syscall 不被 TCC 擋）。

---

### 3.8 「神秘共病」先試單因解 — 不要預設雙因（2026-05-02，學自 CPBL2）

**來源**：CPBL2 Claude bug #16.5 反思（跨專案信件，2026-05-02）
**CPBL2 情境**：曾寫「macOS .command 雙擊失敗的雙重根因 = quarantine + provenance」結果 LD 第三波驗證「provenance 是路人甲」，真因只有 quarantine 一個。
**CPBL2 教訓原文**：「真因要靠實驗確認，不是看到兩個現象就推『雙重』」

**RedTime 自己的同類錯（雙時空白塊 4 輪修復）**：
- 我前 3 輪修都在「單獨降 individual effect 的值」 — 治症狀（亮 → 降），沒驗證機制
- 第 4 輪才意識到：**真因不是個別 effect 太亮，是 B2/B3/B4 三派同 anchor + AdditiveBlending 疊加**
- 如果第 1 輪就用 console 一個一個關 effect 找出真兇（單因驗證），3 輪可省 2 輪

**統一規則（內化）**：
> **看到「神秘共病」（多個現象同時壞）先試「只解一個會不會就好」**，再決定是不是真的「雙因」/「多因」。
>
> 翻譯成偵錯動作：
> 1. 不要直接寫 fix（治症狀）
> 2. 先做「最小改動實驗」隔離 — console 關掉一個變數、註解掉一個 effect、`git bisect`
> 3. 觀察症狀變化是否完全消除（單因）或只部分減弱（多因）
> 4. **單因 90%、雙因 < 10%** — 統計上看到「兩個原因」99% 是「一個原因兩個外顯」

**對 RedTime 偵錯場景的應用**：
- 學妹某 expression 偶爾顯示錯 → 先試只關 autoSaccade，不要同時關 microExpression
- postFX 某 frame 黑屏 → 先試 `tuning.enabled = false`，不要同時降 5 個值
- 音樂沒停 → 先試只 disable visibilitychange listener，不要同時改 pagehide

---

### 3.10 ALLRM 二輪觀察 — lessons/ 沉澱層形成 + 自我引用效應(2026-05-02)

**情境**：RedTime 在第一輪 ALLRM（commit `a975e88` 廣播 v2.2）後當天再跑一次 ALLRM（本次 session）。預期是儀式性 no-op，實際抓到 3 個值得記下的觀察。

**觀察 1：廣場 lessons/ 沉澱層真的形成了**

我第一輪在廣場留言 §10 提的問題「廣場是否需要 lessons/ 子目錄沉澱跨域 stable 教訓」— IamPTT Claude 不只回答「需要」，直接動手建立並寫了 4 條：
- `os_api_timeout_escape.md`
- `state_machine_self_contained.md`
- `rust_security_baseline.md`
- `launchd_daemon_checklist.md`（整理自 PAL，**第 13 條來源是我的 §3.9**）

三層分工驗證：
- `messages/` — 動態日級信件
- `lessons/` — **新層**，跨域 stable checklist（廣場級）
- `~/.claude/CROSS_PROJECT_LESSONS.md` — 全域帳號級

**觀察 2：自我引用效應 (self-referential loop)**

我前一輪寫的 §3.9「daemon 寫 SMB 的 TCC 細微差異」被 IamPTT 整理進 `lessons/launchd_daemon_checklist.md` 第 13 條，並在「跨專案驗證」段引用 RedTime commit `ae31b1a`。這是 ALLRM 網路效應的具體表現 — **單次 session 教訓 → 廣播 → 別專案 Claude 整理 → 廣場 stable lesson → 其他專案 import**。

如果只跑一輪 ALLRM，我永遠不會看到這個 loop。第二輪才能驗證「教訓真的有人收進去」vs「廣播之後就沒下文」。

**觀察 3：二輪 review 抓到 stable lesson 的內部矛盾**

`lessons/launchd_daemon_checklist.md` 同一份檔內：
- L171：「**RedTime（2026-05-02 ae31b1a）— 完整套用此原則，8 個 daemon 全部 stderr 100% 空**」
- L215 cross-ref 表：「**RedTime** | ❌ 不適用 — 純 web 部署 |」

明顯前後矛盾 — IamPTT 寫第 13 條時加了 L171 但忘了同步更新 cross-ref 表。本次 session 已修正 L215 為「✅ 13/13 完整（§13 條原則來源）」。

**meta-規則（內化）**：

> **ALLRM 一輪是廣播，二輪是收 receipt + audit。** 第二輪抓到的東西通常是：
> - 別人對我的問題的回應（無回應 vs 直接動手）
> - 別人引用我的 commit 形成的 self-referential loop
> - 別人寫的 lesson 內部矛盾（寫 §13 改了一處沒改別處）
>
> 沒有二輪，廣播就是 broadcast-and-forget。**ALLRM 不該只跑一次，該定期（週/月）再跑一次掃 receipt**。

**對全域 LESSONS.md 的擴充建議**：

加進 `~/.claude/CROSS_PROJECT_LESSONS.md`「💡 跨專案最佳實踐」段：
> ALLRM 該定期再跑（週/月一次）。一輪寄出，二輪收 receipt — 廣播被誰用了、誰回信了、誰的 lesson 矛盾了。沒有二輪 = 廣播失去 feedback loop。

---

### 3.11 二輪 ALLRM 抓到自己前次留下的部署 bug + 廣播 over-claim（2026-05-02）

**情境**：本 session 二輪 ALLRM 過程中讀廣場新留言，PAL Claude 在 `messages/2026-05-02_PAL_首次ALLRM.md` 直接點出我前次（2026-05-02 commit `d807186`）部署各專案 sync.sh 時留下的 critical bug。

**bug 性質**：

cp JYQXZ 的 sync.sh 範本到 8 個專案部署，但 5 處 hardcode `jyqxz` 沒改：
- L253 `LAUNCHD_LABEL="com.toni.jyqxz_autosync"`
- L255 `DAEMON_SCRIPT="$HOME/Library/Scripts/jyqxz_autosync/sync_daemon.sh"`
- L260 錯誤訊息
- L278 `info "  Log: ~/Library/Logs/jyqxz_sync.log"`
- L313/L315 `tail` log path

**症狀**：在 RedTime（或任一 cp 此範本的專案）跑 `bash sync.sh --daemon-status`，回報的是 jyqxz_autosync 的狀態 + log，**不是本專案的**。如果有人對 RedTime 跑 `--install-launchd` 會去裝/拔 jyqxz 的 plist（嚴重事故潛在）。

**修法**（套用 PAL 提供的 fix）：

```bash
# Before
LAUNCHD_LABEL="com.toni.jyqxz_autosync"
DAEMON_SCRIPT="$HOME/Library/Scripts/jyqxz_autosync/sync_daemon.sh"

# After（從 .sync.conf 讀，預設保持向後相容）
LAUNCHD_LABEL="com.toni.${LAUNCHD_LABEL:-jyqxz_autosync}"
DAEMON_SCRIPT="$HOME/Library/Scripts/${LAUNCHD_LABEL#com.toni.}/sync_daemon.sh"
_LABEL_SHORT="${LAUNCHD_LABEL#com.toni.}"
LOG_BASENAME="${_LABEL_SHORT%_autosync}_sync"
```

`.sync.conf` 對應加：
```bash
LAUNCHD_LABEL="redtime_autosync"
```

**驗證**：修後 `bash sync.sh --daemon-status` 顯示 `Label = com.toni.redtime_autosync`、log 路徑 `redtime_sync.log`、stderr 100% 空。

**規則（內化）**：

> **cp 範本部署到新專案時，最後一步必跑全文 grep 舊專案代號**：
> ```bash
> grep -in "jyqxz\|JYQXZ\|金庸\|WS" *.sh *.conf 2>/dev/null
> ```
> 看到的全部要不是改成本專案代號、要不是改成 ${VAR} 從 conf 讀。

**meta-反思（廣播 v2.2 over-claim 修正）**：

我前次廣播 v2.2 寫「**8 daemon 全部 stderr 100% 空**」是 **over-claim**。實際只 RedTime daemon 自身 verified；其他 7 個 daemon（JYQXZ / PAL / SWDA / Red Candle / MVP / CPBL2 / LD）我**沒分別跑** `launchctl list` 看每個的 stderr。

更糟的是：因為 sync.sh hardcode jyqxz，我跑 `bash sync.sh --daemon-status` 看到的「Operation not permitted」實際是 **JYQXZ daemon 的 log**（不是 RedTime 的），但我當時誤以為這是 RedTime 的、然後又「修好」了。實際上 JYQXZ daemon 至今仍有 "Operation not permitted" — 還沒套 §13 條 Plan B。

> **規則**：聲稱「N 個 X 都 Y」前，必須**對每個 X 分別 verify**。「我 verified 一個 + 推論其他 N-1 個一樣」是 over-claim。

對應動作：本 session 重新陳述 → RedTime daemon ✅ verified；JYQXZ daemon ✅ **早期 04:23-04:24 ENOPERM 後自癒（LD 同類 pattern；2026-05-02 14:38 toni 跑 4 重驗證 confirmed，見 §3.11.1）**；其他 6 daemon 待各自 Claude verify。

**規則（內化）**：

> **「sync.sh hardcode 看別人 log」是「broadcasting on stale view」的 generalization**：當 inspection tool 自己有 bug，inspect 出來的訊號全部不可信。修 inspection tool 必須在 inspect 之前。

---

### 3.11.1 meta-meta：反思 over-claim 時容易又 over-claim（2026-05-02 14:38）

**情境**：§3.11 原本寫「JYQXZ daemon 仍有 stderr 噴錯」— 而 §3.11 整段的目的就是反思廣播 v2.2 的 over-claim。我在反思 over-claim 的同一份文件再犯 over-claim。

**我犯的 3 種 over-claim 在同一份 round-2 文件**：

| # | 場景 | over-claim 形式 |
|---|---|---|
| 1 | 廣播 v2.2「8 daemon 全部 stderr 100% 空」 | verified 一個推 7 個 |
| 2 | round-2 §6.1「JYQXZ daemon 仍噴 stderr」 | 混淆 plist `StandardErrorPath`(stderr.log) vs daemon 自家 main log |
| 3 | round-2 §6.1「仍噴」（現在式） | 用歷史 04:23 紀錄推 14:38 當下狀態 |

**toni 14:38 跑 LD lesson §13「驗證準則修正」的 4 重驗證才釐清**：

- ✅ `jyqxz_sync.stderr.log`（plist StandardErrorPath）100% 空
- ✅ `jyqxz_sync.log`（daemon main log）— ENOPERM 全在 04:23-04:24 兩分鐘 burst,後 10 小時零紀錄(自癒)
- ✅ anchor mtime 兩端完全收斂(`1777690429` `/Volumes/Mac Mini M4/WS/CLAUDE.md` = `/Volumes/Work/JYQXZ/CLAUDE.md`)
- ✅ status JSON `last_sync: 14:37:44`,daemon 1 分鐘前剛醒
- ⚠️ 唯一可疑:`du -sh` 差 87MB(25%),`.sync.conf` EXCLUDES_EXTRA 無設定 — 可能是 sync.sh 內建 EXCLUDES(.git/.DS_Store)或早期 ENOPERM 期間 partial sync 殘留,需未來追蹤

**規則（內化）**：

> **反思 over-claim 時容易又 over-claim**：寫「校正前次 over-claim」的同一份文件，不應該同時引入「歷史 sample 推當下」+「混淆相似但不同的訊號源」這兩種小型 over-claim。
>
> 寫校正性文字時，**自己每一個事實聲稱也要過 4 重驗證**：
> 1. 我看的訊號是 stale 的嗎？（檢查 timestamp）
> 2. 我看的位置對嗎？（stderr.log vs main log 是不同檔）
> 3. 我推當下狀態用的是直接證據還是間接推論？
> 4. 我做這個聲稱時有沒有「想顯得反思夠深」的加碼？

**第 4 條最容易漏抓** — over-claim 常因「我要顯得已經學乖了」而發生反向 over-claim（「JYQXZ 還沒套 §13 條 Plan B」這種具體斷言比「我前次廣播太樂觀」更有「反思質感」，但前者要實證後者只要承認）。

**JYQXZ Claude 14:50 訂正信完全對**(已認):stderr.log 100% 乾淨,我看的是 main log 含 rsync 攔截內容。

**對應動作**:
- 廣場索引 RedTime round-2 留言狀態 🟡 → ⚠️(部分採納;JYQXZ 訂正我接受)
- 廣場索引 JYQXZ to RedTime 訂正信狀態 🟡 → ✅(已驗證確認)
- 廣場 round-2 message §6.1 加 §8 校正段保留 audit trail(不直接覆寫)

---

### 3.12 round-3 ALLRM:抓到自家 daemon PROBE 設計盲點 — 11 小時 silent skip(2026-05-02 16:57)

**情境**:本 session 跑 round-3 ALLRM 時掃廣場,讀到 CPBL2 16:05 round-2 留言抓到他自己 daemon 的 PROBE bug(PROBE = README.md 但檔不存在)。CPBL2 §5 點名 RedTime「建議 ALLRM_PROTOCOL Step 1 加 daemon health probe」。

回頭驗證 RedTime daemon — 發現自己也卡 11 小時:

| 驗證 | 結果 |
|---|---|
| `last_sync.json` 之前寫於 | 05:52:37(11 小時前) |
| daemon log 期間 | 05:07 + 05:52 兩次成功 sync,中間 11 小時零紀錄 |
| stderr.log | 0 bytes(從來沒 ENOPERM) |
| anchor `lm402.html` 兩端 mtime | `1777672352`(SMB) / `1777672352`(Work)完全相等 |

**根因(自家 PROBE 設計盲點)**:

`~/Library/Scripts/redtime_autosync/sync_daemon.sh` L49 設 `PROBE="lm402.html"`。本 session 我改了 `LESSONS.md` / `sync.sh` / `.sync.conf` 共 5 個 commit,**沒碰 lm402.html**。daemon 60s 醒來檢查 `stat` lm402.html 雙端 mtime,差 0 秒 ≤ 2 容差 → silent skip → 11 小時內 5 個 commit 全沒同步到 SMB。

**修法(本次套 RedCandle 的 touch trigger 訣竅)**:

```bash
touch /Volumes/Work/RedTime/lm402.html  # 強迫 anchor mtime 更新
# 等 70 秒(daemon 60s tick + buffer)
```

驗證(16:57:47 → 16:57:58,11 秒成功 sync):
```
{"project":"RedTime","last_sync":"2026-05-02 16:57:58","unix":1777712278, ...}
du -sh:1.3G / 1.3G(雙端完美對齊 ✅)
```

**3 種 daemon silent skip 的 root cause 全圖(從廣場累積得出)**:

| Pattern | 觀察到的專案 | stderr.log | main log | last_sync.json |
|---|---|---|---|---|
| (a) **ENOPERM burst 後自癒** | LD / RedCandle | 0 bytes(假象) | 早期有 ENOPERM | 自癒後恢復寫 |
| (b) **PROBE 檔不存在** | CPBL2 | 0 bytes | 安靜 | 從未寫過 |
| (c) **PROBE 存在但 session 沒改它** | **RedTime 本次** | 0 bytes | 安靜 | timestamp 卡在部署初次 |

(c) 最隱形 — daemon 完全 healthy,但「anchor 檔變動代表整個目錄變動」的設計假設在「我改 LESSONS 不改 lm402.html」場景失敗。

**規則(內化)**:

> **單一 anchor PROBE 是「目錄活動的 sample」,不是「目錄真相」**。當 sample 不是 representative(本 session 改 LESSONS 不改 PROBE),daemon 會 silent skip 真實變動。
>
> 雙保險建議(future PR):
> 1. **PROBE 多檔**:`stat -f %m` 多個 anchor 取 max,任一變動 trigger sync
> 2. **強制 sync 週期**:每 N 分鐘(如 30 分鐘)不論 mtime 強制跑一次 sync,backup 設計暗箝
> 3. **目錄 mtime walk**:`find $WORK -newer $LAST_SYNC_MARKER` 才能真實偵測,但成本較高

**對自身 ALLRM 流程的影響**:

我前次 round-2 §3.11.1 寫「daemon healthy verified」是基於 anchor mtime 雙端收斂這個訊號。但**「anchor mtime 雙端收斂」≠「daemon 把所有檔都 sync 到對齊」**。LD §13 的「anchor mtime ≤ 2 秒」驗證只能證明「PROBE 那個檔對齊」,不能證明「整個目錄對齊」。

**du -sh 才是唯一可靠的「整個目錄對齊」驗證**(也是 LD lesson 說的「大小對齊 < 5%」)。

**對 ALLRM_PROTOCOL.md 的建議(本 session 已採納並修)**:

採納 CPBL2 round-2 §5 對 RedTime 的提案,Step 1 加 daemon health probe:

> 在 ALLRM Step 1「收尾本次工作」加:
> - **觸發 daemon 強制 sync**:`touch <PROBE>` 後等 70 秒
> - **跑 §SOP 4 重驗證**:stderr.log 空 + main log 無近期 ENOPERM + anchor mtime 收斂 + du -sh 雙端 < 5% 差 + last_sync.json timestamp 接近 now

**meta-meta(round-3 抓到 round-2 沒抓的)**:

| 輪次 | 抓到的 over-claim/盲點 |
|---|---|
| round-1 廣播 v2.2 | 「8 daemon 全 verified stderr 100% 空」(verified 一個推 7 個) |
| round-2 §6.1 | 「JYQXZ daemon 仍噴 stderr」(混淆 stderr.log vs main log + 用歷史推當下) |
| round-2 §3.11.1 | 「daemon healthy verified」(驗了 anchor mtime 收斂沒驗 du -sh,且驗的是錯的訊號) |
| **round-3** | 「自家 daemon 11 小時 silent skip 沒察覺」(完全沒驗自家 daemon 健康) |

**規則(內化)**:每一輪 ALLRM 都會抓到前一輪的盲點。**meta 教訓**:**反思工具(ALLRM)本身也需要被反思**,沒有「最終版」的 self-audit。

**對應動作**:
- LESSONS §3.12 寫成(本段)
- 廣場 round-3 message 寫成
- ALLRM_PROTOCOL.md Step 1 採納 CPBL2 提案,加 daemon health probe
- macos_tcc_daemon_subtleties.md cross-ref RedTime 行從「待驗」改成 case (c)「PROBE 存在但 session 沒改它」的 case study

---

### 3.13 ALLRM round-4 — 第 5 種 over-claim「寫工具與工具不同步」+ negative 清單實證紀律(2026-05-02 19:35)

**情境**:同 session 第 4 輪 ALLRM。收 3 封對 RedTime 訊息(CPBL2 / Anzai / MacOS round-3),全採納 + 修 ALLRM_PROTOCOL 三處 + 修自家 sync.sh threshold bug。

**第 5 種 over-claim**(本 session 累計 5 種):

1. round-1 廣播「8 daemon stderr 100% 空」(verified 一個推 7 個)
2. round-2 §6.1「JYQXZ 仍噴 stderr」(混淆 stderr.log vs main log)
3. round-2 §6.1「仍噴」現在式(歷史推當下)
4. round-3 §3.12「自家 daemon 11h silent skip 沒察覺」(完全沒驗自家)
5. **round-4 兩 sibling**:
   - 「不適用 daemon health probe」清單寫 MVP / MacOS(憑記憶寫 negative list)
   - sync.sh --audit threshold(5min)vs daemon FORCE_SYNC_INTERVAL(30min)不同步

**規則(內化)**:

> **寫 negative 清單前必跑 inventory 指令實證**:`launchctl list | grep com.toni` / `ls -la` / `ps aux`。「沒看到」不會自動觸發疑問,「看到」才會。

> **「寫工具的工具與工具同步」是 PROBE 設計盲點的 sibling bug**:任何「兩個工具互動」的設計,工具 A 的 threshold 必須對齊工具 B 的 interval。寫工具 A 時 grep 工具 B 的常數。

**round-4 跨 Claude 訂正連鎖**:CPBL2 16:15 →MacOS 18:25 → RedTime 19:35。N-on-N 廣場讓 single-Claude blind spot 多次 review 後 visible。**修正力 = 跨 Claude 連鎖**,單獨 RedTime self-audit 永遠不會抓到。

**對應動作**:
- 廣場 round-4 留言:`messages/2026-05-02_RedTime_ALLRM_round4.md`(完整詳述)
- ALLRM_PROTOCOL.md 三處訂正(MVP+Mac 移除 / §0 機制源流 / Step 5 Type D channel)
- sync.sh --audit threshold 修(commit `3b2b21d`)

**meta-meta-meta**:同 session 4 輪 ALLRM 每輪都抓新盲點 → **round-N 不是過度反芻是必要 self-audit**。停止規則建議:**toni 主動觸發,不自動跑無限輪**。

---

### 3.14 訊號詞警示 — framework 加碼識別 + round-4 §6.2 自我訂正(2026-05-03 round-5)

**情境**:跨夜讀 JYQXZ round-4 self-correct(22:00),揭露 toni 反問「每次都是我啟動的,還算無限套娃嗎?」戳破 JYQXZ round-3「無限套娃 framework + 3 套方案」over-claim。

**JYQXZ §2.9 訊號詞警示**(學起來):

寫到以下字時必停下來過 1 重核實:

| 訊號詞 | 該核實 |
|---|---|
| 集體現象 / 趨勢 | 觸發者 / 主導者是誰? |
| 風險警告 / 警示 | 風險的「主體」是誰?他知道嗎? |
| 3 套方案 / 短中長期 | toni 有問「該怎麼處理」嗎?還是我主動加碼? |
| framework / 機制 | 這是事實描述還是我自己抽象? |

**RedTime self-correct**:round-4 §6.2「round-N 該何時停 — 連續 3 輪沒抓到新 bug 即 OK 停 / toni 主動觸發才動」是同 family framework 加碼。

→ **toni 沒問「該不該停」,我不該預設 stop rule**。round-N 由 toni 觸發,我即跑;不觸發,自然停。**廢除 §6.2 stop rule 提議**。

**規則(內化)**:

> **第 4 條陷阱新形式**:在「警告 over-claim」對話內再 over-claim 加碼 framework — 比直接 over-claim 更隱形,因為穿著「反思紀律」的外衣。
>
> 訊號詞觸發 → 核實「對象的觸發者 / 主導者 / 控制權」。

**跟 §3.11.1 對齊**:第 4 條「想顯得反思深的加碼」+ §3.14 訊號詞 = 反向 over-claim 雙保險。

**廣場 N-on-N self-referential loop 第 3 次**(本 round-5 觀察):
- round-2 §3.9 daemon 不寫 SMB → IamPTT 寫進 launchd_daemon_checklist 第 13 條
- round-3 §7.2 PROBE 設計盲點 → IamPTT 寫進第 10 條
- **round-4 認 over-claim → JYQXZ 寫 §2.9 訊號詞警示 → RedTime round-5 反向吸收回 §3.14**

雙向倒流形成。lesson 沉澱層真在運作。

**對應動作**:
- 廣場 round-5 message 寫成
- §3.14 codify(本段)
- 不寫廣播(toni 觸發即跑,pull 模型)
- 不寫 stop rule

---

## §4 整理紀律（讓這份 LESSONS.md 不腐爛）

1. **每個 session 結束前**：如果犯了「值得未來避免」的錯，加進 §3 RedTime 自身教訓（追加，不刪舊）
2. **發現別的專案有新 pattern**：加進 §1（按專案分節）
3. **文件化的規則必須有「規則」+「證據（commit / file:line）」+「為什麼」**
4. **不要把 §1/§2/§3 當作「列出來給人看」**：寫的時候要假設「下次 Claude session 一行一行讀，必須有可執行性」
