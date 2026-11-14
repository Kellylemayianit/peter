import { getApproval, decideApproval, setApprovalResult, addMessage } from './db.js';
import { toolByName } from './tools/index.js';
import { friendly } from './errors.js';

// Runs (or rejects) one pending approval. The stored input is what the person saw on the card:
// nothing the model says later can change it.
export async function decide(env, user, id, approve) {
  const a = await getApproval(env, user.id, id);
  if (!a) return { status: 404 };
  if (a.status !== 'pending') return { status: 409, error: 'That one was already answered.' };

  if (!approve) {
    await decideApproval(env, id, 'rejected');
    await addMessage(env, user.id, 'assistant', `(You said no to: ${a.preview.title}.)`);
    return { status: 200, body: { status: 'rejected', message: 'Okay, I left it alone.' } };
  }
  // Claim the approval first so a double tap cannot run it twice.
  if (!(await decideApproval(env, id, 'approved'))) return { status: 409, error: 'That one was already answered.' };
  try {
    const { message } = await toolByName(a.tool).run(env, user.id, a.input);
    await addMessage(env, user.id, 'assistant', `(Done: ${a.preview.title}. ${message})`);
    return { status: 200, body: { status: 'approved', message } };
  } catch (e) {
    await setApprovalResult(env, id, 'failed', friendly(e));
    return { status: 200, body: { status: 'failed', message: friendly(e) } };
  }
}
