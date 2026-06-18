"use client";

import { useState, useEffect, useCallback } from "react";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

export function DriveSettings({ workspaceId }: { workspaceId: string }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  const loadConfig = useCallback(() => {
    fetch(`/api/plugins/config?pluginId=sync-google-drive&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setClientId(d.config.clientId || "");
          setClientSecret(d.config.clientSecret || "");
          setConnected(!!d.config.accessToken);
        }
      })
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function saveAndLink() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/plugins/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginId: "sync-google-drive",
        workspaceId,
        enabled: true,
        config: { clientId, clientSecret },
      }),
    });
    if (!res.ok) {
      setMessage("Failed to save credentials");
      setSaving(false);
      return;
    }
    setSaving(false);

    const redirectUri = `${window.location.origin}/api/oauth/google-drive`;
    const state = btoa(JSON.stringify({ workspaceId }));
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      scope: DRIVE_SCOPE,
      access_type: "offline",
      prompt: "consent",
    });
    window.location.href = `${GOOGLE_AUTH}?${params.toString()}`;
  }

  async function syncNow() {
    setSyncing(true);
    setMessage("");
    const res = await fetch("/api/plugins/sync-google-drive/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    const data = await res.json();
    setMessage(data.synced !== undefined ? `Synced ${data.synced} notes` : (data.error || "Sync failed"));
    setSyncing(false);
  }

  async function unlink() {
    setSaving(true);
    await fetch("/api/plugins/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginId: "sync-google-drive",
        workspaceId,
        enabled: true,
        config: { clientId, clientSecret },
      }),
    });
    setConnected(false);
    setMessage("Google Drive disconnected");
    setSaving(false);
  }

  return (
    <div>
      {connected ? (
        <div>
          <p className="text-xs" style={{ color: "var(--accent-green)", marginBottom: "0.75rem" }}>
            Connected to Google Drive
          </p>
          <div className="flex align-center gap-2">
            <button className="btn primary sm" onClick={syncNow} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Notes Now"}
            </button>
            <button className="btn secondary sm" onClick={unlink} disabled={saving}>
              {saving ? "Unlinking..." : "Unlink"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="form-group">
            <label>Client ID</label>
            <input type="text" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Google OAuth client ID" />
          </div>
          <div className="form-group">
            <label>Client Secret</label>
            <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Google OAuth client secret" />
          </div>
          <p className="text-xs text-muted" style={{ marginBottom: "0.75rem" }}>
            Create an OAuth 2.0 client ID at{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">
              Google Cloud Console
            </a>
            {" "}and add{" "}
            <code>{typeof window !== "undefined" ? `${window.location.origin}/api/oauth/google-drive` : ""}</code>
            {" "}as an authorized redirect URI.
          </p>
          <button className="btn primary sm" onClick={saveAndLink} disabled={saving || !clientId || !clientSecret}>
            {saving ? "Connecting..." : "Link Google Drive"}
          </button>
        </div>
      )}
      {message && <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
}
