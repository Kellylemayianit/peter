import { h } from '../core/dom.js';

// Three-segment probability bar + mono legend. labels default to Home/Draw/Away.
export function probBar({ home, draw, away }, { labels = ['Home', 'Draw', 'Away'], height = 8, legend = true } = {}) {
  const seg = (w, bg) => h('div', { style: { width: w + '%', background: bg } });
  return h('div', { class: 'stack', style: { gap: '8px' } },
    h('div', { class: 'probbar', style: { height: height + 'px' }, role: 'img',
      'aria-label': `${labels[0]} ${home}%, ${labels[1]} ${draw}%, ${labels[2]} ${away}%` },
      seg(home, 'var(--good)'), seg(draw, 'var(--muted)'), seg(away, 'var(--info)')),
    legend && h('div', { class: 'mono row', style: { justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)' } },
      h('span', {}, `${labels[0]} ${home}%`), h('span', {}, `${labels[1]} ${draw}%`), h('span', {}, `${labels[2]} ${away}%`)));
}
