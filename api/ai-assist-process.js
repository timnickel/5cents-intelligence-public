const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

const SYSTEM_PROMPT =
  "You turn a rough note, message, or thought into one clear, actionable next step. You also maintain a short " +
  "running memory of only the important, durable facts from the conversation so far (goals, decisions, " +
  "constraints, open threads) so the conversation can continue indefinitely without resending the full " +
  'transcript. Respond with ONLY a JSON object, no markdown fences, no prose, in this exact shape: {"action": ' +
  '"one short sentence stating the next action", "options": ["short option", "short option"], "memory": "the ' +
  'updated running memory, as a short bullet list or 2-4 sentences, max roughly 500 characters"}. "options" must ' +
  "contain 2 or 3 distinct, concise (2-5 word) choices the user could pick to move forward from the action just " +
  'given — they become button labels, so keep them short and mutually exclusive. "memory" must always be ' +
  "present, even if unchanged, and must stay concise — drop anything no longer relevant rather than letting it " +
  "grow without bound.";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_MEMORY_LENGTH = 3000;

function parseModelResponse(text, previousMemory) {
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
  const memory = typeof parsed.memory === "string" && parsed.memory.trim() ? parsed.memory.trim() : previousMemory;
  return { action, options, memory };
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

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({ error: "message is too long (max " + MAX_MESSAGE_LENGTH + " characters)" });
    return;
  }

  let memory = typeof req.body?.memory === "string" ? req.body.memory.trim() : "";
  if (memory.length > MAX_MEMORY_LENGTH) {
    memory = memory.slice(-MAX_MEMORY_LENGTH);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(500).json({ error: "Server misconfigured", details: "ANTHROPIC_API_KEY is not set" });
    return;
  }

  const userContent = (memory ? "Conversation memory so far:\n" + memory + "\n\n" : "") + "New message:\n" + message;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = response.content.find((block) => block.type === "text")?.text ?? "";
    let action = "";
    let options = [];
    let newMemory = memory;
    try {
      ({ action, options, memory: newMemory } = parseModelResponse(rawText, memory));
    } catch (parseError) {
      action = rawText.trim();
      options = [];
    }
    res.status(200).json({ action, options, memory: newMemory });
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
