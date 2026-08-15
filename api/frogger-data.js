const { list, get } = require("@vercel/blob");
const { text: streamToText } = require("node:stream/consumers");

const PREFIX = "bot-threads/";

function checkAuth(req, res) {
  const secret = req.headers["x-ai-assist-secret"];
  if (!process.env.AI_ASSIST_SECRET || secret !== process.env.AI_ASSIST_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function readBlob(pathname) {
  const result = await get(pathname, { access: "private" });
  if (!result) return null;
  const raw = await streamToText(result.stream);
  return JSON.parse(raw);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkAuth(req, res)) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "Blob storage not configured" });
    return;
  }

  try {
    const { blobs } = await list({ prefix: PREFIX });
    const threads = await Promise.all(blobs.map((blob) => readBlob(blob.pathname)));
    res.status(200).json(threads.filter(Boolean));
  } catch (error) {
    console.error("frogger-data error:", error);
    res.status(502).json({ error: "Storage request failed", details: error?.message || String(error) });
  }
};
