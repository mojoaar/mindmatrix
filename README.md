# MindMatrix

Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.

**Version**: 0.2.0 | **License**: AGPL-3.0

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
- **Realtime Collaboration** — See who's viewing a note, get notified of changes (SSE + PG NOTIFY)
- **Global Search** — Press Cmd+K to search across all notes with command palette
- **Editor** — CodeMirror 6 with configurable layout (split/edit/preview), **Markdown formatting toolbar, inline tag builder, and drag & drop image uploads**
- **Public Sharing** — Share distraction-free, read-only note views with one click, or instantly toggle back to private
- **Import/Export** — Export notes as markdown, import from markdown
- **Plugin System** — Togglable plugins per workspace: OpenCode AI, OpenCode Zen, Proxmox, Unifi, pCloud, Google Drive
- **Profile & Avatar** — Upload avatar, set timezone, 12h/24h time format
- **Workspace Icons** — 400+ Lucide icons per workspace
- **Full REST API** — Complete API coverage for all features
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

| Action          | macOS           | Windows / Linux     |
| --------------- | --------------- | ------------------- |
| Search          | Cmd+K           | Ctrl+K              |
| New Note        | Opt+N           | Alt+N              |
| New Folder      | Opt+Shift+F     | Alt+Shift+F        |
| Save Note       | Cmd+Enter       | Ctrl+Enter          |
| Toggle Sidebar  | Cmd+B           | Ctrl+B              |
| Settings        | Cmd+,           | Ctrl+,              |
| Close Dialogs   | Escape          | Escape              |

## Plugin System

Toggle plugins per workspace in Settings. Available:

- **OpenCode AI** — Chat with notes via OpenCode Go (cloud subscription)
- **OpenCode Zen** — AI chat with multiple model families (GPT, Claude, DeepSeek)
- **Proxmox Inventory** — Scan VMs, containers, storage into a note
- **Unifi Topology** — Scan network devices, WiFi, clients into a note
- **pCloud Sync** — Sync notes as .md files to pCloud storage
- **Google Drive Sync** — Sync notes as .md files to Google Drive

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
