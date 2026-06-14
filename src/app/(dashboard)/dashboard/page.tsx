"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Plus, BookOpen, Users } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (data.workspaces) setWorkspaces(data.workspaces);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const data = await res.json();
      if (data.workspace) {
        router.push(`/dashboard/w/${data.workspace.slug}`);
      } else {
        toastError(data.error || "Failed to create workspace");
      }
    } catch {
      toastError("Failed to create workspace");
    }
    setCreating(false);
  }

  return (
    <div>
      <div className="flex align-center justify-between" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: 0 }}>Workspaces</h1>
        <button className="btn primary flex align-center gap-1" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          New Workspace
        </button>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h3>Create Workspace</h3>
          <form onSubmit={createWorkspace}>
            <div className="form-group">
              <label htmlFor="ws-name">Name</label>
              <input
                id="ws-name"
                type="text"
                placeholder="My Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label htmlFor="ws-desc">Description (optional)</label>
              <input
                id="ws-desc"
                type="text"
                placeholder="Team knowledge base"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-1">
              <button type="submit" className="btn primary" disabled={creating}>
                {creating ? "Creating..." : "Create Workspace"}
              </button>
              <button type="button" className="btn secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="text-muted">Loading workspaces...</p>}

      {!loading && workspaces.length === 0 && !showCreate && (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <BookOpen size={32} style={{ color: "var(--fg-muted)", marginBottom: "1rem" }} />
          <h2>No Workspaces Yet</h2>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
            Create a workspace to start organizing your team&apos;s knowledge.
          </p>
          <button className="btn primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} style={{ marginRight: "0.5rem" }} />
            Create Your First Workspace
          </button>
        </div>
      )}

      {workspaces.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.id}>
                  <td>
                    <Link
                      href={`/dashboard/w/${ws.slug}`}
                      className="flex align-center gap-1"
                      style={{ color: "var(--fg-primary)", fontWeight: 500 }}
                    >
                      <BookOpen size={14} />
                      {ws.name}
                    </Link>
                  </td>
                  <td className="text-muted text-sm">{ws.description || "—"}</td>
                  <td>
                    <Link href={`/dashboard/w/${ws.slug}/settings`} className="btn ghost sm">
                      <Users size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
