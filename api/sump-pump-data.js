const { put, list, del, get } = require("@vercel/blob");
const { text: streamToText } = require("node:stream/consumers");

const PREFIX = "sump-pump/";

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
  if (!checkAuth(req, res)) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "Blob storage not configured" });
    return;
  }

  try {
    if (req.method === "POST") {
      const timestamp = Date.now();
      const id = String(timestamp) + "-" + Math.random().toString(36).slice(2, 8);
      const event = { id: id, timestamp: timestamp };
      await put(PREFIX + id + ".json", JSON.stringify(event), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      res.status(200).json(event);
      return;
    }

    if (req.method === "PATCH") {
      const id = req.body?.id;
      if (!id || typeof id !== "string") {
        res.status(400).json({ error: "id is required" });
        return;
      }
      const existing = await readBlob(PREFIX + id + ".json");
      if (!existing) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      const updated = Object.assign({}, existing, { isDuration: !!req.body?.isDuration });
      await put(PREFIX + id + ".json", JSON.stringify(updated), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      res.status(200).json(updated);
      return;
    }

    if (req.method === "GET") {
      const { blobs } = await list({ prefix: PREFIX });
      const events = await Promise.all(blobs.map((blob) => readBlob(blob.pathname)));
      const sorted = events.filter(Boolean).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      res.status(200).json(sorted);
      return;
    }

    if (req.method === "DELETE") {
      const clearAll = req.query?.all === "1" || req.query?.all === "true";
      if (clearAll) {
        const { blobs } = await list({ prefix: PREFIX });
        if (blobs.length) {
          await del(blobs.map((blob) => blob.pathname));
        }
        res.status(200).json({ ok: true, deleted: blobs.length });
        return;
      }

      const id = req.query?.id;
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }
      await del(PREFIX + id + ".json");
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("sump-pump-data error:", error);
    res.status(502).json({ error: "Storage request failed", details: error?.message || String(error) });
  }
};
