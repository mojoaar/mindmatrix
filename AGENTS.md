# MindMatrix — Agent Guide

## Project Overview
MindMatrix is a markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.
- **Version**: 0.4.0
- **License**: AGPL-3.0
- **Repo**: git@github.com:mojoaar/mindmatrix.git

## Tech Stack
| Package           | Version | Purpose                   |
| ----------------- | ------- | ------------------------- |
| next              | 16.2.9  | Framework (App Router)    |
| react / react-dom | 19.x    | UI                        |
| typescript        | ^5      | Types                     |
| sass              | ^1.77+  | SCSS preprocessor, no Tailwind |
| better-auth       | 1.6.18  | Auth (email/password)     |
| @better-auth/drizzle-adapter | 1.6.18 | Auth DB adapter     |
| drizzle-orm       | 0.45.2  | ORM                       |
| drizzle-kit       | 0.31.10 | Migrations                |
| postgres          | ^3.4.4  | PostgreSQL driver (not pg) |
| @uiw/react-codemirror | 4.25.10 | Markdown editor          |
| prismjs            | 1.29.0  | Syntax highlighting (297 langs) |
| react-markdown    | 10.1.0  | Markdown rendering        |
| @radix-ui/react-* | —       | UI primitives             |
| lucide-react      | 1.18.0  | Icons                     |
| clsx              | 2.1.1   | Class merging             |
| zod               | ^3.23+  | Validation                |
| vitest            | 4.1.8   | Testing                   |

## Styling
- **No Tailwind CSS** — uses Sass/SCSS with CSS custom properties (design tokens)
- 12 themes via `data-theme` attribute: `nord-dark`, `nord-light`, `dracula-dark`, `dracula-light`, `github-dark`, `github-light`, `catppuccin-dark`, `catppuccin-light`, `cyberpunk-dark`, `cyberpunk-light`, `one-dark`, `one-light`
- Theme persistence: `localStorage` key `mindmatrix-theme`, applied via inline `<script>` before first paint
- 8 developer fonts selectable in Settings > Preferences: JetBrains Mono (default), Fira Code, Source Code Pro, IBM Plex Mono, Ubuntu Mono, Inconsolata, Roboto Mono, DM Mono — stored via `localStorage` key `mindmatrix-font`, applied via `data-font` attribute
- Global utility classes: `.btn`, `.card`, `.form-group`, `.badge`, `.table-wrapper`, etc.
- Syntax highlighting via PrismJS autoloader (297 languages), CSS tokens mapped to design variables
- CSS variables defined in `src/app/globals.scss`

## Project Structure
```
src/
├── app/
│   ├── (auth)/login/, register/    # Auth pages
│   ├── (dashboard)/dashboard/       # Authenticated routes
│   │   ├── w/[slug]/                # Workspace views
│   │   ├── settings/                # User settings
│   │   └── admin/                   # Super admin dashboard
│   ├── api/                         # REST API routes
│   ├── docs/                        # User documentation
│   ├── apidocs/                     # API reference
│   ├── layout.tsx                   # Root layout (font, theme, providers)
│   └── globals.scss                 # Theme CSS vars + global styles
├── components/
│   ├── theme/                       # ThemeProvider, ThemeToggle
│   ├── search/                      # SearchOverlay (Cmd+K)
│   ├── editor/                      # BacklinksPanel, VersionPanel, PresenceAvatars
│   └── ui/                          # Avatar, Toast, IconPicker, PluginCard, NotificationBell, CommentSection, etc.
├── plugins/
│   ├── metadata.ts                  # Client-safe plugin registry (names, IDs)
│   ├── index.ts                     # Server-side plugin registry
│   ├── opencode-ai/                 # OpenCode Go AI plugin
│   ├── opencode-zen/                # OpenCode Zen multi-model AI plugin
│   ├── proxmox-inventory/           # Proxmox VE scanner plugin
│   ├── unifi-topology/              # Unifi network scanner plugin
│   ├── sync-pcloud/                 # pCloud sync plugin
│   ├── sync-google-drive/           # Google Drive sync plugin
│   └── git-sync/                    # Git repository sync plugin
├── lib/
│   ├── auth.ts                      # Better Auth server config
│   ├── auth-client.ts               # Better Auth client config
│   ├── auth-helper.ts               # getAuthUser() with Bearer token fallback
│   ├── api-token-auth.ts            # validateApiToken() for CLI/integrations
│   ├── db/
│   │   ├── schema.ts                # All Drizzle table definitions
│   │   └── index.ts                 # Drizzle client + postgres pool
│   ├── realtime/
│   │   └── event-bus.ts             # PG NOTIFY/LISTEN pub/sub singleton
│   ├── icons.ts                     # 400+ Lucide icon registry
│   ├── slug.ts                      # Slug generation utilities
│   ├── email.ts                     # Nodemailer transport
│   ├── email-templates.ts           # Markdown email templates (verify, password reset)
│   ├── date-format.ts               # Shared date formatting utility
│   ├── export-pdf.ts                # Print-friendly HTML export page
│   ├── notifications.ts             # createNotification() with SSE push via event-bus
│   ├── mentions.ts                  # @mention resolver for comments
│   ├── validations.ts               # Zod schemas for all API routes
│   ├── security.ts                  # SSRF validation for webhooks
│   ├── rate-limit.ts                # Sliding-window rate limiter
│   ├── crypto.ts                    # AES-256-GCM encryption/decryption
│   ├── webhooks.ts                  # HMAC-SHA256 webhook dispatch engine
│   └── audit.ts                     # logAction() helper for audit logging
├── hooks/
│   ├── use-realtime-note.ts         # SSE + presence heartbeat hook
│   ├── use-prism.ts                 # PrismJS autoloader syntax highlighting
│   └── use-mermaid.ts               # Mermaid.js CDN diagram renderer
├── middleware.ts                    # Route protection via cookie check
└── __tests__/                       # Vitest tests
```

## Plugin System

Plugins are built-in feature modules toggled per workspace in Settings. Each plugin has:
- `id` + `name` + `description` in `src/plugins/metadata.ts` (client-safe)
- Server-side implementation in `src/plugins/{id}/index.ts`
- Optional settings component in `src/plugins/{id}/components/settings.tsx`
- API routes registered via `src/plugins/index.ts`

Plugin configs stored in `plugin_config` PostgreSQL table (JSONB config, enabled flag).
PluginCard component handles enable/disable and mounts settings component via React.lazy.

## Realtime Architecture

MindMatrix uses **SSE + PostgreSQL LISTEN/NOTIFY** for realtime features — zero new packages:

```
Note save → PATCH handler:
  1. Save note to DB
  2. Create version entry
  3. Parse & store backlinks
  4. sql.notify('note:<id>', { type: 'note_updated', ... })

SSE endpoint (GET /api/notes/[id]/events):
  1. Auth check
  2. Subscribe to PG channel 'note:<noteId>' via event-bus
  3. Stream events to browser via ReadableStream + text/event-stream

Client hook (useRealtimeNote):
  1. EventSource → /api/notes/[id]/events
  2. 15s heartbeat → POST /api/notes/[id]/presence
  3. Returns: viewers[], lastUpdate?, connected
```

## Database
- PostgreSQL via Docker Compose (`deploy/docker-compose.yml`)
- Drizzle ORM with `postgres` driver (not `pg`)
- Schema in `src/lib/db/schema.ts` — auth tables + app tables + plugin tables
- Migrations via `npm run db:push` (dev) or `drizzle-kit generate && migrate` (prod)
- Connection pooling: hot-reload-safe singleton on `globalThis`

## API Routes
All routes under `/api/` require auth (except `/api/auth/*`). Auth checked via `auth.api.getSession()`.
- `/api/auth/[...all]` — Better Auth handler (GET/POST)
- `/api/workspaces` — CRUD workspaces, members
- `/api/notes` — CRUD notes with filters
- `/api/folders` — CRUD folders
- `/api/tags` — CRUD tags
- `/api/search` — Full-text search
- `/api/export` — Export as markdown (format=markdown|json|pdf)
- `/api/import` — Import markdown
- `/api/templates` — CRUD note templates
- `/api/profile` — User profile (name, email, avatar, timezone, timeFormat, dateFormat)
- `/api/profile/avatar` — Avatar upload (2MB, JPEG/PNG/WebP)
- `/api/notes/[id]/links` — Backlinks (incoming + outgoing)
- `/api/notes/[id]/versions` — Version history (list + restore)
- `/api/notes/[id]/versions/[versionId]` — Single version content
- `/api/notes/[id]/events` — SSE stream for realtime collaboration
- `/api/notes/[id]/presence` — Presence heartbeat (POST) + viewers (GET)
- `/api/plugins/[...plugin]` — Dynamic plugin API route dispatcher
- `/api/plugins/config` — Plugin enable/disable + config CRUD
- `/api/sync/pcloud`, `/api/sync/google-drive` — Cloud sync
- `/api/admin/[...]` — Super admin: stats, workspaces, users, audit-logs, settings (system config + email test)
- `/api/notes/[id]/delta` — Y.js CRDT delta updates
- `/api/notes/upload` — Drag & drop file uploads (configurable types/size)
- `/api/workspaces/[id]/webhooks` — Webhook CRUD per workspace
- `/api/oauth/pcloud`, `/api/oauth/google-drive` — OAuth callback handlers
- `/api/tokens` — API token CRUD for CLI and third-party integrations
- `/api/notes/by-slug` — Note lookup by workspace + slug (used for ![[embeds]])
- `/api/notes/[id]/comments` — Threaded comments on notes (GET/POST)
- `/api/comments/[id]` — Delete a comment (author-only)
- `/api/notifications` — List, create, mark all read (GET/POST/PATCH)
- `/api/notifications/[id]` — Mark single notification as read (PATCH)
- `/api/notifications/events` — SSE stream for real-time notification delivery

## Keyboard Shortcuts
| Shortcut                   | macOS                  | Windows / Linux           |
| -------------------------- | ---------------------- | ------------------------- |
| Search                     | Cmd+K                  | Ctrl+K                    |
| New Note                   | Opt+N                  | Alt+N                     |
| New Folder                 | Opt+Shift+F            | Alt+Shift+F               |
| Save Note                  | Cmd+Enter              | Ctrl+Enter                |
| Toggle Sidebar             | Cmd+B                  | Ctrl+B                    |
| Settings                   | Cmd+,                  | Ctrl+,                    |
| Toggle Preview             | Cmd+\                  | Ctrl+\                    |
| Delete Note                | Cmd+Shift+Backspace    | Ctrl+Shift+Backspace      |
| Back to Workspace          | Cmd+Opt+[              | Ctrl+Alt+[                |
| Toggle Public Share        | Cmd+Shift+P            | Ctrl+Shift+P              |
| Close Dialogs              | Escape                 | Escape                    |

## Commands
- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run test` — Run vitest tests
- `npm run lint` — Run ESLint
- `npm run db:push` — Push schema to database (uses drizzle-kit)
- `npm run db:migrate` — Generate and run migrations

> **Note**: `drizzle-kit` is a local dev dependency. Always use `npm run db:push` or `npx drizzle-kit push` — not `drizzle-kit` directly.

## Environment Variables
```
DATABASE_URL=postgres://mindmatrix:password@localhost:5434/mindmatrix
DB_MAX_CONNECTIONS=10
BETTER_AUTH_SECRET=<32+ char secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Key Conventions
- No Tailwind — use Sass modules + CSS custom properties
- Match FleetOps patterns for auth, theme, and DB setup
- Workspace permissions: owner > admin > member > viewer
- All IDs use `crypto.randomUUID()`
- Slugs auto-generated from names (lowercase, hyphens)
- Permission checks occur in every API route
- Theme cookie/key: `mindmatrix-theme`
- Editor layout stored in `localStorage` as `mindmatrix-editor-layout`
- Plugins toggled per workspace, configs in JSONB `plugin_config` table
- Zero new dependencies policy for realtime (SSE + PG NOTIFY)
- Never run `npm audit fix --force` — it downgrades packages across major versions (e.g., Next.js 16→9). Use only `npm audit fix` (no --force) which stays within semver
- Run `npm run db:push` at the start of every local dev session to sync schema changes to the local PostgreSQL container
- When asked "is docs updated?", "update docs", or similar — always check and update these files together: `/docs` pages, `/apidocs` page, `README.md`, `AGENTS.md`, `plan.md`
- Version bump checklist (must update all): `package.json` → `AGENTS.md` → settings About section → landing page → `src/lib/webhooks.ts` → `README.md` → `plan.md`
- Always mark todos as `completed` when done — never leave tasks dangling in the todo panel. The todo list in the sidebar must reflect reality.
