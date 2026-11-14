// Every database query lives here so the rest of the code never writes SQL.
const now = () => Date.now();
const q = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);

export async function upsertUser(env, email, id) {
  const found = await q(env, 'SELECT id, email FROM users WHERE email = ?', email).first();
  if (found) return found;
  await q(env, 'INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)', id, email, now()).run();
  return { id, email };
}
export const getUser = (env, id) => q(env, 'SELECT id, email FROM users WHERE id = ?', id).first();

export const getConnection = (env, userId, provider) =>
  q(env, 'SELECT data_enc FROM connections WHERE user_id = ? AND provider = ?', userId, provider).first();
export const saveConnection = (env, userId, provider, dataEnc) =>
  q(env, `INSERT INTO connections (user_id, provider, data_enc, updated_at) VALUES (?, ?, ?, ?)
          ON CONFLICT (user_id, provider) DO UPDATE SET data_enc = excluded.data_enc, updated_at = excluded.updated_at`,
    userId, provider, dataEnc, now()).run();
export const deleteConnection = (env, userId, provider) =>
  q(env, 'DELETE FROM connections WHERE user_id = ? AND provider = ?', userId, provider).run();
export async function listConnections(env, userId) {
  const { results } = await q(env, 'SELECT provider FROM connections WHERE user_id = ?', userId).all();
  return Object.fromEntries(results.map((r) => [r.provider, true]));
}

export const addMessage = (env, userId, role, text) =>
  q(env, 'INSERT INTO messages (user_id, role, text, created_at) VALUES (?, ?, ?, ?)', userId, role, text, now()).run();
export async function recentMessages(env, userId, limit = 20) {
  const { results } = await q(env, 'SELECT id, role, text FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT ?', userId, limit).all();
  return results.reverse();
}

export const createApproval = (env, a) =>
  q(env, `INSERT INTO approvals (id, user_id, tool, input, preview, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    a.id, a.userId, a.tool, JSON.stringify(a.input), JSON.stringify(a.preview), now()).run();
const hydrate = (r) => r && { ...r, input: JSON.parse(r.input), preview: JSON.parse(r.preview) };
export async function getApproval(env, userId, id) {
  return hydrate(await q(env, 'SELECT * FROM approvals WHERE id = ? AND user_id = ?', id, userId).first());
}
export async function pendingApprovals(env, userId) {
  const { results } = await q(env, `SELECT * FROM approvals WHERE user_id = ? AND status = 'pending' ORDER BY created_at`, userId).all();
  return results.map(hydrate);
}
// The WHERE status='pending' makes a double-tap safe: the second decision changes nothing.
export async function decideApproval(env, id, status, result) {
  const r = await q(env, `UPDATE approvals SET status = ?, result = ?, decided_at = ? WHERE id = ? AND status = 'pending'`,
    status, result ?? null, now(), id).run();
  return (r.meta?.changes ?? r.changes ?? 0) > 0;
}

export const setApprovalResult = (env, id, status, result) =>
  q(env, 'UPDATE approvals SET status = ?, result = ? WHERE id = ?', status, result, id).run();

export async function listMemories(env, userId) {
  const { results } = await q(env, 'SELECT id, text FROM memories WHERE user_id = ? ORDER BY created_at', userId).all();
  return results;
}
export const addMemory = (env, userId, id, text) =>
  q(env, 'INSERT INTO memories (id, user_id, text, created_at) VALUES (?, ?, ?, ?)', id, userId, text, now()).run();
export const deleteMemory = (env, userId, id) =>
  q(env, 'DELETE FROM memories WHERE id = ? AND user_id = ?', id, userId).run();
