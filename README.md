# Bus Cursor

<p align="center">
  <img src="assets/bus.svg" alt="Bus Cursor" width="120" height="120" />
</p>

<p align="center">
  <img src="https://api.visitorbadge.io/api/visitors?path=github.com%2Fagent-cursor%2Fbus-cursor&label=views&countColor=%230d9488&labelColor=%23374151&style=flat" alt="Просмотры bus-cursor" />
</p>

<p align="center">
  <strong>Переписка и задачи между агентами Cursor</strong><br/>
  Плоский UI · Cursor CLI · скилл для Cursor IDE
</p>

<p align="center">
  <a href="https://agent-cursor.github.io">Сайт</a>
  ·
  <a href="https://github.com/agent-cursor">Организация</a>
  ·
  <a href="#установка">Установка</a>
  ·
  <a href="#использование">Использование</a>
</p>

---

<p align="center">
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=SafonovAG&theme=solarized_dark" alt="Profile details" />
</p>

## Что это

**Bus Cursor** - адаптация скилла [claude-bus](https://github.com/jtapes/claude-bus) под Cursor IDE.

- **Оригинал:** [jtapes/claude-bus](https://github.com/jtapes/claude-bus) (Claude Code)
- **Адаптация под Cursor:** [SafonovAG](https://github.com/SafonovAG) / [agent-cursor](https://github.com/agent-cursor)

Файловая переписка между агентами Cursor и оркестратором проекта:

- сообщения во **входящих**, пока их не прочтут
- адресация по **имени** агента
- типы: `TASK` · `QUESTION` · `DONE`
- фоновый подъём через Cursor CLI (`agent -p`)
- локальный UI: чаты, роли, светлая и тёмная тема

## Установка

### Требования

- [Node.js](https://nodejs.org/) 18+
- [Cursor](https://cursor.com/) IDE
- [Cursor CLI](https://cursor.com/docs/cli/overview) (`agent`)

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent login
```

### Скилл

```powershell
git clone https://github.com/agent-cursor/bus-cursor.git "$env:USERPROFILE\.cursor\skills\bus-cursor"
node "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js" setup
```

macOS / Linux:

```bash
git clone https://github.com/agent-cursor/bus-cursor.git ~/.cursor/skills/bus-cursor
node ~/.cursor/skills/bus-cursor/scripts/bus.js setup
```

После `setup`: ярлык **Bus Cursor**, хуки в `~/.cursor/hooks.json`, правило `.cursor/rules/bus-cursor.mdc`.

## Использование

### UI

```powershell
node "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js" ui --app
```

1. Выбери каталог проекта Cursor  
2. **Новый агент** - имя, роль, модель  
3. Отправь `TASK` или `QUESTION`  

### CLI

```powershell
$bus = "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js"
node $bus agents
node $bus inbox
node $bus add review
node $bus send review TASK "проверь правки"
```

| Команда | Действие |
|--------|----------|
| `ui [--app]` | веб-интерфейс |
| `setup` | хуки и ярлык |
| `inbox` | входящие |
| `send <кому> <ТИП> <текст>` | сообщение |
| `add <имя>` | агент (Cursor по умолчанию) |
| `agents` | список |
| `history [кто] [N]` | переписка |

## Данные

| Что | Путь |
|-----|------|
| Реестр | `~/.cursor/bus-cursor/` |
| Ящики проекта | `<проект>/.cursor/bus-cursor/` |
| Роли | `<проект>/.cursor/agents/` |

## Документация

- [`references/cursor.md`](references/cursor.md)
- [`references/roles.md`](references/roles.md)
- [`references/ui.md`](references/ui.md)
- [`SKILL.md`](SKILL.md)

---

<p align="center">
  <sub>
    Оригинал <a href="https://github.com/jtapes/claude-bus">jtapes/claude-bus</a>
    · адаптация под Cursor <a href="https://github.com/SafonovAG">SafonovAG</a>
    · <a href="https://github.com/agent-cursor">agent-cursor</a>
    · <a href="https://agent-cursor.github.io">сайт</a>
  </sub>
</p>
