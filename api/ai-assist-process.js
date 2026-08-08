const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

const SYSTEM_PROMPT =
  "You turn a rough note, message, or thought into one clear, actionable next step. " +
  "Respond with a single short sentence stating the next action. No preamble, no explanation, no markdown, no quotes.";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const secret = req.headers["x-ai-assist-secret"];
  if (!process.env.AI_ASSIST_SECRET || secret !== process.env.AI_ASSIST_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (message.length > 4000) {
    res.status(400).json({ error: "message is too long (max 4000 characters)" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Server misconfigured", details: "ANTHROPIC_API_KEY is not set" });
    return;
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: message }],
    });

    const action = response.content.find((block) => block.type === "text")?.text ?? "";
    res.status(200).json({ action });
  } catch (error) {
    console.error("ai-assist-process error:", error);
    res.status(502).json({
      error: "Processing failed",
      details: error?.message || String(error),
      status: error?.status,
      type: error?.type || error?.name,
    });
  }
};
