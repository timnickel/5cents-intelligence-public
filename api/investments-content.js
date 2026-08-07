const crypto = require("crypto");

// Bump on every push: yyyy.mm.dd.x.x — date of the push, then a same-day push counter,
// then a same-day-same-counter revision (increment the last digit for a same-day fix/redeploy).
const VERSION = "2026.08.07.1.0";

// Placeholder content (Phase 1a figures) served only after a valid session cookie is presented.
// All dollar figures below are made-up placeholders for layout purposes — see investments-tax-plan.md.
const CONTENT = {
  stamp: "Estimate — not filed · tax year 2026",
  tabs: [
    {
      id: "overview",
      label: "Overview",
      blocks: [
        {
          type: "stat-grid",
          items: [
            { label: "Est. federal liability", value: "$28,400" },
            { label: "Est. Illinois liability", value: "$8,100" },
            { label: "Effective rate (combined)", value: "19.8%" },
            { label: "Marginal rate", value: "24% fed / 4.95% IL" },
          ],
        },
        {
          type: "breakdown-bar",
          title: "Where the gross goes",
          segments: [
            { label: "Federal", value: "$28,400", share: "17.7%", token: "federal" },
            { label: "Illinois", value: "$8,100", share: "5.1%", token: "illinois" },
            { label: "Take-home", value: "$123,500", share: "77.2%", token: "takehome" },
          ],
        },
        {
          type: "text",
          title: "Overview",
          body: "Rough estimate based on placeholder inputs: $145,000 non-investment AGI, $9,400 realized brokerage gains, $2,110 dividends, and $3,200 crypto gains. Not tax advice — see investments-tax-plan.md for scope and caveats.",
        },
      ],
    },
    {
      id: "federal",
      label: "Federal",
      blocks: [
        {
          type: "text",
          title: "Federal summary",
          body: "Placeholder only. Real calculation pending Phase 2: ordinary-income brackets, long-term capital gains/qualified dividend rates, NIIT, and retirement-contribution treatment against verified 2026 IRS figures.",
        },
      ],
    },
    {
      id: "illinois",
      label: "Illinois",
      blocks: [
        {
          type: "text",
          title: "Illinois summary",
          body: "Placeholder only. Real calculation pending Phase 3: Illinois's flat rate applied to ordinary income and capital gains alike (no preferential rate), with retirement distributions excluded.",
        },
      ],
    },
    {
      id: "scenarios",
      label: "Scenarios",
      blocks: [
        {
          type: "text",
          title: "Scenarios",
          body: "Placeholder only. Real what-if scenarios (Roth conversion, loss harvesting, withdrawal timing) land in Phase 4 once Phases 2–3 produce trustworthy liability numbers.",
        },
      ],
    },
  ],
};

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });
  return cookies;
}

function isValidSession(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  const expected = crypto.createHmac("sha256", secret).update(expiresAtRaw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const sessionSecret = process.env.INVESTMENTS_SESSION_SECRET;
  const cookies = parseCookies(req.headers.cookie);

  if (!isValidSession(cookies.investments_session, sessionSecret)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.status(200).json({ ok: true, content: CONTENT, version: VERSION });
};
