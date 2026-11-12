import { h, html } from '../core/dom.js';

export function kpiCard({ label, value, sub, color, spark }) {
  return h('div', { class: 'card stack', style: { padding: '18px', gap: '8px' } },
    h('div', { class: 'row', style: { justifyContent: 'space-between' } },
      h('span', { class: 'label' }, label), h('span', { class: 'dot', style: { background: color } })),
    h('div', { class: 'row', style: { alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' } },
      h('span', { class: 'mono', style: { fontSize: '36px', fontWeight: 600, lineHeight: 1, letterSpacing: '-.02em' } }, value),
      html(`<svg width="84" height="32" viewBox="0 0 84 32" aria-hidden="true"><polyline points="${spark}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke:${color}"/></svg>`)),
    h('span', { style: { fontSize: '13px', color: 'var(--text2)' } }, sub));
}
