import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Explore the release history, feature updates, and improvements of MindMatrix.",
};

export default function ChangelogPage() {
  return (
    <div>
      <h1>Changelog</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Stay up to date with the latest features, improvements, and fixes in MindMatrix.
      </p>

      <div className="card">
        <h2>v0.5.0 — 2026-06-18</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Spatially Docked 2-Column AI Layout</strong> — A split-screen vertical AI Assistant panel that lets you edit your CodeMirror notes on the left and chat/interact with the AI on the right, toggled seamlessly via a note header Sparkles button.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Dynamic Active Profile Avatars in AI Chat</strong> — Replaced generic fallback user icons inside the AI chat bubbles with the user's active custom profile photo or clean colored initials avatar, creating a high-fidelity visual experience.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Dynamic Note-Content Context Injection</strong> — Resolved a context-gap where the editor note's active contents were omitted during subsequent chat interactions. Dynamically injects up-to-date note content directly inside the model's system prompt block on every chat turn.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Markdown Formatting Extension</strong> — Added 5 brand new rich editing actions to the markdown toolbar: Mermaid Diagram block insertion, Note Embed (<code>![[]]</code>), Blockquote (<code>&gt; </code>), Strikethrough (<code>~~</code>), and Horizontal Rule (<code>---</code>).
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Workspace Settings Grouped Modules</strong> — Reorganized the workspace settings plugins into distinct categorized grid structures (AI Assistants, Synchronisation, Infrastructure Scanners) while keeping Webhooks cleanly styled as its own independent card.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Double-Encryption Key Correction & Config Preservation</strong> — Fixed a silent data-overwrite bug in the workspace plugin configurations where toggling enabled/disabled states without submitting configuration JSON would strip existing database configurations. Restored decryption of masked <code>••••••••</code> values prior to form submission, preventing double-encryption key corruption on subsequent edits.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Defensive API Error Bubbling</strong> — Added strict JSON body inspection inside downstream OpenCode Go (<code>opencode-ai</code>) and OpenCode Zen (<code>opencode-zen</code>) clients. When downstream endpoints return API error payloads inside standard successful <code>200 OK</code> status responses, the clients now throw and bubble up the correct API error message to render as a red toast alert, rather than rendering empty chat bubbles.
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>v0.4.0 — 2026-06-17</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Mermaid.js Diagrams</strong> — render <code>```mermaid</code> blocks as SVG diagrams in markdown preview (CDN-loaded, no local dependencies)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Note Embeds</strong> — <code>![[note-slug]]</code> Obsidian-style transclusion with nested rendering (max 3 levels)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Threaded Comments</strong> — comment on shared notes/workspaces with real-time delivery via SSE
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>@mentions in Comments</strong> — mention workspace members in comments (<code>@username</code>) to trigger notifications
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>API Tokens</strong> — Bearer token auth for CLI and third-party integrations (Create/Revoke UI)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Multi-Layer Security Hardening</strong> — complete audit pass adding BOLA guards, Stored XSS filters, DNS-rebinding-safe SSRF webhooks, AES-256-GCM credentials encryption, and sliding-window rate limiting on comments/tokens
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Interactive Notes Sorting</strong> — click table headers in workspace notes view to sort dynamically by Title (alphabetical) or Updated (chronological, newest first)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Visual Search in Docs & API Reference</strong> — added a visual Search button matching the main dashboard layout to both <code>/docs</code> and <code>/apidocs</code> routes
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Interactive Multi-Language API Examples</strong> — added a sticky language selector bar (cURL, PowerShell, Python, JavaScript) to <code>/apidocs</code> with collapsible PrismJS-highlighted code integration snippets
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Client Cache Invalidation</strong> — resolved stale notes list and out-of-sync sidebar folder note counts on soft navigations by appending <code>{`{ cache: "no-store" }`}</code> headers to all dynamic GET fetch requests
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Workspace Plugins Loading Fix</strong> — fixed a data-binding bug in the generic <code>PluginCard</code> component (<code>d.config?.enabled</code> → <code>d.enabled</code>) that failed to bind active states on reload, restoring persistent status displays for all 7 plugins
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>OpenCode Naming Alignment</strong> — renamed the OpenCode AI plugin to <strong>OpenCode Go</strong> across all server plugins, metadata registries, and documentations to create clean, distinctive naming alignment with your subscriptions
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>v0.3.0 — 2026-06-16</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Landing Page</strong> — unauthenticated responsive landing page with theme toggle and presets
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Webhooks</strong> — HMAC-SHA256 signed HTTP callbacks on note, folder, and tag events with SSRF protection
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Git Sync Plugin</strong> — pull/commit workspace notes to any Git repository (SSH/HTTPS)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>TOTP Two-Factor Auth</strong> — opt-in MFA with QR setup, backup codes, and trusted devices
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>CRDT Realtime Co-authoring</strong> — Y.js-based collaborative editing with delta sync (upgrade from last-write-wins)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Public Note Sharing</strong> — one-click read-only public document links with SEO preview cards
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Markdown Formatting Toolbar</strong> — headings, lists, links, tables, code blocks in the editor
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Drag & Drop Image Upload</strong> — drop images directly into the editor for instant upload
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Sidebar Folders & Tags</strong> — interactive folder and tag navigation with live note counts
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Proxy Cookie Fix</strong> — <code>__Secure-</code> prefix added for HTTPS production compatibility
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Customizable Email</strong> — users can change their email address with uniqueness validation
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Date Format Preference</strong> — choose browser, ISO, US, EU, long, or short date display format
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Admin Email Settings</strong> — SMTP configuration, markdown email templates, test email button
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Dynamic System Config</strong> — admin UI for upload file types, max size, landing page toggle
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Server-Side Preferences</strong> — theme, font, editor layout, and sidebar visibility stored in user profile
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Folder Icons</strong> — 400+ Lucide icons selectable per folder alongside workspace icons
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>PDF Export</strong> — one-click HTML print page using browser&apos;s native &ldquo;Save as PDF&rdquo;
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Notifications Center</strong> — bell icon with unread badge, SSE real-time delivery for invites and edits
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Mobile Responsive</strong> — hamburger menu, auto-collapse sidebar at 768px, touch-friendly sizing
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>v0.2.0 — 2026-06-14</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Backlinks</strong> — <code>[[note-slug]]</code> detection with incoming/outgoing links panel
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Version History</strong> — auto-snapshot on save, restore from history
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Realtime Collaboration</strong> — presence avatars, live update notifications (SSE + PG NOTIFY)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Plugin System</strong> — extendable plugin infrastructure, 5 built-in plugins
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>OpenCode Go Plugin</strong> — chat with notes via OpenCode Go (13 models, live picker)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Proxmox Inventory Plugin</strong> — scan PVE VMs/CTs/storage into a structured note
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Unifi Topology Plugin</strong> — scan Unifi devices/WiFi/clients into a topology note
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Note Templates</strong> — workspace-level templates with &ldquo;New from Template&rdquo; dropdown
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Workspace Icons</strong> — 400+ Lucide icons, searchable picker
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Profile & Avatar</strong> — upload avatar (2MB), timezone selector, 12h/24h time format
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Cross-platform Shortcuts</strong> — macOS + Windows/Linux docs for all 7 shortcuts
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Toast Notifications</strong> — Radix-powered toast system
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Email Verification</strong> — nodemailer-based verification + forgot/reset password flow
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Keyboard Command Palette</strong> — Cmd+K shows all shortcuts when empty
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Improved Proxy</strong> — auto-redirects auth pages to dashboard, 401 handling
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>12 Themes</strong> — Added GitHub, Catppuccin, Cyberpunk, One (light/dark each)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>8 Developer Fonts</strong> — JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Ubuntu Mono, Inconsolata, Roboto Mono, DM Mono
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>PrismJS Syntax Highlighting</strong> — 297 languages with autoloader
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Super Admin Dashboard</strong> — stats, workspace/user management, audit logs
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Audit Logging</strong> — all CRUD operations tracked with searchable trail
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>OpenCode Zen Plugin</strong> — multi-model AI chat (GPT, Claude, DeepSeek)
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Security Hardening</strong> — AES-256-GCM encryption for plugin credentials, BOLA fixes
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>v0.1.0 — 2026-06-13</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Initial release: workspaces, notes, folders, tags, search, themes, Docker deployment</li>
        </ul>
      </div>
    </div>
  );
}
