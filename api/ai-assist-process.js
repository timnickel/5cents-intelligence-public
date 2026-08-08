const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

const SYSTEM_PROMPT =
  "You turn a rough note, message, or thought into one clear, actionable next step, considering the full " +
  "conversation so far. Respond with ONLY a JSON object, no markdown fences, no prose, in this exact shape: " +
  '{"action": "one short sentence stating the next action", "options": ["short option", "short option"]}. ' +
  '"options" must contain 2 or 3 distinct, concise (2-5 word) choices the user could pick to move forward from ' +
  "the action just given — they become button labels, so keep them short and mutually exclusive.";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MESSAGES = 20;

function parseModelResponse(text) {
  let jsonText = text.trim();
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }
  const parsed = JSON.parse(jsonText);
  const action = typeof parsed.action === "string" ? parsed.action : "";
  const options = Array.isArray(parsed.options)
    ? parsed.options.filter((o) => typeof o === "string" && o.trim()).slice(0, 3)
    : [];
  return { action, options };
}

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

  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!rawMessages || rawMessages.length === 0) {
    res.status(400).json({ error: "messages is required" });
    return;
  }
  if (rawMessages.length > MAX_MESSAGES) {
    res.status(400).json({ error: "too many messages (max " + MAX_MESSAGES + ")" });
    return;
  }

  const messages = [];
  for (const entry of rawMessages) {
    const role = entry?.role === "assistant" ? "assistant" : entry?.role === "user" ? "user" : null;
    const content = typeof entry?.content === "string" ? entry.content.trim() : "";
    if (!role || !content) {
      res.status(400).json({ error: "each message needs a valid role and non-empty content" });
      return;
    }
    if (content.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: "a message is too long (max " + MAX_MESSAGE_LENGTH + " characters)" });
      return;
    }
    messages.push({ role, content });
  }
  if (messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "the last message must be from the user" });
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
      messages,
    });

    const rawText = response.content.find((block) => block.type === "text")?.text ?? "";
    let action = "";
    let options = [];
    try {
      ({ action, options } = parseModelResponse(rawText));
    } catch (parseError) {
      action = rawText.trim();
      options = [];
    }
    res.status(200).json({ action, options });
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
