#!/bin/bash
# ============================================================
#  通用雙向同步腳本（支援多專案）
#
#  讀取同目錄的 .sync.conf 取得 MASTER / WORK 路徑
#  若無 .sync.conf 則 fallback 到金庸群俠傳預設路徑
#
#  .sync.conf 格式：
#    MASTER="/Volumes/Mac Mini M4/WS"
#    WORK="/Volumes/Work/JYQXZ"
#    PROJECT_NAME="金庸群俠傳"
#    EXCLUDES_EXTRA="--exclude='custom-exclude'"   # 選用，額外排除
#
#  策略：rsync -au（archive + update，timestamp 比較）
#  雙向各跑一次，較新者勝
#
#  用法：
#    bash sync.sh pull       Master → Work
#    bash sync.sh push       Work → Master
#    bash sync.sh both       雙向同步（推薦）
#    bash sync.sh status     檢查差異不實際同步
#    bash sync.sh init       建立預設 .sync.conf 範本
# ============================================================

set -e

# ── 找 .sync.conf 並載入 ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_FILE="$SCRIPT_DIR/.sync.conf"

if [ -f "$CONF_FILE" ]; then
    # shellcheck disable=SC1090
    source "$CONF_FILE"
fi

# ── 預設值（金庸群俠傳）──
MASTER="${MASTER:-/Volumes/Mac Mini M4/WS}"
WORK="${WORK:-/Volumes/Work/JYQXZ}"
PROJECT_NAME="${PROJECT_NAME:-金庸群俠傳}"

# ── 顏色 ──
if [ -t 1 ]; then
    C_R='\033[0;31m'; C_G='\033[0;32m'; C_Y='\033[1;33m'; C_C='\033[0;36m'; C_N='\033[0m'
else
    C_R=''; C_G=''; C_Y=''; C_C=''; C_N=''
fi
info() { printf "${C_C}[資訊]${C_N} %s\n" "$1"; }
ok()   { printf "${C_G}[完成]${C_N} %s\n" "$1"; }
warn() { printf "${C_Y}[警告]${C_N} %s\n" "$1"; }
err()  { printf "${C_R}[錯誤]${C_N} %s\n" "$1" >&2; }

# 共用排除清單（跨專案標準）
EXCLUDES=(
    # Git / Claude / 開發垃圾
    --exclude='.git'
    --exclude='.claude'
    --exclude='.DS_Store'
    --exclude='.fseventsd'
    --exclude='.Spotlight-V100'
    --exclude='.TemporaryItems'

    # Python / Node / Rust / 其他
    --exclude='__pycache__'
    --exclude='node_modules'
    --exclude='target'
    --exclude='.next'
    --exclude='dist'
    --exclude='build'

    # 開發過程產物
    --exclude='test-results'
    --exclude='output'
    --exclude='_dist'
    --exclude='.playwright-cli'

    # 本機運行狀態
    --exclude='.server_pid'
    --exclude='.server_info'
    --exclude='server_debug.log'
    --exclude='*.log'

    # 該專案自己的本機備份（不應同步）
    --exclude='_tools/.dosbox_runtime.conf'
    --exclude='_tools/backup/_initial'
    --exclude='_tools/backup/_snapshots'
    --exclude='_tools/backup/backup.json'
)

# 從 conf 加額外排除（若有定義 EXCLUDES_EXTRA 陣列）
# fix（RedTime 第一次踩到，2026-05-02）：原本用 head -c 11 比對 "declare -a"
# 但 declare -p 輸出實際是 "declare -a " 含尾隨空格 → 比對失敗 → EXCLUDES_EXTRA 失效
# 改用 grep 更穩定：matches "declare -a EXCLUDES_EXTRA" 開頭
if declare -p EXCLUDES_EXTRA &>/dev/null; then
    if declare -p EXCLUDES_EXTRA 2>/dev/null | grep -q "^declare -a"; then
        EXCLUDES+=("${EXCLUDES_EXTRA[@]}")
    fi
fi

# ── 檢查路徑 ──
check_paths() {
    if [ ! -d "$MASTER" ]; then
        err "Master 不存在：$MASTER"
        err "請確認 SMB 已掛載（osascript 自動掛載參考全域 CLAUDE.md）"
        exit 1
    fi
    if [ ! -d "$WORK" ]; then
        err "Work 不存在：$WORK"
        err "請確認外接 SSD 已連接"
        exit 1
    fi
}

# ── 移除 quarantine（rsync 從 SMB 複製到 APFS 時 macOS 會自動加）──
strip_quarantine_on_work() {
    if [ -d "$WORK" ]; then
        # quarantine 是擋雙擊執行的真正原因（不是 provenance）
        # 從 SMB rsync 來的檔案會被標記，需要清除才能雙擊 .command / .app
        local count
        count=$(xattr -dr com.apple.quarantine "$WORK" 2>&1 | wc -l | tr -d ' ')
        if [ "$count" -gt 0 ]; then
            info "已清除 $count 處 quarantine 屬性（讓 .command 可雙擊）"
        fi
    fi
}

# ── Pull: Master → Work ──
cmd_pull() {
    check_paths
    info "[$PROJECT_NAME] Pull 中：Master → Work"
    info "  $MASTER  →  $WORK"
    rsync -av --update "${EXCLUDES[@]}" "$MASTER/" "$WORK/" 2>&1 | tail -20
    strip_quarantine_on_work
    ok "Pull 完成（Master 較新的檔案已同步到 Work）"
}

# ── Push: Work → Master ──
cmd_push() {
    check_paths
    info "[$PROJECT_NAME] Push 中：Work → Master"
    info "  $WORK  →  $MASTER"
    rsync -av --update "${EXCLUDES[@]}" "$WORK/" "$MASTER/" 2>&1 | tail -20
    ok "Push 完成（Work 較新的檔案已同步到 Master）"
}

# ── 雙向同步 ──
cmd_both() {
    check_paths
    info "═══════════════════════════════════════"
    info "  [$PROJECT_NAME] 雙向同步（先 Pull 後 Push）"
    info "═══════════════════════════════════════"
    cmd_pull
    echo ""
    cmd_push
    echo ""
    ok "雙向同步完成 — Master 與 Work 已對齊"
}

# ── Conflict detection: 列出兩邊都比對方新的同一個檔案 ──
# 原理：rsync --update 是「較新者勝」。但如果兩邊都改過同一個檔，
# 不管哪邊「贏」都會丟失對方的變動。這個函數找出這種衝突。
detect_conflicts() {
    # 兩邊各跑 dry-run，取交集（不含目錄記號）
    local master_newer work_newer
    master_newer=$(rsync -avn --update "${EXCLUDES[@]}" "$MASTER/" "$WORK/" 2>&1 \
        | grep -vE "^sending|^sent |^total |^$|^Transfer starting|^Skip newer|^\.\/|/$" \
        | sort)
    work_newer=$(rsync -avn --update "${EXCLUDES[@]}" "$WORK/" "$MASTER/" 2>&1 \
        | grep -vE "^sending|^sent |^total |^$|^Transfer starting|^Skip newer|^\.\/|/$" \
        | sort)

    # 找出在 master_newer 出現但 master 端比較新 + work_newer 也出現的檔案
    # 這代表「兩邊各自有更新的副本」— 真衝突
    if [ -n "$master_newer" ] && [ -n "$work_newer" ]; then
        comm -12 <(echo "$master_newer") <(echo "$work_newer") 2>/dev/null
    fi
}

# ── Status: 顯示差異不實際同步 ──
cmd_status() {
    check_paths
    info "═══ [$PROJECT_NAME] 差異報告（dry-run）═══"
    echo ""
    echo -e "${C_Y}── Master 比 Work 新的檔案 ──${C_N}"
    diff_to_work=$(rsync -avn --update "${EXCLUDES[@]}" "$MASTER/" "$WORK/" 2>&1 | grep -v "^sending\|^sent \|^total \|^$\|^Transfer starting\|^Skip newer\|^\./" | tail -30)
    if [ -z "$diff_to_work" ]; then
        echo "  （無）"
    else
        echo "$diff_to_work"
    fi
    echo ""
    echo -e "${C_Y}── Work 比 Master 新的檔案 ──${C_N}"
    diff_to_master=$(rsync -avn --update "${EXCLUDES[@]}" "$WORK/" "$MASTER/" 2>&1 | grep -v "^sending\|^sent \|^total \|^$\|^Transfer starting\|^Skip newer\|^\./" | tail -30)
    if [ -z "$diff_to_master" ]; then
        echo "  （無）"
    else
        echo "$diff_to_master"
    fi

    # ── 衝突檢測：兩邊都改過同一檔案 ──
    echo ""
    echo -e "${C_R}── ⚠️  衝突偵測（兩邊都改過的同檔案）──${C_N}"
    conflicts=$(detect_conflicts)
    if [ -z "$conflicts" ]; then
        echo "  （無衝突，rsync --update 可安全執行）"
    else
        echo "$conflicts" | while IFS= read -r f; do
            [ -n "$f" ] || continue
            echo -e "  ${C_R}⚠${C_N} $f"
            # 顯示兩邊的 mtime 幫助判斷
            local m_path="$MASTER/$f"
            local w_path="$WORK/$f"
            if [ -f "$m_path" ] && [ -f "$w_path" ]; then
                local m_mt w_mt
                m_mt=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$m_path" 2>/dev/null)
                w_mt=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$w_path" 2>/dev/null)
                echo "      Master: $m_mt"
                echo "      Work:   $w_mt"
            fi
        done
        echo ""
        warn "兩邊都修改過上述檔案 — both 模式下較舊那邊的變動會丟失"
        warn "建議：手動比對內容後決定保留哪邊（diff / vimdiff）"
    fi
    echo ""
    info "（執行 'bash sync.sh both' 進行實際同步）"
}

# ── Init: 建立 .sync.conf 範本 ──
cmd_init() {
    if [ -f "$CONF_FILE" ]; then
        warn ".sync.conf 已存在，不覆蓋"
        cat "$CONF_FILE"
        return
    fi
    cat > "$CONF_FILE" <<EOF
# sync.sh 設定檔
# 修改 MASTER / WORK 為你的專案路徑

MASTER="/Volumes/Mac Mini M4/<專案名>"
WORK="/Volumes/Work/<專案名>"
PROJECT_NAME="<顯示用名稱>"

# 額外排除（陣列形式）— 選用
# EXCLUDES_EXTRA=(
#     --exclude='your-custom-dir'
# )
EOF
    ok ".sync.conf 範本已建立：$CONF_FILE"
    info "請編輯該檔填入正確路徑"
}

# ── launchd daemon 控制 ──
# 從 .sync.conf 讀 LAUNCHD_LABEL（如「redtime_autosync」），預設 jyqxz_autosync 保持向後相容
# 修法源自 PAL Claude 廣場留言（2026-05-02 二輪 ALLRM）— 解決「cp 範本後沒 grep 全文」反覆踩雷
LAUNCHD_LABEL="com.toni.${LAUNCHD_LABEL:-jyqxz_autosync}"
LAUNCHD_PLIST="$HOME/Library/LaunchAgents/$LAUNCHD_LABEL.plist"
DAEMON_SCRIPT="$HOME/Library/Scripts/${LAUNCHD_LABEL#com.toni.}/sync_daemon.sh"
# log 命名慣例 <project>_sync.log（去 _autosync 後綴）
_LABEL_SHORT="${LAUNCHD_LABEL#com.toni.}"
LOG_BASENAME="${_LABEL_SHORT%_autosync}_sync"

cmd_install_launchd() {
    if [ ! -f "$LAUNCHD_PLIST" ]; then
        err "找不到 plist：$LAUNCHD_PLIST"
        err "請確認 $LAUNCHD_LABEL.plist 已建立於 ~/Library/LaunchAgents/"
        exit 1
    fi
    if [ ! -x "$DAEMON_SCRIPT" ]; then
        err "找不到 daemon 腳本：$DAEMON_SCRIPT"
        exit 1
    fi

    info "載入 launchd daemon: $LAUNCHD_LABEL"
    # 先 unload（可能已存在）
    launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
    launchctl load -w "$LAUNCHD_PLIST"

    # 等 1 秒讓它跑一次（RunAtLoad=true）
    sleep 1
    if launchctl list | grep -q "$LAUNCHD_LABEL"; then
        ok "Daemon 已載入並運行中"
        info "  每 60 秒自動檢查並同步 Master ↔ Work"
        info "  Log: ~/Library/Logs/${LOG_BASENAME}.log"
        info "  Status JSON: $WORK/.tools/last_sync.json"
        info ""
        info "  停止：bash sync.sh --uninstall-launchd"
    else
        err "Daemon 載入失敗"
        exit 1
    fi
}

cmd_uninstall_launchd() {
    if [ -f "$LAUNCHD_PLIST" ]; then
        launchctl unload "$LAUNCHD_PLIST" 2>/dev/null || true
        ok "Daemon 已停止"
    else
        warn "Daemon plist 不存在（無需 unload）"
    fi
}

cmd_daemon_status() {
    info "═══ Daemon 狀態 ═══"
    if launchctl list | grep -q "$LAUNCHD_LABEL"; then
        ok "Daemon 運行中"
        launchctl list "$LAUNCHD_LABEL" 2>/dev/null | head -10
    else
        warn "Daemon 未運行"
        info "啟用：bash sync.sh --install-launchd"
    fi
    echo ""
    if [ -f "$WORK/.tools/last_sync.json" ]; then
        info "最近一次同步：$(cat "$WORK/.tools/last_sync.json")"
    else
        warn "尚無 last_sync.json（daemon 還沒實際同步過 — mtime 容差內可能還沒觸發）"
    fi
    echo ""
    if [ -f "$HOME/Library/Logs/${LOG_BASENAME}.log" ]; then
        info "── 最近 10 行 log ──"
        tail -10 "$HOME/Library/Logs/${LOG_BASENAME}.log"
    fi
}

# ── 使用說明 ──
cmd_help() {
    local DAEMON_RUNNING="否"
    launchctl list 2>/dev/null | grep -q "$LAUNCHD_LABEL" && DAEMON_RUNNING="是 ✓"

    cat <<EOF

用法：bash sync.sh <指令>

  ── 同步 ──
  pull     Master → Work（拉取 Master 變動）
  push     Work → Master（推送 Work 變動）
  both     雙向同步（推薦，先 pull 後 push）
  status   檢查差異（不實際同步）
  init     建立 .sync.conf 範本（部署到新專案時）

  ── launchd daemon（背景每 60 秒自動同步）──
  --install-launchd     啟用 launchd daemon
  --uninstall-launchd   停止 launchd daemon
  --daemon-status       看 daemon 狀態 + log

  help     顯示此說明

  目前設定：
    PROJECT:        $PROJECT_NAME
    MASTER:         $MASTER
    WORK:           $WORK
    CONF:           $([ -f "$CONF_FILE" ] && echo "$CONF_FILE（已載入）" || echo "（無，使用預設）")
    Daemon 運行中：$DAEMON_RUNNING

EOF
}

# ── 主程式 ──
case "${1:-help}" in
    pull)               cmd_pull ;;
    push)               cmd_push ;;
    both)               cmd_both ;;
    status)             cmd_status ;;
    init)               cmd_init ;;
    --install-launchd)  cmd_install_launchd ;;
    --uninstall-launchd) cmd_uninstall_launchd ;;
    --daemon-status)    cmd_daemon_status ;;
    help|-h|--help)     cmd_help ;;
    *)                  err "未知指令：$1"; cmd_help; exit 1 ;;
esac
