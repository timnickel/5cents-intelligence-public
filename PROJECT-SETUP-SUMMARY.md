# 5cents-intelligence-public Setup Summary

## Purpose
This repository hosts the public-facing teaser experience for 5cents-intelligence.com.

It is intentionally separate from the admin portal codebase so public branding/site changes can move independently from internal operations tooling.

## What Is Already Implemented
- One-page teaser at `index.html`
- Orbit Nickel Minimal mark at `logo.svg`
- Private passcode-gated page at `investments.html`, served at `/investments`, backed by two serverless functions (`api/investments-auth.js`, `api/investments-content.js`) that verify a passcode server-side and gate content behind a signed session cookie. Requires `INVESTMENTS_PASSCODE` and `INVESTMENTS_SESSION_SECRET` environment variables set on the Vercel project — see `.env.example`.
- Vercel static config at `vercel.json`
- Base project README
- Copilot context copied to `.github/copilot-instructions.md`

## Current Navigation Behavior
- Main page: `index.html`

## Local Test Notes
Recommended local serve command from this repo root:

`npx.cmd serve -l 4173`

Expected local URLs:
- `http://localhost:4173/`

## Deployment Plan (Vercel)
1. Import this repository into Vercel.
2. Framework preset: `Other`.
3. Build command: empty.
4. Install command: empty.
5. Output directory: empty.
6. Deploy.

## Domain and DNS Plan (GoDaddy)
Attach these domains in Vercel project settings:
- `5cents-intelligence.com`
- `www.5cents-intelligence.com`

Set GoDaddy DNS records:
- A record: Host `@` -> `76.76.21.21`
- CNAME: Host `www` -> `cname.vercel-dns.com`

## Post-Deploy Verification
1. Confirm Vercel marks both domains as valid.
2. Open `https://5cents-intelligence.com`.
3. Open `https://www.5cents-intelligence.com`.
4. Confirm both routes load over HTTPS.

## Notes for Future Focused Work
- This repository is now the single source of truth for the public site.
- Admin portal tracking can continue separately.
- Future teaser or brand updates should be committed here first.
