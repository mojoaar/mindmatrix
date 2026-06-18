"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Users, FileText, Webhook } from "lucide-react";
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

interface NonMember {
  id: string;
  name: string;
  email: string;
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
  const [nonMembers, setNonMembers] = useState<NonMember[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["note.created", "note.updated", "note.deleted"]);
  const [webhookActive, setWebhookActive] = useState(true);

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

          const nmRes = await fetch(`/api/workspaces/${ws.id}/non-members`);
          const nmData = await nmRes.json();
          if (nmData.users) setNonMembers(nmData.users);

          const whRes = await fetch(`/api/workspaces/${ws.id}/webhooks`);
          const whData = await whRes.json();
          if (whData.webhooks) setWebhooks(whData.webhooks);
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

  async function createWebhook() {
    if (!workspace || !webhookName.trim() || !webhookUrl.trim()) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/workspaces/${workspace.id}/webhooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: webhookName.trim(),
        url: webhookUrl.trim(),
        secret: webhookSecret.trim() || null,
        events: webhookEvents,
        active: webhookActive,
      }),
    });
    const data = await res.json();
    if (data.webhook) {
      setWebhooks((prev) => [data.webhook, ...prev]);
      setWebhookName("");
      setWebhookUrl("");
      setWebhookSecret("");
      setWebhookEvents(["note.created", "note.updated", "note.deleted"]);
      setWebhookActive(true);
      setShowNewWebhook(false);
      setSuccess("Webhook created successfully");
    } else {
      setError(data.error || "Failed to create webhook");
    }
  }

  async function deleteWebhook(id: string) {
    if (!workspace) return;
    if (!confirm("Delete this webhook?")) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/workspaces/${workspace.id}/webhooks/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      setSuccess("Webhook deleted successfully");
    } else {
      setError("Failed to delete webhook");
    }
  }

  async function toggleWebhookActive(wh: any) {
    if (!workspace) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/workspaces/${workspace.id}/webhooks/${wh.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !wh.active }),
    });
    if (res.ok) {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === wh.id ? { ...w, active: !wh.active } : w))
      );
      setSuccess("Webhook status updated");
    } else {
      setError("Failed to update webhook status");
    }
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
            placeholder="Add by email..."
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            list="eligible-users"
            style={{ flex: 1 }}
          />
          <datalist id="eligible-users">
            {nonMembers.map((u) => (
              <option key={u.id} value={u.email}>
                {u.name}
              </option>
            ))}
          </datalist>
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" className="btn primary sm">Add</button>
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

      {/* Webhooks */}
      <div className="card">
        <div className="flex align-center justify-between" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginBottom: 0 }}>
            <Webhook size={16} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
            Webhooks
          </h3>
          <button className="btn primary sm" onClick={() => setShowNewWebhook(true)}>Add Webhook</button>
        </div>

        {webhooks.length === 0 && !showNewWebhook && (
          <p className="text-muted text-sm">No webhooks yet. Add a webhook to send real-time event payloads to external servers.</p>
        )}

        {showNewWebhook && (
          <div className="card" style={{ marginBottom: "1rem", backgroundColor: "var(--bg-tertiary)" }}>
            <div className="form-group">
              <label>Name</label>
              <input
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="e.g., Slack Integration, Custom Server"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Payload URL</label>
              <input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>
            <div className="form-group">
              <label>Secret (Optional signing key)</label>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Secure signing token"
              />
            </div>
            <div className="form-group">
              <label>Triggers</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "0.5rem" }}>
                {["note.created", "note.updated", "note.deleted", "folder.created", "tag.created"].map((ev) => (
                  <label key={ev} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(ev)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setWebhookEvents((prev) => [...prev, ev]);
                        } else {
                          setWebhookEvents((prev) => prev.filter((item) => item !== ev));
                        }
                      }}
                      style={{ width: "auto" }}
                    />
                    {ev}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="wh-active"
                type="checkbox"
                checked={webhookActive}
                onChange={(e) => setWebhookActive(e.target.checked)}
                style={{ width: "auto" }}
              />
              <label htmlFor="wh-active" style={{ marginBottom: 0, cursor: "pointer" }}>Active</label>
            </div>
            <div className="flex gap-1">
              <button className="btn primary sm" onClick={createWebhook}>Create</button>
              <button className="btn secondary sm" onClick={() => setShowNewWebhook(false)}>Cancel</button>
            </div>
          </div>
        )}

        {webhooks.map((wh) => (
          <div key={wh.id} className="flex align-center justify-between" style={{ padding: "0.75rem 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ overflow: "hidden", marginRight: "1rem" }}>
              <div className="flex align-center gap-1">
                <span className="text-sm" style={{ fontWeight: 500 }}>{wh.name}</span>
                <span className={`badge ${wh.active ? "success" : ""}`} style={{ fontSize: "0.65rem", padding: "0.1rem 0.25rem", backgroundColor: wh.active ? "var(--accent-green)" : "var(--bg-accent)", color: "#fff" }}>
                  {wh.active ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="text-muted text-xs truncate" style={{ marginTop: "0.25rem" }}>{wh.url}</div>
              <div className="text-muted text-xs" style={{ marginTop: "0.1rem" }}>Events: {wh.events?.join(", ")}</div>
            </div>
            <div className="flex gap-1">
              <button className="btn secondary sm" onClick={() => toggleWebhookActive(wh)}>
                {wh.active ? "Disable" : "Enable"}
              </button>
              <button className="btn danger sm" onClick={() => deleteWebhook(wh.id)}>
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Plugins */}
      <h2 style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>Workspace Modules</h2>
      
      {/* AI Group */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ color: "var(--accent-purple)", marginBottom: "0.25rem", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
          Artificial Intelligence
        </h4>
        <p className="text-muted text-xs" style={{ marginBottom: "1rem" }}>
          Leverage AI to assist, rewrite, and query note contexts.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pluginMetadata.filter(p => ["opencode-ai", "opencode-zen"].includes(p.id)).map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} workspaceId={workspace.id} />
          ))}
        </div>
      </div>

      {/* Sync Group */}
      <div style={{ marginBottom: "2rem" }}>
        <h4 style={{ color: "var(--accent-indigo)", marginBottom: "0.25rem", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
          Synchronisation
        </h4>
        <p className="text-muted text-xs" style={{ marginBottom: "1rem" }}>
          Backup and synchronize notes to cloud storage or git repositories.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pluginMetadata.filter(p => ["sync-pcloud", "sync-google-drive", "git-sync"].includes(p.id)).map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} workspaceId={workspace.id} />
          ))}
        </div>
      </div>

      {/* Scanners Group */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h4 style={{ color: "var(--accent-yellow)", marginBottom: "0.25rem", textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.05em" }}>
          Infrastructure Scanners
        </h4>
        <p className="text-muted text-xs" style={{ marginBottom: "1rem" }}>
          Scan server VM details and network topology directly into note tables.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pluginMetadata.filter(p => ["proxmox-inventory", "unifi-topology"].includes(p.id)).map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} workspaceId={workspace.id} />
          ))}
        </div>
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
