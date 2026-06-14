"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Users } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const wsRes = await fetch(`/api/workspaces`);
      const wsData = await wsRes.json();
      if (wsData.workspaces) {
        const ws = wsData.workspaces.find((w: { slug: string }) => w.slug === slug);
        if (ws) {
          setWorkspace(ws);
          setName(ws.name);
          setDescription(ws.description || "");

          const memRes = await fetch(`/api/workspaces/${ws.id}/members`);
          const memData = await memRes.json();
          if (memData.members) setMembers(memData.members);
        }
      }
    }
    load();
  }, [slug]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setError("");
    setSuccess("");

    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (res.ok) {
      setSuccess("Settings saved");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save");
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace || !inviteEmail) return;
    setError("");

    const res = await fetch(`/api/workspaces/${workspace.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    if (res.ok) {
      setInviteEmail("");
      const memRes = await fetch(`/api/workspaces/${workspace.id}/members`);
      const memData = await memRes.json();
      if (memData.members) setMembers(memData.members);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to invite member");
    }
  }

  async function deleteWorkspace() {
    if (!workspace) return;
    if (!confirm(`Delete workspace "${workspace.name}"? This action cannot be undone.`)) return;

    await fetch(`/api/workspaces/${workspace.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (!workspace) {
    return <div className="container"><p className="text-muted">Loading...</p></div>;
  }

  return (
    <div>
      <h1>Workspace Settings</h1>

      {error && <div className="card" style={{ padding: "0.75rem", borderColor: "var(--accent-red)", color: "var(--accent-red)", marginBottom: "1rem" }}>{error}</div>}
      {success && <div className="card" style={{ padding: "0.75rem", borderColor: "var(--accent-green)", color: "var(--accent-green)", marginBottom: "1rem" }}>{success}</div>}

      <div className="card">
        <h3>General</h3>
        <form onSubmit={saveSettings}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit" className="btn primary">Save Changes</button>
        </form>
      </div>

      <div className="card">
        <div className="flex align-center justify-between" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: 0 }}>
            <Users size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            Members
          </h3>
        </div>

        <div className="table-wrapper" style={{ marginBottom: "1rem" }}>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td className="text-muted text-sm">{m.user.email}</td>
                  <td><span className="badge">{m.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={inviteMember} className="flex align-center gap-2">
          <input
            type="email"
            placeholder="Email to invite"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn primary sm">Invite</button>
        </form>
      </div>

      <div className="card" style={{ borderColor: "var(--accent-red)" }}>
        <h3 style={{ color: "var(--accent-red)" }}>Danger Zone</h3>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Deleting this workspace will remove all notes, folders, and tags permanently.
        </p>
        <button className="btn danger" onClick={deleteWorkspace}>
          <Trash2 size={14} style={{ marginRight: "0.5rem" }} />
          Delete Workspace
        </button>
      </div>
    </div>
  );
}
