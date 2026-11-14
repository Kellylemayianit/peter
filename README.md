# Becca

A personal assistant you talk to. It reads your calendar and email, drafts things, adds Trello cards and
remembers what you tell it. **Anything that changes something waits for your OK.**

    web/   the app (vanilla JS modules, no build step)
    api/   one Cloudflare Worker: sign-in, assistant, Google + Trello tools, approvals

## Try it in 10 seconds (no accounts)
    cd web && python3 -m http.server 8000      # open http://localhost:8000  (demo mode, scripted replies)

## Try the real wiring (no accounts)
    cd api && node test/devserver.mjs          # open http://localhost:8787/dev-login
Runs the real Worker code with a throwaway database and fake Google + AI.

## Tests
    cd api && node test/run.mjs                # 19 checks (needs Node 22)

## Deploy
1. **Google Cloud Console**: create a project, turn on the Gmail API and Google Calendar API, create an
   OAuth client (Web). Authorised redirect URI: `https://YOUR-WORKER-URL/api/auth/google/callback`
   (and `http://localhost:8787/api/auth/google/callback` for `wrangler dev`).
2. `cd api && npm install`
3. `npx wrangler d1 create becca` and paste the id into `wrangler.toml`
4. `npx wrangler d1 execute becca --remote --file=schema.sql`
5. Set `ALLOWED_EMAILS` in `wrangler.toml` to your Google address (only these accounts can sign in).
6. Secrets, one at a time: `npx wrangler secret put GOOGLE_CLIENT_ID` (also GOOGLE_CLIENT_SECRET,
   SESSION_SECRET, TOKEN_KEY, ANTHROPIC_API_KEY). Make SESSION_SECRET and TOKEN_KEY with `openssl rand -base64 32`.
7. `npx wrangler deploy`

## How a request flows
You message Becca -> the Worker checks your sign-in -> asks the AI what to do -> the AI uses read tools
(calendar, Gmail, Trello) -> anything that changes things is saved as a pending approval -> you tap Yes ->
only then does the stored, exact action run.

## Safety rules built in
- Writes (send email, move/add events, add cards, remember) never run from chat. Only your tap runs them,
  and what runs is exactly what the card showed.
- Email text is treated as data. Even a tricked AI can only ask; you still have to approve.
- Google/Trello tokens are encrypted in the database (AES-GCM). Sessions are signed cookies.
- Only emails in ALLOWED_EMAILS can sign in. POSTs need a custom header (cross-site protection).

## Not built yet / not verified
- **Web browsing** is not built. The Apps page says "Coming next".
- **Approvals live in D1**, not a Durable Object (simpler; the same guarantees for one person).
- Not verified here: `wrangler deploy` and the `[assets]` config, real Google/Trello/Anthropic calls, and
  the Google sign-in screen. Tests use fakes for all of those.
- Google keeps unverified apps in "testing" mode, where sign-in may need repeating about weekly. Gmail scopes
  are restricted: fine for just you, but other people means Google's review.
- No rate limiting yet. Add one before sharing the URL.
