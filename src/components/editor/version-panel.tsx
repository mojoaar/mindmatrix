"use client";

import { useState, useEffect } from "react";
import { History, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface Version {
  id: string;
  title: string;
  changeSummary: string | null;
  createdAt: string;
}

interface VersionPanelProps {
  noteId: string;
}

export function VersionPanel({ noteId }: VersionPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/notes/${noteId}/versions`)
      .then((r) => r.json())
      .then((data) => {
        if (data.versions) setVersions(data.versions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [noteId, open]);

  async function restore(versionId: string) {
    const res = await fetch(`/api/notes/${noteId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    if (res.ok) {
      toastSuccess("Note restored. Refresh to see changes.");
    } else {
      toastError("Failed to restore version");
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "1rem", paddingTop: "1rem" }}>
      <button
        className="btn ghost sm flex align-center gap-1 text-xs text-muted"
        onClick={() => setOpen(!open)}
      >
        <History size={12} />
        Version History{versions.length > 0 ? ` (${versions.length})` : ""}
      </button>

      {open && (
        <div style={{ marginTop: "0.5rem" }}>
          {loading && <p className="text-xs text-muted">Loading...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-xs text-muted">No versions yet.</p>
          )}
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex align-center justify-between"
              style={{ padding: "0.25rem 0", borderBottom: "1px solid var(--border-color)" }}
            >
              <div>
                <span className="text-xs">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                className="btn ghost sm"
                onClick={() => restore(v.id)}
                title="Restore this version"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
