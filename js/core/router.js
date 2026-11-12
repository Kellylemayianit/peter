// Hash router with lazy-loaded view modules.
//
// A view module's default export is:
//   { title, reactive?, render(ctx) -> Node }
// - reactive: true  => router re-renders the view whenever the store changes
// - ctx = { store, params, navigate, onDestroy(fn) }
// Each view is fetched with import() the first time it is visited (code splitting for free).

export function createRouter({ outlet, routes, store, fallback, onChange }) {
  const cache = new Map();
  let current = null; // { name, view, cleanups, unsub }
  let token = 0;

  const parse = () => {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, query = ''] = raw.split('?');
    return { name: routes[path] ? path : fallback, params: Object.fromEntries(new URLSearchParams(query)) };
  };

  const navigate = (to) => { location.hash = '#/' + to; };

  function teardown() {
    if (!current) return;
    current.unsub?.();
    current.cleanups.forEach(fn => fn());
    current = null;
  }

  async function go() {
    const mine = ++token;
    const { name, params } = parse();
    if (!cache.has(name)) cache.set(name, (await routes[name]()).default);
    if (mine !== token) return; // a newer navigation won the race

    teardown();
    const view = cache.get(name);
    const cleanups = [];
    const ctx = { store, params, navigate, onDestroy: fn => cleanups.push(fn) };
    const draw = () => { outlet.replaceChildren(view.render(ctx)); };

    draw();
    current = { name, view, cleanups, unsub: view.reactive ? store.subscribe(draw) : null };
    document.title = `${view.title} · Becca`;
    window.scrollTo(0, 0);
    onChange?.(name);
  }

  return {
    navigate,
    start() { addEventListener('hashchange', go); return go(); },
  };
}
