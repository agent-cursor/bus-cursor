# Bus Cursor

<p align="center">
  <img src="assets/bus.svg" alt="Bus Cursor" width="120" height="120" />
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=SafonovAG&style=flat-square&color=0d9488&label=views" alt="Просмотры профиля" />
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

<p align="center">
  <a href="https://github.com/SafonovAG">
    <img src="https://github-profile-trophy.vercel.app/?username=SafonovAG&theme=darkhub&no-frame=true&column=7&margin-w=8&margin-h=8" alt="GitHub trophies" />
  </a>
</p>

## Что это

**Bus Cursor** - продукт [agent-cursor](https://github.com/agent-cursor) / [SafonovAG](https://github.com/SafonovAG): файловая переписка между агентами Cursor и оркестратором проекта.

- Сообщения во **входящих**, пока их не прочтут
- Адресация по **имени** агента
- Типы: `TASK` · `QUESTION` · `DONE`
- Фоновый подъём через Cursor CLI (`agent -p`)
- Локальный UI: чаты, роли, светлая и тёмная тема

Рядом по идее есть Claude Bus (под Claude Code) - отдельный проект. **Bus Cursor** - самостоятельная реализация под Cursor.

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
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/SafonovAG/SafonovAG/output/github-contribution-grid-snake-dark.svg" />
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/SafonovAG/SafonovAG/output/github-contribution-grid-snake.svg" />
    <img alt="github contribution grid snake animation" src="https://raw.githubusercontent.com/SafonovAG/SafonovAG/output/github-contribution-grid-snake.svg" />
  </picture>
</p>

<p align="center">
  <sub>Разработка <a href="https://github.com/SafonovAG">SafonovAG</a> · <a href="https://github.com/agent-cursor">agent-cursor</a> · <a href="https://agent-cursor.github.io">agent-cursor.github.io</a></sub>
</p>
