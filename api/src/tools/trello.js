import { getConnection } from '../db.js';
import { decryptJson } from '../crypto.js';
import { NotConnected, UserError } from '../errors.js';

const BASE = 'https://api.trello.com/1';
const hex24 = (v, what) => { if (!/^[0-9a-f]{24}$/.test(String(v || ''))) throw new UserError(`I got a bad ${what}. Let me look again.`); return v; };

async function t(env, userId, path, params = {}, method = 'GET') {
  const row = await getConnection(env, userId, 'trello');
  if (!row) throw new NotConnected('trello');
  const { key, token } = await decryptJson(env, row.data_enc);
  const res = await fetch(`${BASE}${path}?${new URLSearchParams({ ...params, key, token })}`, { method });
  if (res.status === 401) throw new NotConnected('trello', 'expired');
  if (!res.ok) throw new UserError('Trello would not do that. The board or list may have changed.');
  return res.json();
}

export const trelloTools = [
  {
    name: 'trello_list_boards', label: () => 'Checking your Trello boards',
    description: 'List open Trello boards.', input_schema: { type: 'object', properties: {} },
    run: async (env, u) => (await t(env, u, '/members/me/boards', { fields: 'name', filter: 'open' })).map((b) => ({ id: b.id, name: b.name })),
  },
  {
    name: 'trello_list_cards', label: () => 'Looking at a Trello board',
    description: 'List the lists and open cards on a board.',
    input_schema: { type: 'object', properties: { board_id: { type: 'string' } }, required: ['board_id'] },
    async run(env, u, i) {
      const lists = await t(env, u, `/boards/${hex24(i.board_id, 'board')}/lists`, { cards: 'open', card_fields: 'name,due', fields: 'name' });
      return lists.map((l) => ({ list_id: l.id, list: l.name, cards: l.cards.map((c) => ({ name: c.name, due: c.due || undefined })) }));
    },
  },
  {
    name: 'trello_create_card', write: true, label: () => 'Preparing a Trello card',
    description: 'Create a Trello card in a list. The person must approve before it happens.',
    input_schema: { type: 'object', properties: { list_id: { type: 'string' }, list_name: { type: 'string' }, name: { type: 'string' }, notes: { type: 'string' }, due: { type: 'string' } }, required: ['list_id', 'name'] },
    async preview(env, u, i) {
      hex24(i.list_id, 'list');
      return { kind: 'trello', title: `Add card “${i.name}”`, confirm: 'Add card', lines: [{ label: 'List', value: i.list_name || 'chosen list' }, ...(i.due ? [{ label: 'Due', value: i.due.slice(0, 10) }] : [])], body: i.notes };
    },
    async run(env, u, i) {
      await t(env, u, '/cards', { idList: hex24(i.list_id, 'list'), name: i.name, desc: i.notes || '', ...(i.due ? { due: i.due } : {}) }, 'POST');
      return { message: `Added “${i.name}” to Trello.` };
    },
  },
];
