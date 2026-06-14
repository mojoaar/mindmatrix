"use client";

import { useState, useEffect } from "react";

export function UnifiSettings({ workspaceId }: { workspaceId: string }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [site, setSite] = useState("default");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/plugins/config?pluginId=unifi-topology&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.config) {
          setHost(d.config.config.host || "");
          setPort(d.config.config.port || "443");
          setUsername(d.config.config.username || "");
          setPassword(d.config.config.password || "");
          setSite(d.config.config.site || "default");
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
        pluginId: "unifi-topology",
        workspaceId,
        enabled: true,
        config: { host, port, username, password, site },
      }),
    });
    setMessage(res.ok ? "Saved" : "Failed to save");
    setSaving(false);
  }

  async function scan() {
    setScanning(true);
    setMessage("");
    const res = await fetch("/api/plugins/unifi-topology/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await res.json();
    if (res.ok && data.noteId) {
      setMessage(`Topology note created`);
    } else {
      setMessage(data.error || "Scan failed");
    }
    setScanning(false);
  }

  return (
    <div>
      <div className="form-group">
        <label>Host</label>
        <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="unifi.example.com" />
      </div>
      <div className="form-group">
        <label>Port</label>
        <input type="text" value={port} onChange={(e) => setPort(e.target.value)} placeholder="443" />
      </div>
      <div className="form-group">
        <label>Username</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Unifi controller password" />
      </div>
      <div className="form-group">
        <label>Site</label>
        <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="default" />
      </div>
      <div className="flex align-center gap-2">
        <button className="btn primary sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="btn secondary sm" onClick={scan} disabled={scanning || !host || !username || !password}>
          {scanning ? "Scanning..." : "Scan Network"}
        </button>
      </div>
      {message && <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
}
