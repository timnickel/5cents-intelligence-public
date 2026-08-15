# Changelog

All notable changes to this repository should be recorded in this file.

## [Unreleased]

### 2026.08.15.2.0
- `/sump-pump`'s "time since last run" counter now shows millisecond precision and ticks ~20x/sec instead of once a second.
- Added a "Reset counter" button to `/sump-pump` that clears all logged runs (confirm dialog, then a bulk `DELETE ?all=1` against `api/sump-pump-data.js`).

### 2026.08.15.1.0
- Added `/sump-pump`, a passphrase-gated page to log sump pump runs: a live "time since last run" counter, a log button, and a history list showing each run's timestamp and the gap since the previous one.
- Added `api/sump-pump-data.js` (GET/POST/DELETE, same `AI_ASSIST_SECRET` header auth as `api/ai-assist-bot-store.js`), storing one Vercel Blob per run under `sump-pump/*.json`.

### 2026.08.14.2.0
- `/ai-assist`'s local "Threads" list now shows only the 3 most recently updated threads by default, with a "Show N more" / "Show less" toggle to reveal the rest — "Saved to bot" is unaffected.

### 2026.08.14.1.0
- Added memory export to `/ai-assist` (export the current thread) and `/frogger` (export every saved thread), with checkboxes for memory summary / full transcript, an optional free-text field describing the desired formatting, and a choice of file type (txt, md, json, csv).
- Added `api/memory-export.js`: for `txt`/`md` it sends the selected thread data plus the user's formatting instructions to Claude and returns the formatted file content; for `json`/`csv` it serializes deterministically without a model call, so those formats always stay valid regardless of instructions.

### 2026.08.12.2.0
- Added a link from `/ai-assist`'s "Saved to bot" section to `/frogger` ("🐸 Curious about this data? See stats & charts on it in Frogger").

### 2026.08.12.1.0
- Added `/frogger`, an experimental passphrase-gated data explorer over the threads saved to bots from `/ai-assist`: an about blurb, KPI tiles (saved threads, distinct bots, total messages, avg. turns/thread, avg. memory length, most active bot), three bar charts (threads saved per day, threads per bot, conversation length distribution), a random-thread spotlight, and a full sortable/expandable thread table with transcripts.
- Added `api/frogger-data.js`, a read-only endpoint (same `AI_ASSIST_SECRET` header auth as `api/ai-assist-bot-store.js`) that lists and returns every `bot-threads/*.json` blob in full — no new blob prefix, no writes, no changes to the existing bot-store endpoint.
- `/frogger` reuses the `/ai-assist` passphrase and `localStorage` key rather than introducing a second secret (see `README.md`).

### 2026.08.09.4.0
- Added a "🧪 Coming soon" preview section to `/ai-assist` announcing two upcoming features with non-functional mockups: a persistent "None of the above" option pill, and a "predicted future steps" forking roadmap (root action branching into 3 example paths, each with 3 example steps, animated in on scroll via `IntersectionObserver`). Purely decorative — no click handlers, no backing logic.

### 2026.08.09.3.0
- Replaced the default "Frogger" bot name with a first-run naming modal (frog mascot image, name input, contact email) since multiple people use this tool and shouldn't all default to the same bot name. Same modal is reused for renaming later.

### 2026.08.09.2.0
- Saved-to-bot threads now record which bot name they were saved under (`botName`, snapshotted at save time) instead of relying on a single implicit bot, and the "Saved to \<bot\>" list surfaces it.

### 2026.08.09.1.0
- Fixed `api/ai-assist-bot-store.js` to work with a private-access Vercel Blob store: writes now use `access:"private"`, and reads use the SDK's `get()` (by pathname) instead of a plain `fetch(blob.url)`, which would have failed against a private store.
- Added the frog-themed bot to AI Assist: state-driven mascot (`frog-idle/thinking/happy/alert.png`, cropped from `four-frogs.png`), an editable bot name, and an opt-in "Save to bot" per thread backed by `api/ai-assist-bot-store.js` (Vercel Blob), alongside the existing local-only autosave.

### 2026.08.08.2.0
- Moved the Debug Log into a sticky right-hand column next to the main card (stacks below on narrow screens) and added a Copy button.
- `/api/ai-assist-process` now returns the real failure reason (`details`, `status`, `type`) instead of a generic "Processing failed" message, plus an explicit check for a missing `ANTHROPIC_API_KEY`, surfaced in both the result box and the debug log.

### 2026.08.08.1.0
- Added an always-visible Debug Log card to `/ai-assist` that shows the full outgoing request (headers, body) and incoming response (status, headers, raw body) for each `/api/ai-assist-process` call, plus a Clear button, to help troubleshoot passphrase/auth issues.

### 2026.08.07.1.0
- Added a passcode-free, passphrase-header-gated `/ai-assist` page (`ai-assist.html`, `api/ai-assist-process.js`), ported over from the standalone `ai-assist` project/repo so it deploys under the main `5cents-intelligence.com` domain instead of its own separate Vercel project.
- Added a glowing, floating circular robot mascot (`robot.png`) above the AI Assist title.
- Requires `ANTHROPIC_API_KEY` and `AI_ASSIST_SECRET` environment variables on this Vercel project (`AI_ASSIST_SECRET` regenerated fresh rather than copied, since the old value couldn't be safely read out of the previous project's environment).
- Documented this repo's structure and its two access-gating patterns (`/investments`'s signed-cookie pattern vs. `/ai-assist`'s client-stored header-secret pattern) in `README.md`, as a reference for adding future gated pages.
