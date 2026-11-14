import { h } from '../core/dom.js';
import { icon } from './icons.js';
import { api } from '../api/index.js';

const NAV = [
  { id: 'chat', label: 'Chat', icon: 'chat' },
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'memory', label: 'Memory', icon: 'memory' },
];

export function sidebar(active, state) {
  const n = state.pending.length;
  return h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' }, h('div', { class: 'logo' }, 'B'), 'Becca'),
    h('nav', { 'aria-label': 'Main', style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
      NAV.map((i) => h('a', { href: `#/${i.id}`, class: 'nav' + (i.id === active ? ' active' : ''), 'aria-current': i.id === active ? 'page' : null },
        icon(i.icon), i.label, i.id === 'today' && n ? h('span', { class: 'badge' }, n) : null))),
    h('div', { style: { flex: '1' } }),
    state.demo ? h('div', { class: 'muted', style: { padding: '0 12px 12px', fontSize: '13px' } }, 'Demo mode: nothing here is real yet.')
      : h('button', { class: 'nav', type: 'button', onClick: () => api.logout() }, icon('out'), 'Sign out'));
}

export function tabbar(active, state) {
  const n = state.pending.length;
  return h('nav', { class: 'tabbar', 'aria-label': 'Main' },
    NAV.map((i) => h('a', { href: `#/${i.id}`, class: 'tab' + (i.id === active ? ' active' : ''), 'aria-current': i.id === active ? 'page' : null },
      icon(i.icon), i.label, i.id === 'today' && n ? h('span', { class: 'badge' }, n) : null)));
}
