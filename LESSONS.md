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

## §4 整理紀律（讓這份 LESSONS.md 不腐爛）

1. **每個 session 結束前**：如果犯了「值得未來避免」的錯，加進 §3 RedTime 自身教訓（追加，不刪舊）
2. **發現別的專案有新 pattern**：加進 §1（按專案分節）
3. **文件化的規則必須有「規則」+「證據（commit / file:line）」+「為什麼」**
4. **不要把 §1/§2/§3 當作「列出來給人看」**：寫的時候要假設「下次 Claude session 一行一行讀，必須有可執行性」
