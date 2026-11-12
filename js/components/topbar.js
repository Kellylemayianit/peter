import { h } from '../core/dom.js';
import { icon } from './icons.js';
import { fmtDay } from '../core/format.js';

export function topbar(title) {
  const input = h('input', { 'aria-label': 'Search or ask Becca', placeholder: 'Search memories, decisions, fixtures…' });

  return h('header', { class: 'topbar' },
    h('span', { style: { fontWeight: 700, fontSize: '15px', flex: '0 0 auto' } }, title),
    h('label', { class: 'search' }, icon('search'), input,
      h('span', { class: 'mono', style: { fontSize: '12px', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--line)' } }, '⌘K')),
    h('div', { class: 'grow' }),
    h('span', { class: 'chip desktop-only' }, icon('calendar', 14), `${fmtDay(new Date())} · Nairobi`),
    h('button', { class: 'btn icon', 'aria-label': 'Notifications', style: { position: 'relative' } },
      icon('bell'),
      h('span', { class: 'dot', style: { position: 'absolute', top: '10px', right: '11px', background: 'var(--accent)', width: '9px', height: '9px' } })));
}
