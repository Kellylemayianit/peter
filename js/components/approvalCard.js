import { h } from '../core/dom.js';
import { icon } from './icons.js';
import { btn, chip } from './ui.js';

// Self-repainting approval card. Reads the approval from the store; writes via actions.
export function approvalCard(store, act, id, { highlight = false } = {}) {
  const root = h('div', { class: 'card stack', style: { padding: '18px', gap: '12px', borderColor: highlight ? 'var(--accent)' : null } });

  function paint() {
    const a = store.get().approvals.find(x => x.id === id);
    if (!a) return root.replaceChildren();
    const pending = a.status === 'pending';
    root.replaceChildren(
      h('div', { class: 'row wrap', style: { gap: '10px' } },
        pending ? chip('Waiting for you', { on: true })
          : chip(a.status === 'approved' ? 'Approved' : 'Rejected', { color: a.status === 'approved' ? 'var(--good)' : 'var(--bad)' }),
        h('span', { style: { fontWeight: 700 } }, a.title)),
      h('div', { class: 'mono text2', style: { padding: '12px', borderRadius: '10px', background: 'var(--panel2)', border: '1px solid var(--line)', fontSize: '12px', overflowX: 'auto', whiteSpace: 'nowrap' } }, a.detail),
      pending
        ? h('div', { class: 'row wrap', style: { gap: '8px' } },
            btn('Approve', { primary: true, iconName: 'check', onClick: () => { act.setApproval(id, 'approved'); paint(); } }),
            btn('Reject', { iconName: 'x', onClick: () => { act.setApproval(id, 'rejected'); paint(); } }),
            h('span', { class: 'muted', style: { fontSize: '12px' } }, 'Not done yet. Nothing is written until you approve.'))
        : h('span', { class: 'muted', style: { fontSize: '12px' } },
            a.status === 'approved' ? 'Approved. In the real build this is where the Sheets write would happen.' : 'Rejected. Nothing was written.'));
  }
  paint();
  return root;
}
