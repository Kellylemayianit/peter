import { h } from '../core/dom.js';
import { card } from '../components/ui.js';
import { approvalCard } from '../components/approvalCard.js';
import { topbar } from '../components/topbar.js';
import { staticHome } from '../data/mock.js';
import { actions } from '../core/actions.js';

export default {
  title: 'Workspace',
  reactive: true,
  render({ store }) {
    const act = actions(store);
    const { approvals } = store.get();
    return h('div', { class: 'page' },
      topbar('Workspace'),
      h('h1', { style: { fontSize: '28px', fontWeight: 800, letterSpacing: '-.02em' } }, 'Approvals'),
      h('div', { class: 'cols' },
        h('div', { class: 'col-main' }, approvals.map(a => approvalCard(store, act, a.id, { highlight: a.status === 'pending' }))),
        h('div', { class: 'col-side' }, card({ style: { padding: '20px' } },
          h('h2', { style: { fontSize: '17px', fontWeight: 700, marginBottom: '8px' } }, 'What Becca can reach'),
          staticHome.systems.map(x => h('div', { class: 'row', style: { gap: '12px', padding: '10px 0', borderTop: '1px solid var(--line)' } },
            h('span', { class: 'dot', style: { background: x.color } }),
            h('span', { class: 'grow', style: { fontWeight: 500 } }, x.name),
            h('span', { class: 'text2', style: { fontSize: '13px' } }, x.state)))))));
  },
};
