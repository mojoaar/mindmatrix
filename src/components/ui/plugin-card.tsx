"use client";

import { useState, useEffect, Suspense, lazy, ComponentType } from "react";

const OpenCodeSettings = lazy(() =>
  import("@/plugins/opencode-ai/components/ai-settings").then((m) => ({ default: m.OpenCodeSettings }))
);

const settingsMap: Record<string, ComponentType<{ workspaceId: string }>> = {
  "opencode-ai": OpenCodeSettings,
};

interface PluginMeta {
  id: string;
  name: string;
  description: string;
  version: string;
}

export function PluginCard({ plugin, workspaceId }: { plugin: PluginMeta; workspaceId: string }) {
  const [enabled, setEnabled] = useState(false);
  const SettingsComponent = settingsMap[plugin.id];

  useEffect(() => {
    fetch(`/api/plugins/config?pluginId=${plugin.id}&workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.config?.enabled) setEnabled(d.config.enabled);
      })
      .catch(() => {});
  }, [plugin.id, workspaceId]);

  async function toggle() {
    const newState = !enabled;
    setEnabled(newState);
    await fetch("/api/plugins/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pluginId: plugin.id, workspaceId, enabled: newState }),
    });
  }

  return (
    <div className="card">
      <div className="flex align-center justify-between" style={{ marginBottom: "0.5rem" }}>
        <div>
          <h3 style={{ marginBottom: 0 }}>{plugin.name}</h3>
          <p className="text-muted text-xs">{plugin.description}</p>
        </div>
        <button
          className={`btn sm ${enabled ? "primary" : "secondary"}`}
          onClick={toggle}
        >
          {enabled ? "Enabled" : "Disabled"}
        </button>
      </div>

      {enabled && SettingsComponent && (
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          <Suspense fallback={<p className="text-xs text-muted">Loading...</p>}>
            <SettingsComponent workspaceId={workspaceId} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
