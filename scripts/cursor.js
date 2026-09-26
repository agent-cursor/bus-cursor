/**
 * Cursor как движок фонового агента шины: `agent -p --force --output-format stream-json` в каталоге агента.
 * Форматы - по докам cursor.com/docs/cli/reference/output-format и /docs/hooks (Context7, сверено 26.09.2026); живьём не проверено -
 * Cursor на машине разработки не стоял. Отличия от claude, которые Bus Cursor обходит:
 *   - нет --agent: роль и задание едут файлом в каталоге агента, в аргумент - короткое «прочитай файл» (кавычки и лимит командной строки Windows);
 *   - нет входа stream-json: вброса посреди хода (btw) нет, сообщение ждёт следующего круга в inbox;
 *   - в потоке нет usage, стоимости и лимитов аккаунта: расход - оценка по объёму потока (≈4 символа на токен), окна контекста нет;
 *   - сессии на диске официально не описаны: --resume пробуем по id из system/init, не проверяя файл.
 * Возвращает то же, что wake.runClaude: { ok, ms, tokens, context, window, usage, cost, reason, report, sessionId }.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { killTree, writeAtomic } = require('./fsx.js');

const CURSOR_CMD = process.env.BUS_CURSOR_CMD || ''; // подменяют тесты; пусто - agent или cursor-agent из PATH (command())
// --trust: без него headless отказывает в каталоге, которому Cursor ещё не доверял (проект, ни разу не открытый в IDE, домашняя папка);
// --approve-mcps - MCP в фоне без вопроса, как bypassPermissions у claude. readonly (служебные задачи UI) - --mode ask без --force: править нечего
const ARGS = ['-p', '--force', '--trust', '--approve-mcps', '--output-format', 'stream-json'];
const READONLY_ARGS = ['-p', '--trust', '--mode', 'ask', '--output-format', 'stream-json'];
const PROMPT_TTL_MS = 3 * 60 * 60 * 1000; // дольше запуск не живёт (таймаут до 120 мин) - старше этого файл промпта остался от снятого stop-ом
const FIRST_EVENT_MS = Number(process.env.BUS_WAKE_FIRST_EVENT_MS) || 60 * 1000;
const EXIT_WAIT_MS = 15 * 1000;
const SESSION_ID = /^[0-9a-zA-Z-]{8,64}$/;
const RUN_ID = /^[0-9a-z]{4,20}-[0-9a-z]{2,10}$/;
const CHARS_PER_TOKEN = 4;
const LIVE_TEXT = 400;
const USAGE_EVERY_MS = 2000;

const oneLine = (text, max) => {
  const flat = String(text || '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
};

function shortPath(value, cwd) {
  const text = String(value || '');
  if (!cwd || !path.isAbsolute(text)) return text;
  const rel = path.relative(cwd, text);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel.split(path.sep).join('/') : text;
}

// tool_call: { readToolCall: { args: { path } } } → «read src/app.js». Имена, кроме read и write из доков, не сверены - неизвестные идут как есть
const TOOL_ARG = ['path', 'command', 'pattern', 'query', 'url', 'glob', 'globPattern'];
function toolLine(call, cwd) {
  const key = Object.keys(call || {})[0] || '';
  const name = key.replace(/ToolCall$/, '') || '?';
  const args = (call[key] && call[key].args) || {};
  const field = TOOL_ARG.find((k) => typeof args[k] === 'string' && args[k]);
  if (!field) return name;
  const arg = field === 'path' ? shortPath(args[field], cwd) : args[field].slice(0, 80);
  return `${name} ${arg}`;
}

/** Событие потока → строки живого хода [{ at, kind, text }], как wake.liveEntries у claude. */
function liveEntries(e, cwd) {
  if (!e || typeof e !== 'object') return [];
  const at = Date.now();
  if (e.type === 'assistant' && Array.isArray(e.message && e.message.content)) {
    return e.message.content.filter((b) => b && b.type === 'text' && String(b.text || '').trim()).map((b) => ({ at, kind: 'text', text: oneLine(b.text, LIVE_TEXT) }));
  }
  if (e.type === 'tool_call' && e.subtype === 'started' && e.tool_call) return [{ at, kind: 'tool', text: oneLine(toolLine(e.tool_call, cwd), LIVE_TEXT) }];
  return [];
}

const textOf = (e) => (e.message.content || []).filter((b) => b && b.type === 'text').map((b) => String(b.text || '')).join('');

/**
 * Промпт - файлом в <каталог>/.claude/bus/prompts/: каталог агента Cursor читает без вопросов, а .claude/bus/ уже в .git/info/exclude.
 * Роль идёт первой - у Cursor нет --agent, её кладёт шина. → { file, arg } - arg в кавычках для командной строки.
 */
function promptFile(cwd, text, role) {
  const dir = path.join(cwd, '.claude', 'bus', 'prompts');
  fs.mkdirSync(dir, { recursive: true });
  // stop убивает раннер вместе с Cursor - свой файл он не убрал; подметаем брошенные при следующем запуске
  for (const name of fs.readdirSync(dir)) {
    try {
      const old = path.join(dir, name);
      if (Date.now() - fs.statSync(old).mtimeMs > PROMPT_TTL_MS) fs.rmSync(old, { force: true });
    } catch {
      // файл заняли или уже убрали - не наше дело
    }
  }
  const file = path.join(dir, `${Date.now().toString(36)}-${process.pid}-${Math.random().toString(36).slice(2, 6)}.md`);
  const head = role ? ['# Твоя роль', '', role.trim(), '', '# Задание', ''] : [];
  fs.writeFileSync(file, [...head, text].join('\n'));
  const rel = path.relative(cwd, file).split(path.sep).join('/');
  return { file, arg: `"Прочитай файл ${rel} целиком и выполни задание из него. Файл одноразовый, не правь и не удаляй его."` };
}

/**
 * Один фоновый запуск Cursor. role - текст роли субагента (без frontmatter); у безымянной сессии и при resume - пусто.
 * Параметры и итог - как у wake.runClaude; btw и settings не поддерживаются и молча не используются.
 */
function run({ cwd, agent = null, role = '', model = null, prompt: text, timeoutMs, resume = null, onStart = null, onLive = null, onContext = null, runId = '', readonly = false }) {
  const { spawn } = require('child_process');
  return new Promise((resolve) => {
    const started = Date.now();
    const { file, arg } = promptFile(cwd, text, resume ? '' : role);
    const resumeArg = resume && SESSION_ID.test(resume) ? ['--resume', resume] : [];
    const args = [...(readonly ? READONLY_ARGS : ARGS), ...resumeArg, ...(model ? ['--model', `"${model}"`] : []), arg];
    // CLAUDECODE снимаем: раннер могли поднять из сессии Claude, а по этой переменной send решает, что чат сам поднимет агента (wake:).
    // BUS_ORCHESTRATOR не ставим: роль оркестратора headless-задаче кладёт в промпт сам вызывающий (role), хук sessionStart её не дублирует
    const env = { ...process.env, BUS_WAKE: '1', TG_LISTENER_RUN: '1', BUS_RUN: agent && RUN_ID.test(runId) ? `${agent}:${runId}` : '', BUS_ORCHESTRATOR: '' };
    delete env.CLAUDECODE;
    const child = spawn(`${command()} ${args.join(' ')}`, { cwd, shell: true, windowsHide: true, env });
    let tail = '';
    let stderr = '';
    let buffer = '';
    let chars = 0;
    let timedOut = false;
    let silent = false;
    let sessionId = '';
    let final = null;
    let lastText = '';
    let reported = 0;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    const kill = (flag) => () => {
      if (flag === 'timeout') timedOut = true;
      if (flag === 'silent') silent = true;
      killTree(child.pid);
    };
    const timers = [setTimeout(kill('timeout'), timeoutMs)];
    const firstEvent = setTimeout(kill('silent'), FIRST_EVENT_MS);
    const estimate = () => Math.round(chars / CHARS_PER_TOKEN);
    const usage = () => ({ tokens: estimate(), input: 0, cacheWrite: 0, cacheRead: 0, output: 0 });
    const report = (force = false) => {
      if (!onContext || (!force && Date.now() - reported < USAGE_EVERY_MS)) return;
      reported = Date.now();
      onContext({ tokens: 0, window: 0, usage: usage() }); // окна нет - вкладка диалога его не покажет, расход запуска - оценкой
    };

    function onEvent(e) {
      clearTimeout(firstEvent);
      if (!sessionId && SESSION_ID.test(String(e.session_id || ''))) {
        sessionId = e.session_id;
        if (onStart) onStart(sessionId);
      }
      if (onLive) for (const entry of liveEntries(e, cwd)) onLive(entry);
      if (e.type === 'assistant' && e.message && textOf(e).trim()) lastText = textOf(e).trim();
      report();
      if (e.type !== 'result') return;
      final = e;
      timers.push(setTimeout(kill(), EXIT_WAIT_MS)); // -p выходит сам после итога; не вышел - добиваем
    }

    child.stdout.on('data', (chunk) => {
      chars += chunk.length;
      tail = (tail + chunk).slice(-2000);
      buffer += chunk;
      for (let at = buffer.indexOf('\n'); at >= 0; at = buffer.indexOf('\n')) {
        const line = buffer.slice(0, at).trim();
        buffer = buffer.slice(at + 1);
        try {
          if (line) onEvent(JSON.parse(line));
        } catch {
          // не JSON - причиной станет хвост вывода
        }
      }
    });
    child.stderr.on('data', (chunk) => (stderr = (stderr + chunk).slice(-4000)));
    const finish = (result) => {
      [...timers, firstEvent].forEach((t) => clearTimeout(t));
      fs.rmSync(file, { force: true });
      report(true);
      resolve(result);
    };
    child.on('error', (e) => finish({ ok: false, ms: Date.now() - started, tokens: 0, context: 0, window: 0, usage: usage(), cost: 0, reason: `Cursor (${command()}) не запустился: ${e.message}`, report: '', sessionId }));
    child.on('close', (code) => {
      if (!final && buffer.trim()) {
        try {
          const last = JSON.parse(buffer);
          if (last.type === 'result') final = last;
        } catch {
          // не JSON
        }
      }
      const result = final || {};
      // result.result у Cursor - склейка всех реплик хода; отчёт - последняя реплика, как у claude
      const text = lastText || (typeof result.result === 'string' ? result.result.trim().slice(-2000) : '');
      const ok = !timedOut && !silent && Boolean(final) && !result.is_error;
      const why = timedOut
        ? `таймаут ${Math.round(timeoutMs / 1000)} с`
        : silent
          ? `Cursor молчит ${Math.round(FIRST_EVENT_MS / 1000)} с - не залогинен (agent login) или сменился формат потока`
          : `Cursor вернул ошибку (код ${code}): ${(stderr || (result.is_error ? text : '') || tail).trim().slice(-200) || 'пустой ответ'}`;
      finish({ ok, ms: Date.now() - started, tokens: estimate(), context: 0, window: 0, usage: usage(), cost: 0, reason: ok ? '' : why, report: text, sessionId });
    });
    child.stdin.on('error', () => {});
    child.stdin.end();
  });
}

/** Команда есть в PATH? Для выбора движка по умолчанию и имени команды Cursor. */
const seen = new Map();
function installed(cmd) {
  if (seen.has(cmd)) return seen.get(cmd);
  const { spawnSync } = require('child_process');
  const r = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8', windowsHide: true });
  const found = r.status === 0 && Boolean(String(r.stdout || '').trim());
  seen.set(cmd, found);
  return found;
}

// Установщик Cursor ставит agent и cursor-agent (старое имя); берём что нашлось, ничего - agent, ошибка скажет «не найден»
const command = () => CURSOR_CMD || (installed('agent') ? 'agent' : installed('cursor-agent') ? 'cursor-agent' : 'agent');
const available = () => Boolean(CURSOR_CMD) || installed('agent') || installed('cursor-agent');

// ---------- Cursor IDE как оркестратор: хуки и правило ----------

const CURSOR_HOME = process.env.BUS_CURSOR_HOME || path.join(os.homedir(), '.cursor'); // подменяют тесты
const HOOKS_FILE = path.join(CURSOR_HOME, 'hooks.json');
const BUS_JS = path.join(__dirname, 'bus.js').split(path.sep).join('/');
const HOOK_MARK = 'skills/bus-cursor/scripts/bus.js';
const RULE = path.join('.cursor', 'rules', 'bus-cursor.mdc');
const present = () => fs.existsSync(CURSOR_HOME);

/**
 * Хуки шины в ~/.cursor/hooks.json. У Cursor нет хука, который добавит текст к промпту (beforeSubmitPrompt только блокирует), поэтому:
 * sessionStart - роль оркестратора и входящие; postToolUse - входящие посреди хода; stop - пришло за ход: followup_message, Cursor сам
 * отправит его следующим сообщением (не больше loop_limit раз подряд). Путь к bus.js абсолютный - файл вне репо, пишется при установке;
 * переехал скилл - наша запись переписывается. → true, если файл правился; Cursor не стоит - false.
 */
const CURSOR_HOOKS = [
  ['sessionStart', 'orchestrator --hook --cursor'],
  ['postToolUse', 'inbox --hook --cursor'],
  ['stop', 'inbox --hook --cursor --stop'],
];
function ensureHooks() {
  if (!present()) return false;
  let data = {};
  if (fs.existsSync(HOOKS_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(HOOKS_FILE, 'utf8'));
    } catch {
      throw new Error(`не трогаю ${HOOKS_FILE}: там невалидный JSON`);
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`не трогаю ${HOOKS_FILE}: там не объект`);
  data.version = data.version || 1;
  data.hooks = data.hooks && typeof data.hooks === 'object' ? data.hooks : {};
  let changed = false;
  for (const [event, args] of CURSOR_HOOKS) {
    const command = `node "${BUS_JS}" ${args}`;
    const list = Array.isArray(data.hooks[event]) ? data.hooks[event] : [];
    const ours = list.filter((h) => h && String(h.command || '').includes(HOOK_MARK) && String(h.command).endsWith(args));
    if (ours.length === 1 && ours[0].command === command) continue;
    data.hooks[event] = [...list.filter((h) => !ours.includes(h)), { command }];
    changed = true;
  }
  if (!changed) return false;
  fs.mkdirSync(CURSOR_HOME, { recursive: true });
  writeAtomic(HOOKS_FILE, JSON.stringify(data, null, 2) + '\n');
  return true;
}

/**
 * Правило проекта .cursor/rules/bus.mdc: хуки кладут входящие только на старте чата и после вызова инструмента - пришедшее,
 * пока чат простаивал, агент увидит, лишь позвав inbox. Файл личный, как .claude/bus/: в .git/info/exclude (exclude - bus.excludeLocal).
 * Руками поправленное не переписываем. → true, если файл создан.
 */
function ensureRule(root, exclude = null) {
  if (!present() || !root) return false;
  const file = path.join(root, RULE);
  if (fs.existsSync(file)) return false;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, [
    '---',
    'description: Bus Cursor - входящие от агентов и пользователя из UI',
    'alwaysApply: true',
    '---',
    '',
    `Проект подключён к Bus Cursor. Это правило - для чата оркестратора в Cursor IDE: в начале каждого хода, до ответа, выполни \`node "${BUS_JS}" inbox\` - пришедшее покажет, пустой ящик ответит «Входящих нет.». Тебя поднял Bus Cursor в фоне (в промпте есть роль с блоком «Шина» и --as) - правило не твоё: читай только свой ящик через --as.`,
    'Блок «[bus] …» в контексте - те же входящие, повторно inbox ради них не зови. TASK выполни, на QUESTION ответь, DONE учти - ответ отправителю и остальное - по скиллу bus-cursor.',
    'Строки `wake:` в выводе send здесь не бывает: субагентов Bus Cursor поднимает сама в фоне, ответ придёт во входящие.',
    '',
  ].join('\n'));
  if (exclude) exclude(root, RULE.split(path.sep).join('/'), RULE);
  return true;
}

module.exports = { run, liveEntries, toolLine, promptFile, installed, available, command, CURSOR_HOME, HOOKS_FILE, present, ensureHooks, ensureRule };
