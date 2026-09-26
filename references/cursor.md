# Bus Cursor и Cursor IDE

## Установка

1. Cursor CLI: `irm 'https://cursor.com/install?win32=true' | iex`, затем `agent login`.
2. `node ~/.cursor/skills/bus-cursor/scripts/bus.js setup` - хуки в `~/.cursor/hooks.json`, ярлык **Bus Cursor**, правило `.cursor/rules/bus-cursor.mdc` в проектах.
3. Скилл: `~/.cursor/skills/bus-cursor/`.

## Агенты

Роль: `.cursor/agents/<имя>.md` (проект) или `~/.cursor/agents/<имя>.md` (глобальный).
Движок по умолчанию - Cursor (`agent -p`). В UI: **Новый агент**.

```bash
node .../bus.js add my-agent
node .../bus.js send my-agent TASK "..."
```

## UI как оркестратор

Хуки в `~/.cursor/hooks.json`: sessionStart, postToolUse, stop - входящие и роль.
Правило `bus-cursor.mdc` (`alwaysApply`): в начале хода зови `inbox`.

## Данные

- `~/.cursor/bus-cursor/` - реестр, audit
- `<проект>/.cursor/bus-cursor/` - ящики и история проекта
