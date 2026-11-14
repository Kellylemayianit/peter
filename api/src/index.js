import { currentUser, startGoogle, finishGoogle, logoutHeaders } from './auth.js';
import { runAgent } from './agent.js';
import { decide } from './approvals.js';
import { encryptJson } from './crypto.js';
import { friendly } from './errors.js';
import { dayBounds } from './time.js';
import { todayEvents } from './tools/google.js';
import * as db from './db.js';

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });

export async function handle(req, env, ctx) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // Sign-in routes (browser redirects, so no custom header needed)
  if (path === '/api/auth/google/start' && method === 'GET') return startGoogle(req, env);
  if (path === '/api/auth/google/callback' && method === 'GET') return finishGoogle(req, env);

  // CSRF guard: a cross-site form cannot set this header, and the cookie is SameSite=Lax as well.
  if (method !== 'GET' && req.headers.get('x-requested-with') !== 'becca') return json({ error: 'Blocked.' }, 403);

  if (path === '/api/auth/logout' && method === 'POST') return json({ ok: true }, 200, logoutHeaders());

  const user = await currentUser(req, env);
  if (!user) return json({ error: 'Please sign in.' }, 401);

  if (path === '/api/me' && method === 'GET') return json({ email: user.email, connections: await db.listConnections(env, user.id) });

  if (path === '/api/history' && method === 'GET') return json({ messages: await db.recentMessages(env, user.id, 40) });

  if (path === '/api/chat' && method === 'POST') {
    const { message } = await req.json().catch(() => ({}));
    const text = String(message || '').trim().slice(0, 2000);
    if (!text) return json({ error: 'Say something first.' }, 400);
    const { readable, writable } = new TransformStream();
    const w = writable.getWriter();
    const enc = new TextEncoder();
    const send = (o) => w.write(enc.encode(`data: ${JSON.stringify(o)}\n\n`)).catch(() => {});
    ctx.waitUntil((async () => {
      try { await runAgent(env, user, text, send); }
      catch (e) { console.error('chat failed', e); await send({ type: 'error', message: friendly(e) }); }
      finally { await send({ type: 'done' }); await w.close().catch(() => {}); }
    })());
    return new Response(readable, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store' } });
  }

  if (path === '/api/approvals' && method === 'GET') {
    const rows = await db.pendingApprovals(env, user.id);
    return json({ approvals: rows.map((a) => ({ id: a.id, tool: a.tool, status: a.status, preview: a.preview })) });
  }
  const dm = path.match(/^\/api\/approvals\/([\w-]+)\/decision$/);
  if (dm && method === 'POST') {
    const { approve } = await req.json().catch(() => ({}));
    const r = await decide(env, user, dm[1], approve === true);
    return r.body ? json(r.body) : json({ error: r.error || 'Not found.' }, r.status);
  }

  if (path === '/api/today' && method === 'GET') {
    const connected = (await db.listConnections(env, user.id)).google;
    if (!connected) return json({ connected: false, events: [] });
    try { const { from, to } = dayBounds(env.TIMEZONE || 'Africa/Nairobi'); return json({ connected: true, events: await todayEvents(env, user.id, from, to) }); }
    catch (e) { return json({ connected: false, events: [], message: friendly(e) }); }
  }

  if (path === '/api/connections/trello' && method === 'POST') {
    const { key, token } = await req.json().catch(() => ({}));
    if (!/^[0-9a-f]{32}$/i.test(key || '') || !/^[\w-]{20,}$/.test(token || '')) return json({ error: 'That key or token does not look right.' }, 400);
    const ok = await fetch(`https://api.trello.com/1/members/me?${new URLSearchParams({ key, token, fields: 'id' })}`);
    if (!ok.ok) return json({ error: 'Trello did not accept that key and token.' }, 400);
    await db.saveConnection(env, user.id, 'trello', await encryptJson(env, { key, token }));
    return json({ ok: true });
  }
  const cm = path.match(/^\/api\/connections\/(google|trello)$/);
  if (cm && method === 'DELETE') { await db.deleteConnection(env, user.id, cm[1]); return json({ ok: true }); }

  if (path === '/api/memories' && method === 'GET') return json({ memories: await db.listMemories(env, user.id) });
  const mm = path.match(/^\/api\/memories\/([\w-]+)$/);
  if (mm && method === 'DELETE') { await db.deleteMemory(env, user.id, mm[1]); return json({ ok: true }); }

  return json({ error: 'Not found.' }, 404);
}

export default {
  async fetch(req, env, ctx) {
    try { return await handle(req, env, ctx); }
    catch (e) { console.error('unhandled', e); return json({ error: 'Something went wrong on my side.' }, 500); }
  },
};
