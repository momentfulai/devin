"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Icon } from "./Icon";

const suggestions = [
  "Am I too concentrated?",
  "Explain my fees",
  "Why sell Nvidia?",
  "What if markets fall 30%?",
];

const toolLabels: Record<string, string> = {
  getPortfolio: "Reading your accounts",
  getHolding: "Looking up the holding",
  getRisk: "Checking what you react to",
  getRecommendations: "Re-reading the suggestions",
  explainRecommendation: "Pulling up the working",
  getOpportunities: "Scanning for gaps",
  whatIf: "Running the fall through your money",
};

export function Chat() {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat();
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  if (!open) {
    return (
      <button className="chat-launcher" onClick={() => setOpen(true)}>
        Ask Northstar
      </button>
    );
  }

  return (
    <aside className="chat card" aria-label="Ask Northstar">
      <div className="head">
        <span
          className="mark"
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background: "linear-gradient(135deg,var(--accent),var(--purple))",
          }}
        />
        <b style={{ flex: 1, fontSize: 14 }}>Ask Northstar</b>
        <span className="chip good">live</span>
        <button
          className="btn sec sm"
          onClick={() => setOpen(false)}
          aria-label="Hide the assistant"
          style={{ padding: "4px 9px" }}
        >
          Hide
        </button>
      </div>

      <div className="body" ref={body}>
        <div className="msg bot">
          I have read your 3 accounts. Ask me anything about your money and I will show the working.
        </div>

        {messages.map((m) => (
          <div key={m.id} style={{ display: "grid", gap: 6 }}>
            {m.parts.map((part, i) => {
              if (part.type === "text") {
                return (
                  <div key={i} className={`msg ${m.role === "user" ? "me" : "bot"}`}>
                    {part.text}
                  </div>
                );
              }
              if (part.type.startsWith("tool-")) {
                const name = part.type.replace("tool-", "");
                return (
                  <span key={i} className="chip info" style={{ justifySelf: "start" }}>
                    <Icon name="spark" className="a" style={{ width: 12, height: 12 }} />
                    {toolLabels[name] ?? name}
                  </span>
                );
              }
              return null;
            })}
          </div>
        ))}

        {busy && <div className="tiny">Thinking…</div>}

        {error && (
          <div className="msg bot" style={{ color: "var(--bad)" }}>
            I could not answer that. If this is a fresh install, add an OPENAI_API_KEY to .env.local and
            restart.
          </div>
        )}
      </div>

      <div className="chips">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="foot"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your money…"
          aria-label="Ask about your money"
        />
        <button className="btn blue" type="submit" disabled={busy} aria-label="Send">
          <Icon name="send" className="w" />
        </button>
      </form>
    </aside>
  );
}
