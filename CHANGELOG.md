# Changelog

All notable changes to this repository should be recorded in this file.

## [Unreleased]

### 2026.08.08.1.0
- Added an always-visible Debug Log card to `/ai-assist` that shows the full outgoing request (headers, body) and incoming response (status, headers, raw body) for each `/api/ai-assist-process` call, plus a Clear button, to help troubleshoot passphrase/auth issues.

### 2026.08.07.1.0
- Added a passcode-free, passphrase-header-gated `/ai-assist` page (`ai-assist.html`, `api/ai-assist-process.js`), ported over from the standalone `ai-assist` project/repo so it deploys under the main `5cents-intelligence.com` domain instead of its own separate Vercel project.
- Added a glowing, floating circular robot mascot (`robot.png`) above the AI Assist title.
- Requires `ANTHROPIC_API_KEY` and `AI_ASSIST_SECRET` environment variables on this Vercel project (copied over from the old `ai-assist` project).
