import { h, replaceChildren } from '../core/dom.js';
import { api } from '../api/index.js';
import { refreshPending } from '../core/state.js';

const WHAT = { calendar: 'Calendar', email: 'Email', trello: 'Trello', memory: 'Memory' };

// A card that asks "shall I?". It repaints itself: waiting, working, then the result.
export function approvalCard(approval, store) {
  const { id, preview: p } = approval;
  const root = h('section', { class: 'card ask', 'aria-label': p.title });

  function paint(state = 'pending', message = '') {
    const final = !['pending', 'busy'].includes(state);
    root.className = 'card ask' + (final ? ' done' : '');
    replaceChildren(root,
      h('div', { class: 'label' }, `${WHAT[p.kind] || 'Becca'}${final ? '' : ' · needs your OK'}`),
      h('h2', { style: { fontSize: '17px', fontWeight: '700' } }, p.title),
      ...p.lines.map((l) => h('div', { class: 'kv' }, h('b', {}, l.label), h('span', {}, l.value))),
      p.body ? h('div', { class: 'ask-body' }, p.body) : null,
      final
        ? h('div', { class: `status ${state === 'approved' ? 'ok' : state === 'rejected' ? 'no' : 'bad'}` },
            state === 'approved' ? `✓ ${message || 'Done'}` : state === 'rejected' ? message || 'Left alone' : message || 'That did not work')
        : h('div', { class: 'ask-actions' },
            h('button', { class: 'btn pri', type: 'button', disabled: state === 'busy', onClick: () => act(true) }, state === 'busy' ? 'Working…' : p.confirm || 'Yes'),
            h('button', { class: 'btn', type: 'button', disabled: state === 'busy', onClick: () => act(false) }, 'Not now')));
  }

  async function act(yes) {
    paint('busy');
    try {
      const r = await api.decide(id, yes);
      paint(r.status, r.message);
    } catch (e) { paint('failed', e.message); }
    refreshPending(store);
  }

  paint(approval.status === 'pending' ? 'pending' : approval.status);
  return root;
}
