import { h } from '../core/dom.js';

// The "Becca is working" strip: live steps while Becca does things for you.
export function workStrip() {
  const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } });
  const el = h('section', { class: 'card work', 'aria-live': 'polite' },
    h('div', { class: 'work-title' }, h('span', { class: 'pulse' }), 'Becca is working'),
    list, h('div', { class: 'bar' }, h('i')));
  const rows = new Map();
  let hideTimer;

  function row(id, label, state) {
    const mark = state === 'running' ? h('span', { class: 'spin' }) : h('span', { class: 'tick' + (state === 'failed' ? ' failed' : '') }, state === 'failed' ? '!' : '✓');
    const next = h('div', { class: 'step' + (state === 'running' ? '' : ' done') }, mark, h('span', {}, label));
    if (rows.has(id)) rows.get(id).replaceWith(next); else list.append(next);
    rows.set(id, next);
  }

  return {
    el,
    begin() {
      clearTimeout(hideTimer); rows.clear(); list.replaceChildren();
      row('think', 'Thinking…', 'running'); el.classList.add('on');
    },
    update({ id, label, state }) {
      if (rows.has('think')) { rows.get('think').remove(); rows.delete('think'); }
      row(id, label, state);
    },
    end() { hideTimer = setTimeout(() => el.classList.remove('on'), 700); },
  };
}
