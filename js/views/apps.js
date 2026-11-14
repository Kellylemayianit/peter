import { h, replaceChildren } from '../core/dom.js';
import { api } from '../api/index.js';

export default {
  title: 'Apps',
  reactive: false,
  render({ store }) {
    const root = h('div', { class: 'page' });
    let note = '';

    async function refresh() {
      const me = await api.me();
      store.set({ conns: me.connections });
      paint(me.connections);
    }
    async function run(fn) {
      try { await fn(); note = ''; } catch (e) { note = e.message; }
      await refresh();
    }

    function appCard(name, about, connected, action) {
      return h('section', { class: 'card', style: { padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' } },
        h('div', { class: 'row' },
          h('div', { style: { flex: '1' } }, h('h2', { style: { fontSize: '17px' } }, name), h('p', { class: 'muted', style: { fontSize: '14px' } }, about)),
          h('span', { class: 'row', style: { gap: '6px', fontSize: '13px', fontWeight: '600' } }, h('i', { class: 'dot' + (connected ? '' : ' off') }), connected ? 'Connected' : 'Not connected')),
        action);
    }

    function paint(c) {
      const key = h('input', { class: 'input', 'aria-label': 'Trello key', placeholder: 'Trello key', autocomplete: 'off' });
      const token = h('input', { class: 'input', 'aria-label': 'Trello token', placeholder: 'Trello token', type: 'password', autocomplete: 'off' });
      replaceChildren(root,
        h('h1', {}, 'Apps'),
        h('p', { class: 'muted' }, 'Becca can read your calendar and email. Anything that changes something waits for your OK.'),
        note ? h('p', { class: 'status bad', role: 'alert' }, note) : null,
        appCard('Google', 'Calendar and Gmail', c.google,
          c.google ? h('div', {}, h('button', { class: 'btn', type: 'button', onClick: () => run(() => api.disconnect('google')) }, 'Disconnect'))
            : h('div', {}, h('button', { class: 'btn pri', type: 'button', onClick: async () => { await api.connectGoogle(); refresh(); } }, 'Connect Google'))),
        appCard('Trello', 'Boards and cards', c.trello,
          c.trello ? h('div', {}, h('button', { class: 'btn', type: 'button', onClick: () => run(() => api.disconnect('trello')) }, 'Disconnect'))
            : h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } }, key, token,
                h('div', {}, h('button', { class: 'btn pri', type: 'button', onClick: () => run(() => api.connectTrello(key.value.trim(), token.value.trim())) }, 'Connect Trello')))),
        appCard('Web browsing', 'Becca opens a page and fills it in with you watching', false, h('p', { class: 'muted', style: { fontSize: '14px' } }, 'Coming next.')));
    }

    refresh().catch(() => paint({}));
    return root;
  },
};
