import { real, SignedOut } from './real.js';
import { mock } from './mock.js';
export { SignedOut };

// One object the whole app imports. boot() fills it with the real or the demo implementation.
export const api = {};

// Real backend if it answers with JSON (even a 401 means "backend is there"); otherwise demo mode.
export async function boot() {
  let impl = mock;
  if (!/[?&]demo\b/.test(location.search)) {
    try {
      const res = await fetch('/api/me', { headers: { 'x-requested-with': 'becca' }, credentials: 'same-origin' });
      if ((res.headers.get('content-type') || '').includes('json')) impl = real;
    } catch { /* no backend: demo */ }
  }
  Object.assign(api, impl);
  return impl.demo;
}
