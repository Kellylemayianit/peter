import { api } from '../api/index.js';
// Keep the "waiting for your OK" count in sync with the server.
export async function refreshPending(store) {
  try { store.set({ pending: await api.pending() }); } catch { /* keep the old list */ }
}
