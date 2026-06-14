"use client";

import { Cloud } from "lucide-react";

export default function SyncPage() {
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
        <button className="btn secondary sm" disabled>
          Coming Soon
        </button>
      </div>

      <div className="card">
        <h3>
          <Cloud size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
          Google Drive
        </h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Sync notes to a MindMatrix folder in your Google Drive.
        </p>
        <button className="btn secondary sm" disabled>
          Coming Soon
        </button>
      </div>

      <div className="card">
        <h3>Manual Sync</h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Trigger a manual sync for all connected providers.
        </p>
        <button className="btn primary" disabled>
          Coming Soon
        </button>
      </div>
    </div>
  );
}
