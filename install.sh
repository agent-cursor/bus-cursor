#!/usr/bin/env bash
# Установка Bus Cursor: хуки Cursor + ярлык на рабочем столе / в меню.
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
bus="$root/scripts/bus.js"
if [[ ! -f "$bus" ]]; then
  echo "Не найден scripts/bus.js рядом с install.sh ($root)" >&2
  exit 1
fi
node "$bus" setup
echo "Готово. Открыть UI: node scripts/bus.js ui --app"
