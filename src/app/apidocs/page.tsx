"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="container">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/dashboard" className="btn ghost sm flex align-center gap-1" style={{ display: "inline-flex" }}>
          <ArrowLeft size={14} />
          Back to Dashboard
        </Link>
      </div>
      <h1>API Reference</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Full API documentation for MindMatrix. All endpoints require authentication
        unless marked otherwise.
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Authentication</h2>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          MindMatrix uses Better Auth for authentication. All API routes (except auth
          routes) require a valid session.
        </p>

        <h3>Endpoints</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>POST</code></td><td><code>/api/auth/sign-in/email</code></td><td>Sign in with email and password</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/auth/sign-up/email</code></td><td>Register a new account</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/auth/sign-out</code></td><td>Sign out</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/auth/get-session</code></td><td>Get current session</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Workspaces</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/workspaces</code></td><td>List all workspaces for current user</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/workspaces</code></td><td>Create a new workspace</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/workspaces/:id</code></td><td>Get workspace details</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/workspaces/:id</code></td><td>Update workspace (owner only)</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/workspaces/:id</code></td><td>Delete workspace (owner only)</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/workspaces/:id/members</code></td><td>List workspace members</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/workspaces/:id/members</code></td><td>Add member by email</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/workspaces/:id/webhooks</code></td><td>List workspace webhooks</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/workspaces/:id/webhooks</code></td><td>Create a workspace webhook</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/workspaces/:id/webhooks/:webhookId</code></td><td>Update a workspace webhook</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/workspaces/:id/webhooks/:webhookId</code></td><td>Delete a workspace webhook</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Notes</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/notes?workspaceId=&folderId=&tagId=&q=</code></td><td>List notes with filters</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/notes</code></td><td>Create a note</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id</code></td><td>Get note with full content (bypasses auth if note is publicly shared)</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/notes/:id</code></td><td>Update note (title, content, isPublic, folderId, tagIds)</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/notes/:id</code></td><td>Delete note</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/notes/upload</code></td><td>Upload note attachment (configurable file types/size via admin)</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Folders & Tags</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/folders?workspaceId=&parentId=</code></td><td>List folders</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/folders</code></td><td>Create folder</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/folders/:id</code></td><td>Update folder</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/folders/:id</code></td><td>Delete folder</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/tags?workspaceId=</code></td><td>List tags</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/tags</code></td><td>Create tag</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/tags/:id</code></td><td>Update tag</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/tags/:id</code></td><td>Delete tag</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Super Admin</h2>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Super Admin endpoints are restricted to users with the <code>super_admin</code> role. The first registered user is automatically promoted.
        </p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/admin/stats</code></td><td>Dashboard statistics (users, workspaces, notes, etc.)</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/admin/workspaces</code></td><td>List all workspaces with owners and note counts</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/admin/workspaces/:id</code></td><td>Force-delete any workspace</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/admin/users</code></td><td>List all users with roles and verification status</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/admin/users/:id</code></td><td>Promote or demote user role</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/admin/audit-logs</code></td><td>Paginated, searchable audit trail</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/admin/settings</code></td><td>Get system config (uploads, SMTP, landing page)</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/admin/settings</code></td><td>Update system config key/value pairs</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/admin/settings/email-test</code></td><td>Send test email to verify SMTP setup</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Profile</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/profile</code></td><td>Get current user profile</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/profile</code></td><td>Update name, email, timezone, time format, date format</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/profile/avatar</code></td><td>Upload avatar (JPEG/PNG/WebP, max 2MB)</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/profile/avatar</code></td><td>Remove avatar</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Backlinks & Versions</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id/links</code></td><td>Get incoming and outgoing backlinks</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id/versions</code></td><td>List version history</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id/versions/:versionId</code></td><td>Get specific version content</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/notes/:id/versions</code></td><td>Restore a previous version</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Realtime</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id/events</code></td><td>SSE stream for real-time updates</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/notes/:id/presence</code></td><td>List current viewers</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/notes/:id/presence</code></td><td>Heartbeat (set viewer presence)</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/notes/:id/delta</code></td><td>Y.js CRDT co-authoring delta update</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Notifications</h2>
        <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
          Persistent notification system with unread tracking and SSE real-time delivery.
        </p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Method</th><th>Path</th><th>Description</th></tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/notifications?limit=&page=</code></td><td>List notifications (paginated, includes unread count)</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/notifications</code></td><td>Mark all notifications as read</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/notifications/:id</code></td><td>Mark a single notification as read</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/notifications/events</code></td><td>SSE stream for real-time notification delivery</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Plugins</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/plugins/config?workspaceId=</code></td><td>List plugin states for workspace</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/config</code></td><td>Enable/disable plugin or save config</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/opencode-ai/chat</code></td><td>Chat with notes via AI</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/proxmox-inventory/scan</code></td><td>Scan Proxmox VE inventory</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/unifi-topology/scan</code></td><td>Scan Unifi network topology</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/git-sync/pull</code></td><td>Pull notes from remote Git branch</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/plugins/git-sync/push</code></td><td>Commit and push notes to remote Git branch</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2>Templates</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/templates?workspaceId=</code></td><td>List note templates</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/templates</code></td><td>Create template</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/templates/:id</code></td><td>Update template</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/templates/:id</code></td><td>Delete template</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Additional Endpoints</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><code>GET</code></td><td><code>/api/search?q=&workspaceId=</code></td><td>Search notes</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/export?workspaceId=&format=markdown</code></td><td>Export workspace notes as markdown</td></tr>
              <tr><td><code>GET</code></td><td><code>/api/export?workspaceId=&format=pdf</code></td><td>Export workspace notes as print-friendly HTML page</td></tr>
              <tr><td><code>POST</code></td><td><code>/api/import</code></td><td>Import markdown notes</td></tr>
              <tr><td><code>GET/POST</code></td><td><code>/api/sync/pcloud</code></td><td>pCloud sync management</td></tr>
              <tr><td><code>GET/POST</code></td><td><code>/api/sync/google-drive</code></td><td>Google Drive sync management</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
