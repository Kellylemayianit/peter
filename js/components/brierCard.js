import { h, html } from '../core/dom.js';
import { icon } from './icons.js';

export function brierCard() {
  return h('section', { class: 'card stack', style: { padding: '20px', gap: '10px' } },
    h('div', { class: 'row', style: { alignItems: 'baseline', justifyContent: 'space-between' } },
      h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, 'Prediction quality'),
      h('span', { class: 'mono', style: { fontSize: '20px', fontWeight: 600 } }, '0.21')),
    h('span', { class: 'text2', style: { fontSize: '13px' } }, 'Brier score over the last 12 settled matches. Lower is better.'),
    html(`<svg viewBox="0 0 320 130" width="100%" role="img" aria-label="Brier score trend falling from 0.27 to 0.21 over 12 matches" style="display:block">
      <line x1="0" y1="20" x2="320" y2="20" style="stroke:var(--line)"/><line x1="0" y1="60" x2="320" y2="60" style="stroke:var(--line)"/><line x1="0" y1="100" x2="320" y2="100" style="stroke:var(--line)"/>
      <path d="M0 34 L29 30 L58 52 L87 44 L116 58 L145 50 L174 70 L203 62 L232 76 L261 68 L290 80 L320 74 L320 130 L0 130 Z" style="fill:color-mix(in srgb,var(--accent) 14%,transparent)"/>
      <polyline points="0,34 29,30 58,52 87,44 116,58 145,50 174,70 203,62 232,76 261,68 290,80 320,74" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--accent)"/>
      <circle cx="320" cy="74" r="4.5" style="fill:var(--accent)"/></svg>`),
    h('div', { class: 'callout' }, icon('alert', 16),
      h('span', {}, '12 settled matches is too few to call the model calibrated. Becca will say so until there are about 100.')));
}
