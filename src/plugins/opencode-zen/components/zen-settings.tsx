"use client";

import { useState, useEffect } from "react";
import { ZEN_DOCS_URL } from "../constants";

interface Model {
  id: string;
  name: string;
}

export function ZenSettings({ workspaceId }: { workspaceId: string }) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-v4-pro");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/plugins/opencode-zen/models")
      .then((r) => r.json())
      .then((d) => { if (d.models) setModels(d.models); })
      .catch(() => {});
    fetch(`/api/plugins/config?pluginId=opencode-zen&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setApiKey(d.config.apiKey || "");
          setModel(d.config.model || "deepseek-v4-pro");
          setSystemPrompt(d.config.systemPrompt || "");
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  async function save() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/plugins/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginId: "opencode-zen",
        workspaceId,
        enabled: true,
        config: { apiKey, model, systemPrompt },
      }),
    });
    setMessage(res.ok ? "Saved" : "Failed to save");
    setSaving(false);
  }

  return (
    <div>
      <div className="form-group">
        <label>API Key</label>
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="opencode-..." />
      </div>
      <div className="form-group">
        <label>Model</label>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>System Prompt</label>
        <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={3} style={{ width: "100%" }} placeholder="You are a helpful assistant." />
      </div>
      <div className="flex align-center justify-between gap-2">
        <button className="btn primary sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <a href={ZEN_DOCS_URL} target="_blank" rel="noopener" className="text-xs text-muted">
          OpenCode Zen docs →
        </a>
      </div>
      {message && <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
}
