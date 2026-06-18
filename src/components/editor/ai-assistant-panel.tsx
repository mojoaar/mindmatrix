"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Copy, ArrowDownToLine, AlertCircle, Bot, User } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantPanelProps {
  noteId: string;
  workspaceId: string;
  noteContent: string;
  setContent: (content: string) => void;
  insertAtCursor: (text: string) => void;
}

export function AIAssistantPanel({
  noteId,
  workspaceId,
  noteContent,
  setContent,
  insertAtCursor,
}: AIAssistantPanelProps) {
  const [goEnabled, setGoEnabled] = useState(false);
  const [zenEnabled, setZenEnabled] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [provider, setProvider] = useState<"go" | "zen">("go");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/plugins/config?pluginId=opencode-ai&workspaceId=${workspaceId}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ enabled: false })),
      fetch(`/api/plugins/config?pluginId=opencode-zen&workspaceId=${workspaceId}`, { cache: "no-store" })
        .then((r) => r.json())
        .catch(() => ({ enabled: false })),
    ]).then(([goData, zenData]) => {
      if (cancelled) return;
      setGoEnabled(!!goData.enabled);
      setZenEnabled(!!zenData.enabled);
      if (zenData.enabled && !goData.enabled) {
        setProvider("zen");
      }
      setLoadingConfig(false);
    });

    return () => { cancelled = true; };
  }, [workspaceId]);

  useEffect(() => {
    if (open) {
      threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  if (loadingConfig) return null;
  if (!goEnabled && !zenEnabled) return null;

  async function submit() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setBody("");
    setLoading(true);

    const targetEndpoint = provider === "go" ? "opencode-ai" : "opencode-zen";

    try {
      const res = await fetch(`/api/plugins/${targetEndpoint}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          noteContent,
          messages: nextMsgs,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toastError(errData.error || "AI assist failed");
        setMessages((prev) => prev.slice(0, -1)); // remove last user message on fail
      } else {
        const data = await res.json();
        if (data.content !== undefined) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
        } else {
          toastError("No content returned");
        }
      }
    } catch {
      toastError("Network error. AI assist failed.");
    } finally {
      setLoading(false);
    }
  }

  function appendContent(text: string) {
    setContent(noteContent ? `${noteContent}\n\n${text}` : text);
    toastSuccess("Appended to note");
  }

  return (
    <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "1rem", paddingTop: "1rem" }}>
      <button
        className="btn ghost sm flex align-center gap-1 text-xs text-muted"
        onClick={() => setOpen(!open)}
      >
        <Sparkles size={12} style={{ color: "var(--accent-purple)" }} />
        AI Assistant
      </button>

      {open && (
        <div className="card" style={{ marginTop: "0.75rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {goEnabled && zenEnabled && (
            <div className="flex gap-1" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              <button
                className={`btn ${provider === "go" ? "primary" : "secondary"} sm`}
                onClick={() => setProvider("go")}
              >
                OpenCode Go
              </button>
              <button
                className={`btn ${provider === "zen" ? "primary" : "secondary"} sm`}
                onClick={() => setProvider("zen")}
              >
                OpenCode Zen
              </button>
            </div>
          )}

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              paddingRight: "0.25rem",
            }}
          >
            {messages.length === 0 && (
              <div className="flex align-center gap-2 text-xs text-muted" style={{ padding: "1rem 0", justifyContent: "center" }}>
                <Bot size={14} />
                Ask the AI to improve, summarize, rewrite, or analyze this note.
              </div>
            )}

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "rgba(180, 142, 173, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Bot size={12} style={{ color: "var(--accent-purple)" }} />
                  </div>
                )}

                <div
                  className={`chat-bubble ${m.role}`}
                  style={{
                    maxWidth: "80%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "var(--border-radius)",
                    fontSize: "0.85rem",
                    backgroundColor: m.role === "user" ? "var(--bg-tertiary)" : "rgba(180, 142, 173, 0.08)",
                    border: m.role === "user" ? "1px solid var(--border-color)" : "1px dashed rgba(180, 142, 173, 0.25)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}

                  {m.role === "assistant" && (
                    <div className="flex gap-1" style={{ marginTop: "0.5rem", borderTop: "1px dashed var(--border-color)", paddingTop: "0.5rem" }}>
                      <button
                        className="btn ghost sm"
                        style={{ padding: "0.15rem 0.35rem", fontSize: "0.7rem", height: "auto" }}
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          toastSuccess("Copied to clipboard");
                        }}
                      >
                        <Copy size={10} style={{ marginRight: "0.2rem" }} />
                        Copy
                      </button>
                      <button
                        className="btn ghost sm"
                        style={{ padding: "0.15rem 0.35rem", fontSize: "0.7rem", height: "auto" }}
                        onClick={() => insertAtCursor(m.content)}
                      >
                        <ArrowDownToLine size={10} style={{ marginRight: "0.2rem" }} />
                        Insert
                      </button>
                      <button
                        className="btn ghost sm"
                        style={{ padding: "0.15rem 0.35rem", fontSize: "0.7rem", height: "auto" }}
                        onClick={() => appendContent(m.content)}
                      >
                        <ArrowDownToLine size={10} style={{ marginRight: "0.2rem" }} />
                        Append
                      </button>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <User size={12} style={{ color: "var(--fg-secondary)" }} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: "rgba(180, 142, 173, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={12} className="spin" style={{ color: "var(--accent-purple)" }} />
                </div>
                <div className="text-xs text-muted" style={{ padding: "0.5rem" }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={threadEndRef} />
          </div>

          <div className="flex gap-1">
            <input
              placeholder="Ask AI anything..."
              value={input}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !loading) submit(); }}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button className="btn primary sm" onClick={submit} disabled={loading || !input.trim()}>
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
