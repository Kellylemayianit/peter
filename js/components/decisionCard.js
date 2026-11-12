import { h, html } from '../core/dom.js';

const TONE = { accent: 'var(--accent)', bad: 'var(--bad)', good: 'var(--good)', info: 'var(--info)' };
const C = 2 * Math.PI * 18; // ring circumference for r=18

export function decisionCard(d, { actions } = {}) {
  const color = TONE[d.tone] || 'var(--accent)';
  const ring = html(`<svg width="52" height="52" viewBox="0 0 44 44" role="img" aria-label="Confidence ${d.pct} percent" style="flex:0 0 auto">
    <circle cx="22" cy="22" r="18" fill="none" stroke-width="4" style="stroke:var(--line)"/>
    <circle cx="22" cy="22" r="18" fill="none" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(d.pct / 100 * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 22 22)" style="stroke:${color}"/>
    <text x="22" y="26" text-anchor="middle" font-size="11" font-weight="600" class="mono" style="fill:var(--text)">${Number(d.pct)}</text></svg>`);
  return h('div', { class: 'card row', style: { padding: '18px', gap: '16px', alignItems: 'flex-start' } },
    ring,
    h('div', { class: 'stack', style: { gap: '6px', minWidth: 0 } },
      h('span', { style: { fontWeight: 700 } }, d.title),
      h('span', { style: { fontSize: '13px', color: 'var(--text2)' } }, d.next),
      h('span', { class: 'chip', style: { alignSelf: 'flex-start', color } }, d.risk),
      actions));
}
