# Bus Cursor

<p align="center">
  <img src="assets/bus.svg" alt="Bus Cursor" width="120" height="120" />
</p>

<p align="center">
  <strong>Переписка и задачи между агентами Cursor</strong><br/>
  Локальный UI · Cursor CLI · скилл для Cursor IDE
</p>

<p align="center">
  <a href="README.en.md">English</a>
  ·
  <a href="https://github.com/agent-cursor/bus-cursor/releases">Релизы</a>
  ·
  <a href="#установка">Установка</a>
  ·
  <a href="#использование">Использование</a>
</p>

---

## Что это

**Bus Cursor** — файловая шина между агентами Cursor и пользователем: сообщения лежат во входящих, пока их не прочтут. Адресация по **имени** агента, типы `TASK` · `QUESTION` · `DONE`, фоновый подъём через Cursor CLI (`agent -p`).

Это адаптация [claude-bus](https://github.com/jtapes/claude-bus) (Claude Code) под Cursor IDE.

| | |
|---|---|
| Оригинал | [jtapes/claude-bus](https://github.com/jtapes/claude-bus) · [JTapes](https://github.com/jtapes) |
| Адаптация под Cursor | [SafonovAG](https://github.com/SafonovAG) · [agent-cursor/bus-cursor](https://github.com/agent-cursor/bus-cursor) |

Текущая версия: см. [`release.json`](release.json) и [релизы GitHub](https://github.com/agent-cursor/bus-cursor/releases).

## Возможности

- **UI** — лента диалогов, агенты слева, композер с вложениями и `@`-файлами проекта
- **Роли** — создание и правка агентов, доступ по галочкам, «Переписать с ИИ»
- **Фон** — агент поднимается сам (`agent -p`); live-ход, stop / resume, btw
- **Диалоги** — вкладки, сжатие в сводку, история закрытых
- **Расписание** — cron-задачи (демон scheduler)
- **Лимиты Cursor** — Auto / API / Grok Bot в шапке (как в кабинете Cursor)
- **Интерфейс** — светлая и тёмная тема, русский / English, видеофон
- **О приложении** — версия, проверка обновлений, ссылки на репозитории
- **Обновления** — кнопка в шапке при новой версии на GitHub (нужен `release.json`)

## Требования

- [Node.js](https://nodejs.org/) 18+
- [Cursor](https://cursor.com/) IDE
- [Cursor CLI](https://cursor.com/docs/cli/overview) (`agent`)

Windows — CLI:

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent login
```

macOS / Linux — см. [документацию Cursor CLI](https://cursor.com/docs/cli/overview), затем `agent login`.

## Установка

### Windows

```powershell
git clone https://github.com/agent-cursor/bus-cursor.git "$env:USERPROFILE\.cursor\skills\bus-cursor"
& "$env:USERPROFILE\.cursor\skills\bus-cursor\install.ps1"
```

### macOS / Linux

```bash
git clone https://github.com/agent-cursor/bus-cursor.git ~/.cursor/skills/bus-cursor
chmod +x ~/.cursor/skills/bus-cursor/install.sh
~/.cursor/skills/bus-cursor/install.sh
```

Скрипт `install` вызывает `bus.js setup` и ставит:

- хуки в `~/.cursor/hooks.json`
- ярлык **Bus Cursor** (Windows: рабочий стол и «Пуск»; macOS: `~/Applications`; Linux: меню и рабочий стол)
- правило проекта `.cursor/rules/bus-cursor.mdc` при подключении каталога

Альтернатива без git: скачай архив с [страницы релизов](https://github.com/agent-cursor/bus-cursor/releases), распакуй в `~/.cursor/skills/bus-cursor` и запусти `install.ps1` / `install.sh`.

## Запуск

Ярлык **Bus Cursor** или:

```powershell
node "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js" ui --app
```

```bash
node ~/.cursor/skills/bus-cursor/scripts/bus.js ui --app
```

`--app` открывает отдельное окно Chrome/Edge без вкладок. Без флага — обычная вкладка браузера (`127.0.0.1:4781`, при занятости — следующий порт).

1. Выбери каталог проекта Cursor в шапке  
2. **Новый агент** — имя, роль, модель  
3. Отправь `TASK` или `QUESTION`  

Повторно поставить ярлык: кнопка в настройках (⚙) или `bus.js ui --shortcut`.

## Обновления

В шапке появляется кнопка обновления, если на GitHub вышел релиз новее локального `release.json`. В **О приложении** (кнопка внизу списка агентов) — текущая версия и «Проверить обновления».

Установка подтягивает файлы скилла из релиза; копия прежней папки — `skills/bus-cursor.backup`. После установки нажми **Перезапустить** в модалке.

## Использование

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
| `send <кому> <ТИП> <текст>` | сообщение (`TASK` / `QUESTION` / `DONE`) |
| `add <имя>` | агент (движок Cursor по умолчанию) |
| `agents` | список |
| `history [кто] [N]` | переписка |
| `schedule …` | задачи по cron |

Полный список: `node bus.js` без аргументов.

### В Cursor IDE

Скилл отвечает на запросы вроде «открой Bus Cursor», «что во входящих», «пусть X сделает». Хуки и правило подсказывают агенту читать `inbox`. Подробности — [`SKILL.md`](SKILL.md) и [`references/cursor.md`](references/cursor.md).

## Данные

| Что | Путь |
|-----|------|
| Реестр, кэш, настройки шины | `~/.cursor/bus-cursor/` |
| Ящики и история проекта | `<проект>/.cursor/bus-cursor/` |
| Роли агентов | `<проект>/.cursor/agents/` или `~/.cursor/agents/` |

## Документация

- [`SKILL.md`](SKILL.md) — кратко для агента Cursor  
- [`references/cursor.md`](references/cursor.md) — Cursor IDE и CLI  
- [`references/roles.md`](references/roles.md) — роли и доступ  
- [`references/ui.md`](references/ui.md) — поведение UI  
- [`references/schedule.md`](references/schedule.md) — расписание  
- [`references/admin.md`](references/admin.md) — команды оркестратора  

## Авторы

- [JTapes](https://github.com/jtapes) — [claude-bus](https://github.com/jtapes/claude-bus)  
- [SafonovAG](https://github.com/SafonovAG) — адаптация под Cursor ([agent-cursor](https://github.com/agent-cursor))  

---

<p align="center">
  <sub>
    <a href="README.en.md">English README</a>
    ·
    <a href="https://github.com/agent-cursor/bus-cursor/releases">Releases</a>
  </sub>
</p>
