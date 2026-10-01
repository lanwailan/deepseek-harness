#!/usr/bin/env bash
# 同步官方更新：upstream/master 快进到 master 并推送，再把 master 合并进 dev。
# dev 不会自动推送，构建、确认没问题后再 git push origin dev。
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "工作区有未提交的改动，先提交或 git stash 再同步。" >&2
  exit 1
fi

git fetch upstream --prune
git checkout master
git merge --ff-only upstream/master
git push origin master

git checkout dev
if ! git merge --no-edit master; then
  # lockfile 冲突不手工合：取官方版本，再由 pnpm install 把自己的包补回去。
  if git diff --name-only --diff-filter=U | grep -qx 'pnpm-lock.yaml'; then
    git checkout --theirs pnpm-lock.yaml
    pnpm install
    git add pnpm-lock.yaml
  fi
  if [ -n "$(git diff --name-only --diff-filter=U)" ]; then
    echo "还有冲突需要手工解决：" >&2
    git diff --name-only --diff-filter=U >&2
    echo "解决后 git add 并 git commit 完成合并。" >&2
    exit 1
  fi
  git commit --no-edit
fi

pnpm install
echo
echo "已合并到 dev。下一步：pnpm run build，确认没问题后 git push origin dev"
