#!/bin/bash
# backup.sh — LM402 自動化備份系統
#
# 學自 PAL_2026 / JYQXZ 等姊妹專案，把手動 GO + All Backup 流程封裝。
#
# 用法：
#   bash backup.sh go        # 同步晴晴 NAS（rsync --delete）
#   bash backup.sh all       # 時間戳快照（不覆蓋）
#   bash backup.sh both      # GO + All Backup
#   bash backup.sh status    # 列最近 10 個 All Backup 快照
#   bash backup.sh diff      # GO dry-run（看會傳什麼，不實際傳）

set -e

SOURCE="/Volumes/Mac Mini M4/Red Time/"
NAS_GO="/Volumes/918 資料夾/晴晴/時間裡的兩個妳/解析/EP0~EP40修訂二版/網站/"
NAS_ALL="/Volumes/918 資料夾/The Backup/Red Time/All Backup"

EXCLUDES=(
  --exclude=.git
  --exclude=node_modules
  --exclude=.claude
  --exclude=test-results
  --exclude=output
  --exclude=.playwright-cli
  --exclude=.DS_Store
  --exclude=Thumbs.db
  # Lighthouse / smoke 大量臨時檔（非開發必需，不上 NAS）
  --exclude=tools/lighthouse-baseline
  --exclude=tools/smoke-tests
  # 本地 .original.* 備份（已存在工作機，不需重複 NAS）
  --exclude=*.original.js
  --exclude=*.original.css
)

# ─── helpers ───────────────────────────────────────────

ensure_nas() {
  if [ ! -d "/Volumes/918 資料夾" ]; then
    echo "🔌 NAS 未掛載，自動掛載中..."
    osascript -e 'tell application "Finder" to open location "smb://toniLiuMVP._smb._tcp.local/918%20%E8%B3%87%E6%96%99%E5%A4%BE"'
    sleep 8
    if [ ! -d "/Volumes/918 資料夾" ]; then
      echo "❌ NAS 掛載失敗"
      exit 1
    fi
  fi
}

cmd_go() {
  ensure_nas
  echo "🚀 GO 同步晴晴 NAS..."
  rsync -a --delete --stats "${EXCLUDES[@]}" "$SOURCE" "$NAS_GO" 2>&1 | tail -5
  echo "✅ GO 完成"
}

cmd_all() {
  ensure_nas
  TS=$(date +%Y%m%d%H%M)
  TARGET="$NAS_ALL/$TS"
  echo "📦 All Backup 時間戳 $TS..."
  mkdir -p "$TARGET"
  rsync -a --stats "${EXCLUDES[@]}" "$SOURCE" "$TARGET/" 2>&1 | tail -5
  echo "✅ All Backup: $TARGET"
}

cmd_both() {
  cmd_go
  echo ""
  cmd_all
}

cmd_status() {
  ensure_nas
  echo "📋 最近 10 個 All Backup 快照："
  ls -1t "$NAS_ALL" 2>/dev/null | head -10
  echo ""
  echo "💾 NAS 路徑：$NAS_ALL"
  echo "📦 晴晴 GO：$NAS_GO"
}

cmd_diff() {
  ensure_nas
  echo "🔍 GO dry-run（不實際傳，只列差異）..."
  rsync -an --delete --itemize-changes "${EXCLUDES[@]}" "$SOURCE" "$NAS_GO" 2>&1 | head -20
  echo ""
  echo "↑ 空白＝完全同步；< / > 開頭＝會傳/刪"
}

cmd_help() {
  cat <<EOF
LM402 自動化備份

用法：
  bash backup.sh go        # 同步晴晴 NAS（rsync --delete）
  bash backup.sh all       # 時間戳快照
  bash backup.sh both      # GO + All Backup
  bash backup.sh status    # 列最近 10 個快照
  bash backup.sh diff      # dry-run

備份位置：
  GO:  $NAS_GO
  ALL: $NAS_ALL/yyyyMMddHHmm/

排除：.git / node_modules / .claude / test-results / output / .playwright-cli / .DS_Store
EOF
}

# ─── dispatch ──────────────────────────────────────────

case "$1" in
  go)     cmd_go ;;
  all)    cmd_all ;;
  both)   cmd_both ;;
  status) cmd_status ;;
  diff)   cmd_diff ;;
  ""|help|-h|--help) cmd_help ;;
  *)
    echo "❌ 未知命令：$1"
    echo ""
    cmd_help
    exit 1
    ;;
esac
