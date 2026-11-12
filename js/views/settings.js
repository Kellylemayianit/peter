import { h } from '../core/dom.js';
import { card } from '../components/ui.js';
import { topbar } from '../components/topbar.js';
import { actions } from '../core/actions.js';

const ACCENTS = [['#F5A524', 'Amber'], ['#3DD6A5', 'Mint'], ['#8B9BFF', 'Periwinkle'], ['#FF7B88', 'Coral']];

export default {
  title: 'Settings',
  reactive: true,
  render({ store }) {
    const act = actions(store);
    const { theme, accent } = store.get();
    const pill = (label, on, onClick) => h('button', { class: 'chip' + (on ? ' on' : ''), type: 'button', 'aria-pressed': String(on), style: { minHeight: '36px', padding: '0 14px', fontSize: '13px' }, onClick }, label);
    return h('div', { class: 'page' },
      topbar('Settings'),
      card({ style: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' } },
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('span', { class: 'label' }, 'Theme'),
          h('div', { class: 'row', style: { gap: '8px' } }, ['dark', 'light'].map(t => pill(t[0].toUpperCase() + t.slice(1), theme === t, () => act.setTheme(t))))),
        h('div', { class: 'stack', style: { gap: '10px' } },
          h('span', { class: 'label' }, 'Accent'),
          h('div', { class: 'row', style: { gap: '12px' } }, ACCENTS.map(([hex, name]) =>
            h('button', { type: 'button', 'aria-label': name, 'aria-pressed': String(accent === hex), onClick: () => act.setAccent(hex),
              style: { width: '44px', height: '44px', borderRadius: '12px', background: hex, cursor: 'pointer', border: accent === hex ? '3px solid var(--text)' : '3px solid transparent' } }))))));
  },
};
