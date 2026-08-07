const crypto = require("crypto");

// Session lifetime for a successful unlock.
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function timingSafeEqualStrings(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself so mismatched lengths don't leak timing info.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function signSession(expiresAt, secret) {
  const hmac = crypto.createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
  return expiresAt + "." + hmac;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const expected = process.env.INVESTMENTS_PASSCODE;
  const sessionSecret = process.env.INVESTMENTS_SESSION_SECRET;

  if (!expected || !sessionSecret) {
    console.error("investments-auth: missing INVESTMENTS_PASSCODE or INVESTMENTS_SESSION_SECRET env var");
    res.status(500).json({ error: "Server not configured" });
    return;
  }

  const passcode = typeof req.body?.passcode === "string" ? req.body.passcode : "";

  if (!passcode || passcode.length > 200 || !timingSafeEqualStrings(passcode, expected)) {
    res.status(401).json({ error: "Incorrect passcode" });
    return;
  }

  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const token = signSession(expiresAt, sessionSecret);

  res.setHeader(
    "Set-Cookie",
    "investments_session=" + token + "; Path=/; Max-Age=" + SESSION_MAX_AGE_SECONDS + "; HttpOnly; Secure; SameSite=Strict"
  );
  res.status(200).json({ ok: true });
};
