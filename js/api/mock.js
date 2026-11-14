// Demo brain: scripted conversations with in-memory data, so the app works with no backend.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const state = { connections: { google: true, trello: true }, pending: [], memories: [{ id: 'm1', text: 'Prefers meetings after 10am' }], messages: [] };
let seq = 0;

const cards = {
  calendar: () => ({ kind: 'calendar', title: 'Move “Call with Nancy”', confirm: 'Yes, move it', lines: [{ label: 'From', value: 'Thu 2:00 pm' }, { label: 'To', value: 'Thu 4:30 pm' }] }),
  email: () => ({ kind: 'email', title: 'Send this email?', confirm: 'Send', lines: [{ label: 'To', value: 'nancy@example.com' }, { label: 'Subject', value: 'Moving our call' }], body: 'Hi Nancy, something came up at 2. Could we talk at 4:30 instead?' }),
  trello: () => ({ kind: 'trello', title: 'Add card “Call the supplier”', confirm: 'Add card', lines: [{ label: 'List', value: 'This week' }, { label: 'Due', value: 'Friday' }] }),
  memory: () => ({ kind: 'memory', title: 'Remember this?', confirm: 'Remember it', lines: [{ label: 'Becca will remember', value: 'You like short, direct answers' }] }),
};
const flows = [
  [/clash|move|calendar|week|plan|schedule/i, ['Reading your calendar', 'Looking for free time'], 'calendar', 'Habari Gibu. Tomorrow you have two things at 2 pm: Nancy’s call and the supplier visit. I can move the call to 4:30. It is waiting for your OK.'],
  [/inbox|email|mail|reply/i, ['Looking through your email', 'Reading an email'], 'email', 'Nancy wrote asking about Thursday. I drafted a reply for you. Have a look, then tell me to send it.'],
  [/trello|card|task|todo/i, ['Checking your Trello boards'], 'trello', 'I found your “This week” list and drafted a card. It is waiting for your OK.'],
  [/remember|prefer|always|never/i, [], 'memory', 'Good to know. Shall I keep that in mind?'],
];

export const mock = {
  demo: true,
  me: async () => ({ email: 'demo@becca.app', connections: { ...state.connections } }),
  history: async () => state.messages,
  pending: async () => state.pending.map(({ id, tool, status, preview }) => ({ id, tool, status, preview })),
  today: async () => ({ connected: state.connections.google, events: state.connections.google ? [
    { id: 'e1', title: 'Review plan with Moses', start: new Date().toISOString().slice(0, 10) + 'T09:00:00+03:00', end: '' },
    { id: 'e2', title: 'Call with Nancy', start: new Date().toISOString().slice(0, 10) + 'T14:00:00+03:00', end: '' },
    { id: 'e3', title: 'Supplier visit', start: new Date().toISOString().slice(0, 10) + 'T14:00:00+03:00', end: '' }] : [] }),
  memories: async () => [...state.memories],
  deleteMemory: async (id) => { state.memories = state.memories.filter((m) => m.id !== id); return { ok: true }; },
  connectTrello: async () => { state.connections.trello = true; return { ok: true }; },
  disconnect: async (app) => { state.connections[app] = false; return { ok: true }; },
  connectGoogle: async () => { state.connections.google = true; },
  logout: async () => {},
  async decide(id, approve) {
    await wait(500);
    const a = state.pending.find((p) => p.id === id);
    state.pending = state.pending.filter((p) => p.id !== id);
    if (!approve) return { status: 'rejected', message: 'Okay, I left it alone.' };
    if (a?.preview.kind === 'memory') state.memories.push({ id: 'm' + ++seq, text: a.preview.lines[0].value });
    return { status: 'approved', message: 'Done.' };
  },
  async chat(text, onEvent) {
    state.messages.push({ role: 'user', text });
    const flow = flows.find(([re]) => re.test(text));
    if (!flow) {
      await wait(600);
      const reply = 'I can look at your calendar and email, add Trello cards, and remember things for you. Try “Plan my week” or “Check my inbox”.';
      state.messages.push({ role: 'assistant', text: reply });
      return onEvent({ type: 'text', text: reply });
    }
    const [, steps, kind, reply] = flow;
    for (const [i, label] of steps.entries()) {
      onEvent({ type: 'step', id: 's' + i, label, state: 'running' }); await wait(850);
      onEvent({ type: 'step', id: 's' + i, label, state: 'done' });
    }
    const approval = { id: 'a' + ++seq, tool: kind, status: 'pending', preview: cards[kind]() };
    state.pending.push(approval);
    await wait(250);
    onEvent({ type: 'approval', approval });
    state.messages.push({ role: 'assistant', text: reply });
    onEvent({ type: 'text', text: reply });
  },
};
