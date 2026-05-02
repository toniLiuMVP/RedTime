#!/bin/bash
# 一次性安裝 RedTime git hooks(學自 LD pre_commit_check.sh pattern)
# 跑法:bash tools/setup_hooks.sh
# 之後本 repo 任何 git commit 都會跑 .githooks/* 內的 hook

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ ! -d ".githooks" ]; then
    echo "❌ .githooks/ 不存在,請確認在 RedTime repo root 跑此 script"
    exit 1
fi

# 設定 git hooksPath
git config core.hooksPath .githooks

# 確保所有 hook 可執行
find .githooks -type f -exec chmod +x {} \;

echo "✅ git hooks 已安裝"
echo ""
echo "已啟用的 hooks:"
ls -1 .githooks/ | sed 's/^/   - /'
echo ""
echo "驗證:跑 git config core.hooksPath 應顯示 .githooks"
git config core.hooksPath
