import { h } from '../core/dom.js';
import { btn } from '../components/ui.js';
import { decisionCard } from '../components/decisionCard.js';
import { topbar } from '../components/topbar.js';
import { actions } from '../core/actions.js';

export default {
  title: 'Decisions',
  reactive: true,
  render({ store }) {
    const act = actions(store);
    const { decisions } = store.get();
    return h('div', { class: 'page' },
      topbar('Decisions'),
      h('h1', { style: { fontSize: '28px', fontWeight: 800, letterSpacing: '-.02em' } }, 'Decision log'),
      h('div', { class: 'decisions' }, decisions.map(d =>
        decisionCard(d, { actions: d.needsOutcome
          ? h('div', { style: { marginTop: '4px' } }, btn(`Log outcome (${d.ageDays} days old)`, { onClick: () => act.logOutcome(d.id) }))
          : null }))));
  },
};
