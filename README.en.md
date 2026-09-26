# Bus Cursor

<p align="center">
  <img src="assets/bus.svg" alt="Bus Cursor" width="120" height="120" />
</p>

<p align="center">
  <strong>Messaging and tasks between Cursor agents</strong><br/>
  Local UI · Cursor CLI · skill for Cursor IDE
</p>

<p align="center">
  <a href="README.md">Русский</a>
  ·
  <a href="https://github.com/agent-cursor/bus-cursor/releases">Releases</a>
  ·
  <a href="#installation">Install</a>
  ·
  <a href="#usage">Usage</a>
</p>

---

## What it is

**Bus Cursor** is a file-based message bus between Cursor agents and the user: messages stay in inboxes until they are read. Address agents by **name**, use types `TASK` · `QUESTION` · `DONE`, and wake agents in the background via Cursor CLI (`agent -p`).

It is an adaptation of [claude-bus](https://github.com/jtapes/claude-bus) (Claude Code) for Cursor IDE.

| | |
|---|---|
| Original | [jtapes/claude-bus](https://github.com/jtapes/claude-bus) · [JTapes](https://github.com/jtapes) |
| Cursor port | [SafonovAG](https://github.com/SafonovAG) · [agent-cursor/bus-cursor](https://github.com/agent-cursor/bus-cursor) |

Current version: see [`release.json`](release.json) and [GitHub Releases](https://github.com/agent-cursor/bus-cursor/releases).

## Features

- **UI** — dialog feed, agents sidebar, composer with attachments and `@` project files
- **Roles** — create and edit agents, checkbox access, “Rewrite with AI”
- **Background runs** — agents wake via `agent -p`; live transcript, stop / resume, btw
- **Dialogs** — tabs, compress to summary, closed history
- **Schedule** — cron jobs (scheduler daemon)
- **Cursor limits** — Auto / API / Grok Bot in the header (same as Cursor account Usage)
- **UI prefs** — light / dark theme, Russian / English, video background
- **About** — version, update check, repository links
- **Updates** — header button when a newer GitHub release is available (`release.json` required)

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Cursor](https://cursor.com/) IDE
- [Cursor CLI](https://cursor.com/docs/cli/overview) (`agent`)

Windows — CLI:

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent login
```

macOS / Linux — see [Cursor CLI docs](https://cursor.com/docs/cli/overview), then `agent login`.

## Installation

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

The install script runs `bus.js setup` and installs:

- hooks in `~/.cursor/hooks.json`
- a **Bus Cursor** shortcut (Windows: Desktop + Start Menu; macOS: `~/Applications`; Linux: app menu + desktop)
- project rule `.cursor/rules/bus-cursor.mdc` when a folder is attached

Without git: download a release archive from [Releases](https://github.com/agent-cursor/bus-cursor/releases), extract to `~/.cursor/skills/bus-cursor`, then run `install.ps1` / `install.sh`.

## Launch

Use the **Bus Cursor** shortcut, or:

```powershell
node "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js" ui --app
```

```bash
node ~/.cursor/skills/bus-cursor/scripts/bus.js ui --app
```

`--app` opens a dedicated Chrome/Edge window (no tabs). Without it, a normal browser tab is used (`127.0.0.1:4781`, or the next free port).

1. Pick a Cursor project folder in the header  
2. **New agent** — name, role, model  
3. Send a `TASK` or `QUESTION`  

Recreate the shortcut: Settings (⚙) or `bus.js ui --shortcut`.

## Updates

An update button appears in the header when GitHub has a newer release than local `release.json`. **About** (button at the bottom of the agents sidebar) shows the version and “Check for updates”.

Installing replaces skill files from the release; a copy of the previous folder is kept as `skills/bus-cursor.backup`. After install, press **Restart** in the modal.

## Usage

### CLI

```powershell
$bus = "$env:USERPROFILE\.cursor\skills\bus-cursor\scripts\bus.js"
node $bus agents
node $bus inbox
node $bus add review
node $bus send review TASK "review the changes"
```

| Command | Action |
|--------|--------|
| `ui [--app]` | web UI |
| `setup` | hooks and shortcut |
| `inbox` | unread messages |
| `send <to> <TYPE> <text>` | message (`TASK` / `QUESTION` / `DONE`) |
| `add <name>` | register an agent (Cursor engine by default) |
| `agents` | list |
| `history [who] [N]` | transcript |
| `schedule …` | cron jobs |

Full list: run `node bus.js` with no arguments.

### In Cursor IDE

The skill responds to prompts like “open Bus Cursor”, “what’s in the inbox”, “have X do …”. Hooks and the project rule nudge the agent to call `inbox`. Details: [`SKILL.md`](SKILL.md) and [`references/cursor.md`](references/cursor.md).

## Data

| What | Path |
|-----|------|
| Registry, cache, bus settings | `~/.cursor/bus-cursor/` |
| Project inboxes and history | `<project>/.cursor/bus-cursor/` |
| Agent roles | `<project>/.cursor/agents/` or `~/.cursor/agents/` |

## Documentation

- [`SKILL.md`](SKILL.md) — short skill brief for Cursor  
- [`references/cursor.md`](references/cursor.md) — Cursor IDE and CLI  
- [`references/roles.md`](references/roles.md) — roles and access  
- [`references/ui.md`](references/ui.md) — UI behavior  
- [`references/schedule.md`](references/schedule.md) — scheduling  
- [`references/admin.md`](references/admin.md) — orchestrator commands  

## Authors

- [JTapes](https://github.com/jtapes) — [claude-bus](https://github.com/jtapes/claude-bus)  
- [SafonovAG](https://github.com/SafonovAG) — Cursor port ([agent-cursor](https://github.com/agent-cursor))  

---

<p align="center">
  <sub>
    <a href="README.md">Русский README</a>
    ·
    <a href="https://github.com/agent-cursor/bus-cursor/releases">Releases</a>
  </sub>
</p>
