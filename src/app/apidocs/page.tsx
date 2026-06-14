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
              <tr><td><code>GET</code></td><td><code>/api/notes/:id</code></td><td>Get note with full content</td></tr>
              <tr><td><code>PATCH</code></td><td><code>/api/notes/:id</code></td><td>Update note</td></tr>
              <tr><td><code>DELETE</code></td><td><code>/api/notes/:id</code></td><td>Delete note</td></tr>
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
              <tr><td><code>GET</code></td><td><code>/api/export?workspaceId=</code></td><td>Export workspace notes as markdown</td></tr>
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
