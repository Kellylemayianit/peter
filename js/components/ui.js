import { h } from '../core/dom.js';
import { icon } from './icons.js';

export const chip = (text, { on = false, color, iconName } = {}) =>
  h('span', { class: 'chip' + (on ? ' on' : ''), style: color ? { color } : null },
    iconName && icon(iconName, 14), text);

export const btn = (text, { primary = false, sm = true, iconName, onClick, label } = {}) =>
  h('button', { class: `btn${primary ? ' primary' : ''}${sm ? ' sm' : ''}`, type: 'button', 'aria-label': label, onClick },
    iconName && icon(iconName, 16), text);

export const sectionTitle = (text, iconName) =>
  h('h2', { class: 'row', style: { gap: '10px', fontSize: '17px', fontWeight: 700 } },
    iconName && icon(iconName), text);

export const card = (props = {}, ...kids) =>
  h('section', { ...props, class: 'card ' + (props.class || '') }, ...kids);
