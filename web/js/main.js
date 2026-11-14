import { h } from './core/dom.js';
import { createStore } from './core/store.js';
import { createRouter } from './core/router.js';
import { refreshPending } from './core/state.js';
import { api, boot, SignedOut } from './api/index.js';
import { sidebar, tabbar } from './components/shell.js';

const app = document.getElementById('app');

function signIn(reason) {
  const msg = { notallowed: 'That Google account is not allowed to use this Becca.', failed: 'Sign-in did not work. Please try again.' }[reason];
  app.replaceChildren(h('main', { class: 'center' }, h('section', { class: 'card signin' },
    h('div', { class: 'logo', style: { margin: '0 auto', width: '48px', height: '48px', fontSize: '22px' } }, 'B'),
    h('h1', { style: { fontSize: '24px' } }, 'Meet Becca'),
    h('p', { class: 'muted' }, 'Your personal assistant. Sign in with Google to begin.'),
    msg ? h('p', { class: 'status bad', role: 'alert' }, msg) : null,
    h('button', { class: 'btn pri', type: 'button', onClick: () => api.connectGoogle() }, 'Sign in with Google'))));
}

async function start() {
  const demo = await boot();
  let me;
  try { me = await api.me(); }
  catch (e) { return e instanceof SignedOut ? signIn(new URLSearchParams(location.search).get('signin')) : signIn('failed'); }

  const store = createStore({ demo, conns: me.connections, pending: [] });
  const routes = {
    chat: () => import('./views/chat.js'),
    today: () => import('./views/today.js'),
    apps: () => import('./views/apps.js'),
    memory: () => import('./views/memory.js'),
  };

  const side = h('div', { style: { display: 'contents' } });
  const tabs = h('div', { style: { display: 'contents' } });
  const outlet = h('main', { class: 'main' });
  app.replaceChildren(h('div', { class: 'shell' }, side, outlet), tabs);

  let active = 'chat';
  const chrome = () => { side.replaceChildren(sidebar(active, store.get())); tabs.replaceChildren(tabbar(active, store.get())); };
  store.subscribe(chrome);

  const router = createRouter({ outlet, routes, store, fallback: 'chat', onChange: (name) => { active = name; chrome(); } });
  await refreshPending(store);
  router.start();
}

start();
