# Frogger — AI Assist Data Explorer

Originally scoped as a brief for a standalone project; built in-repo instead
(see decision note below). This file now documents what exists, in the same
spirit as `PROJECT-SETUP-SUMMARY.md`.

## What it is

A gated page at `/frogger` (`frogger.html` + `api/frogger-data.js`) with two
parts:

1. **About blurb** — a few sentences explaining what `/ai-assist` is, since
   this page is entirely about that app's data.
2. **Data explorer** — stats, charts, and a full thread list over the
   conversation threads users have saved to their bots from `/ai-assist`.

This is v1 of an experiment: read-only, small in scope, meant for trying out
different cuts of the data rather than being a finished dashboard.

## Why it's in this repo, not a new project

The original brief assumed a separate repo/Vercel project. That was dropped
in favor of building here directly, because:

- The data lives in this project's Vercel Blob store — a separate project
  would need that store's token copied into its own environment to see
  anything real, which is more setup for no real benefit.
- The gating story is simpler: `/frogger` reuses `/ai-assist`'s
  `AI_ASSIST_SECRET` and `localStorage` key outright (see Access below)
  instead of provisioning a second secret.
- `README.md` already says as much for this repo generally: "If you're about
  to build a new gated page, put it here, not in a standalone project."

## Data source

Reads the same private Vercel Blob store `api/ai-assist-bot-store.js` writes
to — `bot-threads/*.json`, one blob per saved thread. `api/frogger-data.js`
is a **new, separate, read-only** endpoint (`list` + `get`, no `put`/`del`)
so nothing about the existing bot-store endpoint changed.

Thread JSON shape (unchanged from `api/ai-assist-bot-store.js`):

```json
{
  "id": "string (uuid)",
  "title": "string — first user message, truncated to 60 chars",
  "botName": "string",
  "messages": [{ "role": "user" | "assistant", "content": "string" }],
  "options": ["string"],
  "memory": "string",
  "updatedAt": 1234567890123
}
```

Only threads a user explicitly clicked "Save" on in `/ai-assist` show up
here — this is a subset of all conversations, not everything typed in.

## Access

Reuses `/ai-assist`'s Pattern B (client-stored header secret) exactly:
same `ai-assist-secret` `localStorage` key, same `X-AI-Assist-Secret` header,
same `AI_ASSIST_SECRET` env var check server-side. No new environment
variable was introduced. This isn't a security downgrade — anyone holding
that secret could already read every thread's full content via
`api/ai-assist-bot-store.js`'s `GET ?id=` (it's not scoped per bot/user), so
`/frogger` doesn't expose anything new.

## What's on the page

- KPI tiles: saved threads, distinct bots, total messages, avg. turns/thread,
  avg. memory length, most active bot.
- Charts (plain HTML/CSS bar charts, no external chart library, matching the
  rest of this repo's zero-dependency style): threads saved per day (last 30
  days with data), threads per bot (top 8 + "Other"), conversation-length
  distribution (turns per thread).
- A "spotlight" card showing one random saved thread, with a reroll button.
- A full thread table, sorted by most recently updated, click-to-expand for
  the raw transcript.

## Non-goals (still true)

- No writing, editing, or deleting thread data from `/frogger` — read-only.
- No changes to `/ai-assist` itself or to `api/ai-assist-bot-store.js`.
- No real-time updates — a page load / manual refresh is fine for v1.
