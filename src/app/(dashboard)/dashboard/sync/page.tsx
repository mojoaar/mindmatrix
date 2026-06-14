"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";

export default function SyncPage() {
  const [pCloudConnected, setPCloudConnected] = useState(false);
  const [gDriveConnected, setGDriveConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const [pcRes, gdRes] = await Promise.all([
          fetch("/api/sync/pcloud"),
          fetch("/api/sync/google-drive"),
        ]);
        const pcData = await pcRes.json();
        const gdData = await gdRes.json();
        setPCloudConnected(pcData.connections?.some((c: { provider: string }) => c.provider === "pcloud") || false);
        setGDriveConnected(gdData.connected || false);
      } catch {
        // ignore
      }
    }
    check();
  }, []);

  async function syncNow() {
    setSyncing(true);
    // For MVP, just simulates
    setTimeout(() => setSyncing(false), 2000);
  }

  return (
    <div>
      <h1>Cloud Sync</h1>
      <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
        Connect cloud storage providers to sync your notes.
      </p>

      <div className="card">
        <h3>
          <Cloud size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
          pCloud
        </h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Sync notes to your pCloud account. Notes are stored in a MindMatrix folder.
        </p>
        <div className="flex align-center gap-2">
          {pCloudConnected ? (
            <>
              <span className="badge" style={{ backgroundColor: "var(--accent-green)", color: "#fff" }}>Connected</span>
              <button className="btn secondary sm" onClick={() => setPCloudConnected(false)}>
                <CloudOff size={14} style={{ marginRight: "0.5rem" }} />
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn primary sm" onClick={() => setPCloudConnected(true)}>
              Connect pCloud
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>
          <Cloud size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
          Google Drive
        </h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Sync notes to a MindMatrix folder in your Google Drive.
        </p>
        <div className="flex align-center gap-2">
          {gDriveConnected ? (
            <>
              <span className="badge" style={{ backgroundColor: "var(--accent-green)", color: "#fff" }}>Connected</span>
              <button className="btn secondary sm" onClick={() => setGDriveConnected(false)}>
                <CloudOff size={14} style={{ marginRight: "0.5rem" }} />
                Disconnect
              </button>
            </>
          ) : (
            <button className="btn primary sm" onClick={() => setGDriveConnected(true)}>
              Connect Google Drive
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Manual Sync</h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Trigger a manual sync for all connected providers.
        </p>
        <button
          className="btn primary"
          onClick={syncNow}
          disabled={syncing || (!pCloudConnected && !gDriveConnected)}
        >
          <RefreshCw size={14} className={syncing ? "spin" : ""} style={{ marginRight: "0.5rem" }} />
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
      </div>
    </div>
  );
}
