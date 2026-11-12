import { h } from '../core/dom.js';
import { btn, chip, card } from '../components/ui.js';
import { probBar } from '../components/probBar.js';
import { topbar } from '../components/topbar.js';
import { fixtures } from '../data/mock.js';
import { fmtKickoff } from '../core/format.js';

export default {
  title: 'Football',
  render({ navigate }) {
    return h('div', { class: 'page' },
      topbar('Football'),
      h('h1', { style: { fontSize: '28px', fontWeight: 800, letterSpacing: '-.02em' } }, 'Predictions'),
      h('div', { class: 'stack', style: { gap: '16px' } }, fixtures.map(f =>
        card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' } },
          h('div', { class: 'row wrap', style: { justifyContent: 'space-between', gap: '12px' } },
            h('div', { class: 'stack', style: { gap: '2px' } },
              h('span', { class: 'muted', style: { fontSize: '12px' } }, `${f.league} · ${fmtKickoff(f.kickoff)}`),
              h('span', { style: { fontWeight: 800, fontSize: '20px' } }, `${f.home} vs ${f.away}`)),
            chip(f.verified ? 'Fixture verified' : 'Not verified', { color: f.verified ? 'var(--good)' : 'var(--warn)' })),
          f.verified ? probBar(f.probs, { labels: [f.home, 'Draw', f.away], height: 10 })
                     : h('p', { class: 'text2', style: { fontSize: '13px' } }, f.note),
          f.verified && f.lineups === false && h('p', { class: 'muted', style: { fontSize: '13px' } }, 'Lineups pending: confidence is capped.'),
          f.verified && h('div', {}, btn('Ask Becca about this', { onClick: () => navigate('assistant?q=' + encodeURIComponent(`Predict ${f.home} vs ${f.away}`)) }))))));
  },
};
