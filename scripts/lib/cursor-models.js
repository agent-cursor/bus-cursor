/**
 * Список моделей Cursor для формы агента: AiService/AvailableModels (тот же JWT, что у лимитов).
 * Кэш: ~/.cursor/bus-cursor/cache/cursor-models.json.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { readAccessToken } = require('./rate-limits.js');

const BUS_DIR = process.env.BUS_CURSOR_DATA || path.join(os.homedir(), '.cursor', 'bus-cursor');
const CACHE_DIR = path.join(BUS_DIR, 'cache');
const SNAPSHOT = path.join(CACHE_DIR, 'cursor-models.json');
const MODELS_URL = 'https://api2.cursor.sh/aiserver.v1.AiService/AvailableModels';
const REFRESH_MS = 30 * 60 * 1000; // модели меняются редко

/** Варианты effort/max в имени: в пикере оставляем defaultOn и «стабильные» slug без суффикса. */
const EFFORT = /-(minimal|none|low|medium|high|xhigh|extra-high|max)(-fast)?$/;

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
};

function titleOf(m) {
  const tip = String(m.tooltipData?.markdownContent || '');
  const bold = tip.match(/\*\*([^*]+)\*\*/);
  return (bold ? bold[1] : '').replace(/[\u200b\u200c\u200d\ufeff]/g, '').trim();
}

function labelOf(m) {
  const title = titleOf(m);
  if (!title || title === m.name) return m.name;
  const effort = m.name.match(EFFORT);
  if (effort && !/\((fast|Fast|Thinking)/i.test(title)) return `${title} · ${effort[0].slice(1)}`;
  return title;
}

/** Сырой ответ API → [{ id, label }]. */
function fromResponse(body) {
  const list = Array.isArray(body?.models) ? body.models : [];
  const out = [];
  const seen = new Set();
  for (const m of list) {
    if (!m || typeof m.name !== 'string' || !m.name.trim()) continue;
    if (m.supportsAgent === false) continue;
    const id = m.name.trim();
    if (seen.has(id)) continue;
    if (!m.defaultOn && EFFORT.test(id) && id !== 'default') continue;
    seen.add(id);
    out.push({ id, label: labelOf(m) });
  }
  out.sort((a, b) => {
    if (a.id === 'default') return -1;
    if (b.id === 'default') return 1;
    return a.label.localeCompare(b.label, 'en');
  });
  return out;
}

function save(models) {
  if (!Array.isArray(models) || !models.length) return;
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT, JSON.stringify({ at: Date.now(), models }));
  } catch {
    // кэш - не повод ронять UI
  }
}

/** → [{ id, label }] из кэша или []. */
function readModels() {
  const data = readJson(SNAPSHOT);
  if (!data || !Array.isArray(data.models)) return [];
  return data.models.filter((m) => m && typeof m.id === 'string' && typeof m.label === 'string');
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
        if (res.statusCode !== 200) return reject(new Error(`Cursor models HTTP ${res.statusCode}`));
        try {
          resolve(JSON.parse(text));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('Cursor models timeout')));
    req.write(body);
    req.end();
  });
}

let refreshing = null;

/**
 * Тянет AvailableModels. force - игнор TTL.
 * → [{ id, label }]
 */
async function refresh(opts = {}) {
  const force = Boolean(opts.force);
  const now = Date.now();
  const prev = readJson(SNAPSHOT);
  const at = Number(prev?.at) || 0;
  if (!force && prev && Array.isArray(prev.models) && prev.models.length && now - at < REFRESH_MS) return readModels();
  if (refreshing) return refreshing;

  refreshing = (async () => {
    const token = readAccessToken();
    if (!token) return readModels();
    try {
      const body = await postJson(MODELS_URL, {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Connect-Protocol-Version': '1',
      }, '{}');
      const models = fromResponse(body);
      if (models.length) save(models);
    } catch {
      // офлайн / токен протух - остаётся кэш
    }
    return readModels();
  })();

  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

module.exports = {
  SNAPSHOT,
  REFRESH_MS,
  fromResponse,
  readModels,
  refresh,
};
