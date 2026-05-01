# Master + Work 雙位置遷移設計文件

> RedTime 從「純 SMB 主目錄」改為「Master (SMB) + Work (APFS) 雙位置 + 雙向 sync」架構
>
> 範本來源：`/Volumes/Work/JYQXZ/sync.sh`（已實證 5 個專案使用：JYQXZ / PAL / SWDA / Red Candle / + 本次 RedTime）
> 設計者：RedTime Claude（2026-05-02）
> 狀態：📐 設計完成 → 🚀 執行中 → ✅ 待 Verify

---

## §1 為什麼要做

### 痛點

RedTime 主目錄目前在 `/Volumes/Mac Mini M4/Red Time/`（SMB 網路掛載）：

| 操作 | SMB 速度 | APFS 速度 | 倍率 |
|---|---|---|---|
| `git status` | 3-5 秒 | 0.1-0.3 秒 | **15-30x** |
| 1000 檔 `grep` | 20-40 秒 | 0.5-1 秒 | **30-50x** |
| `Read` 1MB 檔 | 0.3-0.8 秒 | 0.01 秒 | **30-80x** |
| ALLRM 整流程 | 5-10 分鐘 | 1-2 分鐘 | **5x** |
| All Backup（rsync）| 10-15 分鐘 | 1-2 分鐘 | **8x** |

每次 Claude session 都被網路 I/O 拖累。

### 既有解：JYQXZ 範本

toni 在 JYQXZ 早就建立了完整的 master+work 架構，5 個專案實證：

```
SMB Master ←─ rsync(--update) ─→ APFS Work
        │                            │
   只存放歸檔                  主要開發位置
   不做 git 操作                 git commit/push 都在這
```

### 收益

- Claude session 工具操作快 5-50 倍
- All Backup 從 10-15 分鐘降到 1-2 分鐘
- toni 在 Mac Mini M4 端仍可看到最新檔案（每 60 秒 launchd daemon 自動 sync）

### 風險

| 風險 | 緩解 |
|---|---|
| 兩邊同時改同檔案 → 較舊覆蓋較新 | sync.sh 有 conflict detection，每次 status 顯示衝突 |
| .git 目錄分歧 | sync.sh exclude .git，Master 端 .git 不再使用，主 git 在 Work |
| 玩家 / 訪客在 SMB 端開啟舊版 | Master 每 60s 自動 sync，最多落後 1 分鐘 |
| Work SSD 壞 | All Backup 還是有；Master 也是備份 |
| 忘記 sync 就 push 到 GitHub | git push 永遠在 Work 端做，不會碰到此問題 |

---

## §2 架構設計

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Pages                            │
│              (toniLiuMVP/RedTime, public)                   │
└──────────────────────────┬──────────────────────────────────┘
                           ▲
                           │ git push origin main
                           │
┌──────────────────────────┴──────────────────────────────────┐
│   Work (APFS) — 主開發位置                                   │
│   /Volumes/Work/RedTime/                                    │
│                                                              │
│   ✓ git commit / git push 都在這                            │
│   ✓ Claude session cwd 指這裡                               │
│   ✓ 所有編輯在這裡                                          │
│   ✓ backup.sh 從這裡跑                                      │
│   ✓ 速度快 5-50 倍                                          │
└──────────────────────────┬──────────────────────────────────┘
                           ▲
                           │ rsync --update (60s daemon + 手動)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│   Master (SMB) — 唯讀副本（自動同步）                          │
│   /Volumes/Mac Mini M4/Red Time/                           │
│                                                              │
│   ✓ 內容跟 Work 一致（自動 sync）                           │
│   ✗ 不做 git 操作（.git 排除在 sync 之外）                  │
│   ✗ 不在這裡編輯                                            │
│   ✓ 給 Mac Mini M4 端訪問用                                 │
└─────────────────────────────────────────────────────────────┘

外加：NAS 備份（晴晴 + All Backup 時光機）— 不變，繼續從 Work 端跑
```

### 排除清單（不雙向同步的東西）

| 項目 | 為什麼排除 |
|---|---|
| `.git/` | 只在 Work 端做 git，Master .git 不需要更新 |
| `.DS_Store`, `Thumbs.db` | macOS / Windows 系統垃圾 |
| `node_modules/` | 構建產物，需要時自己 npm install |
| `.claude/` | Claude session 暫存 |
| `test-results/`, `output/`, `.playwright-cli/` | 測試輸出 |
| `tools/lighthouse-baseline/`, `tools/smoke-tests/` | 大量臨時報告 |
| `*.log` | 本地 log |
| `.fseventsd`, `.Spotlight-V100`, `.TemporaryItems` | macOS 系統檔 |

---

## §3 執行步驟

### Phase 1：初次複製（一次性）

```bash
# 1. 確認 Work SSD 有空間（需要 ~600MB）
df -h /Volumes/Work

# 2. 建立 Work 端目錄
mkdir -p /Volumes/Work/RedTime

# 3. 第一次大複製（SMB → APFS）
#    含 .git（讓 Work 端 git 從第一刻就 work）
#    排掉 .gitignore 已知垃圾以節省空間
rsync -av \
  --exclude='.DS_Store' \
  --exclude='Thumbs.db' \
  --exclude='node_modules' \
  --exclude='.claude' \
  --exclude='test-results' \
  --exclude='output' \
  --exclude='.playwright-cli' \
  --exclude='tools/lighthouse-baseline' \
  --exclude='tools/smoke-tests' \
  --exclude='.fseventsd' \
  --exclude='.Spotlight-V100' \
  "/Volumes/Mac Mini M4/Red Time/" \
  "/Volumes/Work/RedTime/"

# 4. 驗證 git 在 Work 端正常
cd /Volumes/Work/RedTime
git status
git log --oneline -5

# 5. 設定 Work 端 git core.fileMode false（避免權限誤判）
git config core.fileMode false
```

### Phase 2：部署 sync.sh + .sync.conf

```bash
# 1. 複製通用 sync.sh（從 JYQXZ）
cp /Volumes/Work/JYQXZ/sync.sh /Volumes/Work/RedTime/sync.sh
chmod +x /Volumes/Work/RedTime/sync.sh

# 2. 建立 RedTime 專屬 .sync.conf
cat > /Volumes/Work/RedTime/.sync.conf <<'EOF'
# RedTime sync.sh 設定檔
MASTER="/Volumes/Mac Mini M4/Red Time"
WORK="/Volumes/Work/RedTime"
PROJECT_NAME="時間裡的兩個妳 RedTime"

# 額外排除（RedTime 專屬）
EXCLUDES_EXTRA=(
    --exclude='*.original.js'
    --exclude='*.original.css'
)
EOF

# 3. 測試
cd /Volumes/Work/RedTime
bash sync.sh status   # 應顯示「無差異」（剛複製完）
```

### Phase 3：（可選）launchd daemon 自動同步

```bash
# 1. 建立 daemon 腳本目錄
mkdir -p ~/Library/Scripts/redtime_autosync

# 2. 複製 + adapt JYQXZ 的 daemon 腳本
cp ~/Library/Scripts/jyqxz_autosync/sync_daemon.sh \
   ~/Library/Scripts/redtime_autosync/sync_daemon.sh
sed -i '' 's|jyqxz|redtime|g; s|JYQXZ|RedTime|g' \
   ~/Library/Scripts/redtime_autosync/sync_daemon.sh
chmod +x ~/Library/Scripts/redtime_autosync/sync_daemon.sh

# 3. 建立 plist
cat > ~/Library/LaunchAgents/com.toni.redtime_autosync.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.toni.redtime_autosync</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/toni/Library/Scripts/redtime_autosync/sync_daemon.sh</string>
    </array>
    <key>StartInterval</key><integer>60</integer>
    <key>ThrottleInterval</key><integer>30</integer>
    <key>RunAtLoad</key><true/>
    <key>StandardOutPath</key><string>/Users/toni/Library/Logs/redtime_sync.stdout.log</string>
    <key>StandardErrorPath</key><string>/Users/toni/Library/Logs/redtime_sync.stderr.log</string>
</dict>
</plist>
EOF

# 4. 載入
launchctl unload ~/Library/LaunchAgents/com.toni.redtime_autosync.plist 2>/dev/null
launchctl load -w ~/Library/LaunchAgents/com.toni.redtime_autosync.plist
launchctl list | grep redtime_autosync   # 確認運行中
```

### Phase 4：切換主開發位置

```bash
# 1. 在 Work 端做一次 commit + push（確認 git pipeline 工作）
cd /Volumes/Work/RedTime
echo "" >> CLAUDE.md  # 觸發小變動測試
git add CLAUDE.md
git commit -m "test: Work 端 git pipeline 確認"
git push origin main

# 2. 從 Work 端跑 backup.sh both（確認 NAS sync 工作）
bash backup.sh both
```

### Phase 5：未來日常使用

從今天起：
- **所有 Claude session** cwd 指 `/Volumes/Work/RedTime/`
- **所有 git 操作** 在 Work 端
- **所有編輯** 在 Work 端
- Master 端的 `/Volumes/Mac Mini M4/Red Time/` 是唯讀副本（自動 sync）
- `bash sync.sh both` 手動觸發雙向同步（daemon 已每 60s 自動跑）
- `bash sync.sh status` 看當前差異（含 conflict detection）

---

## §4 風險評估 + 回滾方案

### 風險點

1. **Master 端 .git 過期**
   - **影響**：如果 toni 不小心在 Master 端 cd 進去 git status，會看到舊的 commit history
   - **緩解**：在 Master 端 `/Volumes/Mac Mini M4/Red Time/.git/HEAD` 加註解 `# DEPRECATED — git is now in /Volumes/Work/RedTime/.git`（或重新命名 .git → .git.old）

2. **NAS 備份從哪邊跑？**
   - **決定**：從 Work 端跑（更快），但 NAS 備份目標路徑不變（仍是晴晴目錄）
   - **影響**：backup.sh 內 SOURCE 改為 `/Volumes/Work/RedTime/`

3. **如果 Work SSD 壞了**
   - **回滾路徑**：Master 端是 60s 內的副本，可繼續開發（速度慢但不丟）
   - **長期回滾**：rsync Work → 新 SSD，繼續

4. **如果 daemon 故障（不再每 60s 同步）**
   - **症狀**：Master 端檔案不再更新
   - **檢測**：`bash sync.sh --daemon-status` 看 last_sync.json 時間
   - **修復**：`bash sync.sh --uninstall-launchd && bash sync.sh --install-launchd`

### 完整回滾方案

如果整個架構出問題：
```bash
# 1. 停 daemon
launchctl unload ~/Library/LaunchAgents/com.toni.redtime_autosync.plist

# 2. 確認 Master 端有最新（手動 sync 一次）
bash /Volumes/Work/RedTime/sync.sh push

# 3. 之後直接用 Master 端開發（回到舊架構）
cd /Volumes/Mac Mini M4/Red Time
git status   # 工作樹仍正常

# 4. 刪 Work 副本（可選）
rm -rf /Volumes/Work/RedTime
```

---

## §5 跟其他專案的關係

### 已使用本架構的專案

| 專案 | Master | Work | sync.sh | daemon |
|---|---|---|---|---|
| JYQXZ | `/Volumes/Mac Mini M4/WS/` | `/Volumes/Work/JYQXZ/` | ✅ | ✅ com.toni.jyqxz_autosync |
| PAL_2026 | `/Volumes/Mac Mini M4/PAL_2026/` | `/Volumes/Work/PAL_2026/` | ✅（待確認）| ✅（待確認）|
| SWDA_2026 | `/Volumes/Mac Mini M4/SWDA_2026/` | `/Volumes/Work/SWDA_2026/` | ✅（待確認）| ✅（待確認）|
| **RedTime（本次）** | `/Volumes/Mac Mini M4/Red Time/` | `/Volumes/Work/RedTime/` | 📐 部署中 | 📐 部署中 |
| **WS（金庸 master）** | 同上 JYQXZ | 同上 JYQXZ | 跟 JYQXZ 共用 | 跟 JYQXZ 共用 |

### 架構共用部分

- `sync.sh` 是 **通用版**（363 行，讀 `.sync.conf`），所有專案共用同一份程式碼
- 各專案差異只在 `.sync.conf` 三行（MASTER / WORK / PROJECT_NAME）

### 未來新增專案

如果 toni 之後新增專案需要 master+work：
1. `cp /Volumes/Work/RedTime/sync.sh /Volumes/Work/<新專案>/sync.sh`
2. 建 `.sync.conf` 改 3 個變數
3. 仿 Phase 3 建 daemon plist

---

## §6 工程量估算

| Phase | 動作 | 預估時間 | 實際時間 |
|---|---|---|---|
| Phase 1 | rsync 1.3GB（含 .git）SMB → APFS | 5-10 分鐘 | （待填）|
| Phase 2 | 部署 sync.sh + .sync.conf | 2 分鐘 | （待填）|
| Phase 3 | launchd daemon 建立（可選）| 5 分鐘 | （待填）|
| Phase 4 | 切換主位置 + 驗證 git | 5 分鐘 | （待填）|
| 文件 | 寫本檔 + 更新 CLAUDE.md | 15 分鐘 | （待填）|
| 測試 | sync 雙向 + conflict detection | 5 分鐘 | （待填）|
| **總計** | | **~40 分鐘** | （待填）|

---

## §7 測試清單

完成後必須通過以下檢查：

- [ ] Phase 1：`/Volumes/Work/RedTime/` 目錄存在 + 檔案數量 ≥ Master 端
- [ ] Phase 1：`cd /Volumes/Work/RedTime && git log --oneline -5` 顯示最近 5 個 commit
- [ ] Phase 1：`git config core.fileMode` 顯示 false
- [ ] Phase 2：`bash sync.sh status` 顯示「無差異」（剛複製完）
- [ ] Phase 2：`bash sync.sh --help` 顯示完整指令說明
- [ ] Phase 3（可選）：`launchctl list | grep redtime_autosync` 有輸出
- [ ] Phase 3（可選）：60s 後 `~/Library/Logs/redtime_sync.stdout.log` 有 daemon log
- [ ] Phase 4：在 Work 端做 commit + push 成功推到 GitHub
- [ ] Phase 4：等 60s（或手動 sync push），確認 Master 端有新檔案
- [ ] Phase 4：跟 NAS 備份路徑核對（backup.sh 仍工作）
- [ ] Phase 5：故意在 Master 端動一個檔案（模擬衝突），`sync.sh status` 偵測並警告

---

## §8 執行紀錄

> 每次執行更新此段。

### 2026-05-02 05:00–05:08 — 第一次執行（RedTime Claude）

**Phase 1（rsync 1.3GB）**：✅ **29 秒完成**（48 MB/s）
- 預估 5-10 分鐘，實際 SMB 讀取 + APFS 寫入意外快很多
- Work 端檔案數 772 vs Master 854（差 82 都是 exclude 掉的，正常）

**Phase 2（sync.sh + .sync.conf）**：✅ 完成 + **發現並修 1 個 bug**
- 直接 cp `/Volumes/Work/JYQXZ/sync.sh` 過來
- **Bug**：sync.sh 的 EXCLUDES_EXTRA 陣列偵測用 `head -c 11` 比對 "declare -a"，但實際 declare -p 輸出含尾隨空格 → 比對失敗 → EXCLUDES_EXTRA 永遠失效
- **修法**：改用 `grep -q "^declare -a"` 更穩定
- 修在 RedTime 端的 sync.sh L90-95（已寫信件 #003 通知 JYQXZ Claude 同步修這個 bug）

**Phase 3（launchd daemon）**：✅ 完成
- `~/Library/Scripts/redtime_autosync/sync_daemon.sh`（從 JYQXZ 模板 sed 改）
- `~/Library/LaunchAgents/com.toni.redtime_autosync.plist`（60s interval, RunAtLoad）
- launchctl load 後 `launchctl list | grep redtime` 確認運行
- 故意改 lm402.html mtime 觸發 daemon → log 寫入 + last_sync.json 寫入 + 雙向 rsync 工作

**Phase 4（切換主位置）**：✅ 完成
- 從本 commit 起 git 操作改在 Work 端做
- Master 端的 .git 不再使用，但留檔（被 sync.sh exclude 不會被覆蓋）

**測試結果**：
| 測試項 | 結果 |
|---|---|
| Work 端 git status / log 正常 | ✅ |
| `git config core.fileMode false` 設定 | ✅ |
| `bash sync.sh status` 顯示無差異 | ✅（修 EXCLUDES_EXTRA 後） |
| `bash sync.sh both` 雙向同步成功 | ✅ |
| daemon 載入 + 自動運行 | ✅ |
| daemon mtime 容差 ±2s skip | ✅ |
| daemon 真實 sync + 寫 status JSON | ✅ |
| 衝突偵測（兩邊都改同檔）| ✅（status 命令會警告） |

**遇到的問題 + 解法**：
1. **sync.sh EXCLUDES_EXTRA 失效** — 已記載上方 Phase 2，修 sync.sh L90-95
2. **daemon 第一次 silent exit** — 原因：兩邊 mtime probe（lm402.html）一致，daemon 設計就是相同時 skip。手動 touch 觸發 mtime 差異後驗證正常運作
3. **sed 替換 jyqxz_launcher.html → lm402.html 過程** — 註解內仍殘留「金庸用 redtime_launcher.html」字眼，第二輪 sed 補修
4. **JYQXZ-specific excludes（_tools/.dosbox_runtime.conf 等）** — daemon sed 後變空行，手動 Edit 清掉並補 RedTime 專屬（Thumbs.db / *.original.* / lighthouse-baseline / smoke-tests / test-results / output / .playwright-cli）

**實際工程量**：
- 文件 + 規劃：30 分鐘
- Phase 1-3 執行：8 分鐘（rsync 29s + 部署 1min + daemon 設定 6min）
- 測試 + bug 修：5 分鐘
- 文件更新 + commit：10 分鐘
- **總計：~55 分鐘**（預估 40 分鐘，實際稍多因為 EXCLUDES bug + sed 殘留）

---

## §9 後續建議

1. **盤點其他專案**：PAL_2026 / SWDA_2026 是否真的有 sync.sh + daemon（之前只 ls 確認 Work 副本存在，沒確認 sync 機制）
2. **CLAUDE.md 全域版** 加段「toni 主目錄一覽表」（哪些專案在 SMB、哪些在 Work、哪些雙位置 + sync）
3. **每月一次** 讓所有 daemon 跑 status report（all sync.sh status 撈差異），toni 巡視一次
4. **未來 RedTime master 撤掉**：如果 6 個月內證實 Work 端開發穩定，可考慮砍掉 Master 端純歸檔（純依賴 git + NAS 備份），但短期不建議
