# MindMatrix

Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.

**Version**: 0.3.0 | **License**: AGPL-3.0

## Quick Start

### Docker Compose (Recommended)

```bash
git clone git@github.com:mojoaar/mindmatrix.git
cd mindmatrix
cp .env.example .env
# Generate a secure auth secret: openssl rand -base64 48
# Edit .env with your secrets
docker compose -f deploy/docker-compose.yml up -d
```

The app will be available at http://localhost:3000

### Node.js / systemd

```bash
git clone git@github.com:mojoaar/mindmatrix.git /opt/mindmatrix
cd /opt/mindmatrix
cp .env.example .env
# Edit .env with your database credentials and secrets
npm ci
npm run build
npm run db:push
npm run start
```

See `deploy/mindmatrix.service` for a systemd unit file.

## Development

```bash
npm install
cp .env.example .env
# Start PostgreSQL (e.g., via docker compose -f deploy/docker-compose.yml up -d postgres)
npm run db:push
npm run dev
```

## Features

- **Markdown-native** — Notes stored and edited as plain .md content
- **Workspaces** — Team organization with role-based permissions (owner, admin, member, viewer)
- **Folders & Tags** — Hierarchical organization and flexible tagging, complete with interactive sidebar note counts and dynamic rename, deletion, and color-change management directly in the dashboard
- **Note Templates** — Workspace-level templates: create from ADR, runbook, meeting notes
- **Backlinks** — `[[note-slug]]` wiki-style linking with incoming/outgoing links panel
- **Version History** — Automatic snapshots on save, restore previous versions
- **Realtime Collaboration** — CRDT-based co-authoring via Y.js, presence avatars, live notifications (SSE + PG NOTIFY)
- **Landing Page** — Unauthenticated responsive landing page with theme toggle
- **Webhooks** — HMAC-SHA256 signed HTTP callbacks on note, folder, and tag events
- **Git Sync Plugin** — Pull/commit workspace notes to any Git repository (SSH or HTTPS) per workspace
- **TOTP Two-Factor Auth** — Opt-in MFA with QR setup, backup codes, and trusted devices
- **Global Search** — Press Cmd+K to search across all notes with command palette
- **Editor** — CodeMirror 6 with configurable layout (split/edit/preview), **Markdown formatting toolbar, inline tag builder, and drag & drop image uploads**
- **Public Sharing** — Share distraction-free, read-only note views with one click, or instantly toggle back to private
- **Import/Export** — Export notes as markdown, import from markdown
- **Plugin System** — Togglable plugins per workspace: OpenCode AI, OpenCode Zen, Proxmox, Unifi, pCloud, Google Drive, Git Sync
- **Profile & Avatar** — Upload avatar, set timezone, date format (ISO/US/EU/long/short), 12h/24h time format
- **Workspace Icons** — 400+ Lucide icons per workspace and folder
- **Admin Settings** — SMTP email configuration, upload type/size limits, landing page toggle, markdown email templates
- **Full REST API** — Complete API coverage including webhooks, delta sync, admin settings
- **Themes** — 12 themes: Nord, Dracula, GitHub, Catppuccin, Cyberpunk, One (light & dark)
- **Developer Fonts** — 8 monospace fonts: JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Ubuntu Mono, Inconsolata, Roboto Mono, DM Mono
- **Syntax Highlighting** — PrismJS with autoloader supporting 297 languages
- **Self-hosted** — Docker Compose or systemd deployment

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/) — Authentication
- [CodeMirror 6](https://codemirror.net/) — Editor
- [Radix UI](https://www.radix-ui.com/) — Accessible components
- [PrismJS](https://prismjs.com/) — Syntax highlighting (297 languages)
- [Sass/SCSS](https://sass-lang.com/) — Styling
- [Vitest](https://vitest.dev/) — Testing

## Keyboard Shortcuts

| Action               | macOS                 | Windows / Linux          |
| -------------------- | --------------------- | ------------------------ |
| Search               | Cmd+K                 | Ctrl+K                   |
| New Note             | Opt+N                 | Alt+N                    |
| New Folder           | Opt+Shift+F           | Alt+Shift+F              |
| Save Note            | Cmd+Enter             | Ctrl+Enter               |
| Toggle Sidebar       | Cmd+B                 | Ctrl+B                   |
| Settings             | Cmd+,                 | Ctrl+,                   |
| Toggle Preview       | Cmd+\                 | Ctrl+\                   |
| Delete Note          | Cmd+Shift+Backspace   | Ctrl+Shift+Backspace     |
| Back to Workspace    | Cmd+Opt+[             | Ctrl+Alt+[               |
| Toggle Public Share  | Cmd+Shift+P           | Ctrl+Shift+P             |
| Close Dialogs        | Escape                | Escape                   |

## Plugin System

Toggle plugins per workspace in Settings. Available:

- **OpenCode AI** — Chat with notes via OpenCode Go (cloud subscription)
- **OpenCode Zen** — AI chat with multiple model families (GPT, Claude, DeepSeek)
- **Proxmox Inventory** — Scan VMs, containers, storage into a note
- **Unifi Topology** — Scan network devices, WiFi, clients into a note
- **pCloud Sync** — Sync notes as .md files to pCloud storage
- **Google Drive Sync** — Sync notes as .md files to Google Drive
- **Git Sync** — Pull and commit workspace notes to any Git repository (SSH or HTTPS)

## API Documentation

Full API docs available at `/apidocs` when the app is running.

## Testing

```bash
npm run test
```

## License

MindMatrix is licensed under the GNU Affero General Public License v3.0. See [LICENSE](./LICENSE) for details.

Built by [mojoaar](https://github.com/mojoaar)

## Changelog

### v0.3.0 — 2026-06-16
- **Landing Page** — unauthenticated responsive landing page with theme toggle and presets
- **Webhooks** — HMAC-SHA256 signed HTTP callbacks on note, folder, and tag events with SSRF protection
- **Git Sync Plugin** — pull/commit workspace notes to any Git repository (SSH/HTTPS)
- **TOTP Two-Factor Auth** — opt-in MFA with QR setup, backup codes, and trusted devices
- **CRDT Realtime Co-authoring** — Y.js-based collaborative editing with delta sync (upgrade from last-write-wins)
- **Public Note Sharing** — one-click read-only public document links with SEO preview cards
- **Markdown Formatting Toolbar** — headings, lists, links, tables, code blocks in the editor
- **Drag & Drop Image Upload** — drop images directly into the editor for instant upload
- **Sidebar Folders & Tags** — interactive folder and tag navigation with live note counts
- **Proxy Cookie Fix** — `__Secure-` prefix added for HTTPS production compatibility
- **Customizable Email** — users can change their email address with uniqueness validation
- **Date Format Preference** — choose browser, ISO, US, EU, long, or short date display format
- **Admin Email Settings** — SMTP configuration, markdown email templates, test email button
- **Dynamic System Config** — admin UI for upload file types, max size, landing page toggle
- **Server-Side Preferences** — theme, font, editor layout, and sidebar visibility stored in user profile
- **Folder Icons** — 400+ Lucide icons selectable per folder alongside workspace icons

### v0.2.0 — 2026-06-14
- **Backlinks** — `[[note-slug]]` detection with incoming/outgoing links panel
- **Version History** — auto-snapshot on save, restore from history
- **Realtime Collaboration** — presence avatars, live update notifications (SSE + PG NOTIFY)
- **Plugin System** — extendable plugin infrastructure, 5 built-in plugins
- **OpenCode AI Plugin** — chat with notes via OpenCode Go (13 models, live picker)
- **Proxmox Inventory Plugin** — scan PVE VMs/CTs/storage into a structured note
- **Unifi Topology Plugin** — scan Unifi devices/WiFi/clients into a topology note
- **Note Templates** — workspace-level templates with "New from Template" dropdown
- **Workspace Icons** — 400+ Lucide icons, searchable picker
- **Profile & Avatar** — upload avatar (2MB), timezone selector, 12h/24h time format
- **Cross-platform Shortcuts** — macOS + Windows/Linux docs for all 7 shortcuts
- **Toast Notifications** — Radix-powered toast system
- **Email Verification** — nodemailer-based verification + forgot/reset password flow
- **Keyboard Command Palette** — Cmd+K shows all shortcuts when empty
- **Improved Proxy** — auto-redirects auth pages to dashboard, 401 handling
- **12 Themes** — Added GitHub, Catppuccin, Cyberpunk, One (light/dark each)
- **8 Developer Fonts** — JetBrains Mono, Fira Code, Source Code Pro, IBM Plex Mono, Ubuntu Mono, Inconsolata, Roboto Mono, DM Mono
- **PrismJS Syntax Highlighting** — 297 languages with autoloader
- **Super Admin Dashboard** — stats, workspace/user management, audit logs
- **Audit Logging** — all CRUD operations tracked with searchable trail
- **OpenCode Zen Plugin** — multi-model AI chat (GPT, Claude, DeepSeek)
- **Security Hardening** — AES-256-GCM encryption for plugin credentials, BOLA fixes

### v0.1.0 — 2026-06-13
- Initial release: workspaces, notes, folders, tags, search, themes, Docker deployment
