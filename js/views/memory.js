import { h } from '../core/dom.js';
import { btn, card } from '../components/ui.js';
import { topbar } from '../components/topbar.js';
import { actions } from '../core/actions.js';

export default {
  title: 'Memory',
  reactive: true,
  render({ store }) {
    const act = actions(store);
    const { memories } = store.get();
    const proposed = memories.filter(m => m.status === 'proposed');
    const saved = memories.filter(m => m.status === 'saved');
    const section = (title, sub, rows) => card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' } },
      h('div', { class: 'stack', style: { gap: '2px' } }, h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, title), h('span', { class: 'muted', style: { fontSize: '13px' } }, sub)),
      rows.length ? rows : h('span', { class: 'muted' }, 'Nothing here.'));
    return h('div', { class: 'page' },
      topbar('Memory'),
      section('To review', 'Becca proposes. Nothing is remembered until you save it.', proposed.map(m =>
        h('div', { class: 'row wrap mem-card', style: { gap: '12px' } },
          h('span', { class: 'grow', style: { color: 'var(--text)' } }, m.text),
          btn('Save', { primary: true, onClick: () => act.saveMemory(m.id) }),
          btn('Dismiss', { onClick: () => act.dismissMemory(m.id) })))),
      section('Saved', 'What Becca is allowed to use.', saved.map(m => h('div', { class: 'mem-card' }, m.text))));
  },
};
