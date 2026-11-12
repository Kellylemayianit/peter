import { h } from './core/dom.js';
import { createStore } from './core/store.js';
import { createRouter } from './core/router.js';
import { initialState } from './data/mock.js';
import { mountIconSprite } from './components/icons.js';
import { sidebar, tabbar } from './components/sidebar.js';

// 1. State. Only theme + accent survive a refresh (everything else is demo data).
const store = createStore(initialState, { persistKey: 'becca:v1', persist: ['theme', 'accent'] });

// 2. Lazy routes. Each view is its own module, fetched on first visit.
const routes = {
  home: () => import('./views/home.js'),
  assistant: () => import('./views/assistant.js'),
  football: () => import('./views/football.js'),
  decisions: () => import('./views/decisions.js'),
  memory: () => import('./views/memory.js'),
  workspace: () => import('./views/workspace.js'),
  settings: () => import('./views/settings.js'),
  developer: () => import('./views/developer.js'),
};

// 3. App shell: persistent chrome around a swappable <main>.
const app = document.getElementById('app');
const sidebarSlot = h('div', { style: { display: 'contents' } });
const tabSlot = h('div', { style: { display: 'contents' } });
const outlet = h('main', { class: 'main', id: 'view' });
app.append(h('div', { class: 'shell' }, sidebarSlot, outlet), tabSlot);
mountIconSprite(app);

let active = 'home';
const paintChrome = () => {
  sidebarSlot.replaceChildren(sidebar(active, store.get()));
  tabSlot.replaceChildren(tabbar(active));
};
const applyTheme = ({ theme, accent }) => {
  app.dataset.theme = theme;
  app.style.setProperty('--accent', accent);
};

applyTheme(store.get());
store.subscribe((s) => { applyTheme(s); paintChrome(); });

const router = createRouter({
  outlet, routes, store, fallback: 'home',
  onChange: (name) => { active = name; paintChrome(); },
});
router.start();

// ⌘K / Ctrl+K focuses the search field of whichever view is showing.
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    document.querySelector('.topbar .search input')?.focus();
  }
});
