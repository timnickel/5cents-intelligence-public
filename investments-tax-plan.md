# Investments & Tax Planning — Tax Year 2026

**Scope:** Personal investment tracking and tax-liability estimates for tax year 2026 (filed in 2027).
**Jurisdiction:** US federal + Illinois state.
**Accounts covered:** Taxable brokerage, retirement accounts (401(k)/IRA/Roth), crypto.
**Audience/delivery:** Content for the passcode-gated `/investments` page (`investments.html`, served via `api/investments-content.js`, both in this repo). See `copilot-chats/2026-08-07-investments-phase1d-content-build.md` for how the gate and Phase 1d mock were built.

> **Not tax advice.** This is a personal planning tool, not a substitute for a CPA or tax software. All bracket/threshold/limit figures below are marked either from memory (⚠️ verify) or as placeholders (TBD) — every number must be checked against the actual IRS Revenue Procedure for 2026 and the Illinois Department of Revenue before it's used to make a real decision.

---

## Phase 1 — Inputs & Data Inventory

Goal: get the page's look and feel right using rough estimates first; swap in real figures later without redesigning anything. Split into sub-steps so design work isn't blocked on real data.

### Phase 1a — Placeholder estimates (rough numbers, not real data)

⚠️ **All figures below are made up for layout purposes only** — not the user's real numbers, not computed from real tax law. They exist so Phase 1d has realistic-shaped values to lay out. Real inputs come later in Phase 1e; real math comes in Phases 2–3.

| Input | Placeholder value |
|---|---|
| Filing status | Single |
| Non-investment AGI (W-2, etc.) | $145,000 |
| Taxable brokerage — total value | $62,000 |
| Taxable brokerage — 2026 realized gains | $9,400 total ($2,100 short-term / $7,300 long-term) |
| Dividends | $1,850 qualified / $260 ordinary |
| Retirement contributions (2026) | $19,000 Traditional 401(k) / $7,000 Roth IRA |
| Crypto — 2026 realized gain | $3,200 |

Derived headline numbers for the stat tiles (also placeholders — illustrative shape only, not a real projection):

| Stat tile | Placeholder value |
|---|---|
| Est. federal liability | $28,400 |
| Est. Illinois liability | $8,100 |
| Effective rate (combined) | 19.8% |
| Marginal rate | 24% federal / 4.95% Illinois |

Once Phase 1d's layout is approved, these get replaced first by better placeholders (if needed) and ultimately by Phase 2/3's real calculations against Phase 1e's real data.

### Phase 1b — Visual design system (reuse the site's existing theme)

`5cents-intelligence.com` already has a consistent dark, understated dashboard aesthetic across `index.html` and the current `investments.html` gate — extend it rather than inventing a new one. The site is **dark-mode only** (`color-scheme: dark` is hardcoded, no light variant exists), so the design system below only needs a dark instance.

**Reused as-is from the existing theme:**

- **Palette:** deep navy background (`#06101d` → `#0d1728` gradient), cyan (`#7dd3fc`) + green (`#34d399`) as UI accents, red (`#f87171`) for errors, muted slate (`#94a3b8`) for secondary text, hairline borders (`rgba(148,163,184,0.14)`).
- **Texture:** the faint 40px grid overlay + soft radial glows used on `index.html` — carries the "signal/orbit" motif into the investments page instead of leaving it flat.
- **Card language:** rounded `hero` panel (28–36px radius), subtle border + drop shadow, semi-transparent panel fill — same shape used for both the teaser hero and the investments gate.
- **Typography accents:** the cyan uppercase "eyebrow" label (letter-spacing 0.36em) and the pill-shaped "stamp" badge with a gradient dot — reuse these as section labels and status indicators (e.g. a stamp reading "Estimate — not filed" instead of "Teaser release").

**New tokens, designed for this page using the `dataviz` skill (validated, not eyeballed):**

The existing brand accents (`#7dd3fc` cyan, `#34d399` green) are great for text/badges but are *too light* (OKLCH L ≈ 0.77–0.83) to serve as chart fill colors on this dark surface — they fail the categorical lightness band (target L ≈ 0.48–0.67 dark). So the page needs a second, darker set of the *same* hue families reserved for chart fills only, kept distinct from the lighter UI-accent tokens:

```css
/* Existing UI accent tokens (investments.html :root) — unchanged, used for text/badges/buttons */
--cyan: #7dd3fc;
--green: #34d399;
--red: #f87171;
--muted: #94a3b8;

/* New: chart-fill tokens — darker steps of the same families, dark-surface only */
--chart-surface: #0b1221;         /* effective panel color the chart sits on */
--chart-federal: #0284c7;         /* categorical slot 1 — sky */
--chart-illinois: #d97706;        /* categorical slot 2 — amber */
--chart-takehome: #059669;        /* categorical slot 3 — emerald */
--status-warning-text: #fbbf24;   /* amber-400, text-safe (11.2:1 on chart-surface) */
```

Validated with `scripts/validate_palette.js` against the flattened panel surface (`#0b1221`, i.e. the hero card's translucent fill over the page gradient):
- Lightness band, chroma floor, contrast (all ≥ 3:1 vs. surface): **PASS**.
- CVD separation: **PASS** at the normal-vision floor (ΔE ≥ 15); the amber↔emerald adjacent pair sits in the 6–8 "floor" band for simulated color-vision deficiency, which is legal *only* with direct labels — already the plan below, since a 3-series chart direct-labels by default per the skill's series-count rule.

**New components needed for a dashboard (designed below, not yet built):**

- **Stat tiles** — KPI row of 4 (est. federal liability, est. Illinois liability, effective rate, marginal rate). Per the stat-tile contract: sentence-case label (no trailing colon) + semibold value in the page's sans (`Segoe UI`), proportional figures (not tabular — these are standalone numbers, not a table column). No delta/sparkline yet — a single tax-year snapshot has no prior period to compare against. Reuses the existing `.hero`-style card shape at a smaller size, on the navy panel background.
- **Section nav/tabs** — a row of pill buttons (same shape as the existing `.stamp` badge) to switch between Overview / Federal / Illinois / Scenarios without one long scroll.
- **Effective-rate breakdown visual** — job is *part-to-whole* (federal tax + Illinois tax + take-home = 100% of gross), so per the skill's form table this is a **horizontal stacked bar**, not a donut (donut is deprioritized by the skill in favor of stacked bar). Single bar, 3 segments using the `--chart-federal` / `--chart-illinois` / `--chart-takehome` tokens above, ≤24px thick, 4px rounded end-caps, 2px surface-color gap between segments, direct label on each segment (value + share), legend row below since this is the "identity" chart on the page. No axis needed for a single part-to-whole bar.

### Phase 1c — Content architecture (schema, not copy yet)

- [x] Decide whether the current flat `{ title, body }` sections array in `investments-content.js` is enough, or whether it needs to grow (e.g. `{ type: "stat-grid", items: [...] }`, `{ type: "text", ... }`) to support tiles/tabs instead of just headings and paragraphs. — Grew into `tabs: [{ id, label, blocks: [...] }]` with typed blocks (`stat-grid`, `breakdown-bar`, `text`); legacy flat `sections` kept as a fallback.
- [x] Map Phase 1a's placeholder numbers to the stat tiles/sections designed in 1b, so the mock in 1d has real-looking (if fake) values to render.

### Phase 1d — Static look-and-feel mock

- [x] Build a static pass of `investments.html`'s post-unlock `#content` area using the Phase 1b design system and Phase 1a placeholder numbers, hardcoded (not yet wired through the real API response). — Shipped in `d93d6cd`.
- [ ] Review/iterate on layout, spacing, responsiveness before touching Phase 2's actual tax math.

### Phase 1e — Real data inventory (deferred until look/feel is approved)

- [ ] Filing status and actual 2026 AGI from non-investment income.
- [ ] Taxable brokerage: real holdings with cost basis, acquisition date, current value, realized gains/losses (short-term vs. long-term).
- [ ] Dividend income by holding: qualified vs. ordinary, foreign tax withheld.
- [ ] Retirement accounts: type, actual 2026 contributions/employer match, distributions taken.
- [ ] Crypto: real transaction history with cost basis per lot.
- [ ] Tax-loss harvesting done in 2026 and wash-sale exposure.
- [ ] Illinois residency status for the full tax year.

**Output of this phase:** first a look-and-feel mock built on placeholders (1a–1d), then — once that's approved — a structured real data file (JSON or spreadsheet) that Phases 2–4 read from (1e). Real figures should never be hardcoded directly into page markup.

---

## Phase 2 — Federal Tax Calculations

Goal: define the formulas, not yet the final 2026 numbers.

1. **Ordinary income tax** — apply the 7 federal brackets (10/12/22/24/32/35/37%) to wages + short-term capital gains + non-qualified dividends + ordinary retirement distributions. TBD: exact 2026 bracket thresholds (inflation-adjusted annually via IRS Rev. Proc. — ⚠️ verify, do not assume prior-year numbers).
2. **Long-term capital gains / qualified dividends** — apply the 0/15/20% preferential rates based on taxable income thresholds (also inflation-adjusted). TBD: 2026 thresholds.
3. **Net Investment Income Tax (NIIT)** — additional 3.8% on the lesser of net investment income or MAGI over $200,000 (single) / $250,000 (MFJ). These thresholds are **not** inflation-indexed, so they should hold for 2026, but ⚠️ verify no legislative change.
4. **Retirement account treatment:**
   - Traditional 401(k)/IRA contributions reduce current-year taxable income (subject to 2026 contribution limits — TBD, ⚠️ verify against IRS annual limit announcement).
   - Roth contributions: no current-year deduction, but qualified withdrawals are tax-free.
   - Early-withdrawal 10% penalty if applicable (age/exception check).
5. **Crypto** — treated as property; capital gains/loss rules from #2 apply per lot (FIFO/specific-ID method — decide and document which method is used, since it affects the result).
6. **Standard vs. itemized deduction** — TBD 2026 standard deduction by filing status.

**Output:** a reusable calculation module (e.g. `investments-tax-plan/federal.js` or similar) that takes the Phase 1 data and returns a federal liability estimate, kept separate from hardcoded page copy.

---

## Phase 3 — Illinois State Tax Calculations

Illinois has a materially simpler, flat-rate system — worth calling out explicitly since it changes the shape of the calculation vs. federal:

1. **Flat individual income tax rate** — currently 4.95% of net income; ⚠️ verify the 2026 rate (Illinois has had graduated-rate ballot proposals fail before, but confirm no change).
2. **No capital gains preference** — Illinois taxes capital gains (short- and long-term alike) and dividends as ordinary income at the flat rate. There's no 0/15/20% equivalent at the state level.
3. **Retirement income is exempt** — 401(k), IRA, and pension distributions are generally *not* taxed by Illinois. This is a significant planning lever (state liability drops if income shifts from brokerage gains to retirement distributions).
4. **Personal exemption allowance** — Illinois allows a personal exemption amount (indexed annually). TBD: 2026 figure, ⚠️ verify.
5. **No NIIT-equivalent surtax** at the state level.

**Output:** a second calculation module mirroring Phase 2's structure, applied only to the income categories Illinois actually taxes.

---

## Phase 4 — Combined Scenario Worksheet

Goal: turn Phases 2–3 into something decision-useful, not just a liability number.

- [ ] Combined federal + Illinois effective and marginal rate, given the current holdings/income mix.
- [ ] "What-if" scenarios: e.g. realizing a specific long-term gain, converting Traditional → Roth, harvesting a loss against a gain, shifting withdrawal timing across the Dec 31 boundary.
- [ ] Estimated quarterly tax payment check (federal Form 1040-ES safe-harbor: 100%/110% of prior-year liability, or 90% of current-year) if investment income is large enough to require it.
- [ ] Flag any wash-sale conflicts across the brokerage + crypto data from Phase 1.

**Output:** a simple worksheet (could be the same data file extended, or a small script) — not yet page content.

---

## Phase 5 — Page Content Build-Out

Only after Phases 1–4 produce trustworthy numbers:

- [ ] Replace the placeholder `tabs`/`blocks` content in `api/investments-content.js` with real section content (Overview, Federal Summary, Illinois Summary, Scenarios, Action Items).
- [ ] Decide whether raw numbers/holdings should live in that file directly, or be fetched from a separate private data source — given the passcode-gate exists specifically to protect this content, keep sensitive figures out of anything that could leak into the public static site or git history unencrypted.

---

## Phase 6 — Maintenance

- [ ] Re-verify every ⚠️/TBD figure in this document each year against the actual IRS Revenue Procedure and Illinois Department of Revenue guidance — thresholds move annually with inflation.
- [ ] Re-run Phase 1 data collection whenever a new account, holding, or income source is added mid-year.

---

## Open Questions

- What method should apply to crypto lot accounting — FIFO, LIFO, or specific identification? This must be picked before Phase 2 crypto calculations mean anything.
- Any anticipated large events in 2026 (bonus, RSU vesting, home sale, job change) that would shift the ordinary-income baseline used in the bracket calculations?
- Should Phase 4's scenario worksheet live in this repo (script) or is a spreadsheet sufficient for now?
