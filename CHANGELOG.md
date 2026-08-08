# Changelog

All notable changes to this repository should be recorded in this file.

## [Unreleased]

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
