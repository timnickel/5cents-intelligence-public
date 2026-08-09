const { put, list, del, get } = require("@vercel/blob");
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
  if (!checkAuth(req, res)) return;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "Blob storage not configured" });
    return;
  }

  try {
    if (req.method === "POST") {
      const thread = req.body?.thread;
      if (!thread || typeof thread.id !== "string" || !thread.id) {
        res.status(400).json({ error: "thread with an id is required" });
        return;
      }
      await put(PREFIX + thread.id + ".json", JSON.stringify(thread), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "GET") {
      const id = req.query?.id;
      if (id) {
        const thread = await readBlob(PREFIX + id + ".json");
        if (!thread) {
          res.status(404).json({ error: "Not found" });
          return;
        }
        res.status(200).json(thread);
        return;
      }

      const { blobs } = await list({ prefix: PREFIX });
      const threads = await Promise.all(blobs.map((blob) => readBlob(blob.pathname)));
      const summaries = threads
        .filter(Boolean)
        .map((thread) => ({ id: thread.id, title: thread.title, updatedAt: thread.updatedAt }))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      res.status(200).json(summaries);
      return;
    }

    if (req.method === "DELETE") {
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
    console.error("ai-assist-bot-store error:", error);
    res.status(502).json({ error: "Storage request failed", details: error?.message || String(error) });
  }
};
