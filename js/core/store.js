// A ~30 line state container: get / set / subscribe, with optional localStorage persistence.
export function createStore(initial, { persistKey, persist = [] } = {}) {
  let state = { ...initial };
  const subs = new Set();

  if (persistKey) {
    try {
      const saved = JSON.parse(localStorage.getItem(persistKey) || '{}');
      for (const k of persist) if (k in saved) state[k] = saved[k];
    } catch { /* storage blocked or corrupt: fall back to defaults */ }
  }

  const save = () => {
    if (!persistKey) return;
    try {
      localStorage.setItem(persistKey, JSON.stringify(Object.fromEntries(persist.map(k => [k, state[k]]))));
    } catch { /* ignore */ }
  };

  return {
    get: () => state,
    // set accepts a patch object or an updater (state) => patch
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      save();
      subs.forEach(fn => fn(state));
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    reset() {
      if (persistKey) try { localStorage.removeItem(persistKey); } catch {}
      state = { ...initial };
      subs.forEach(fn => fn(state));
    },
  };
}
