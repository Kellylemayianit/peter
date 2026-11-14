import { h } from '../core/dom.js';
import { api, SignedOut } from '../api/index.js';
import { refreshPending } from '../core/state.js';
import { icon } from '../components/icons.js';
import { approvalCard } from '../components/approvalCard.js';
import { workStrip } from '../components/workStrip.js';

const CHIPS = ['Plan my week', 'Check my inbox', 'Add to Trello'];
const WELCOME = 'Habari! I’m Becca. Tell me what you need and I’ll sort it out. I always ask before I change anything.';

export default {
  title: 'Chat',
  reactive: false, // the chat updates its own DOM, so typing and scroll are never lost
  render({ store }) {
    const s = store.get();
    const log = h('div', { class: 'log', role: 'log', 'aria-live': 'polite' });
    const strip = workStrip();
    let busy = false;

    const toEnd = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    const add = (node) => { log.append(node); toEnd(); return node; };
    const say = (text, cls = '') => add(h('p', { class: `msg ${cls}` }, text));

    async function send(text) {
      text = text.trim();
      if (!text || busy) return;
      busy = true; input.value = ''; input.disabled = true; go.disabled = true;
      say(text, 'me'); strip.begin();
      try {
        await api.chat(text, (ev) => {
          if (ev.type === 'step') strip.update(ev);
          else if (ev.type === 'approval') { add(approvalCard(ev.approval, store)); refreshPending(store); }
          else if (ev.type === 'text') say(ev.text);
          else if (ev.type === 'error') say(ev.message, 'err');
        });
      } catch (e) {
        if (e instanceof SignedOut) return location.reload();
        say(e.message || 'Something went wrong. Please try again.', 'err');
      } finally {
        strip.end(); busy = false; input.disabled = false; go.disabled = false; input.focus();
      }
    }

    const input = h('input', { 'aria-label': 'Message Becca', placeholder: 'Tell Becca what you need…', autocomplete: 'off', enterkeyhint: 'send',
      onKeydown: (e) => { if (e.key === 'Enter') send(input.value); } });
    const go = h('button', { class: 'btn pri send', type: 'button', 'aria-label': 'Send', onClick: () => send(input.value) }, icon('send'));

    // Earlier conversation, then anything still waiting for a yes.
    (async () => {
      try {
        const [past, pending] = await Promise.all([api.history(), api.pending()]);
        if (!past.length) say(WELCOME);
        past.forEach((m) => {
          // The server saves "(Done: ...)" notes so Becca remembers outcomes; show them as quiet status lines.
          if (m.role === 'assistant' && /^\(.*\)$/s.test(m.text)) say('✓ ' + m.text.slice(1, -1).replace(/^(Done: |You said no to: )/, ''), 'note');
          else say(m.text, m.role === 'user' ? 'me' : '');
        });
        pending.forEach((a) => log.append(approvalCard(a, store)));
        window.scrollTo(0, document.body.scrollHeight);
      } catch (e) { if (e instanceof SignedOut) location.reload(); else say(WELCOME); }
    })();

    const dot = (name, on) => h('span', {}, h('i', { class: 'dot' + (on ? '' : ' off') }), name);
    return h('div', { class: 'chat' },
      h('header', { class: 'chat-head' },
        h('div', { class: 'logo' }, 'B'),
        h('div', { style: { flex: '1', minWidth: 0 } },
          h('div', { style: { fontWeight: '700' } }, 'Becca'),
          h('div', { class: 'dots' }, dot('Calendar & Gmail', s.conns.google), dot('Trello', s.conns.trello))),
        s.demo ? h('span', { class: 'chip demo' }, 'Demo') : null),
      strip.el, log,
      h('div', { class: 'composer' },
        h('div', { class: 'chips' }, CHIPS.map((c) => h('button', { class: 'chip', type: 'button', onClick: () => send(c) }, c))),
        h('div', { class: 'field' }, input, go)));
  },
};
