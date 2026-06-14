"use client";

import { useState, useEffect } from "react";

export function ProxmoxSettings({ workspaceId }: { workspaceId: string }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("8006");
  const [tokenId, setTokenId] = useState("");
  const [secret, setSecret] = useState("");
  const [verifySSL, setVerifySSL] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/plugins/config?pluginId=proxmox-inventory&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.config) {
          setHost(d.config.config.host || "");
          setPort(d.config.config.port || "8006");
          setTokenId(d.config.config.tokenId || "");
          setSecret(d.config.config.secret || "");
          setVerifySSL(d.config.config.verifySSL !== false);
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
        pluginId: "proxmox-inventory",
        workspaceId,
        enabled: true,
        config: { host, port, tokenId, secret, verifySSL },
      }),
    });
    setMessage(res.ok ? "Saved" : "Failed to save");
    setSaving(false);
  }

  async function scan() {
    setScanning(true);
    setMessage("");
    const res = await fetch("/api/plugins/proxmox-inventory/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await res.json();
    if (res.ok && data.noteId) {
      setMessage(`Inventory note created`);
    } else {
      setMessage(data.error || "Scan failed");
    }
    setScanning(false);
  }

  return (
    <div>
      <div className="form-group">
        <label>Host</label>
        <input type="text" value={host} onChange={(e) => setHost(e.target.value)} placeholder="proxmox.example.com" />
      </div>
      <div className="form-group">
        <label>Port</label>
        <input type="text" value={port} onChange={(e) => setPort(e.target.value)} placeholder="8006" />
      </div>
      <div className="form-group">
        <label>Token ID</label>
        <input type="text" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="user@pam!token-name" />
      </div>
      <div className="form-group">
        <label>Secret</label>
        <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Proxmox API token secret" />
      </div>
      <div className="form-group">
        <label className="flex align-center gap-1" style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={verifySSL} onChange={(e) => setVerifySSL(e.target.checked)} />
          Verify SSL
        </label>
      </div>
      <div className="flex align-center gap-2">
        <button className="btn primary sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button className="btn secondary sm" onClick={scan} disabled={scanning || !host || !tokenId || !secret}>
          {scanning ? "Scanning..." : "Scan Inventory"}
        </button>
      </div>
      {message && <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
}
