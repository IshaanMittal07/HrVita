import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Mic, MicOff, Send, Sparkles } from "lucide-react";
import { getState } from "../lib/store.js";
import { alertLevel, summarize } from "../lib/hrv.js";

const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

// Short summary of current patients so the assistant can answer questions about them.
function patientContext() {
  const { patients, readings } = getState();
  if (!patients.length) return "No patients are registered yet.";
  return patients
    .map((p) => {
      const list = readings[p.id] || [];
      const s = summarize(list);
      if (!s) return `- ${p.name} (${p.patientId}): no readings yet`;
      const last = list.at(-1);
      return `- ${p.name} (${p.patientId}): ${s.count} readings, latest HR ${last.hr} bpm, current SD ${s.current.toFixed(2)}, avg SD ${s.average.toFixed(2)}, min ${s.min.toFixed(2)}, max ${s.max.toFixed(2)}, alert level ${alertLevel(last)}`;
    })
    .join("\n");
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef(null);
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => () => recognition.current?.stop(), []);

  async function send(text = input) {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context: patientContext() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages([...next, { role: "assistant", content: `Couldn't reach the assistant: ${err.message}. Make sure the API server is running (npm run dev) and ANTHROPIC_API_KEY is set in .env.`, error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.onresult = (e) => setInput(Array.from(e.results).map((r) => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HrVita AI Assistant</h1>
            <p className="text-sm text-slate-600">Ask questions about heart rate variability monitoring and patient care</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-5 w-5 text-blue-600" /> Welcome to HrVita AI Assistant
              </p>
              <p className="mt-4">I can help you with:</p>
              <ul className="mt-3 space-y-2 text-slate-700">
                {["Understanding heart rate variability and readings", "Interpreting patient data and trends", "General health and monitoring guidance", "Answering questions about the HrVita monitoring system"].map((t) => (
                  <li key={t} className="flex gap-2"><span className="text-blue-600">•</span>{t}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-500">💡 You can type your questions or use the microphone button to speak</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user" ? "bg-blue-600 text-white" : m.error ? "border border-red-200 bg-red-50 text-red-800" : "border border-slate-200 bg-white"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={bottom} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder={listening ? "Listening…" : "Type your message or use the microphone..."}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button onClick={toggleMic} aria-label={listening ? "Stop voice input" : "Start voice input"} className={`rounded-lg border px-3 ${listening ? "border-red-300 bg-red-50 text-red-600" : "border-slate-200 hover:bg-slate-50"}`}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button onClick={() => send()} disabled={!input.trim() || loading} aria-label="Send message" className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700 disabled:bg-blue-300">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
