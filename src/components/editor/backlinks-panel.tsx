"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";

interface LinkedNote {
  id: string;
  title: string;
  slug: string;
}

interface BacklinksPanelProps {
  noteId: string;
  workspaceSlug: string;
}

export function BacklinksPanel({ noteId, workspaceSlug }: BacklinksPanelProps) {
  const [incoming, setIncoming] = useState<LinkedNote[]>([]);
  const [outgoing, setOutgoing] = useState<LinkedNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/notes/${noteId}/links`)
      .then((r) => r.json())
      .then((data) => {
        if (data.links) {
          setIncoming(data.links.incoming || []);
          setOutgoing(data.links.outgoing || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [noteId]);

  if (loading) return null;
  if (incoming.length === 0 && outgoing.length === 0) return null;

  return (
    <div
      style={{
        borderTop: "1px solid var(--border-color)",
        marginTop: "1rem",
        paddingTop: "1rem",
      }}
    >
      <h4 className="text-sm" style={{ color: "var(--fg-muted)", marginBottom: "0.5rem" }}>
        <Link2 size={12} style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
        Backlinks
      </h4>

      {incoming.length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          <span className="text-xs text-muted">Links from:</span>
          {incoming.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/w/${workspaceSlug}/notes/${n.id}`}
              className="text-sm"
              style={{ display: "block", paddingLeft: "0.5rem", color: "var(--accent-cyan)" }}
            >
              ← {n.title}
            </Link>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <span className="text-xs text-muted">Links to:</span>
          {outgoing.map((n) => (
            <Link
              key={n.id}
              href={`/dashboard/w/${workspaceSlug}/notes/${n.id}`}
              className="text-sm"
              style={{ display: "block", paddingLeft: "0.5rem", color: "var(--accent-cyan)" }}
            >
              → {n.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
