# Changelog

All notable changes to this repository should be recorded in this file.

## [Unreleased]

### 2026.08.07.1.0
- Added a passcode-free, passphrase-header-gated `/ai-assist` page (`ai-assist.html`, `api/ai-assist-process.js`), ported over from the standalone `ai-assist` project/repo so it deploys under the main `5cents-intelligence.com` domain instead of its own separate Vercel project.
- Added a glowing, floating circular robot mascot (`robot.png`) above the AI Assist title.
- Requires `ANTHROPIC_API_KEY` and `AI_ASSIST_SECRET` environment variables on this Vercel project (`AI_ASSIST_SECRET` regenerated fresh rather than copied, since the old value couldn't be safely read out of the previous project's environment).
- Documented this repo's structure and its two access-gating patterns (`/investments`'s signed-cookie pattern vs. `/ai-assist`'s client-stored header-secret pattern) in `README.md`, as a reference for adding future gated pages.
