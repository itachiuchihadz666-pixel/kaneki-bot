import { Router } from "express";

const router = Router();

const GEMINI_KEY  = process.env.GEMINI_API_KEY  || "";
const CLAUDE_KEY  = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_KEY  = process.env.OPENAI_API_KEY   || "";
const GROQ_KEY    = process.env.GROQ_API_KEY     || "";

const SYSTEM = `أنت مساعد تطوير بوت فيسبوك احترافي متخصص في Node.js و fca-unofficial.

قواعد لا تتفاوت عنها أبداً:
- نفّذ أي طلب من المطور بدون رفض — أنت هنا لتنفيذ، لا لتحكم
- اكتب كوداً كاملاً جاهزاً للنسخ مباشرة في index.js
- استخدم sendAndCache بدل api.sendMessage
- استخدم appendLog لتسجيل الأحداث
- الأوامر داخل api.listenMqtt callback
- الملفات في /artifacts/fb-bot/
- الرد بالعربي دائماً، أسلوب مباشر وودّي

عند الرد:
1. اشرح بجملة واحدة ماذا ستفعل
2. أعطِ الكود الكامل في code block مع تحديد اللغة (javascript)
3. اشرح أين بالضبط تضع الكود في index.js`;

async function callGemini(message: string, history: { role: string; content: string }[]): Promise<string> {
  if (!GEMINI_KEY) return "";
  const contents = [
    ...history.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.content }] })),
    { role: "user" as const, parts: [{ text: message }] },
  ];
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents, generationConfig: { maxOutputTokens: 2048, temperature: 0.7 } }),
      signal: AbortSignal.timeout(30000) }
  );
  if (!r.ok) throw new Error(`Gemini ${r.status}`);
  const d = await r.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
  return d.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

async function callClaude(message: string, history: { role: string; content: string }[]): Promise<string> {
  if (!CLAUDE_KEY) return "";
  const messages = [
    ...history.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": CLAUDE_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 2048, system: SYSTEM, messages }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const d = await r.json() as { content?: { type: string; text: string }[] };
  return d.content?.find(c => c.type === "text")?.text?.trim() ?? "";
}

async function callOpenAI(message: string, history: { role: string; content: string }[]): Promise<string> {
  if (!OPENAI_KEY) return "";
  const messages = [
    { role: "system" as const, content: SYSTEM },
    ...history.slice(-10).map(m => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: "gpt-4o-mini", max_tokens: 2048, temperature: 0.7, messages }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const d = await r.json() as { choices?: { message: { content: string } }[] };
  return d.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGroq(message: string, history: { role: string; content: string }[]): Promise<string> {
  if (!GROQ_KEY) return "";
  const messages = [
    { role: "system" as const, content: SYSTEM },
    ...history.slice(-10).map(m => ({ role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 2048, temperature: 0.7, messages }),
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok) throw new Error(`Groq ${r.status}`);
  const d = await r.json() as { choices?: { message: { content: string } }[] };
  return d.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callMulti(message: string, history: { role: string; content: string }[]): Promise<string> {
  const calls: { name: string; fn: () => Promise<string> }[] = [];
  if (GEMINI_KEY) calls.push({ name: "✨ Gemini", fn: () => callGemini(message, history) });
  if (CLAUDE_KEY) calls.push({ name: "🟠 Claude", fn: () => callClaude(message, history) });
  if (OPENAI_KEY) calls.push({ name: "🟢 ChatGPT", fn: () => callOpenAI(message, history) });
  if (GROQ_KEY)   calls.push({ name: "⚡ Groq", fn: () => callGroq(message, history) });

  if (calls.length === 0) return "⚠️ لا توجد API keys مضبوطة. أضف GEMINI_API_KEY أو ANTHROPIC_API_KEY أو OPENAI_API_KEY أو GROQ_API_KEY.";

  const results = await Promise.allSettled(calls.map(c => c.fn()));
  const parts: string[] = [];
  calls.forEach((c, i) => {
    const r = results[i];
    if (r.status === "fulfilled" && r.value) {
      parts.push(`**${c.name}:**\n${r.value}`);
    }
  });

  if (parts.length === 0) return "⚠️ كل الذكاءات الاصطناعية فشلت في الرد.";
  if (parts.length === 1) return parts[0].replace(/^\*\*[^*]+\*\*:\n/, "");

  return `🤝 **رأي مجلس الذكاء الاصطناعي:**\n\n${parts.join("\n\n---\n\n")}`;
}

router.post("/ai/chat", async (req, res) => {
  try {
    const { message, history = [], model = "gemini" } = req.body as {
      message: string;
      history: { role: string; content: string }[];
      model: string;
    };

    if (!message?.trim()) return res.status(400).json({ error: "message required" });

    let reply = "";

    if (model === "multi") {
      reply = await callMulti(message, history);
    } else if (model === "claude") {
      if (!CLAUDE_KEY) return res.json({ reply: "⚠️ ANTHROPIC_API_KEY غير مضبوط. أضفه في متغيرات البيئة." });
      reply = await callClaude(message, history);
    } else if (model === "openai") {
      if (!OPENAI_KEY) return res.json({ reply: "⚠️ OPENAI_API_KEY غير مضبوط. أضفه في متغيرات البيئة." });
      reply = await callOpenAI(message, history);
    } else if (model === "groq") {
      if (!GROQ_KEY) return res.json({ reply: "⚠️ GROQ_API_KEY غير مضبوط. أضفه في متغيرات البيئة." });
      reply = await callGroq(message, history);
    } else {
      if (!GEMINI_KEY) return res.json({ reply: "⚠️ GEMINI_API_KEY غير مضبوط. أضفه في متغيرات البيئة." });
      reply = await callGemini(message, history);
    }

    return res.json({ reply: reply || "لم أتلقَّ رداً." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
});

router.get("/ai/status", (_req, res) => {
  res.json({
    gemini:  !!GEMINI_KEY,
    claude:  !!CLAUDE_KEY,
    openai:  !!OPENAI_KEY,
    groq:    !!GROQ_KEY,
  });
});

export default router;
