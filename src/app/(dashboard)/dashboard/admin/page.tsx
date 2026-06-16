"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Building2, FileText, Activity, Search, Trash2, Shield, User, Settings2, Mail } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatDate as fmtDate } from "@/lib/date-format";
import { DEFAULT_VERIFY_TEMPLATE, DEFAULT_RESET_TEMPLATE } from "@/lib/email-templates";

interface Stats {
  users: number;
  workspaces: number;
  notes: number;
  folders: number;
  tags: number;
  enabledPlugins: number;
  syncConnections: number;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  noteCount: number;
  owner?: { id: string; name: string; email: string };
  members?: { id: string; role: string; user?: { id: string; name: string; email: string } }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
}

type Tab = "overview" | "workspaces" | "users" | "audit" | "settings";

export default function AdminPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [timezone, setTimezone] = useState("browser");
  const [timeFormat, setTimeFormat] = useState("browser");
  const [dateFormat, setDateFormat] = useState("browser");
  const [settingsConfig, setSettingsConfig] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [logSearch, setLogSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);
  const [emailTestStatus, setEmailTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [emailTestMessage, setEmailTestMessage] = useState("");

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) {
      router.push("/dashboard");
      return;
    }
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
    }
  }, [router]);

  const loadWorkspaces = useCallback(async () => {
    const res = await fetch("/api/admin/workspaces");
    if (res.ok) {
      const data = await res.json();
      setWorkspaces(data.workspaces);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
  }, []);

  const loadLogs = useCallback(async (page: number) => {
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogTotal(data.pagination.total);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/admin/settings");
    if (res.ok) {
      const data = await res.json();
      if (data.config) setSettingsConfig(data.config);
    }
  }, []);

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.profile?.role !== "super_admin") {
        router.push("/dashboard");
        return;
      }
      setTimezone(data.profile.timezone || "browser");
      setTimeFormat(data.profile.timeFormat || "browser");
      setDateFormat(data.profile.dateFormat || "browser");
      setAuthorized(true);
      setLoading(false);
    }
    init();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadStats();
    loadWorkspaces();
    loadUsers();
    loadLogs(1);
  }, [authorized, loadStats, loadWorkspaces, loadUsers, loadLogs]);

  const handleDeleteWorkspace = async (wsId: string, wsName: string) => {
    if (!confirm(`Delete workspace "${wsName}"? This cannot be undone.`)) return;
    setDeleting(wsId);
    try {
      const res = await fetch(`/api/admin/workspaces/${wsId}`, { method: "DELETE" });
      if (res.ok) {
        setWorkspaces((prev) => prev.filter((w) => w.id !== wsId));
        toastSuccess(`Workspace "${wsName}" deleted`);
        loadStats();
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to delete workspace");
      }
    } catch {
      toastError("Failed to delete workspace");
    }
    setDeleting(null);
  };

  const handleToggleRole = async (targetUser: User) => {
    if (targetUser.id === "self") return;
    const newRole = targetUser.role === "super_admin" ? "user" : "super_admin";
    if (!confirm(`Change ${targetUser.name}'s role from "${targetUser.role}" to "${newRole}"?`)) return;

    setTogglingRole(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
        toastSuccess(`${targetUser.name} is now ${newRole}`);
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to update role");
      }
    } catch {
      toastError("Failed to update role");
    }
    setTogglingRole(null);
  };

  const handleVerifyUser = async (targetUser: User) => {
    setTogglingRole(targetUser.id);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailVerified: true }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, emailVerified: true } : u))
        );
        toastSuccess(`${targetUser.name} verified`);
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to verify");
      }
    } catch {
      toastError("Failed to verify");
    }
    setTogglingRole(null);
  };

  const handleLogSearch = async () => {
    const params = new URLSearchParams({ page: "1", limit: "50" });
    if (logSearch) params.set("search", logSearch);
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogTotal(data.pagination.total);
      setLogPage(1);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (!authorized) return null;

  function formatDate(iso: string): string {
    return fmtDate(iso, {
      timezone,
      timeFormat: timeFormat as "browser" | "12h" | "24h",
      dateFormat: dateFormat as "browser" | "iso" | "us" | "eu" | "long" | "short",
    });
  }

  const saveConfig = async (key: string, value: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSettingsConfig((prev) => ({ ...prev, [key]: value }));
        toastSuccess("Setting saved");
      } else {
        const data = await res.json();
        toastError(data.error || "Failed to save setting");
      }
    } catch {
      toastError("Failed to save setting");
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "workspaces", label: "Workspaces", icon: Building2 },
    { id: "users", label: "Users", icon: Users },
    { id: "audit", label: "Audit Logs", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings2 },
  ];

  const statCards = stats
    ? [
        { label: "Users", value: stats.users, icon: Users },
        { label: "Workspaces", value: stats.workspaces, icon: Building2 },
        { label: "Notes", value: stats.notes, icon: FileText },
        { label: "Folders", value: stats.folders, icon: FileText },
        { label: "Tags", value: stats.tags, icon: Activity },
        { label: "Plugins", value: stats.enabledPlugins, icon: ShieldCheck },
        { label: "Syncs", value: stats.syncConnections, icon: Activity },
      ]
    : [];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="flex align-center gap-2" style={{ marginBottom: "2rem" }}>
        <ShieldCheck size={28} style={{ color: "var(--accent-green)" }} />
        <h1 style={{ margin: 0 }}>Admin Area</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "2rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              backgroundColor: activeTab === tab.id ? "var(--bg-tertiary)" : "transparent",
              color: activeTab === tab.id ? "var(--fg-primary)" : "var(--fg-muted)",
              fontWeight: activeTab === tab.id ? 600 : 400,
              gap: "0.4rem",
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {statCards.map((card) => (
            <div key={card.label} className="card" style={{ textAlign: "center", padding: "1.5rem" }}>
              <card.icon size={24} style={{ color: "var(--fg-muted)", marginBottom: "0.5rem" }} />
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--fg-primary)" }}>{card.value}</div>
              <div className="text-sm text-muted">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Workspaces */}
      {activeTab === "workspaces" && (
        <div>
          {workspaces.length === 0 ? (
            <p className="text-muted">No workspaces found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Owner</th>
                    <th>Members</th>
                    <th>Notes</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workspaces.map((ws) => (
                    <tr key={ws.id}>
                      <td style={{ fontWeight: 600 }}>{ws.name}</td>
                      <td className="text-muted">{ws.slug}</td>
                      <td>{ws.owner?.name || "—"}</td>
                      <td>{ws.members?.length || 0}</td>
                      <td>{ws.noteCount}</td>
                      <td className="text-muted text-sm">{formatDate(ws.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn"
                          style={{ color: "var(--accent-red)" }}
                          onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                          disabled={deleting === ws.id}
                        >
                          <Trash2 size={14} />
                          {deleting === ws.id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === "users" && (
        <div>
          {users.length === 0 ? (
            <p className="text-muted">No users found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Joined</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: u.role === "super_admin" ? "var(--accent-green)" : "var(--bg-tertiary)",
                            color: u.role === "super_admin" ? "#fff" : "var(--fg-muted)",
                          }}
                        >
                          {u.role === "super_admin" ? <Shield size={12} /> : <User size={12} />}
                          {" "}{u.role}
                        </span>
                      </td>
                      <td className="text-muted">{u.emailVerified ? "Yes" : "No"}</td>
                      <td className="text-muted text-sm">{formatDate(u.createdAt)}</td>
                      <td style={{ textAlign: "right" }}>
                        {!u.emailVerified && (
                          <button
                            className="btn secondary sm"
                            style={{ 
                              color: "var(--accent-green)", 
                              borderColor: "rgba(163, 190, 140, 0.4)",
                              backgroundColor: "var(--bg-tertiary)",
                              marginRight: "0.5rem" 
                            }}
                            onClick={() => handleVerifyUser(u)}
                            disabled={togglingRole === u.id}
                          >
                            Verify
                          </button>
                        )}
                        <button
                          className="btn secondary sm"
                          style={{
                            color: u.role === "super_admin" ? "var(--accent-red)" : "var(--accent-green)",
                            borderColor: u.role === "super_admin" ? "rgba(191, 97, 106, 0.4)" : "rgba(163, 190, 140, 0.4)",
                            backgroundColor: "var(--bg-tertiary)",
                          }}
                          onClick={() => handleToggleRole(u)}
                          disabled={togglingRole === u.id}
                        >
                          <Shield size={12} style={{ marginRight: "0.25rem" }} />
                          {togglingRole === u.id
                            ? "..."
                            : u.role === "super_admin"
                            ? "Demote"
                            : "Promote"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Audit Logs */}
      {activeTab === "audit" && (
        <div>
          <div className="flex align-center gap-2" style={{ marginBottom: "1rem" }}>
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogSearch()}
              />
            </div>
            <button className="btn" onClick={handleLogSearch}>
              <Search size={14} /> Search
            </button>
          </div>

          {logs.length === 0 ? (
            <p className="text-muted">No audit logs found.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Details</th>
                    <th>IP</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span className="badge" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                          {log.action}
                        </span>
                      </td>
                      <td className="text-muted">{log.user?.name || log.user?.email || "System"}</td>
                      <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {log.details || "—"}
                      </td>
                      <td className="text-muted text-sm">{log.ipAddress || "—"}</td>
                      <td className="text-muted text-sm">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {logTotal > 50 && (
            <div className="flex align-center gap-2" style={{ marginTop: "1rem", justifyContent: "center" }}>
              <button
                className="btn"
                disabled={logPage <= 1}
                onClick={() => {
                  const p = logPage - 1;
                  setLogPage(p);
                  loadLogs(p);
                }}
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {logPage} of {Math.ceil(logTotal / 50)}
              </span>
              <button
                className="btn"
                disabled={logPage >= Math.ceil(logTotal / 50)}
                onClick={() => {
                  const p = logPage + 1;
                  setLogPage(p);
                  loadLogs(p);
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3>Upload Settings</h3>
            <div className="form-group">
              <label htmlFor="upload-types">Allowed File Types</label>
              <input
                id="upload-types"
                value={settingsConfig.uploadTypes || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, uploadTypes: e.target.value }))}
                placeholder="text/markdown,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
              />
              <p className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
                Comma-separated MIME types for note attachment uploads.{" "}
                <a href="https://mime-type.com/mime-types" target="_blank" rel="noopener">Browse MIME types</a>
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="upload-max-size">Max Upload Size (MB)</label>
              <input
                id="upload-max-size"
                type="number"
                value={settingsConfig.uploadMaxSize || "5"}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, uploadMaxSize: e.target.value }))}
              />
            </div>
            <button
              className="btn primary"
              onClick={() => {
                const types = settingsConfig.uploadTypes;
                const size = settingsConfig.uploadMaxSize;
                if (types !== undefined) saveConfig("uploadTypes", types);
                if (size !== undefined && types) saveConfig("uploadMaxSize", size);
                else saveConfig("uploadTypes", types || "");
                if (size !== undefined) setTimeout(() => saveConfig("uploadMaxSize", size), 500);
              }}
            >
              Save Upload Settings
            </button>
          </div>

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3>Email Settings</h3>

            <div className="flex gap-1" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label htmlFor="smtp-host">SMTP Host</label>
                <input
                  id="smtp-host"
                  value={settingsConfig.smtpHost || ""}
                  onChange={(e) => setSettingsConfig((prev) => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="mail.smtp2go.com"
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0, maxWidth: "120px" }}>
                <label htmlFor="smtp-port">Port</label>
                <input
                  id="smtp-port"
                  value={settingsConfig.smtpPort || ""}
                  onChange={(e) => setSettingsConfig((prev) => ({ ...prev, smtpPort: e.target.value }))}
                  placeholder="587"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="smtp-user">SMTP User</label>
              <input
                id="smtp-user"
                value={settingsConfig.smtpUser || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, smtpUser: e.target.value }))}
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="smtp-pass">SMTP Password</label>
              <input
                id="smtp-pass"
                type="password"
                value={settingsConfig.smtpPass || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, smtpPass: e.target.value }))}
                placeholder="••••••••"
              />
              <p className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
                Encrypted at rest. Leave as •••••••• to keep unchanged.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="smtp-from">From Address</label>
              <input
                id="smtp-from"
                value={settingsConfig.smtpFrom || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, smtpFrom: e.target.value }))}
                placeholder="noreply@mindmatrix.local"
              />
            </div>

            <div className="flex gap-1 align-center" style={{ marginBottom: "1rem" }}>
              <button
                className="btn primary sm"
                onClick={() => {
                  const keys = ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom"] as const;
                  for (const k of keys) {
                    const v = settingsConfig[k];
                    if (v !== undefined) saveConfig(k, v);
                  }
                }}
              >
                Save SMTP Settings
              </button>
              <button
                className="btn secondary sm"
                disabled={emailTestStatus === "loading"}
                onClick={async () => {
                  setEmailTestStatus("loading");
                  setEmailTestMessage("");
                  try {
                    const res = await fetch("/api/admin/settings/email-test", { method: "POST" });
                    const data = await res.json();
                    if (res.ok) {
                      setEmailTestStatus("success");
                      setEmailTestMessage(`Test email sent to ${data.to}`);
                    } else {
                      setEmailTestStatus("error");
                      setEmailTestMessage(data.error || "Failed");
                    }
                  } catch {
                    setEmailTestStatus("error");
                    setEmailTestMessage("Network error");
                  }
                }}
              >
                <Mail size={12} style={{ marginRight: "0.25rem" }} />
                {emailTestStatus === "loading" ? "Sending..." : "Send Test Email"}
              </button>
            </div>
            {emailTestMessage && (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: emailTestStatus === "success" ? "rgba(163,190,140,0.15)" : "rgba(191,97,106,0.15)",
                  color: emailTestStatus === "success" ? "var(--accent-green)" : "var(--accent-red)",
                  fontSize: "0.875rem",
                  marginBottom: "1rem",
                }}
              >
                {emailTestMessage}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="template-verify">Verification Email Template</label>
              <textarea
                id="template-verify"
                rows={8}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.5 }}
                value={settingsConfig.emailTemplateVerify || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, emailTemplateVerify: e.target.value }))}
                placeholder={DEFAULT_VERIFY_TEMPLATE}
              />
              <p className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
                Markdown. Placeholders: {"{{name}} {{email}} {{url}} {{app}}"}. Template sent as HTML.
              </p>
              <div className="flex gap-1" style={{ marginTop: "0.5rem" }}>
                <button
                  className="btn primary sm"
                  onClick={() => saveConfig("emailTemplateVerify", settingsConfig.emailTemplateVerify || "")}
                >
                  Save Template
                </button>
                <button
                  className="btn secondary sm"
                  onClick={() => {
                    setSettingsConfig((prev) => ({ ...prev, emailTemplateVerify: DEFAULT_VERIFY_TEMPLATE }));
                    saveConfig("emailTemplateVerify", DEFAULT_VERIFY_TEMPLATE);
                  }}
                >
                  Restore Default
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="template-reset">Password Reset Template</label>
              <textarea
                id="template-reset"
                rows={8}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", lineHeight: 1.5 }}
                value={settingsConfig.emailTemplateReset || ""}
                onChange={(e) => setSettingsConfig((prev) => ({ ...prev, emailTemplateReset: e.target.value }))}
                placeholder={DEFAULT_RESET_TEMPLATE}
              />
              <p className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
                Markdown. Placeholders: {"{{name}} {{email}} {{url}} {{app}}"}. Template sent as HTML.
              </p>
              <div className="flex gap-1" style={{ marginTop: "0.5rem" }}>
                <button
                  className="btn primary sm"
                  onClick={() => saveConfig("emailTemplateReset", settingsConfig.emailTemplateReset || "")}
                >
                  Save Template
                </button>
                <button
                  className="btn secondary sm"
                  onClick={() => {
                    setSettingsConfig((prev) => ({ ...prev, emailTemplateReset: DEFAULT_RESET_TEMPLATE }));
                    saveConfig("emailTemplateReset", DEFAULT_RESET_TEMPLATE);
                  }}
                >
                  Restore Default
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Landing Page</h3>
            <div className="flex align-center justify-between" style={{ marginTop: "0.5rem" }}>
              <div>
                <strong>Show Landing Page</strong>
                <p className="text-muted text-xs">When disabled, unauthenticated visitors are redirected to /login.</p>
              </div>
              <button
                className={`btn ${settingsConfig.showLandingPage === "false" ? "danger" : "primary"} sm`}
                onClick={() => saveConfig("showLandingPage", settingsConfig.showLandingPage === "false" ? "true" : "false")}
              >
                {settingsConfig.showLandingPage === "false" ? "Disabled" : "Enabled"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
