import { html } from '../core/dom.js';

const PATHS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 8l3.5 2.5-1.3 4H9.8l-1.3-4z M12 8V3 M15.5 10.5l4.6-1.5 M14.2 14.5l2.8 3.8 M9.8 14.5L7 18.3 M8.5 10.5L3.9 9"/>',
  scale: '<path d="M12 3v18 M5 21h14 M5 7h14 M5 7l-3 7a3 3 0 0 0 6 0z M19 7l-3 7a3 3 0 0 0 6 0z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z M3 13l9 5 9-5"/>',
  grid: '<path d="M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z"/>',
  sliders: '<path d="M4 6h10 M18 6h2 M4 12h4 M12 12h8 M4 18h12 M20 18h0 M14 4v4 M8 10v4 M16 16v4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7 M10 20a2 2 0 0 0 4 0"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3"/>',
  send: '<path d="M22 2L11 13 M22 2l-7 20-4-9-9-4z"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  alert: '<path d="M12 3l10 18H2z M12 10v5 M12 18h0.01"/>',
  spark: '<path d="M12 3v5 M12 16v5 M3 12h5 M16 12h5 M6 6l3 3 M15 15l3 3 M18 6l-3 3 M9 15l-3 3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<path d="M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4"/>',
  code: '<path d="M8 8l-4 4 4 4 M16 8l4 4-4 4"/>',
  arrow: '<path d="M5 12h14 M13 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12 M18 6L6 18"/>',
};

// One hidden sprite in the page; icon() just points <use> at it.
export function mountIconSprite(parent) {
  const symbols = Object.entries(PATHS)
    .map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${d}</symbol>`).join('');
  parent.append(html(`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${symbols}</defs></svg>`));
}

export function icon(name, size) {
  const el = html(`<svg class="ic" aria-hidden="true"><use href="#i-${name}"/></svg>`);
  if (size) { el.style.width = el.style.height = size + 'px'; }
  return el;
}
