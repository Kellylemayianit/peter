// STUB assistant. Swap `replyFor` for a fetch() to your backend (e.g. POST /api/chat)
// and keep the same return shape: { text }.
import { fixtures } from './mock.js';

export function replyFor(text, mode, state) {
  const t = text.toLowerCase();
  const kind = mode !== 'Auto' ? mode.toLowerCase()
    : /predict|fixture|match|arsenal|chelsea|football|madrid|liverpool/.test(t) ? 'football'
    : /decision|decide|pivot|hire|quit/.test(t) ? 'decision'
    : /remember|memory|memories/.test(t) ? 'memory'
    : /draft|reply|email|message/.test(t) ? 'draft' : 'other';

  if (kind === 'football') {
    const ok = fixtures.filter(f => f.verified);
    const bad = fixtures.filter(f => !f.verified);
    return { text: `${ok.length} fixtures are verified: ${ok.map(f => `${f.home} vs ${f.away} (${f.probs.home}/${f.probs.draw}/${f.probs.away})`).join(', ')}. ` +
      (bad.length ? `${bad.map(f => `${f.home} vs ${f.away}`).join(', ')} is not in the fixture feed, so I withheld it.` : '') };
  }
  if (kind === 'decision') {
    const open = state.decisions.filter(d => d.needsOutcome);
    return { text: `You have ${state.decisions.length} open decisions. ` +
      (open.length ? `${open.map(d => d.title).join(', ')} has no outcome logged yet.` : 'All of them have outcomes logged.') };
  }
  if (kind === 'memory') {
    const n = state.memories.filter(m => m.status === 'proposed').length;
    return { text: `${n} proposed memories are waiting for review. I only keep what you save.` };
  }
  if (kind === 'draft') return { text: 'Drafts stay drafts until you approve them. Nothing is sent from here.' };
  return { text: 'I can help with predictions, decisions, drafts and memory. This build runs on demo data, so connect a backend to get real answers.' };
}
