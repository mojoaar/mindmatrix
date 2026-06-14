"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Users, FileText } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import { PluginCard } from "@/components/ui/plugin-card";
import { pluginMetadata } from "@/plugins/metadata";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface Template {
  id: string;
  name: string;
  content: string;
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("BookOpen");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [showNewTemplate, setShowNewTemplate] = useState(false);

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
          setIcon(ws.icon || "BookOpen");

          const memRes = await fetch(`/api/workspaces/${ws.id}/members`);
          const memData = await memRes.json();
          if (memData.members) setMembers(memData.members);

          const tplRes = await fetch(`/api/templates?workspaceId=${ws.id}`);
          const tplData = await tplRes.json();
          if (tplData.templates) setTemplates(tplData.templates);
        }
      }
    }
    load();
  }, [slug]);

  async function createTemplate() {
    if (!workspace || !newTemplateName.trim()) return;
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: workspace.id, name: newTemplateName.trim(), content: newTemplateContent }),
    });
    const data = await res.json();
    if (data.template) {
      setTemplates((prev) => [...prev, data.template]);
      setNewTemplateName("");
      setNewTemplateContent("");
      setShowNewTemplate(false);
      setSuccess("Template created");
    } else {
      setError(data.error || "Failed to create template");
    }
  }

  async function deleteTemplate(id: string) {
    if (!workspace) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;
    setError("");
    setSuccess("");

    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, icon }),
    });

    if (res.ok) {
      setSuccess("Settings saved");
      window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
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
            <label>Icon</label>
            <IconPicker value={icon} onChange={setIcon} />
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

      <div className="card">
        <div className="flex align-center justify-between" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: 0 }}>
            <FileText size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            Note Templates
          </h3>
          <button className="btn primary sm" onClick={() => setShowNewTemplate(true)}>New Template</button>
        </div>

        {templates.length === 0 && !showNewTemplate && (
          <p className="text-muted text-sm">No templates yet. Create one to use as a starting point for new notes.</p>
        )}

        {showNewTemplate && (
          <div className="card" style={{ marginBottom: "1rem", backgroundColor: "var(--bg-tertiary)" }}>
            <div className="form-group">
              <label>Template Name</label>
              <input
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="e.g., ADR, Runbook, Meeting Notes"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Content (Markdown)</label>
              <textarea
                value={newTemplateContent}
                onChange={(e) => setNewTemplateContent(e.target.value)}
                rows={6}
                style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
                placeholder="# Template title&#10;&#10;Start writing..."
              />
            </div>
            <div className="flex gap-1">
              <button className="btn primary sm" onClick={createTemplate}>Create</button>
              <button className="btn secondary sm" onClick={() => setShowNewTemplate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {templates.map((t) => (
          <div key={t.id} className="flex align-center justify-between" style={{ padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <span className="text-sm" style={{ fontWeight: 500 }}>{t.name}</span>
              <span className="text-muted text-xs" style={{ marginLeft: "0.5rem" }}>
                {t.content.slice(0, 80)}{t.content.length > 80 ? "..." : ""}
              </span>
            </div>
            <button className="btn danger sm" onClick={() => deleteTemplate(t.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Plugins */}
      {pluginMetadata.map((plugin) => (
        <PluginCard key={plugin.id} plugin={plugin} workspaceId={workspace.id} />
      ))}

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
