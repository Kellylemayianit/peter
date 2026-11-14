// Talks to the Worker. Same shape as mock.js, so views never know which one they have.
export class SignedOut extends Error {}
const HEAD = { 'x-requested-with': 'becca', 'content-type': 'application/json' };

async function call(method, path, body) {
  const res = await fetch(path, { method, headers: HEAD, body: body && JSON.stringify(body), credentials: 'same-origin' });
  if (res.status === 401) throw new SignedOut();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const real = {
  demo: false,
  me: () => call('GET', '/api/me'),
  history: async () => (await call('GET', '/api/history')).messages,
  pending: async () => (await call('GET', '/api/approvals')).approvals,
  decide: (id, approve) => call('POST', `/api/approvals/${id}/decision`, { approve }),
  today: () => call('GET', '/api/today'),
  memories: async () => (await call('GET', '/api/memories')).memories,
  deleteMemory: (id) => call('DELETE', `/api/memories/${id}`),
  connectTrello: (key, token) => call('POST', '/api/connections/trello', { key, token }),
  disconnect: (app) => call('DELETE', `/api/connections/${app}`),
  connectGoogle: () => { location.href = '/api/auth/google/start'; },
  logout: async () => { await call('POST', '/api/auth/logout'); location.reload(); },

  // Server-sent events: one JSON object per "data:" line.
  async chat(text, onEvent) {
    const res = await fetch('/api/chat', { method: 'POST', headers: HEAD, body: JSON.stringify({ message: text }), credentials: 'same-origin' });
    if (res.status === 401) throw new SignedOut();
    if (!res.ok || !res.body) throw new Error('I could not start that. Please try again.');
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 2);
        if (line.startsWith('data: ')) onEvent(JSON.parse(line.slice(6)));
      }
    }
  },
};
