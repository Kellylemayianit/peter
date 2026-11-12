import { h } from '../core/dom.js';
import { icon } from '../components/icons.js';
import { btn, chip, card } from '../components/ui.js';
import { probBar } from '../components/probBar.js';
import { approvalCard } from '../components/approvalCard.js';
import { fixtures } from '../data/mock.js';
import { replyFor } from '../data/replies.js';
import { actions } from '../core/actions.js';
import { fmtKickoff } from '../core/format.js';

const SEED = [
  { role: 'user', text: 'Predict Arsenal vs Chelsea this Saturday.' },
  { role: 'becca', rich: 'prediction', fixtureId: 'ars-che' },
];

const stepRow = (s) => h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--line)' } },
  h('span', { style: { color: s.color, marginTop: '2px', display: 'flex' } }, icon(s.icon, 16)),
  h('div', { class: 'stack', style: { gap: '1px', minWidth: 0 } },
    h('span', { style: { fontWeight: 600, fontSize: '13px' } }, s.title),
    h('span', { class: 'text2', style: { fontSize: '13px' } }, s.detail)));

const beccaRow = (...kids) => h('div', { class: 'row', style: { gap: '14px', alignItems: 'flex-start' } },
  h('div', { class: 'avatar-b' }, 'B'),
  h('div', { class: 'stack', style: { flex: '1 1 auto', minWidth: 0, gap: '16px' } }, kids));

export default {
  title: 'Assistant',
  reactive: false, // the view mutates its own DOM so typing and scroll are never lost
  render({ store, params }) {
    const act = actions(store);
    const f = fixtures.find(x => x.id === 'ars-che');
    if (!store.get().messages.length) SEED.forEach(act.addMessage);

    const log = h('div', { class: 'chat-log' });
    let mode = 'Auto';

    function predictionMessage() {
      const wrap = h('div', { class: 'stack', style: { gap: '16px' } });
      const working = h('p', { class: 'text2', hidden: true, style: { fontSize: '13px' } },
        'Poisson model over each team’s last five matches. Probabilities are model output, not bookmaker odds.');
      let reminder = false;
      function paint() {
        const locked = store.get().predictionLocked;
        wrap.replaceChildren(
          h('p', { style: { fontSize: '15px' } }, 'Sawa Gibu. Nimethibitisha fixture kwanza, kisha nikaendesha model. Here is what I checked and what I could not.'),
          card({ style: { padding: '6px 16px', borderRadius: '14px' } }, [
            { icon: 'check', color: 'var(--good)', title: 'Fixture confirmed', detail: `Premier League, ${fmtKickoff(f.kickoff)}. Source: football data feed.` },
            { icon: 'check', color: 'var(--good)', title: 'Form and goals loaded', detail: 'Last five matches for both teams.' },
            { icon: 'alert', color: 'var(--warn)', title: 'Lineups not published', detail: 'Confidence is capped until they are.' },
          ].map(stepRow)),
          card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' } },
            h('div', { class: 'row wrap', style: { justifyContent: 'space-between', gap: '12px' } },
              h('div', { class: 'stack', style: { gap: '2px' } },
                h('span', { class: 'label' }, `Premier League · ${fmtKickoff(f.kickoff)}`),
                h('span', { style: { fontSize: '22px', fontWeight: 800, letterSpacing: '-.01em' } }, 'Arsenal to win')),
              locked ? chip('Locked', { color: 'var(--good)', iconName: 'check' })
                : chip('Medium confidence, lineups pending', { color: 'var(--warn)', iconName: 'alert' })),
            probBar(f.probs, { labels: ['Arsenal', 'Draw', 'Chelsea'], height: 10 }),
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px' } },
              f.markets.map(m => h('div', { class: 'stack', style: { padding: '12px', borderRadius: '12px', background: 'var(--panel2)', border: '1px solid var(--line)', gap: '2px' } },
                h('span', { class: 'muted', style: { fontSize: '12px' } }, m.name),
                h('span', { class: 'mono', style: { fontSize: '18px', fontWeight: 600 } }, m.value)))),
            h('p', { class: 'text2', style: { fontSize: '13px' } },
              h('strong', { style: { color: 'var(--text)' } }, 'Main risk: '),
              'early red card or a penalty can swing a match like this. Treat 69% as a probability, not a promise.'),
            h('div', { class: 'row wrap', style: { gap: '8px' } },
              locked ? null : btn('Lock prediction', { primary: true, onClick: () => { act.lockPrediction(); paint(); } }),
              btn(reminder ? 'Reminder set' : 'Remind me when lineups drop', { onClick: () => { reminder = true; paint(); } }),
              btn('Show the working', { onClick: () => { working.hidden = !working.hidden; } })),
            working),
          approvalCard(store, act, 'a1', { highlight: true }));
      }
      paint();
      return wrap;
    }

    const messageNode = (m) => m.role === 'user'
      ? h('div', { class: 'bubble-user' }, m.text)
      : beccaRow(m.rich === 'prediction' ? predictionMessage() : h('p', { style: { fontSize: '15px' } }, m.text));

    const scrollEnd = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight }));

    function send(text) {
      text = text.trim();
      if (!text) return;
      const user = { role: 'user', text };
      act.addMessage(user);
      log.append(messageNode(user));
      const typing = beccaRow(h('span', { class: 'typing', 'aria-label': 'Becca is typing' }, h('i'), h('i'), h('i')));
      log.append(typing);
      scrollEnd();
      setTimeout(() => {
        const r = { role: 'becca', text: replyFor(text, mode, store.get()).text };
        typing.remove();
        act.addMessage(r);
        log.append(messageNode(r));
        scrollEnd();
      }, 700);
    }

    store.get().messages.forEach(m => log.append(messageNode(m)));

    const input = h('input', { 'aria-label': 'Message Becca', placeholder: 'Message Becca…',
      onKeydown: (e) => { if (e.key === 'Enter') { send(input.value); input.value = ''; } } });
    const modeChips = ['Auto', 'Football', 'Decision', 'Draft'].map(m =>
      h('button', { class: 'chip' + (m === mode ? ' on' : ''), type: 'button', 'aria-pressed': m === mode ? 'true' : 'false',
        onClick: () => { mode = m; modeChips.forEach(c => { const on = c.textContent === m; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); }); } }, m));

    const saved = store.get().memories.filter(m => m.status === 'saved').slice(0, 2);
    const tools = [
      { name: 'Football data', state: 'Done, 1.2 s', color: 'var(--good)' },
      { name: 'Poisson model', state: 'Done', color: 'var(--good)' },
      { name: 'Google Sheets', state: 'Waiting for your approval', color: 'var(--accent)' },
      { name: 'Odds feed', state: 'Not connected', color: 'var(--muted)' },
    ];

    const root = h('div', { class: 'chat-layout' },
      h('div', { class: 'chat-wrap' },
        h('header', { class: 'chat-head' },
          h('div', { class: 'stack' },
            h('span', { style: { fontWeight: 700, fontSize: '16px' } }, 'Arsenal vs Chelsea'),
            h('span', { class: 'muted', style: { fontSize: '12px' } }, 'Football · started today')),
          h('div', { class: 'grow' }),
          chip('Auto mode', { on: true }),
          h('span', { class: 'chip' }, h('span', { class: 'dot', style: { background: 'var(--good)' } }), 'Live context on')),
        log,
        h('div', { class: 'chat-composer' },
          h('div', { class: 'row wrap', style: { gap: '8px' } }, modeChips),
          h('div', { class: 'row', style: { gap: '12px', minHeight: '56px', padding: '6px 8px 6px 18px', borderRadius: '16px', background: 'var(--panel)', border: '1px solid var(--line)' } },
            h('div', { class: 'field grow', style: { border: 0, background: 'transparent', borderRadius: 0 } }, input),
            h('button', { class: 'btn icon', 'aria-label': 'Speak to Becca', style: { borderRadius: '12px' } }, icon('mic')),
            h('button', { class: 'btn primary icon', 'aria-label': 'Send', style: { borderRadius: '12px' }, onClick: () => { send(input.value); input.value = ''; } }, icon('send'))))),
      h('aside', { class: 'context-rail' },
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('span', { class: 'label' }, 'What I used from memory'),
          saved.map(m => h('div', { class: 'mem-card' }, m.text))),
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('span', { class: 'label' }, 'Tools'),
          tools.map(t => h('div', { class: 'row', style: { gap: '12px' } },
            h('span', { class: 'dot', style: { background: t.color } }),
            h('div', { class: 'stack grow', style: { minWidth: 0 } },
              h('span', { style: { fontWeight: 600, fontSize: '13px' } }, t.name),
              h('span', { class: 'muted', style: { fontSize: '12px' } }, t.state))))),
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('span', { class: 'label' }, 'Could not do'),
          h('div', { class: 'mem-card' }, 'Odds comparison skipped: no odds feed is connected. I can compare as soon as one is.'))));

    // Home / prompt chips deep-link here with ?q=...
    if (params.q) { history.replaceState(null, '', '#/assistant'); setTimeout(() => send(params.q), 150); }
    return root;
  },
};
