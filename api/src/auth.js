import { randomId, signSession, verifySession, encryptJson } from './crypto.js';
import { upsertUser, getUser, saveConnection } from './db.js';

const SCOPES = ['openid', 'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose'];

const cookie = (name, value, { path = '/', maxAge } = {}) =>
  `${name}=${value}; Path=${path}; HttpOnly; Secure; SameSite=Lax${maxAge != null ? `; Max-Age=${maxAge}` : ''}`;
const readCookie = (req, name) => (req.headers.get('cookie') || '').split(/;\s*/).map((c) => c.split('=')).find(([k]) => k === name)?.[1];

export async function currentUser(req, env) {
  const id = await verifySession(env, readCookie(req, 'becca_session'));
  return id ? getUser(env, id) : null;
}

export function startGoogle(req, env) {
  const url = new URL(req.url);
  const state = randomId(16);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/api/auth/google/callback`, response_type: 'code',
    scope: SCOPES.join(' '), access_type: 'offline', prompt: 'consent', state,
  });
  return new Response(null, { status: 302, headers: {
    location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'set-cookie': cookie('becca_oauth', state, { path: '/api/auth', maxAge: 600 }),
  } });
}

export async function finishGoogle(req, env) {
  const url = new URL(req.url);
  const bounce = (why) => new Response(null, { status: 302, headers: { location: `/?signin=${why}` } });
  if (!url.searchParams.get('code') || url.searchParams.get('state') !== readCookie(req, 'becca_oauth')) return bounce('failed');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google/callback`, grant_type: 'authorization_code' }),
  });
  if (!tokenRes.ok) return bounce('failed');
  const tok = await tokenRes.json();
  const info = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tok.access_token}` } })).json();

  const allowed = (env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!info.email || !info.email_verified || !allowed.includes(info.email.toLowerCase())) return bounce('notallowed');

  const user = await upsertUser(env, info.email.toLowerCase(), randomId());
  if (tok.refresh_token) {
    await saveConnection(env, user.id, 'google', await encryptJson(env, {
      refresh_token: tok.refresh_token, access_token: tok.access_token, expires_at: Date.now() + tok.expires_in * 1000 }));
  }
  const headers = new Headers({ location: '/' });
  headers.append('set-cookie', cookie('becca_session', await signSession(env, user.id), { maxAge: 30 * 86400 }));
  headers.append('set-cookie', cookie('becca_oauth', '', { path: '/api/auth', maxAge: 0 }));
  return new Response(null, { status: 302, headers });
}

export const logoutHeaders = () => ({ 'set-cookie': cookie('becca_session', '', { maxAge: 0 }) });
