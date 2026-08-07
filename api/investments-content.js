const crypto = require("crypto");

// Placeholder content served only after a valid session cookie is presented.
const CONTENT = {
  sections: [
    {
      title: "Overview",
      body: "Investment planning notes go here. Replace this placeholder content once the real plan is ready.",
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

  res.status(200).json({ ok: true, content: CONTENT });
};
