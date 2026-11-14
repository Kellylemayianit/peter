import { calendarTools, gmailTools } from './google.js';
import { trelloTools } from './trello.js';
import { addMemory, listMemories } from '../db.js';
import { randomId } from '../crypto.js';
import { UserError } from '../errors.js';

const memoryTool = {
  name: 'remember', write: true, label: () => 'Thinking about what to remember',
  description: 'Propose a lasting fact about the person. It is only saved if they say yes. Use sparingly, for stable preferences.',
  input_schema: { type: 'object', properties: { text: { type: 'string', description: 'One short sentence' } }, required: ['text'] },
  preview: async (env, u, i) => ({ kind: 'memory', title: 'Remember this?', confirm: 'Remember it', lines: [{ label: 'Becca will remember', value: String(i.text).slice(0, 200) }] }),
  async run(env, u, i) {
    if ((await listMemories(env, u)).length >= 100) throw new UserError('I am already holding 100 memories. Delete a few first.');
    await addMemory(env, u, randomId(), String(i.text).slice(0, 200));
    return { message: 'Saved. I will remember that.' };
  },
};

export const TOOLS = [...calendarTools, ...gmailTools, ...trelloTools, memoryTool];
export const toolByName = (n) => TOOLS.find((t) => t.name === n);
export const modelTools = () => TOOLS.map(({ name, description, input_schema }) => ({ name, description, input_schema }));
