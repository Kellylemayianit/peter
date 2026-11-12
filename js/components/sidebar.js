import { h } from '../core/dom.js';
import { icon } from './icons.js';
import { nav } from '../data/mock.js';

// Counts shown as badges next to nav items. Pure function of state.
export const badgesFor = (s) => ({
  workspace: s.approvals.filter(a => a.status === 'pending').length || '',
  decisions: s.decisions.length || '',
  memory: s.memories.filter(m => m.status === 'proposed').length || '',
});

const link = (n, active, badge) =>
  h('a', { href: `#/${n.id}`, class: 'nav-item' + (active ? ' active' : ''), 'aria-current': active ? 'page' : null },
    icon(n.icon), h('span', { class: 'grow' }, n.label), badge ? h('span', { class: 'badge mono' }, badge) : null);

export function sidebar(activeId, state) {
  const badges = badgesFor(state);
  const recent = ['Arsenal vs Chelsea', 'Pivot to online wholesale', 'Draft reply to supplier', 'Weekly review'];
  return h('aside', { class: 'sidebar' },
    h('div', { class: 'row', style: { gap: '12px', padding: '0 8px' } },
      h('div', { style: { width: '36px', height: '36px', borderRadius: '11px', background: 'var(--accent)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '18px' } }, 'B'),
      h('div', { class: 'stack' },
        h('span', { style: { fontWeight: 800, fontSize: '17px', letterSpacing: '-.01em' } }, 'Becca'),
        h('span', { class: 'muted', style: { fontSize: '12px' } }, 'Personal assistant'))),
    h('nav', { 'aria-label': 'Main', class: 'stack', style: { gap: '4px' } },
      nav.map(n => link(n, n.id === activeId, badges[n.id]))),
    activeId === 'assistant' && h('div', { class: 'stack', style: { gap: '8px' } },
      h('span', { class: 'label', style: { padding: '0 12px' } }, 'Recent'),
      recent.map(r => h('a', { href: '#/assistant', class: 'nav-item', style: { fontSize: '13px', padding: '8px 12px' } }, r))),
    h('div', { class: 'grow' }),
    h('div', { class: 'stack', style: { gap: '4px' } },
      link({ id: 'settings', label: 'Settings', icon: 'sliders' }, activeId === 'settings'),
      link({ id: 'developer', label: 'Developer', icon: 'code' }, activeId === 'developer')),
    activeId !== 'assistant' && h('div', { class: 'card row', style: { padding: '12px', gap: '12px', borderRadius: '14px' } },
      h('div', { style: { width: '36px', height: '36px', borderRadius: '50%', background: 'var(--panel2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontWeight: 700 } }, 'G'),
      h('div', { class: 'stack', style: { minWidth: 0 } },
        h('span', { style: { fontWeight: 600 } }, 'Gibson Njogu'),
        h('span', { class: 'muted row', style: { fontSize: '12px', gap: '6px' } }, h('span', { class: 'dot', style: { background: 'var(--good)' } }), 'Synced'))));
}

const TABS = ['home', 'assistant', 'football', 'decisions', 'memory'];
const TAB_LABEL = { assistant: 'Chat' };

export function tabbar(activeId) {
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    nav.filter(n => TABS.includes(n.id)).map(n =>
      h('a', { href: `#/${n.id}`, class: 'tab' + (n.id === activeId ? ' active' : '') }, icon(n.icon), TAB_LABEL[n.id] || n.label)));
}
