import { h } from '../core/dom.js';
import { btn, card } from '../components/ui.js';
import { topbar } from '../components/topbar.js';

export default {
  title: 'Developer',
  reactive: true,
  render({ store }) {
    const { messages, ...rest } = store.get();
    return h('div', { class: 'page' },
      topbar('Developer'),
      card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' } },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } },
          h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, 'Store state'),
          btn('Reset demo data', { onClick: () => { store.reset(); } })),
        h('pre', { class: 'mono', style: { margin: 0, fontSize: '12px', color: 'var(--text2)', overflow: 'auto', maxHeight: '60vh' } },
          JSON.stringify({ ...rest, messages: `${messages.length} messages` }, null, 2))));
  },
};
