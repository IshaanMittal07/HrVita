// Small API server that keeps your Anthropic API key off the browser.
// The Vite dev server proxies /api/* here (see vite.config.js).
import "dotenv/config";
import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const SYSTEM = `You are the HrVita AI Assistant, built into a heart rate variability (HRV) monitoring dashboard.
HrVita reads heart rate from an ESP32 sensor and tracks the rolling standard deviation (SD) of the last 10 heart-rate readings as its variability measure. Lower SD means lower variability; the app flags SD under 15 as critical and under 25 as high priority.
Help users understand HRV, interpret the patient data provided, and use the system. Be clear and concise.
You are not a substitute for a clinician: for anything that looks urgent, advise contacting a healthcare professional.`;

app.post("/api/chat", async (req, res) => {
  if (!client) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set on the server" });
  const { messages = [], context = "" } = req.body;
  const clean = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && !m.error)
    .slice(-20);
  if (!clean.length || clean.at(-1).role !== "user") return res.status(400).json({ error: "Last message must be from the user" });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: `${SYSTEM}\n\nCurrent patient data:\n${context}`,
      messages: clean.map(({ role, content }) => ({ role, content })),
    });
    const reply = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "Assistant request failed" });
  }
});

app.listen(PORT, () => console.log(`HrVita API listening on http://localhost:${PORT}`));
