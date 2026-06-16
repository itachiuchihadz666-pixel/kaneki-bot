import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, Send, RefreshCw, Upload, Sparkles, User, Bot, Paperclip, X, Code2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  file?: { name: string; type: string };
}

const QUICK_PROMPTS = [
  "أضف أمر جديد للبوت يرد برسالة ترحيب",
  "كيف أجعل البوت يحظر كلمات معينة؟",
  "أضف أمر /معلومات يعرض إحصاءات الأعضاء",
  "كيف أعدّل الرد التلقائي لكانيكي؟",
  "أضف أمر يرسل صورة عشوائية من المكتبة",
];

export default function AIAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "أهلاً 👋 أنا مساعد تطوير كانيكي بوت. يمكنني مساعدتك في:\n\n• إضافة أوامر جديدة للبوت\n• تعديل السلوك الحالي\n• رفع ملفات وربطها بالأوامر\n• شرح أي جزء من الكود\n\nاكتب ما تريد!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileDesc, setFileDesc] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content?: string) => {
    const text = (content ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error("فشل الاتصال بالذكاء الاصطناعي");
      const data = await res.json() as { reply: string };
      const aiMsg: Message = { role: "assistant", content: data.reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      toast({ title: "خطأ في الذكاء الاصطناعي", description: String(e), variant: "destructive" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ تعذّر الاتصال بالذكاء الاصطناعي. تأكد من إعداد GEMINI_API_KEY.",
        timestamp: new Date(),
      }]);
    }
    setLoading(false);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "bot_library");
      const res = await fetch(`${BASE}/api/bot/files`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("فشل الرفع");

      const aiPrompt = fileDesc
        ? `لقد رفعت ملف اسمه "${file.name}" (${file.type}). الوصف: ${fileDesc}. كيف أربط هذا الملف بأمر في البوت؟`
        : `لقد رفعت ملف اسمه "${file.name}" (${file.type}). ساعدني في إضافة أمر للبوت يستخدم هذا الملف.`;

      const userMsg: Message = {
        role: "user",
        content: aiPrompt,
        timestamp: new Date(),
        file: { name: file.name, type: file.type },
      };
      setMessages(prev => [...prev, userMsg]);
      setFile(null);
      setFileDesc("");
      setShowFileUpload(false);
      setLoading(true);

      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const aiRes = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiPrompt, history }),
      });
      if (aiRes.ok) {
        const data = await aiRes.json() as { reply: string };
        setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
      }
      toast({ title: "✅ رُفع الملف بنجاح", description: file.name });
    } catch (e) {
      toast({ title: "خطأ", description: String(e), variant: "destructive" });
    }
    setUploadingFile(false);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "تم مسح المحادثة. كيف يمكنني مساعدتك؟ 🔧",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="space-y-4 p-1 h-full flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <BrainCircuit className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono uppercase tracking-tight">AI Developer</h2>
            <p className="text-xs text-muted-foreground font-mono">مساعد تطوير البوت بالذكاء الاصطناعي</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowFileUpload(v => !v)}
            className={cn("font-mono text-xs border-border/50 gap-1.5", showFileUpload && "bg-primary/10 border-primary/40 text-primary")}>
            <Paperclip className="h-3 w-3" /> رفع ملف
          </Button>
          <Button size="sm" variant="outline" onClick={clearChat}
            className="font-mono text-xs border-border/50 gap-1.5">
            <RefreshCw className="h-3 w-3" /> مسح
          </Button>
        </div>
      </div>

      {/* File Upload Panel */}
      {showFileUpload && (
        <Card className="border-primary/20 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-2">
              <Upload className="h-3.5 w-3.5 text-primary" /> رفع ملف + ربطه بأمر
              <button onClick={() => setShowFileUpload(false)} className="mr-auto text-muted-foreground hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input ref={fileInputRef} type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/40 hover:border-primary/40 rounded-lg p-5 text-center cursor-pointer transition-colors hover:bg-primary/5">
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm font-mono text-primary">
                  <Paperclip className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span className="text-muted-foreground text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-xs font-mono text-muted-foreground">اضغط لاختيار ملف (صورة، فيديو، صوت، PDF)</p>
                </div>
              )}
            </div>
            <Textarea
              value={fileDesc}
              onChange={e => setFileDesc(e.target.value)}
              placeholder="صف كيف تريد استخدام هذا الملف في البوت (اختياري)..."
              className="min-h-[60px] bg-background/50 border-border/50 resize-none text-sm"
              dir="rtl"
            />
            <Button onClick={handleFileUpload} disabled={!file || uploadingFile}
              className="w-full font-mono text-xs gap-2 h-9">
              {uploadingFile ? <><RefreshCw className="h-3 w-3 animate-spin" /> جاري الرفع...</> : <><Plus className="h-3 w-3" /> ارفع واطلب من AI</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p)}
              className="text-[11px] font-mono px-3 py-1.5 rounded border border-border/30 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-colors">
              <Sparkles className="h-2.5 w-2.5 inline ml-1" />{p}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur min-h-[350px]">
        <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs",
                msg.role === "user"
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-zinc-800 text-zinc-300 border border-white/10"
              )}>
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={cn(
                "max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary/15 border border-primary/20 text-white rounded-tl-none"
                  : "bg-white/5 border border-white/8 text-zinc-200 rounded-tr-none"
              )}>
                {msg.file && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary/70 mb-2 pb-2 border-b border-white/10">
                    <Paperclip className="h-2.5 w-2.5" /> {msg.file.name}
                  </div>
                )}
                {msg.content.includes("```") ? (
                  <div className="space-y-2">
                    {msg.content.split(/(```[\s\S]*?```)/g).map((part, j) =>
                      part.startsWith("```") ? (
                        <pre key={j} className="bg-black/40 rounded-lg p-3 text-xs font-mono text-green-300 overflow-x-auto border border-white/10 whitespace-pre-wrap">
                          <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
                            <Code2 className="h-3 w-3" />
                            <span className="text-[10px]">كود</span>
                          </div>
                          {part.replace(/```\w*\n?/, "").replace(/```$/, "")}
                        </pre>
                      ) : (
                        <p key={j} className="whitespace-pre-wrap">{part}</p>
                      )
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
                  {msg.timestamp.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center bg-zinc-800 border border-white/10">
                <Bot className="h-3.5 w-3.5 text-zinc-300" />
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl rounded-tr-none px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  {[0, 1, 2].map(d => (
                    <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="اكتب طلبك... (Enter للإرسال، Shift+Enter لسطر جديد)"
          className="flex-1 min-h-[52px] max-h-[120px] bg-background/50 border-border/50 resize-none text-sm"
          dir="rtl"
          disabled={loading}
        />
        <Button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="h-full px-4 font-mono gap-1.5">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
