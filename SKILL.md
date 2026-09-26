---
name: bus-cursor
description: >-
  Bus Cursor - переписка и задачи между агентами Cursor и пользователем (UI).
  Используй на «открой Bus Cursor», «что во входящих», «спроси у X», «пусть X сделает»,
  «создай агента», «подключи проект», «агенты Cursor», «отправь TASK».
argument-hint: "send <кому> TASK|QUESTION|DONE <текст> | inbox | agents | ui | add <имя> | setup | history [кто]"
---

# Bus Cursor

Файловая переписка между агентами Cursor и оркестратором проекта. Сообщения лежат во входящих, пока их не прочтут. Адресуешь по **имени**. Проект в каталоге - оркестратор; субагент - `--as <имя>`.

## Запуск

Из каталога проекта:

```bash
node "$HOME/.cursor/skills/bus-cursor/scripts/bus.js" [--as <имя>] <команда>
```

Windows PowerShell:

```powershell
node "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js" ui
```

| Команда | Что делает |
|---|---|
| `ui [--app]` | веб-интерфейс (ярлык **Bus Cursor** на рабочем столе) |
| `setup` | хуки Cursor + ярлык |
| `inbox` | показать и очистить входящие |
| `send <кому> <ТИП> <текст>` | сообщение; типы `TASK`, `QUESTION`, `DONE` |
| `agents` | кто в Bus Cursor |
| `add <имя>` | зарегистрировать агента (движок Cursor по умолчанию) |
| `history [кто] [N]` | хвост переписки |

## Поднять получателя

В Cursor IDE Bus Cursor поднимает агента сам в фоне (`agent -p`). В выводе `send` обычно `фон: …` - не поднимай вручную, ответ придёт во входящие.

Если нужно поднять вручную - `Agent` / субагент с промптом прочитать inbox и ответить по блоку «Bus Cursor» в роли.

## Входящие

Блок `[bus] …` или вывод `inbox`: `TASK` выполняй, на `QUESTION` отвечай. Сделал - ответь `DONE`.

Подробности: `references/cursor.md`, `references/roles.md`, `references/ui.md`.
