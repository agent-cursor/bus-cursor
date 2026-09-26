/**
 * Снимок лимитов Cursor: ~/.cursor/bus-cursor/cache/rate-limits.json.
 * Формат: { plan, auto?, api?, at } - окна { used_percentage, resets_at? }.
 * Берём из DashboardService/GetCurrentPeriodUsage (токен из state.vscdb Cursor).
 * План - includedSpend/limit (как displayMessage в IDE); Auto/API - percentUsed из ответа.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const BUS_DIR = process.env.BUS_CURSOR_DATA || path.join(os.homedir(), '.cursor', 'bus-cursor');
const CACHE_DIR = path.join(BUS_DIR, 'cache');
const SNAPSHOT = path.join(CACHE_DIR, 'rate-limits.json');

const USAGE_URL = 'https://api2.cursor.sh/aiserver.v1.DashboardService/GetCurrentPeriodUsage';
const REFRESH_MS = 5 * 60 * 1000; // не долбим API чаще пяти минут
const WINDOWS = ['plan', 'auto', 'api'];

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

const known = (win) => Boolean(win && typeof win === 'object' && Number.isFinite(win.used_percentage));

function stateDbPath(env = process.env) {
  if (env.CURSOR_STATE_DB) return env.CURSOR_STATE_DB;
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  if (process.platform === 'linux') return path.join(env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'Cursor', 'User', 'globalStorage', 'state.vscdb');
  return path.join(env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Cursor', 'User', 'globalStorage', 'state.vscdb');
}

/** JWT из локальной БД Cursor. Нет БД / нет токена / нет node:sqlite - null. */
function readAccessToken(env = process.env) {
  const file = stateDbPath(env);
  if (!fs.existsSync(file)) return null;
  try {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(file, { readOnly: true });
    try {
      const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get('cursorAuth/accessToken');
      const token = row && typeof row.value === 'string' ? row.value.trim() : '';
      return token || null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

function saveSnapshot(rateLimits) {
  if (!rateLimits || typeof rateLimits !== 'object') return;
  const old = readJson(SNAPSHOT);
  const next = old && typeof old === 'object' ? { ...old } : {};
  for (const [key, win] of Object.entries(rateLimits)) if (known(win) || !known(next[key])) next[key] = win;
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify(next));
  } catch {
    // кэш - не повод ронять UI
  }
}

/** Claude rate_limit_event больше не пишем - Bus Cursor показывает только Cursor. */
function fromStreamEvent() {
  return null;
}

function pctOf(n) {
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.max(0, Math.min(100, n)) * 10) / 10;
}

/** Ответ GetCurrentPeriodUsage → снимок окон. */
function fromUsageResponse(body) {
  if (!body || typeof body !== 'object') return null;
  const plan = body.planUsage && typeof body.planUsage === 'object' ? body.planUsage : null;
  if (!plan) return null;
  const endMs = Number(body.billingCycleEnd);
  const resets_at = Number.isFinite(endMs) && endMs > 0 ? Math.floor(endMs / 1000) : null;
  const win = (used) => {
    const used_percentage = pctOf(used);
    if (used_percentage === null) return null;
    return resets_at ? { used_percentage, resets_at } : { used_percentage };
  };
  const out = {};
  // displayMessage в IDE считает includedSpend/limit, а не totalPercentUsed
  if (Number.isFinite(plan.limit) && plan.limit > 0 && Number.isFinite(plan.includedSpend)) {
    out.plan = win((plan.includedSpend / plan.limit) * 100);
  } else if (Number.isFinite(plan.totalPercentUsed)) {
    out.plan = win(plan.totalPercentUsed);
  }
  if (Number.isFinite(plan.autoPercentUsed)) out.auto = win(plan.autoPercentUsed);
  if (Number.isFinite(plan.apiPercentUsed)) out.api = win(plan.apiPercentUsed);
  return Object.keys(out).length ? out : null;
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
      timeout: 15000,
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`Cursor usage HTTP ${res.statusCode}`));
        try {
          resolve(JSON.parse(text));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Cursor usage timeout')));
    req.write(body);
    req.end();
  });
}

let refreshing = null;

/**
 * Тянет лимиты с api2.cursor.sh и пишет снимок. force - игнор TTL.
 * → снимок readSnapshot() или null.
 */
async function refresh(opts = {}) {
  const force = Boolean(opts.force);
  const now = Date.now();
  const prev = readJson(SNAPSHOT);
  let at = 0;
  try {
    at = fs.statSync(SNAPSHOT).mtimeMs;
  } catch {
    at = 0;
  }
  if (!force && prev && now - at < REFRESH_MS) return readSnapshot();
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const token = readAccessToken();
    if (!token) return readSnapshot();
    try {
      const body = await postJson(USAGE_URL, {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      }, '{}');
      const snap = fromUsageResponse(body);
      if (snap) saveSnapshot(snap);
    } catch {
      // офлайн / токен протух - остаётся старый снимок
    }
    return readSnapshot();
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

/** → { plan?, auto?, api?, at } или null. */
function readSnapshot() {
  const data = readJson(SNAPSHOT);
  if (!data || typeof data !== 'object') return null;
  let at = 0;
  try {
    at = fs.statSync(SNAPSHOT).mtimeMs;
  } catch {
    return null;
  }
  const out = { at: Math.round(at) };
  for (const key of WINDOWS) if (known(data[key])) out[key] = { used_percentage: data[key].used_percentage, resets_at: Number.isFinite(data[key].resets_at) ? data[key].resets_at : null };
  return WINDOWS.some((k) => out[k]) ? out : null;
}

module.exports = {
  SNAPSHOT,
  WINDOWS,
  REFRESH_MS,
  saveSnapshot,
  fromStreamEvent,
  fromUsageResponse,
  readAccessToken,
  readSnapshot,
  refresh,
};
