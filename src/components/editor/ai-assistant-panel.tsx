"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, Copy, ArrowDownToLine, AlertCircle, Bot, User, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";

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
  onClose: () => void;
  onStatusLoaded?: (goActive: boolean, zenActive: boolean) => void;
  userName?: string;
  userImage?: string | null;
}

export function AIAssistantPanel({
  noteId,
  workspaceId,
  noteContent,
  setContent,
  insertAtCursor,
  onClose,
  onStatusLoaded,
  userName,
  userImage,
}: AIAssistantPanelProps) {
  const [goEnabled, setGoEnabled] = useState(false);
  const [zenEnabled, setZenEnabled] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [provider, setProvider] = useState<"go" | "zen">("go");
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
      const gEnabled = !!goData.enabled;
      const zEnabled = !!zenData.enabled;
      setGoEnabled(gEnabled);
      setZenEnabled(zEnabled);
      if (zEnabled && !gEnabled) {
        setProvider("zen");
      }
      if (onStatusLoaded) {
        onStatusLoaded(gEnabled, zEnabled);
      }
      setLoadingConfig(false);
    });

    return () => { cancelled = true; };
  }, [workspaceId, onStatusLoaded]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (loadingConfig) return null;
  if (!goEnabled && !zenEnabled) return null;

  async function performChat(nextMsgs: Message[]) {
    setLoading(true);
    const targetEndpoint = provider === "go" ? "opencode-ai" : "opencode-zen";

    let attempts = 3;
    let res: Response | null = null;
    let lastError: unknown = null;

    for (let i = 0; i < attempts; i++) {
      try {
        res = await fetch(`/api/plugins/${targetEndpoint}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            noteContent,
            messages: nextMsgs,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.content && data.content.trim() !== "") {
            setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
            setLoading(false);
            return;
          } else {
            lastError = new Error("Empty response from AI server.");
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = new Error(errData.error || `AI assist failed with status ${res.status}`);
        }
      } catch (e: unknown) {
        lastError = e;
      }

      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    toastError((lastError instanceof Error ? lastError.message : undefined) || "AI assist failed after 3 attempts");
    setLoading(false);
  }

  async function submit() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setBody("");
    await performChat(nextMsgs);
  }

  async function retryLast() {
    if (loading) return;
    const lastUserMsg = messages[messages.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== "user") return;
    await performChat(messages);
  }

  function appendContent(text: string) {
    setContent(noteContent ? `${noteContent}\n\n${text}` : text);
    toastSuccess("Appended to note");
  }

  return (
    <div 
      className="card" 
      style={{ 
        height: "100%", 
        maxHeight: "calc(100vh - 250px)", 
        display: "flex", 
        flexDirection: "column", 
        gap: "1rem", 
        padding: "1rem",
        margin: 0,
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="flex align-center justify-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
        <div className="flex align-center gap-1">
          <Sparkles size={14} style={{ color: "var(--accent-purple)" }} />
          <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>AI Assistant</span>
        </div>
        
        <div className="flex align-center gap-2">
          {goEnabled && zenEnabled && (
            <div className="flex" style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--border-radius)", padding: "2px" }}>
              <button
                className={`btn sm ${provider === "go" ? "primary" : "ghost"}`}
                onClick={() => setProvider("go")}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              >
                Go
              </button>
              <button
                className={`btn sm ${provider === "zen" ? "primary" : "ghost"}`}
                onClick={() => setProvider("zen")}
                style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}
              >
                Zen
              </button>
            </div>
          )}
          
          <button className="btn ghost sm" onClick={onClose} style={{ padding: "0.2rem" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          paddingRight: "0.25rem",
        }}
      >
        {messages.length === 0 && (
          <div className="flex align-center gap-2 text-xs text-muted" style={{ padding: "2rem 0", justifyContent: "center", flexDirection: "column", flex: 1 }}>
            <Bot size={18} style={{ color: "var(--accent-purple)" }} />
            <span>Ask the AI to improve, summarize, rewrite, or analyze this note.</span>
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
                maxWidth: "85%",
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
              <div style={{ flexShrink: 0 }}>
                <Avatar name={userName || "User"} email="" image={userImage} size={24} />
              </div>
            )}
          </div>
        ))}

        {!loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div className="flex gap-2 align-center" style={{ backgroundColor: "rgba(235, 203, 139, 0.1)", border: "1px dashed var(--accent-yellow)", borderRadius: "var(--border-radius)", padding: "0.5rem 0.75rem", margin: "0.5rem 0" }}>
            <AlertCircle size={14} style={{ color: "var(--accent-yellow)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>AI failed to respond.</span>
            <button
              className="btn secondary sm"
              style={{ padding: "0.15rem 0.5rem", fontSize: "0.75rem", marginLeft: "auto", height: "auto" }}
              onClick={retryLast}
            >
              Retry
            </button>
          </div>
        )}

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

      {/* Input bar */}
      <div className="flex gap-1" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
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
  );
}
