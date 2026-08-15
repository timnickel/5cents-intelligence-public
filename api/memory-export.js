const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

const FILE_TYPES = {
  txt: { mimeType: "text/plain", extension: "txt", useModel: true },
  md: { mimeType: "text/markdown", extension: "md", useModel: true },
  json: { mimeType: "application/json", extension: "json", useModel: false },
  csv: { mimeType: "text/csv", extension: "csv", useModel: false },
};

const MAX_INSTRUCTIONS_LENGTH = 500;
const MAX_INPUT_CHARS = 15000;

const SYSTEM_PROMPT =
  "You format exported AI Assist bot data (memory summaries and/or conversation transcripts) into a plain " +
  "downloadable file for the user. You will be given the raw data as JSON, the target file type (txt or md), " +
  "and optional formatting instructions from the user. Respond with ONLY the final file content — no code " +
  "fences, no commentary, no explanation of what you did. If no instructions are given, use a clean, readable " +
  "default: group by thread (title, bot name, last updated), then the memory summary if present, then the " +
  "transcript if present. If instructions are given, follow them as closely as possible while still including " +
  "the underlying data faithfully — do not invent facts that aren't in the source data.";

function checkAuth(req, res) {
  const secret = req.headers["x-ai-assist-secret"];
  if (!process.env.AI_ASSIST_SECRET || secret !== process.env.AI_ASSIST_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function csvEscape(value) {
  const str = value === undefined || value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsv(threads) {
  const rows = [["id", "title", "botName", "updatedAt", "memory", "transcript"]];
  threads.forEach((thread) => {
    const transcript = Array.isArray(thread.messages)
      ? thread.messages.map((m) => (m.role || "") + ": " + (m.content || "")).join(" | ")
      : "";
    rows.push([
      thread.id || "",
      thread.title || "",
      thread.botName || "",
      thread.updatedAt ? new Date(thread.updatedAt).toISOString() : "",
      thread.memory || "",
      transcript,
    ]);
  });
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!checkAuth(req, res)) return;

  const fileType = typeof req.body?.fileType === "string" ? req.body.fileType : "";
  const config = FILE_TYPES[fileType];
  if (!config) {
    res.status(400).json({ error: "fileType must be one of: " + Object.keys(FILE_TYPES).join(", ") });
    return;
  }

  const threads = Array.isArray(req.body?.threads) ? req.body.threads : null;
  if (!threads || threads.length === 0) {
    res.status(400).json({ error: "threads (non-empty array) is required" });
    return;
  }

  let instructions = typeof req.body?.instructions === "string" ? req.body.instructions.trim() : "";
  if (instructions.length > MAX_INSTRUCTIONS_LENGTH) {
    instructions = instructions.slice(0, MAX_INSTRUCTIONS_LENGTH);
  }

  const filenameBase = "memory-export-" + new Date().toISOString().slice(0, 10);
  const filename = filenameBase + "." + config.extension;

  if (!config.useModel) {
    const content = fileType === "json" ? JSON.stringify(threads, null, 2) : toCsv(threads);
    res.status(200).json({ content, filename, mimeType: config.mimeType });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Server misconfigured", details: "ANTHROPIC_API_KEY is not set" });
    return;
  }

  let dataJson = JSON.stringify(threads, null, 2);
  let truncated = false;
  if (dataJson.length > MAX_INPUT_CHARS) {
    dataJson = dataJson.slice(0, MAX_INPUT_CHARS);
    truncated = true;
  }

  const userContent =
    "Target file type: " + fileType +
    "\n\nFormatting instructions: " + (instructions || "(none given, use the default layout)") +
    (truncated ? "\n\n(Note: the data below was truncated to fit — mention this once at the top of the output.)" : "") +
    "\n\nRaw data:\n" + dataJson;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const content = response.content.find((block) => block.type === "text")?.text?.trim() ?? "";
    res.status(200).json({ content, filename, mimeType: config.mimeType });
  } catch (error) {
    console.error("memory-export error:", error);
    res.status(502).json({
      error: "Export formatting failed",
      details: error?.message || String(error),
      status: error?.status,
      type: error?.type || error?.name,
    });
  }
};
