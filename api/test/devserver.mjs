// Try the REAL wiring with no accounts: the actual Worker code + a SQLite file stand-in for D1,
// with fake Google and AI behind it. Run: node test/devserver.mjs  then open http://localhost:8787/dev-login
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import worker from '../src/index.js';
import { encryptJson, signSession } from '../src/crypto.js';
import { saveConnection, upsertUser } from '../src/db.js';

const WEB = new URL('../../web/', import.meta.url).pathname;
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
const DB = { prepare: (sql) => { const st = sqlite.prepare(sql); return { bind: (...a) => ({
  first: async () => st.get(...a) ?? null, all: async () => ({ results: st.all(...a).map((r) => ({ ...r })) }),
  run: async () => ({ meta: { changes: Number(st.run(...a).changes) } }) }) }; } };
const env = { DB, TOKEN_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))), SESSION_SECRET: 'dev',
  ALLOWED_EMAILS: 'me@example.com', ANTHROPIC_API_KEY: 'fake', GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'x', TIMEZONE: 'Africa/Nairobi' };

const calls = [];
const EVENT = { id: 'abc123', summary: 'Call with Nancy', start: { dateTime: '2026-11-13T14:00:00+03:00' }, end: { dateTime: '2026-11-13T15:00:00+03:00' } };
const ok = (o) => new Response(JSON.stringify(o), { status: 200 });
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  if (url.startsWith('https://api.anthropic.com')) {
    const { messages } = JSON.parse(init.body);
    const last = messages.at(-1).content;
    const results = messages.filter((m) => Array.isArray(m.content) && m.content[0]?.type === 'tool_result').length;
    const say = (text) => ok({ stop_reason: 'end_turn', content: [{ type: 'text', text }] });
    const use = (name, input) => ok({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 't' + results, name, input }] });
    if (typeof last === 'string' && !/move|week|clash/i.test(last)) return say('I can read your calendar and move things. Try “Move my call with Nancy”.');
    if (results === 0) return use('calendar_list_events', { from: '2026-11-13T00:00:00+03:00', to: '2026-11-14T00:00:00+03:00' });
    if (results === 1) return use('calendar_move_event', { event_id: 'abc123', start: '2026-11-13T16:30:00+03:00', end: '2026-11-13T17:30:00+03:00' });
    return say('I can move the call to 4:30. It is waiting for your OK.');
  }
  await new Promise((r) => setTimeout(r, 600)); // feel like a network
  if (url.includes('/events/abc123')) { if (init.method === 'PATCH') { calls.push(JSON.parse(init.body)); return ok({}); } return ok(EVENT); }
  if (url.includes('/events?')) return ok({ items: [EVENT] });
  throw new Error('unexpected ' + url);
};

const user = await upsertUser(env, 'me@example.com', 'dev-user');
await saveConnection(env, user.id, 'google', await encryptJson(env, { refresh_token: 'r', access_token: 'a', expires_at: Date.now() + 36e5 }));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/dev-login') {
    res.writeHead(302, { location: '/', 'set-cookie': `becca_session=${await signSession(env, user.id)}; Path=/; HttpOnly` }); return res.end();
  }
  if (url.pathname === '/dev-calls') { res.setHeader('content-type', 'application/json'); return res.end(JSON.stringify(calls)); }
  if (url.pathname.startsWith('/api/')) {
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)); });
    const out = await worker.fetch(new Request(`http://localhost${req.url}`, { method: req.method, headers: req.headers, body }), env, { waitUntil: () => {} });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    if (out.body) { const rd = out.body.getReader(); for (;;) { const { value, done } = await rd.read(); if (done) break; res.write(value); } }
    return res.end();
  }
  let file = join(WEB, normalize(url.pathname === '/' ? 'index.html' : url.pathname));
  if (!file.startsWith(WEB) || !existsSync(file) || statSync(file).isDirectory()) file = join(WEB, 'index.html');
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'text/plain' }); res.end(readFileSync(file));
}).listen(8787, () => console.log('Becca (fake services) on http://localhost:8787/dev-login'));
