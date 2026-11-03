#!/usr/bin/env bash
# 服务器端发布脚本，由 scripts/deploy.mjs 通过 ssh 调用，部署后保存为 ~/blog/remote.sh
#   remote.sh release <版本号> <压缩包路径>   解压并切换到新版本，健康检查失败自动回退
#   remote.sh rollback                         切回上一个版本
set -euo pipefail

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"

BASE="$HOME/blog"
RELEASES="$BASE/releases"
KEEP=5

# 经 sudo -u 调用时工作目录可能仍是 /root，切到自己的目录避免 find 等命令报错
cd "$HOME"

current_release() {
  readlink -f "$BASE/current" 2>/dev/null || true
}

start_release() {
  ln -sfn "$1" "$BASE/current"
  pm2 delete blog >/dev/null 2>&1 || true
  pm2 start "$BASE/ecosystem.config.cjs" >/dev/null
}

healthy() {
  for _ in $(seq 1 30); do
    if curl -sf -o /dev/null --max-time 5 http://127.0.0.1:3000/; then
      return 0
    fi
    sleep 1
  done
  return 1
}

prune() {
  local cur
  cur="$(current_release)"
  find "$RELEASES" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +$((KEEP + 1)) |
    while read -r dir; do
      [ "$dir" = "$cur" ] || rm -rf "$dir"
    done
}

release() {
  local version="$1" archive="$2"
  local dir="$RELEASES/$version"
  [ -f "$BASE/shared/.env" ] || { echo "缺少 $BASE/shared/.env"; exit 1; }
  mkdir -p "$RELEASES" "$BASE/shared/uploads" "$BASE/shared/logs"

  mkdir -p "$dir"
  tar -xzf "$archive" -C "$dir"
  cp "$dir/deploy/ecosystem.config.cjs" "$BASE/ecosystem.config.cjs"
  cp "$dir/deploy/remote.sh" "$BASE/remote.sh"

  local prev
  prev="$(current_release)"
  echo "启动新版本 $version ..."
  start_release "$dir"
  if healthy; then
    pm2 save >/dev/null
    prune
    echo "✓ 已上线 $version（提交 $(cat "$dir/REVISION" 2>/dev/null || echo 未知)）"
    return 0
  fi

  echo "✗ 健康检查失败，最近错误日志："
  tail -n 30 "$BASE/shared/logs/err.log" 2>/dev/null || true
  if [ -n "$prev" ] && [ -d "$prev" ] && [ "$prev" != "$dir" ]; then
    start_release "$prev"
    pm2 save >/dev/null
    echo "已自动回退到 $(basename "$prev")"
  fi
  rm -rf "$dir"
  exit 1
}

rollback() {
  local cur prev
  cur="$(current_release)"
  prev="$(find "$RELEASES" -mindepth 1 -maxdepth 1 -type d | sort -r | grep -A1 -Fx "$cur" | sed -n 2p || true)"
  [ -n "$prev" ] || { echo "没有更早的版本可以回退"; exit 1; }
  echo "回退：$(basename "$cur") -> $(basename "$prev")"
  start_release "$prev"
  if healthy; then
    pm2 save >/dev/null
    echo "✓ 已回退到 $(basename "$prev")"
  else
    echo "✗ 回退后健康检查仍失败，请查看 $BASE/shared/logs/err.log"
    exit 1
  fi
}

case "${1:-}" in
  release) release "$2" "$3" ;;
  rollback) rollback ;;
  *) echo "用法: remote.sh release <版本号> <压缩包> | rollback"; exit 1 ;;
esac
