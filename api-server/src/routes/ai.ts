import { Router } from "express";

const router = Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const DEV_SYSTEM_PROMPT = `أنت مساعد تطوير بوت فيسبوك محترف متخصص في Node.js وmessenger bots (fca-unofficial).

مهمتك:
- مساعدة المطور في إضافة ميزات جديدة للبوت
- كتابة كود Node.js جاهز ومفصّل
- شرح كيفية إضافة الكود لملف index.js
- الرد بالعربي بأسلوب ودّي مباشر

قواعد الكود:
- استخدم sendAndCache بدل api.sendMessage مباشرة
- البوت يستخدم fca-unofficial (@dongdev/fca-unofficial)
- استخدم appendLog لتسجيل الأحداث
- الكمندات تُكتب داخل api.listenMqtt callback
- الملفات في /artifacts/fb-bot/

عند الرد:
1. اشرح ماذا ستفعل
2. اعطِ الكود الكامل في code block
3. اشرح أين تضع الكود بالضبط`;

router.post("/ai/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      return res.status(400).json({ error: "message required" });
    }

    if (!GEMINI_API_KEY) {
      return res.json({
        reply: "⚠️ GEMINI_API_KEY غير مضبوط. أضفه في متغيرات البيئة لتفعيل الذكاء الاصطناعي.",
      });
    }

    const contents = [
      ...history.slice(-10).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      { role: "user" as const, parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: DEV_SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(500).json({ error: `Gemini error: ${errText}` });
    }

    const data = await geminiRes.json() as {
      candidates?: { content: { parts: { text: string }[] } }[];
    };
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "لم أتلقَّ رداً من الذكاء الاصطناعي.";

    return res.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
});

export default router;
