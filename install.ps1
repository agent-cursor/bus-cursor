# Установка Bus Cursor: хуки Cursor + ярлык на рабочем столе.
# Запуск из корня скилла или после clone в ~/.cursor/skills/bus-cursor
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$bus = Join-Path $root 'scripts\bus.js'
if (-not (Test-Path $bus)) {
  Write-Error "Не найден scripts\bus.js рядом с install.ps1 ($root)"
}
node $bus setup
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host 'Готово. Открыть UI: node scripts\bus.js ui --app'
