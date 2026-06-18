"use client";

import { useState, useEffect } from "react";

export function GitSettings({ workspaceId }: { workspaceId: string }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [authType, setAuthType] = useState<"https" | "ssh">("https");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/plugins/config?pluginId=git-sync&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config) {
          setRepoUrl(d.config.repoUrl || "");
          setBranch(d.config.branch || "main");
          setAuthType(d.config.authType || "https");
          setUsername(d.config.username || "");
          setPassword(d.config.password || "");
          setPrivateKey(d.config.privateKey || "");
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
        pluginId: "git-sync",
        workspaceId,
        enabled: true,
        config: { repoUrl, branch, authType, username, password, privateKey },
      }),
    });
    setMessage(res.ok ? "Saved configuration" : "Failed to save configuration");
    setSaving(false);
  }

  async function pull() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/plugins/git-sync/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Pull and merge completed successfully" : data.error || "Pull failed");
    } catch {
      setMessage("Pull failed");
    }
    setSyncing(false);
  }

  async function push() {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/plugins/git-sync/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Commit and push completed successfully" : data.error || "Push failed");
    } catch {
      setMessage("Push failed");
    }
    setSyncing(false);
  }

  return (
    <div>
      <div className="form-group">
        <label>Repository URL</label>
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="git@github.com:username/repo.git or https://github.com/username/repo.git"
        />
      </div>

      <div className="form-group">
        <label>Branch</label>
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="main"
        />
      </div>

      <div className="form-group">
        <label>Authentication Type</label>
        <div className="flex gap-1" style={{ marginTop: "0.25rem" }}>
          {(["https", "ssh"] as const).map((type) => (
            <button
              key={type}
              type="button"
              className={`btn ${authType === type ? "primary" : "secondary"} sm`}
              onClick={() => setAuthType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {authType === "https" ? (
        <>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Git username"
            />
          </div>
          <div className="form-group">
            <label>Token / Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Personal Access Token (PAT)"
            />
          </div>
        </>
      ) : (
        <div className="form-group">
          <label>SSH Private Key</label>
          <textarea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            rows={6}
            style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", width: "100%" }}
            placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
          />
        </div>
      )}

      <div className="flex align-center gap-2" style={{ marginTop: "1rem" }}>
        <button className="btn primary sm" onClick={save} disabled={saving || syncing}>
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        <button className="btn secondary sm" onClick={pull} disabled={saving || syncing || !repoUrl}>
          {syncing ? "Syncing..." : "Pull & Merge"}
        </button>
        <button className="btn secondary sm" onClick={push} disabled={saving || syncing || !repoUrl}>
          {syncing ? "Syncing..." : "Commit & Push"}
        </button>
      </div>

      {message && <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>{message}</p>}
    </div>
  );
}
