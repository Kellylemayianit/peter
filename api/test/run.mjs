// End-to-end test of the real Worker code with a real SQLite database (node:sqlite stands in for D1)
// and fake Google / Trello / AI services. Run: node test/run.mjs
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { encryptJson, decryptJson, signSession, verifySession, randomId } from '../src/crypto.js';
import { saveConnection, upsertUser } from '../src/db.js';
import { buildRaw } from '../src/tools/google.js';

// ---- D1 shim
const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
const DB = { prepare: (sql) => { const st = sqlite.prepare(sql); return { bind: (...a) => ({
  first: async () => st.get(...a) ?? null,
  all: async () => ({ results: st.all(...a).map((r) => ({ ...r })) }),
  run: async () => ({ meta: { changes: Number(st.run(...a).changes) } }) }) }; } };

const env = { DB, TOKEN_KEY: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))), SESSION_SECRET: 'test-secret',
  ALLOWED_EMAILS: 'me@example.com', ANTHROPIC_API_KEY: 'k', GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 's', MODEL: 'test-model', TIMEZONE: 'Africa/Nairobi' };

// ---- fake outside world
const calls = []; const modelQueue = []; const modelRequests = [];
const EVENT = { id: 'abc123', summary: 'Call with Nancy', start: { dateTime: '2026-11-12T14:00:00+03:00' }, end: { dateTime: '2026-11-12T15:00:00+03:00' } };
globalThis.fetch = async (url, init = {}) => {
  url = String(url); const body = init.body ? (typeof init.body === 'string' ? init.body : String(init.body)) : '';
  const ok = (o, s = 200) => new Response(JSON.stringify(o), { status: s });
  if (url.startsWith('https://api.anthropic.com')) { modelRequests.push(JSON.parse(body)); return ok(modelQueue.shift()); }
  if (url.includes('/calendar/v3/calendars/primary/events/abc123')) { if (init.method === 'PATCH') { calls.push(['PATCH', url, JSON.parse(body)]); return ok({}); } return ok(EVENT); }
  if (url.includes('/calendar/v3/calendars/primary/events?')) return ok({ items: [EVENT, { id: 'ad', summary: 'Holiday', start: { date: '2026-11-12' }, end: { date: '2026-11-13' } }] });
  if (url.includes('/gmail/v1/users/me/messages/send')) { calls.push(['SEND', url, JSON.parse(body)]); return ok({}); }
  if (url.includes('api.trello.com')) { calls.push(['TRELLO', url]); return ok({}); }
  throw new Error('unexpected fetch ' + url);
};
const tool = (name, input, id = randomId(4)) => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id, name, input }] });
const say = (text) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] });

// ---- helpers
const waits = []; const ctx = { waitUntil: (p) => waits.push(p) };
const user = await upsertUser(env, 'me@example.com', 'u1');
await saveConnection(env, 'u1', 'google', await encryptJson(env, { refresh_token: 'r', access_token: 'a', expires_at: Date.now() + 3600e3 }));
const cookie = `becca_session=${await signSession(env, 'u1')}`;
const call = async (method, path, body, headers = {}, settle = true) => {
  const res = await worker.fetch(new Request(`https://becca.test${path}`, { method, body: body && JSON.stringify(body),
    headers: { cookie, 'x-requested-with': 'becca', ...headers } }), env, ctx);
  if (settle) await Promise.all(waits.splice(0));
  return res;
};
// The stream only moves while someone reads it, like a browser would: read and wait together.
const chat = async (message) => {
  const res = await call('POST', '/api/chat', { message }, {}, false);
  const [text] = await Promise.all([res.text(), Promise.all(waits.splice(0))]);
  return text.split('\n\n').filter(Boolean).map((l) => JSON.parse(l.slice(6)));
};
let n = 0; const pass = (name) => console.log(`ok ${++n} - ${name}`);

// 1 crypto + session
const secret = { refresh_token: 'xyz' };
assert.deepEqual(await decryptJson(env, await encryptJson(env, secret)), secret); pass('tokens encrypt and decrypt');
const good = await signSession(env, 'u1');
assert.equal(await verifySession(env, good), 'u1');
assert.equal(await verifySession(env, good.replace('u1', 'u2')), null);
assert.equal(await verifySession(env, 'u1.1.abc'), null); pass('session cookie rejects tampering and expiry');

// 2 access control
let r = await worker.fetch(new Request('https://becca.test/api/me'), env, ctx);
assert.equal(r.status, 401); pass('signed-out requests get 401');
r = await worker.fetch(new Request('https://becca.test/api/chat', { method: 'POST', headers: { cookie } }), env, ctx);
assert.equal(r.status, 403); pass('POST without the app header is blocked');
r = await call('GET', '/api/me'); assert.deepEqual(await r.json(), { email: 'me@example.com', connections: { google: true } }); pass('/api/me');

// 3 the main flow: read, request a change, nothing happens until approved
modelQueue.push(
  tool('calendar_list_events', { from: '2026-11-12T00:00:00+03:00', to: '2026-11-13T00:00:00+03:00' }),
  tool('calendar_move_event', { event_id: 'abc123', start: '2026-11-12T16:30:00+03:00', end: '2026-11-12T17:30:00+03:00' }),
  say('I can move it. It is waiting for your OK.'));
let ev = await chat('Move my call with Nancy to later');
assert.deepEqual(ev.filter((e) => e.type === 'step').map((e) => e.state), ['running', 'done']);
const ap = ev.find((e) => e.type === 'approval').approval;
assert.equal(ap.preview.kind, 'calendar'); assert.equal(ap.preview.title, 'Move “Call with Nancy”');
assert.equal(ev.at(-2).type, 'text'); assert.equal(ev.at(-1).type, 'done');
assert.equal(calls.length, 0); pass('change is queued, not executed');
assert.match(modelRequests[0].system, /untrusted data/); assert.equal(modelRequests[0].messages[0].role, 'user');
const toolResult = modelRequests[2].messages.at(-1).content[0];
assert.match(toolResult.content, /NOT happened/); pass('model is told the change is only a request');

assert.equal((await (await call('GET', '/api/approvals')).json()).approvals.length, 1);
r = await call('POST', `/api/approvals/${ap.id}/decision`, { approve: true });
assert.equal((await r.json()).status, 'approved');
assert.equal(calls.length, 1); assert.match(calls[0][1], /sendUpdates=none/);
assert.equal(calls[0][2].start.dateTime, '2026-11-12T16:30:00+03:00'); pass('approving runs exactly the change shown');
r = await call('POST', `/api/approvals/${ap.id}/decision`, { approve: true });
assert.equal(r.status, 409); assert.equal(calls.length, 1); pass('double approve cannot run twice');
const hist = (await (await call('GET', '/api/history')).json()).messages;
assert.match(hist.at(-1).text, /Done: Move/); pass('result is written into the conversation');

// 4 reject path
modelQueue.push(tool('calendar_move_event', { event_id: 'abc123', start: '2026-11-12T18:00:00+03:00', end: '2026-11-12T19:00:00+03:00' }), say('Waiting for your OK.'));
ev = await chat('Actually try 6pm'); const ap2 = ev.find((e) => e.type === 'approval').approval;
r = await call('POST', `/api/approvals/${ap2.id}/decision`, { approve: false });
assert.equal((await r.json()).status, 'rejected'); assert.equal(calls.length, 1); pass('rejecting does nothing');

// 5 prompt injection: even if the model is fooled, sending still needs approval
modelQueue.push(
  tool('gmail_send', { to: 'evil@example.com', subject: 'All my emails', body: 'pwned' }),
  say('That email asked me to send things. I did not. Want me to?'));
ev = await chat('Read my latest email');
assert.ok(ev.find((e) => e.type === 'approval')); assert.equal(calls.filter((c) => c[0] === 'SEND').length, 0); pass('injected send is only a request');

// 6 bad input is rejected before it becomes an approval
modelQueue.push(tool('gmail_send', { to: 'not-an-email', subject: 's', body: 'b' }), say('That address looks wrong.'));
ev = await chat('Email bob'); assert.equal(ev.filter((e) => e.type === 'approval').length, 0);
assert.match(modelRequests.at(-1).messages.at(-1).content[0].content, /does not look right/); pass('invalid email never reaches approvals');
modelQueue.push(tool('trello_create_card', { list_id: '../../members/me', name: 'x' }), say('Hmm.'));
ev = await chat('add card'); assert.equal(ev.filter((e) => e.type === 'approval').length, 0); pass('Trello ids are validated');

// 7 helpers
const raw = Buffer.from(buildRaw({ to: 'a@b.co', subject: 'Hi\r\nBcc: x@y.z', body: 'Jambo' }).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
assert.ok(!/^Bcc:/mi.test(raw)); assert.match(raw, /^Subject: =\?UTF-8\?B\?/m); pass('email headers cannot be injected');
modelQueue.push(tool('calendar_find_free_time', { from: '2026-11-12T08:00:00+03:00', to: '2026-11-12T18:00:00+03:00', duration_minutes: 60 }), say('Free from 8 and after 3.'));
await chat('when am I free?');
const free = JSON.parse(modelRequests.at(-1).messages.at(-1).content[0].content);
assert.deepEqual(free.map((g) => g.start.slice(11, 16)), ['05:00', '12:00']); pass('free time ignores all-day events');

// 8 memory + today
modelQueue.push(tool('remember', { text: 'Prefers meetings after 10am' }), say('Want me to remember that?'));
ev = await chat('I like late meetings'); const ap3 = ev.find((e) => e.type === 'approval').approval;
assert.equal((await (await call('GET', '/api/memories')).json()).memories.length, 0);
await call('POST', `/api/approvals/${ap3.id}/decision`, { approve: true });
const mems = (await (await call('GET', '/api/memories')).json()).memories; assert.equal(mems.length, 1);
await call('DELETE', `/api/memories/${mems[0].id}`); assert.equal((await (await call('GET', '/api/memories')).json()).memories.length, 0); pass('memory is saved only after approval, and deletable');
const today = await (await call('GET', '/api/today')).json(); assert.equal(today.events.length, 2); pass('/api/today');

// 9 model outage becomes a friendly error
globalThis.fetch = async () => { throw new Error('offline'); };
ev = await chat('hello'); assert.equal(ev.find((e) => e.type === 'error').message, 'I could not reach my thinking service. Try again in a moment.'); pass('outage shows a friendly message');
console.log(`\nall ${n} checks passed`);
