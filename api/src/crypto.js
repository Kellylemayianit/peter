// Small helpers built on the Web Crypto API (available in Workers and Node 20+).
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = {
  to: (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))),
  from: (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
};
const b64url = (buf) => b64.to(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export const randomId = (bytes = 12) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

// ---- Encrypt secrets at rest (Google/Trello tokens). TOKEN_KEY = base64 of 32 random bytes.
async function aesKey(env) {
  const raw = b64.from(env.TOKEN_KEY || '');
  if (raw.length !== 32) throw new Error('TOKEN_KEY must be 32 bytes, base64 encoded');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
export async function encryptJson(env, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(env), enc.encode(JSON.stringify(obj)));
  return `${b64.to(iv)}.${b64.to(ct)}`;
}
export async function decryptJson(env, text) {
  const [iv, ct] = text.split('.');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64.from(iv) }, await aesKey(env), b64.from(ct));
  return JSON.parse(dec.decode(pt));
}

// ---- Signed session cookie: "<userId>.<expiresAt>.<signature>"
async function hmac(env, data) {
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  const key = await crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
const safeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};
export async function signSession(env, userId, days = 30) {
  const body = `${userId}.${Math.floor(Date.now() / 1000) + days * 86400}`;
  return `${body}.${await hmac(env, body)}`;
}
export async function verifySession(env, token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!safeEqual(sig, await hmac(env, `${userId}.${exp}`))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return userId;
}
