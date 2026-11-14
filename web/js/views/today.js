import { h, replaceChildren } from '../core/dom.js';
import { api } from '../api/index.js';
import { approvalCard } from '../components/approvalCard.js';

const clock = (iso) => (iso?.includes('T') ? new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'All day');

export default {
  title: 'Today',
  reactive: false,
  render({ store }) {
    const body = h('div', { class: 'page' }, h('h1', {}, 'Today'), h('p', { class: 'muted' }, 'Loading…'));
    (async () => {
      const [today, pending] = await Promise.all([api.today().catch(() => ({ connected: false, events: [] })), api.pending().catch(() => [])]);
      replaceChildren(body,
        h('h1', {}, 'Today'),
        h('p', { class: 'muted' }, new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })),
        pending.length ? h('section', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          h('h2', { style: { fontSize: '17px' } }, 'Needs your OK'), pending.map((a) => approvalCard(a, store))) : null,
        h('section', { class: 'card' },
          !today.connected ? h('div', { class: 'empty' }, 'Connect Google in ', h('a', { href: '#/apps' }, 'Apps'), ' to see your day.')
            : !today.events.length ? h('div', { class: 'empty' }, 'Nothing on your calendar today.')
            : today.events.map((e) => h('div', { class: 'list-item' }, h('span', { class: 'time' }, clock(e.start)), h('span', { style: { fontWeight: '600' } }, e.title)))));
    })();
    return body;
  },
};
