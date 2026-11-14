import { html } from '../core/dom.js';
const P = {
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
  today: '<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
  apps: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  memory: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
};
export const icon = (name) => html(`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[name]}</svg>`);
