import { h, replaceChildren } from '../core/dom.js';
import { api } from '../api/index.js';

export default {
  title: 'Memory',
  reactive: false,
  render() {
    const root = h('div', { class: 'page' });
    async function paint() {
      const list = await api.memories().catch(() => []);
      replaceChildren(root,
        h('h1', {}, 'What Becca knows'),
        h('p', { class: 'muted' }, 'Becca asks before remembering anything. You can delete any of it.'),
        h('section', { class: 'card' }, list.length
          ? list.map((m) => h('div', { class: 'list-item' }, h('span', { style: { flex: '1' } }, m.text),
              h('button', { class: 'btn', type: 'button', 'aria-label': `Forget: ${m.text}`, onClick: async () => { await api.deleteMemory(m.id); paint(); } }, 'Forget')))
          : h('div', { class: 'empty' }, 'Nothing yet. When you tell Becca something worth keeping, it will ask first.')));
    }
    paint();
    return root;
  },
};
