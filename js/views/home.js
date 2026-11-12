import { h } from '../core/dom.js';
import { icon } from '../components/icons.js';
import { btn, chip, card } from '../components/ui.js';
import { kpiCard } from '../components/kpiCard.js';
import { probBar } from '../components/probBar.js';
import { decisionCard } from '../components/decisionCard.js';
import { brierCard } from '../components/brierCard.js';
import { topbar } from '../components/topbar.js';
import { fixtures, staticHome } from '../data/mock.js';
import { fmtKickoff, fmtTime, hoursUntil } from '../core/format.js';
import { countWord } from '../core/actions.js';

const ask = (navigate, text) => text.trim() && navigate('assistant?q=' + encodeURIComponent(text.trim()));

function noticedItems(s, navigate) {
  const f = fixtures[0];
  const items = [{
    icon: 'clock', color: 'var(--accent)',
    title: `${f.home} vs ${f.away} kicks off in ${hoursUntil(f.kickoff)} hours`,
    body: s.predictionLocked ? 'Prediction is locked.' : 'Lineups are not published yet, so I have not locked the prediction.',
    action: 'Prepare', go: () => ask(navigate, `Predict ${f.home} vs ${f.away}`),
  }];
  const stale = s.decisions.find(d => d.needsOutcome);
  if (stale) items.push({
    icon: 'scale', color: 'var(--info)', title: `A decision is ${stale.ageDays} days old with no outcome`,
    body: `${stale.title}: log what actually happened so I can learn from it.`, action: 'Log outcome', go: () => navigate('decisions'),
  });
  const pending = s.approvals.filter(a => a.status === 'pending').length;
  if (pending) items.push({
    icon: 'check', color: 'var(--good)', title: `${countWord(pending)} Sheets update${pending > 1 ? 's are' : ' is'} ready for your approval`,
    body: 'Nothing is written until you approve.', action: 'Review', go: () => navigate('workspace'),
  });
  return items;
}

export default {
  title: 'Home',
  reactive: true,
  render({ store, navigate }) {
    const s = store.get();
    const pending = s.approvals.filter(a => a.status === 'pending').length;
    const proposed = s.memories.filter(m => m.status === 'proposed').length;
    const noOutcome = s.decisions.filter(d => d.needsOutcome).length;
    const noticed = noticedItems(s, navigate);

    const input = h('input', { 'aria-label': 'Ask Becca', placeholder: 'Ask Becca anything, in English, Kiswahili or Sheng…',
      onKeydown: (e) => e.key === 'Enter' && ask(navigate, input.value) });

    const kpis = [
      { label: 'Awaiting approval', value: String(pending), sub: pending ? 'Drafted, nothing written yet' : 'Nothing waiting', color: 'var(--accent)' },
      { label: 'Open decisions', value: String(s.decisions.length), sub: `${noOutcome} without an outcome logged`, color: 'var(--info)' },
      { label: 'Memories to review', value: String(proposed), sub: 'Proposed by Becca, not saved yet', color: 'var(--good)' },
      { label: 'Prediction accuracy', value: '58%', sub: 'Last 12 settled, 1X2 pick', color: 'var(--bad)' },
    ].map((k, i) => kpiCard({ ...k, spark: staticHome.sparks[i] }));

    return h('div', { class: 'page' },
      topbar('Home'),

      h('section', { class: 'stack', style: { gap: '6px' } },
        h('h1', { style: { fontSize: '34px', fontWeight: 800, letterSpacing: '-.02em' } }, 'Habari, Gibu'),
        h('p', { class: 'text2', style: { fontSize: '16px' } },
          `${countWord(noticed.length)} thing${noticed.length === 1 ? '' : 's'} need${noticed.length === 1 ? 's' : ''} you today. Everything else is on track.`)),

      card({ style: { padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' } },
        h('div', { class: 'field', style: { height: '52px', padding: '0 8px 0 18px' } },
          h('span', { style: { color: 'var(--accent-text)', display: 'flex' } }, icon('spark')),
          input,
          h('button', { class: 'btn icon', 'aria-label': 'Speak to Becca', style: { borderRadius: '10px' } }, icon('mic')),
          h('button', { class: 'btn primary icon', 'aria-label': 'Send', style: { borderRadius: '10px' }, onClick: () => ask(navigate, input.value) }, icon('send'))),
        h('div', { class: 'row wrap', style: { gap: '8px' } },
          staticHome.prompts.map(p => btn(p, { onClick: () => ask(navigate, p) })))),

      h('section', { class: 'kpis' }, kpis),

      h('div', { class: 'cols' },
        h('div', { class: 'col-main' },
          card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' } },
            h('div', { class: 'row', style: { justifyContent: 'space-between' } },
              h('h2', { class: 'row', style: { gap: '10px', fontSize: '17px', fontWeight: 700 } },
                h('span', { style: { color: 'var(--accent-text)', display: 'flex' } }, icon('spark')), 'Becca noticed'),
              h('span', { class: 'muted', style: { fontSize: '13px' } }, 'Only what is relevant today')),
            noticed.map(n => h('div', { class: 'row wrap', style: { gap: '14px', padding: '14px', borderRadius: '12px', background: 'var(--panel2)', border: '1px solid var(--line)' } },
              h('div', { style: { width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', background: `color-mix(in srgb, ${n.color} 16%, transparent)`, color: n.color } }, icon(n.icon)),
              h('div', { class: 'stack', style: { flex: '1 1 300px', minWidth: 0, gap: '2px' } },
                h('span', { style: { fontWeight: 600 } }, n.title),
                h('span', { class: 'text2', style: { fontSize: '13px' } }, n.body)),
              btn(n.action, { onClick: n.go })))),

          card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' } },
            h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } },
              h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, 'Upcoming fixtures'),
              h('a', { href: '#/football', class: 'row', style: { gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' } }, 'All predictions', icon('arrow', 16))),
            fixtures.map(f => h('div', { class: 'list-row' },
              h('div', { class: 'stack', style: { flex: '1 1 200px', minWidth: 0, gap: '2px' } },
                h('span', { class: 'muted', style: { fontSize: '12px' } }, `${f.league} · ${fmtKickoff(f.kickoff)}`),
                h('span', { style: { fontWeight: 700, fontSize: '15px' } }, `${f.home} vs ${f.away}`)),
              h('div', { class: 'stack', style: { flex: '2 1 240px', minWidth: 0 } },
                f.verified ? probBar(f.probs) : h('span', { class: 'text2', style: { fontSize: '13px' } }, f.note)),
              chip(f.verified ? 'Fixture verified' : 'Not verified', { color: f.verified ? 'var(--good)' : 'var(--warn)' }))))),

        h('div', { class: 'col-side' },
          brierCard(),
          card({ style: { padding: '20px' } },
            h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '8px' } },
              h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, 'Today'), chip('Google Calendar')),
            staticHome.today.map(e => h('div', { class: 'row', style: { gap: '14px', padding: '10px 0', borderTop: '1px solid var(--line)' } },
              h('span', { class: 'mono muted', style: { flex: '0 0 52px', fontSize: '13px' } }, e.time),
              h('span', { class: 'grow', style: { fontWeight: 500 } }, e.title),
              h('span', { class: 'dot', style: { background: e.color } })))),
          card({ style: { padding: '20px' } },
            h('h2', { style: { fontSize: '17px', fontWeight: 700, marginBottom: '8px' } }, 'What Becca can reach'),
            staticHome.systems.map(x => h('div', { class: 'row', style: { gap: '12px', padding: '10px 0', borderTop: '1px solid var(--line)' } },
              h('span', { class: 'dot', style: { background: x.color } }),
              h('span', { class: 'grow', style: { fontWeight: 500 } }, x.name),
              h('span', { class: 'text2', style: { fontSize: '13px' } }, x.state)))))),

      h('section', { class: 'stack', style: { gap: '14px' } },
        h('div', { class: 'row', style: { justifyContent: 'space-between' } },
          h('h2', { style: { fontSize: '17px', fontWeight: 700 } }, 'Decisions in progress'),
          h('a', { href: '#/decisions', style: { fontSize: '13px', fontWeight: 600, color: 'var(--accent-text)', textDecoration: 'none' } }, 'Open decision log')),
        h('div', { class: 'decisions' }, s.decisions.slice(0, 3).map(d => decisionCard(d)))));
  },
};
