# 5cents-intelligence-public Setup Summary

## Purpose
This repository hosts the public-facing teaser experience for 5cents-intelligence.com.

It is intentionally separate from the admin portal codebase so public branding/site changes can move independently from internal operations tooling.

## What Is Already Implemented
- One-page teaser at `index.html`
- Orbit Nickel Minimal mark at `logo.svg`
- Small clickable rose image (`rose.png`) on the teaser page
- Secondary sunrise-only page at `sunrise.html` using `sunrise.png`
- Vercel static config at `vercel.json`
- Base project README
- Copilot context copied to `.github/copilot-instructions.md`

## Current Navigation Behavior
- Main page: `index.html`
- Rose click target: `sunrise.html`
- Sunrise page intentionally contains only the image, no text

## Local Test Notes
Recommended local serve command from this repo root:

`npx.cmd serve -l 4173`

Expected local URLs:
- `http://localhost:4173/`
- `http://localhost:4173/sunrise.html`

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
5. Confirm rose click opens the sunrise-only page.

## Notes for Future Focused Work
- This repository is now the single source of truth for the public site.
- Admin portal tracking can continue separately.
- Future teaser or brand updates should be committed here first.
