import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to deploy, configure, and get the most out of MindMatrix.",
};

export default function DocsPage() {
  return (
    <div>
      <h1>MindMatrix Documentation</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Welcome to MindMatrix — a markdown-first, self-hosted, multi-user knowledge hub.
      </p>

      <div className="card">
        <h2>What is MindMatrix?</h2>
        <p>
          MindMatrix is a knowledge management tool for teams and thinkers who want
          structure, speed, and simplicity. It stores all notes as plain Markdown files
          and organizes them into workspaces, folders, and tags.
        </p>
      </div>

      <div className="card">
        <h2>Core Features</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Markdown-native editing with live preview and syntax highlighting (297 languages)</li>
          <li>Workspaces for teams with role-based permissions (owner, admin, member, viewer)</li>
          <li>Folders and tags for hierarchical and flexible organization</li>
          <li>Backlinks — <code>[[note-slug]]</code> wiki-style linking with incoming/outgoing panel</li>
          <li>Version history — automatic snapshots on save, restore any version</li>
          <li>Note templates — create from ADR, runbook, meeting notes, or custom templates</li>
          <li>Realtime collaboration — CRDT-based co-authoring (Y.js), presence avatars, live update notifications</li>
          <li>Notifications center — bell icon with unread badge, SSE real-time delivery for invites and note edits</li>
          <li>Plugin system — toggle per-workspace: OpenCode AI, OpenCode Zen, Proxmox, Unifi, pCloud, Google Drive, Git Sync</li>
          <li>Webhooks — HTTP callbacks with HMAC-SHA256 signing on note, folder, and tag events</li>
          <li>TOTP two-factor authentication — opt-in MFA with QR setup and backup codes</li>
          <li>Public note sharing — one-click toggle to create read-only public document links</li>
          <li>Landing page — unauthenticated responsive landing page with theme toggle</li>
          <li>Mobile responsive — hamburger menu, auto-collapse sidebar at 768px, touch-friendly sizing</li>
          <li>Global search with command palette (Cmd+K)</li>
          <li>Import/export markdown notes and PDF</li>
          <li>Cloud sync to pCloud and Google Drive (per-workspace plugin)</li>
          <li>Full REST API for all operations</li>
          <li>12 themes: Nord, Dracula, GitHub, Catppuccin, Cyberpunk, One (light/dark each)</li>
          <li>8 developer fonts: JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Ubuntu Mono, Inconsolata, Roboto Mono, DM Mono</li>
          <li>Super admin dashboard — stats, workspaces, users, audit logs, solution settings</li>
          <li>Email system — SMTP config in admin, markdown email templates, test email button</li>
          <li>Date format preference — choose browser, ISO, US, EU, long, or short date display</li>
          <li>Dynamic system config — admin UI for upload types, max size, landing page toggle</li>
          <li>Self-hosted with Docker Compose or systemd</li>
        </ul>
      </div>

      <div className="card">
        <h2>Quick Links</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li><a href="/docs/getting-started">Getting Started</a> — Installation and setup</li>
          <li><a href="/docs/workspaces">Workspaces</a> — Team management</li>
          <li><a href="/docs/notes">Notes</a> — Creating and organizing notes</li>
          <li><a href="/docs/search">Search</a> — Finding your knowledge</li>
          <li><a href="/docs/sync">Cloud Sync</a> — Syncing with cloud storage</li>
          <li><a href="/docs/self-hosting">Self-Hosting</a> — Deploying your own instance</li>
          <li><a href="/apidocs">API Reference</a> — Full API documentation</li>
        </ul>
      </div>
    </div>
  );
}
