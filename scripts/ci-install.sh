#!/usr/bin/env bash
# CI 用の `bun install`。失敗したら間を置いて最大3回まで試す。
#
# skia-canvas の install スクリプトは、ネイティブモジュールを GitHub の
# Releases から1回だけ取りに行き、失敗すると再試行せずに終了する。
# Releases の配信が一時的に 504 を返すと（2026-11-09 に約40分続いた）、
# ジョブがまるごと落ちる。依存の解決やテストの失敗は何度試しても同じ
# 結果になるので、再試行で隠れることはない。
set -uo pipefail

for attempt in 1 2 3; do
  if bun install --frozen-lockfile "$@"; then
    exit 0
  fi
  if [ "$attempt" -lt 3 ]; then
    echo "::warning::bun install failed (attempt ${attempt}/3). Retrying in $((attempt * 20))s..."
    sleep $((attempt * 20))
  fi
done

echo "::error::bun install failed 3 times"
exit 1
