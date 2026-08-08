# 5cents-intelligence-public

Public site for 5cents-intelligence.com. Everything that serves the live
domain lives in this repo and this repo alone — there is no other repo or
Vercel project behind 5cents-intelligence.com. If you're about to build a
new gated page, put it here, not in a standalone project.

## Contents
- index.html: primary teaser page
- logo.svg: Orbit Nickel Minimal mark
- sunrise.html: secondary sunrise-only page (also served at /tree)
- sunrise.png: sunrise image asset
- investments.html + api/investments-auth.js + api/investments-content.js: passcode-gated `/investments` page
- ai-assist.html + api/ai-assist-process.js + robot.png: passphrase-gated `/ai-assist` page (note-to-next-action tool, calls the Anthropic API)
- package.json: dependencies for the serverless functions above (currently just `@anthropic-ai/sdk`, used by `api/ai-assist-process.js`)
- vercel.json: rewrite/header configuration mapping clean URLs (`/tree`, `/investments`, `/ai-assist`) to their HTML files, plus the catch-all that serves index.html for everything else

## Deploy
1. Import this repository into Vercel.
2. Framework preset: Other.
3. Build command: empty.
4. Output directory: empty.
5. Add domains: 5cents-intelligence.com and www.5cents-intelligence.com.
6. Git integration auto-deploys on every push to `main` — no manual `vercel --prod` needed (unlike some other projects in this workspace).

## Access-gating patterns used here

Two different patterns exist for gating a page behind a shared secret. Pick
based on how much you need to protect and how you're already reading the
existing code before adding a third variant.

### Pattern A — signed session cookie (`/investments`)
- User submits a passcode via a form POST to `api/investments-auth.js`.
- Server compares it to `INVESTMENTS_PASSCODE` using `crypto.timingSafeEqual` (constant-time, so response timing can't leak the correct value).
- On success, the server issues an `HttpOnly`, `Secure`, `SameSite=Strict` cookie: `expiresAt.HMAC(expiresAt, INVESTMENTS_SESSION_SECRET)`, valid 12 hours.
- `api/investments-content.js` re-verifies that cookie/signature server-side before returning the gated content.
- Stronger: the secret never touches client-side JS or `localStorage`, the cookie can't be read or forged by page scripts, and the comparison is timing-safe.
- Required env vars: `INVESTMENTS_PASSCODE`, `INVESTMENTS_SESSION_SECRET`.

### Pattern B — client-stored header secret (`/ai-assist`)
- `ai-assist.html` prompts for a passphrase with `window.prompt()` and stores it in `localStorage`.
- Every API call sends it back as a custom header (`X-AI-Assist-Secret`), and `api/ai-assist-process.js` does a plain `===` comparison against `AI_ASSIST_SECRET`.
- A `401` response clears the stored passphrase client-side and re-prompts.
- Weaker: the secret sits in `localStorage` (readable by any script on the page) and the comparison isn't timing-safe. Acceptable for a low-stakes personal tool; **do not** reuse this pattern for anything more sensitive than `/investments` without upgrading to Pattern A.
- Required env vars: `AI_ASSIST_SECRET` (plus `ANTHROPIC_API_KEY` for the Claude call itself).

Both patterns' secrets are set via `vercel env add <NAME> production --sensitive` (or the Vercel dashboard) on this project — never committed to the repo.
