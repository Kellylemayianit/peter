// Business logic lives here, not in views. Views call these; these call store.set().
const patchById = (list, id, patch) => list.map(x => (x.id === id ? { ...x, ...patch } : x));

export const actions = (store) => ({
  setApproval: (id, status) => store.set(s => ({ approvals: patchById(s.approvals, id, { status }) })),
  lockPrediction: () => store.set({ predictionLocked: true }),
  logOutcome: (id) => store.set(s => ({ decisions: patchById(s.decisions, id, { needsOutcome: false }) })),
  saveMemory: (id) => store.set(s => ({ memories: patchById(s.memories, id, { status: 'saved' }) })),
  dismissMemory: (id) => store.set(s => ({ memories: s.memories.filter(m => m.id !== id) })),
  setTheme: (theme) => store.set({ theme }),
  setAccent: (accent) => store.set({ accent }),
  addMessage: (m) => store.set(s => ({ messages: [...s.messages, m] })),
});

export const countWord = (n) => ['No', 'One', 'Two', 'Three', 'Four', 'Five'][n] ?? String(n);
