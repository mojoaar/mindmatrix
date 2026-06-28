# MindMatrix v0.6.0 — Implementation Plan

Markdown-first, self-hosted, multi-user knowledge hub.
**License**: AGPL-3.0 | **Repo**: git@github.com:mojoaar/mindmatrix.git

## Tech Stack

| Package                      | Version | Purpose                   |
| ---------------------------- | ------- | ------------------------- |
| next                         | 16.2.9  | Framework (App Router)    |
| react / react-dom            | 19.2    | UI                        |
| typescript                   | ^5      | Types                     |
| sass                         | ^1.77+  | SCSS preprocessor         |
| better-auth                  | 1.6.18  | Auth (email/password)     |
| @better-auth/drizzle-adapter | 1.6.18  | Auth DB adapter           |
| drizzle-orm                  | 0.45.2  | ORM                       |
| drizzle-kit                  | 0.31.10 | SQL migrations            |
| postgres                     | ^3.4.4  | PostgreSQL driver         |
| @uiw/react-codemirror        | 4.25.10 | Markdown editor           |
| @codemirror/lang-markdown    | 6.5.0   | Editor syntax support     |
| react-markdown               | 10.1.0  | Markdown rendering        |
| remark-gfm                   | ^4      | GFM support (tables etc.) |
| @radix-ui/react-dialog       | 1.1.16  | UI primitives             |
| @radix-ui/react-dropdown-menu| 2.x     | UI primitives             |
| @radix-ui/react-slot         | 1.x     | UI primitives             |
| @radix-ui/react-tabs         | 1.x     | UI primitives             |
| @radix-ui/react-tooltip      | 1.x     | UI primitives             |
| @radix-ui/react-toast        | 1.x     | UI primitives             |
| lucide-react                 | 1.18.0  | Icons                     |
| clsx                         | 2.1.1   | Class name utility        |
| zod                          | ^3.23+  | Validation schemas        |
| vitest                       | 4.1.8   | Testing                   |

## Project Structure

```
mindmatrix/
├── src/
│   ├── app/
│   │   ├── (auth)/                  # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/             # Authenticated route group
│   │   │   ├── layout.tsx           # Sidebar + workspace context
│   │   │   ├── page.tsx             # Redirect to first workspace
│   │   │   ├── w/[slug]/            # Workspace routes
│   │   │   │   ├── page.tsx         # Notes list
│   │   │   │   ├── notes/[id]/page.tsx  # Note editor
│   │   │   │   └── settings/page.tsx
│   │   │   ├── settings/page.tsx    # User settings
│   │   │   └── sync/page.tsx        # Cloud sync management
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── workspaces/
│   │   │   ├── notes/
│   │   │   ├── folders/
│   │   │   ├── tags/
│   │   │   ├── search/route.ts
│   │   │   ├── export/route.ts
│   │   │   ├── import/route.ts
│   │   │   └── sync/
│   │   ├── docs/[[...slug]]/page.tsx
│   │   ├── apidocs/page.tsx
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.scss             # Theme vars + global styles
│   ├── components/
│   │   ├── ui/                      # Button, Input, Dialog, etc.
│   │   ├── editor/                  # CodeMirror + preview
│   │   ├── sidebar/                 # Nav sidebar
│   │   ├── search/                  # Cmd+K search overlay
│   │   └── theme/                   # ThemeProvider, ThemeToggle
│   ├── lib/
│   │   ├── auth.ts                  # Better Auth server
│   │   ├── auth-client.ts          # Better Auth client
│   │   ├── db/
│   │   │   ├── index.ts             # Drizzle client
│   │   │   └── schema.ts            # All table definitions
│   │   ├── validations.ts           # Zod schemas
│   │   └── sync/                    # Cloud sync providers
│   ├── hooks/                       # React hooks
│   └── types/                       # Shared TS types
├── drizzle/migrations/
├── deploy/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── mindmatrix.service
├── drizzle.config.ts
├── vitest.config.ts
├── package.json
├── .env.example
├── LICENSE
└── README.md
```

## Database Schema

### Auth tables (Better Auth)
- `user` — id, name, email, emailVerified, image, createdAt, updatedAt
- `session` — id, expiresAt, token, ipAddress, userAgent, userId
- `account` — id, accountId, providerId, userId, accessToken, refreshToken, ...
- `verification` — id, identifier, value, expiresAt

### Application tables
- `workspaces` — id, name, slug, description, createdById, createdAt, updatedAt
- `workspace_members` — id, workspaceId, userId, role (owner|admin|member|viewer)
- `folders` — id, workspaceId, parentId, name, slug, createdById, createdAt, updatedAt
- `notes` — id, workspaceId, folderId, title, slug, content, createdById, updatedById, createdAt, updatedAt
- `tags` — id, workspaceId, name, color, createdById, createdAt
- `note_tags` — noteId, tagId
- `notifications` — id, userId, type, title, message, link, isRead, createdAt
- `system_config` — key (PK), value, updatedAt
- `system_config` — key (text PK), value (text), updatedAt (timestamp)

## API Routes

All routes return JSON, require auth (except auth routes), and enforce workspace-level permissions.

### Auth
- `GET/POST /api/auth/[...all]` — Better Auth handler

### Workspaces
- `GET /api/workspaces` — List user's workspaces
- `POST /api/workspaces` — Create
- `GET /api/workspaces/[id]` — Get details
- `PATCH /api/workspaces/[id]` — Update (owner only)
- `DELETE /api/workspaces/[id]` — Delete (owner only)
- `GET /api/workspaces/[id]/members` — List members
- `POST /api/workspaces/[id]/members` — Add member
- `PATCH /api/workspaces/[id]/members/[userId]` — Update role
- `DELETE /api/workspaces/[id]/members/[userId]` — Remove member

### Notes
- `GET /api/notes?workspaceId=&folderId=&tagId=` — List
- `POST /api/notes` — Create
- `GET /api/notes/[id]` — Get
- `PATCH /api/notes/[id]` — Update
- `DELETE /api/notes/[id]` — Delete

### Folders
- `GET /api/folders?workspaceId=&parentId=` — List
- `POST /api/folders` — Create
- `PATCH /api/folders/[id]` — Update
- `DELETE /api/folders/[id]` — Delete

### Tags
- `GET /api/tags?workspaceId=` — List
- `POST /api/tags` — Create
- `PATCH /api/tags/[id]` — Update
- `DELETE /api/tags/[id]` — Delete

### Search
- `GET /api/search?q=&workspaceId=` — Full-text search

### Export/Import
- `GET /api/export?workspaceId=&format=markdown|json|pdf` — Export workspace notes
- `POST /api/import` — Import markdown/zip

### Notifications
- `GET /api/notifications?limit=&page=` — List (paginated, with unread count)
- `PATCH /api/notifications` — Mark all read
- `PATCH /api/notifications/[id]` — Mark one read
- `GET /api/notifications/events` — SSE stream for real-time delivery

### Cloud Sync
- `GET/POST /api/sync/pcloud/*` — pCloud OAuth + sync
- `GET/POST /api/sync/google-drive/*` — Google Drive OAuth + sync

### Admin
- `GET /api/admin/stats` — Dashboard statistics
- `GET /api/admin/workspaces` — List all workspaces
- `DELETE /api/admin/workspaces/[id]` — Force-delete workspace
- `GET /api/admin/users` — List all users
- `PATCH /api/admin/users/[id]` — Update user role/verification
- `GET /api/admin/audit-logs` — Paginated audit trail
- `GET /api/admin/settings` — Get system config
- `PATCH /api/admin/settings` — Update system config
- `POST /api/admin/settings/email-test` — Test SMTP send

### Profile
- `GET /api/profile` — Get current user
- `PATCH /api/profile` — Update name, email, timezone, timeFormat, dateFormat
- `POST /api/profile/avatar` — Upload avatar
- `DELETE /api/profile/avatar` — Remove avatar

## Theme System

CSS custom properties with 12 themes (each with light and dark):
- Nord: `nord-dark`, `nord-light`
- Dracula: `dracula-dark`, `dracula-light`
- GitHub: `github-dark`, `github-light`
- Catppuccin: `catppuccin-dark`, `catppuccin-light`
- Cyberpunk: `cyberpunk-dark`, `cyberpunk-light`
- One: `one-dark`, `one-light`

8 developer fonts selectable in Settings > Preferences — applied via `data-font` attribute and inline script.

Stored in `localStorage` key `mindmatrix-theme` and `mindmatrix-font`. Applied via inline script before first paint.

## Keyboard Shortcuts

| Shortcut      | Action                |
| ------------- | --------------------- |
| `Cmd+K`       | Global search overlay |
| `Cmd+Enter`   | Save current note     |
| `Cmd+B`       | Toggle sidebar        |
| `Escape`      | Close overlay/dialog  |

## Deployment

**Docker Compose**: PostgreSQL + Next.js app on port 3000
**Node.js + systemd**: `deploy/mindmatrix.service` template

## Execution Steps

1. Scaffold: Next.js 16 + TypeScript + Sass + JetBrains Mono
2. Database: Docker Compose PostgreSQL + Drizzle schema + migrations
3. Auth: Better Auth v1 (email/password) with Drizzle adapter
4. Theme system: 4 themes, provider, toggle, global styles
5. Base UI: Layout, sidebar, Radix components, Sass modules
6. Workspaces: Schema + API + UI (list, create, settings, members)
7. Folders + Tags: Schema + API + UI
8. Notes: Schema + API + UI
9. Editor: CodeMirror 6 with configurable layout
10. Search: Full-text search + global Cmd+K overlay
11. Import/Export: Markdown zip
12. Cloud Sync: pCloud + Google Drive OAuth
13. API Docs: OpenAPI spec + Scalar at /apidocs
14. User Docs: /docs rendering markdown
15. Tests: Vitest for auth, API, core utilities
16. Docker + README: Dockerfile, compose, systemd, setup guide

## v0.1 Critical Fixes (Post-Build Audit)

### Block 1 — Broken Core Flow
- **B1**: `POST /api/workspaces` does not insert creator into `workspaceMember` → all subsequent note/folder/tag creation returns 403
- **B2**: `GET /api/workspaces` only returns `createdById` workspaces → invited members see nothing, multi-user broken
- **B3**: No "Create Workspace" button anywhere in the UI → new user stuck with empty state
- **B11**: `/dashboard` and `/dashboard/settings` render identical settings pages

### Block 2 — Data Leak & Search
- **B4**: `GET /api/workspaces/[id]` has no membership check → any authenticated user can see all workspace data
- **B5**: `/api/search` uses `eq(workspaceIds[0])` instead of `inArray()` → search limited to first workspace only

### Block 3 — UI
- **B6**: `auth.module.scss` never imported in login/register pages → broken styles
- **B7**: Workspace page fetches all workspaces then client-side filters by slug → fragile, wastes bandwidth
- **B9**: Search button in dashboard header has empty `onClick` → dead code

### Block 4 — Robustness
- **I13**: `src/lib/validations.ts` missing — Zod not used despite being a dependency
- **I14**: `auth.ts` uses non-null assertions on env vars → crashes with opaque error at runtime
- **I15**: `auth-client.ts` falls back to `localhost:3000` in production
- **I16**: `/apidocs` loads Scalar CDN script but never initializes it → dead download
- **I17**: Sync page connect/disconnect buttons are fake local state toggles → no real OAuth

## v0.2 Roadmap

- **Backlinks** — `[[note-slug]]` detection + "what links here" sidebar panel
- **Version history** — `note_versions` table + diff view for revision tracking
- **Templates** — workspace-level note templates (ADR, runbook, onboarding doc)
- **Git sync** — push/pull notes to a configured Git repository on save/load
- **CLI** — `mindmatrix` CLI for creating/editing/searching notes from terminal
- **Webhooks** — fire HTTP callbacks on note create/update/delete events
- **AI search** — vector embeddings + semantic search across notes
- **Realtime collaboration** — WebSocket-based live editing (Y.js / PartyKit)

## v0.2 Features (Completed)

### Backlinks
- `[[note-slug]]` wiki-link detection on note save
- `note_link` junction table — outgoing + incoming tracking
- `GET /api/notes/[id]/links` — both directions
- BacklinksPanel in editor — "Links from" + "Links to" sections
- Resolves slugs to note IDs within the same workspace

### Version History
- `note_version` table — snapshot of title + content on every save
- `GET /api/notes/[id]/versions` — list with timestamps, limit 50
- `GET /api/notes/[id]/versions/[versionId]` — full version content
- `POST /api/notes/[id]/versions` — restore version (creates snapshot of current first)
- VersionPanel in editor — history list with restore button

### Realtime Collaboration
- SSE + PostgreSQL LISTEN/NOTIFY — zero new packages
- `GET /api/notes/[id]/events` — Server-Sent Events stream
- `POST /api/notes/[id]/presence` — 15s heartbeat, returns viewer list
- `useRealtimeNote` hook — EventSource + presence heartbeat
- PresenceAvatars in editor header — shows concurrent viewers
- Toast notification when someone else updates the note
- `sql` export from db/index.ts for direct NOTIFY

### Plugin System
- `plugin_config` DB table — per-workspace enable/disable + JSONB config
- Client-safe `metadata.ts` — lightweight plugin registry
- Server-side `index.ts` — full plugin implementation registry
- `PluginCard` component — enable toggle + lazy-load settings
- `GET/POST /api/plugins/config` — enable/disable + save config
- `POST/GET /api/plugins/[...plugin]` — dynamic route dispatcher
- 5 built-in plugins: OpenCode Go, Proxmox Inventory, Unifi Topology, pCloud, Google Drive

### v0.2 Polish
- 400+ workspace icons with searchable IconPicker
- Cross-platform shortcut docs (macOS + Windows/Linux)
- 401 handling in dashboard layout + settings (auto-redirect)
- Profile/avatar sync to sidebar via custom events
- Workspace icon/name sync to sidebar via custom events
- Full IANA timezone list via Intl.supportedValuesOf
- Back navigation on /docs and /apidocs
- Theme selector moved from sidebar to Settings > Preferences
- Click username → Settings page
- Cmd+K command palette shows all shortcuts when empty
- Workspaces sorted alphabetically
- Port 5434 for PostgreSQL (coexists with FleetOps)

## v0.3 Roadmap (Completed)

### Sync Plugins (pCloud + Google Drive) ✓
- OAuth 2.0 flows for both providers
- Folder-based sync: upload/download .md files
- Token refresh for Google (access tokens expire)
- Settings UI: Connect/Disconnect, status, Sync Now button
- OAuth callback endpoints: `/api/oauth/pcloud`, `/api/oauth/google-drive`

### Test Coverage ✓
- Plugin metadata, OpenCode client, event-bus, proxy, config API
- 54 tests across test files

### Security Hardening ✓
- AES-256-GCM encryption for plugin credentials (`src/lib/crypto.ts`)
- BOLA fixes: workspace membership guards on all plugin endpoints
- Config masking: sensitive values replaced with `••••••••` before client delivery
- `requirePluginAccess()` guard in all 5 plugin route handlers

### Super Admin ✓
- First user auto-promoted to `super_admin`
- Admin dashboard: stats, workspace/user management, audit logs
- Audit logging wired to all CRUD operations

### Webhooks & Git Sync ✓
- Webhooks system with HMAC-SHA256 signature payloads and automatic event logging
- Git Sync plugin supporting SSH and HTTPS clone, fetch-and-merge note upserting, and push-on-save

### Realtime CRDT & Rich Editor ✓
- Realtime co-authoring via Y.js Base64 delta streams over PostgreSQL LISTEN/NOTIFY
- Debounced background saving of co-authored documents to Postgres Note table
- Full-width notes workspace (100% viewport spacing)
- Markdown Formatting Toolbar (Headings, bold, italic, code, list, tasks, table grid)
- Drag & Drop file upload with automatic image insertion
- Public read-only document sharing and toggle controls
- User profile timezone / 12h/24h date calculation mapping inside Notes

### Taxonomy & UI Polish ✓
- Generalized Dashboard Edit Mode (Edit/Done toggle for both folders and tags)
- Full Folder management: rename and delete directly from folder pills
- Full Tag management: rename, change colors via circular picker, and delete directly from tag filter pills
- Automatic tag color rotation from an 8-color cyclic pool on new tag creations
- Sidebar folder note counts `(N)` updated reactively via workspace data-bindings
- Nested folders and tags toggles in user settings with instant responsive sidebar layout updates

### Landing Page & Security ✓
- Unauthenticated Dracula landing page with theme toggle preserving user preferences
- TOTP two-factor authentication (opt-in, QR code setup, backup codes, trusted devices)
- Proxy `__Secure-` cookie prefix fix for HTTPS production compatibility
- SSRF protection for webhook URL validation (`src/lib/security.ts`)
- Rate limiting on auth endpoints and note file uploads (`src/lib/rate-limit.ts`)
- XSS sanitization via rehype-sanitize in note editor and public share pages
- Avatar cache-busting (timestamped filenames) and Better Auth additionalFields sync

### v0.4 Features (Completed ✓)
- **Mermaid.js Diagrams** — ` ```mermaid ` blocks rendered as SVG in preview (CDN-loaded)
- **Note Embeds** — `![[note-slug]]` transclusion with nested ReactMarkdown, 3-level depth limit
- **Threaded Comments** — comment on shared notes with SSE real-time delivery
- **@mentions in Comments** — workspace member notification when mentioned
- **API Tokens** — Bearer token auth for CLI and third-party integrations
- **Interactive Notes Sorting** — click table headers in workspace notes view to sort dynamically by Title or Updated
- **Visual Search in Docs & API Reference** — added search triggers and overlays to `/docs` and `/apidocs` routes
- **Interactive Multi-Language API Examples** — added a sticky language selector bar with collapsible PrismJS snippets to `/apidocs`
- **Client Cache Invalidation** — resolved stale notes list and out-of-sync sidebar folder note counts on soft navigations by appending `{ cache: "no-store" }` headers to all dynamic GET fetch requests
- **Workspace Plugins Loading Fix** — fixed a data-binding bug in the generic `PluginCard` component (`d.config?.enabled` → `d.enabled`) that failed to bind active states on reload, restoring persistent status displays for all 7 plugins
- **OpenCode Naming Alignment** — renamed the OpenCode AI plugin to **OpenCode Go** across all server plugins, metadata registries, and documentations to create clean, distinctive naming alignment with your subscriptions

### Ideas Backlog

| #   | Feature                 | Description                                                                             |
| --- | ----------------------- | --------------------------------------------------------------------------------------- |
| 1   | CLI                     | `mindmatrix` terminal tool: auth, search, create/list/get notes, export                  |
| 2   | Note move               | Move a note between workspaces — dropdown in editor, PATCH workspaceId                 |
| 3   | AI search               | Vector embeddings + semantic search across notes                                         |
| 4   | Star/favorite notes     | Bookmark important notes, pinned list in sidebar                                         |
| 5   | Bulk operations         | Multi-select notes → batch tag, move, or delete                                          |
| 6   | Graph view              | Visualize `[[backlinks]]` as interactive force-directed graph                              |
| 7   | Calendar view           | Notes displayed on a timeline/calendar by created/updated date                         |
| 8   | API keys for plugins    | Per-plugin API keys for external services                                                 |
| 9   | SSO / OIDC              | Single sign-on via Google, GitHub, or OIDC provider                                     |
| 10  | Activity feed           | Per-workspace feed: who created/edited/deleted what                                     |
| 11  | Knowledge graph AI      | Auto-suggest related notes, tag gaps, duplicate detection                               |
| 12  | OCR for images          | Extract text from uploaded images, make searchable                                      |
| 13  | Custom dashboards       | Per-user dashboard widgets: recent notes, stats, pinned folders                         |
| 14  | Scheduled publishing    | Set a future publish date for notes                                                      |
| 15  | SSH-based plugin runner | Plugins can run on remote machines via SSH                                                |
| 16  | Dark editor theme only  | Independent editor theme toggle separate from UI theme                                     |
| 17  | Bookmark manager        | Browser-style bookmark list of external URLs pinned inside a workspace                     |
| 18  | Contact form plugin     | Configurable contact form embedded in public shared note pages                             |
| 19  | MCP server support     | Expose MindMatrix as a Model Context Protocol (MCP) server — first-class OpenCode integration for querying notes, workspaces, folders, tags, search, and backlinks directly from AI tools. Authenticate via existing Bearer API tokens. |

## Security Hardening Plan (Completed ✓)

### 1. Database At-Rest Encryption (`src/lib/crypto.ts`)
- Symmetric AES-256-GCM encryption using `ENCRYPTION_KEY` from `.env`.
- `encryptConfig(config)` / `decryptConfig(config)` utilities transparently encrypt sensitive JSONB columns in `plugin_config`.
- `maskConfig(config)` replaces sensitive values (keys, tokens, passwords) with `"••••••••"` before sending to client.
- Sensitive keys identified: `apiKey`, `secret`, `password`, `accessToken`, `refreshToken`, `clientSecret`, `tokenId`, `token`.

### 2. Broken Object-Level Authorization (BOLA) Fixes
- **Plugin Config Endpoint** (`/api/plugins/config`):
  - **GET**: Guard with workspace membership check (403 if not a member). Mask config values so plaintext secrets never leak to browser.
  - **POST**: Guard with role check (only "owner" or "admin" can write). Support partial updates if `"••••••••"` is sent back to preserve existing encrypted credentials.
- **5 Plugin Route Handlers** (`src/plugins/{id}/index.ts`):
  - Add workspace membership validation guard to every route handler.
  - Decrypt database credentials transparently on server before integration calls.

### 3. UI Zero-Secrets-Leak Handlers
- Support masked password/token state fields in settings components.

---

## v0.6.1 — Desktop & Mobile Clients Plan

### 1. Overview
Build Tauri desktop and PWA Android clients. MindMatrix stays as the self-hosted backend (Docker, full REST API). Clients talk via existing REST API + SSE.

### 2. Phase 1: PWA + CORS + Delta Sync (1-2 days)

| Task | File | Description |
| ---- | ---- | ----------- |
| Upgrade manifest icons | `src/app/manifest.ts` | Add 192x192 and 512x512 PNG icons with `"purpose": "any maskable"` |
| Service Worker | `public/sw.js` | Cache-first for static assets, network-first for API. Registered via inline `<script>` in root layout |
| CORS middleware | `src/middleware.ts` | Global CORS headers via `ALLOWED_ORIGINS` env var. Handle OPTIONS preflight |
| Delta sync endpoint | `src/app/api/sync/notes/route.ts` | `GET /api/sync/notes?workspaceId=X&since=ISO8601` returns changed notes + cursor |
| PWA icons | `public/icon-192.png`, `public/icon-512.png` | PNG exports of the SVG ribbon logo at 192x192 and 512x512 |

### 3. Phase 2: Tauri Desktop Shell (2-3 days)
- **Framework**: Tauri v2 (Rust backend + webview)
- **Approach**: Remote webview — loads user's self-hosted instance URL
- **`/connect` route**: Dedicated Next.js page for first-launch server URL + API token entry
- **Native features**: OS menu bar, system tray, OS notifications via Tauri API
- **Desktop icon**: Reuses existing SVG ribbon logo
- **Auto-updater**: Tauri updater plugin
- **Config storage**: `tauri-plugin-store` for persisting server URL + token

### 4. Phase 3: Offline Mode (future — not critical for initial release)
- Tauri-side SQLite via `tauri-plugin-sql`
- Sync notes via delta endpoint into local SQLite
- Queue edits locally, push on reconnect
- File system watcher monitors local folder, auto-imports `.md` files

### 5. Phase 4: Native Android (future — PWA-first for now)
- Build on Phase 1's CORS + token auth + delta sync
- Kotlin + Jetpack Compose
- SQLite/Room for local cache
- Share sheet integration, local notifications, biometric lock

---

## v0.7.0 — Workspace-Level AI Roadmap

As MindMatrix transitions from single-note prompting to workspace-wide context, we lay out the architectural blueprints for **Workspace-Level AI** to be built in v0.7.0:

### 1. Marquee Use Cases
- **Taxonomy & Tag Auditor** — Scans note themes, identifies un-tagged semantic matches, flags redundant or synonymous tags (e.g., `#devops` vs `#infra`), and suggests consolidations.
- **Title-Content Alignment Auditor** — Detects generic titles ("Untitled", "Draft") and generates descriptive titles based on content summaries. Flags file-title mismatches.
- **Semantic Link Discovery (PKM Graph Gaps)** — Scans all notes in a workspace to identify unlinked plain text mentions that match existing note slugs, suggesting `[[note-slug]]` transclusions with a single-click **[Auto-Link]** trigger.
- **Workspace-Wide Semantic Search & QA** — Interrogates the entire knowledge base (e.g., *"What are our server prerequisites?"*), retrieves relevant context chunks from multiple notes, compiles a consolidated answer, and lists cited sources.
- **Weekly Workspace Digest** — Generates a global summary of updated, created, and scanned data across the team's shared directory.

### 2. Proposed System Architecture (Hybrid RAG + Background Worker)
- **Database vector support** — Introduce `pgvector` extension to our PostgreSQL container schema to store high-dimensional semantic vectors for note blocks.
- **Incremental Asynchronous Auditor** — Implement an asynchronous background queue (using pg-boss or lightweight Postgres LISTEN/NOTIFY workers) that process note updates incrementally, rather than running expensive LLM scans on active page loads.
- **Centralized AI Copilot Console** — A new Workspace settings tab grouping audit logs into categorized filter tabs (**[Taxonomy Gaps]**, **[Link Discoveries]**, and **[Title Fixes]**) with direct database bulk updates.

---

## v0.5.0 — Pre-v0.6.0 Code & Security Audit (Completed ✓ — v0.6.0)

A thorough four-part audit (security, code quality, test coverage, API completeness) conducted before beginning Desktop & Mobile Clients (v0.6.0). Findings are numbered for referencing during implementation.

---

### 🔴 Critical (1)

| #   | Finding                                                                                                          | File                                     |
| --- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | **`Buffer` used in client-side code** — `use-realtime-note.ts` is marked `"use client"` but calls `Buffer.from()` for base64 encoding/decoding. This throws `ReferenceError: Buffer is not defined` in any browser. | `src/hooks/use-realtime-note.ts:95,128`    |

---

### 🟠 High (7)

| #   | Finding                                                                                                                                                                          | File                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2   | **Zod schemas defined but never used** — 11 schemas in `validations.ts`, zero imported by any route handler. All 49 routes do manual inline validation instead.                         | `src/lib/validations.ts`                                                            |
| 3   | **Rate limiting missing on 45/49 routes** — only 4 endpoints rate-limited (auth, upload, comments, tokens). No protection on notes CRUD, search, import, admin, plugins.               | 45 route files                                                                    |
| 4   | **Cross-user notification injection** — any authenticated user can POST a notification targeting an arbitrary `userId`. The route never checks `userId === session.user.id`.            | `src/app/api/notifications/route.ts:42-48`                                          |
| 5   | **Plugin dispatcher no auth at gateway level** — `plugins/[...plugin]/route.ts` delegates entirely to handlers without its own auth check. A misconfigured or new plugin could be exposed. | `src/app/api/plugins/[...plugin]/route.ts`                                          |
| 6   | **Upload route missing workspace permission check** — accepts `workspaceId` as a field but never validates it against workspace membership. Any authenticated user can upload files.      | `src/app/api/notes/upload/route.ts`                                                |
| 7   | **`middleware.ts`/`proxy.ts` naming mismatch** — middleware listed in AGENTS.md as `middleware.ts` but the actual file is named `proxy.ts`. Route protection may not be loading correctly. | `src/proxy.ts`                                                                     |
| 8   | **0% unit test coverage on 48 API route files**, 7 plugin indexes, 3 hooks, and 16/19 lib utilities. No vitest coverage provider configured. ~60 tests covering ~2% of logic.             | All source files                                                                  |

---

### 🟡 Medium (11)

| #    | Finding                                                                                                                                                                           | File(s)                                                                                                                                                                                    |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9    | **Duplicate inline slug logic in 6 files** — same regex string in every route. Should use `toSlug()` from `src/lib/slug.ts`.                                                             | `notes/route.ts:81`, `notes/[id]/route.ts:73`, `folders/route.ts:64`, `folders/[id]/route.ts:31`, `import/route.ts:33`, `plugins/git-sync/index.ts:208`                                          |
| 10   | **98 ESLint errors — 32 `@typescript-eslint/no-explicit-any`** spread across 17 files. Top offenders: `git-sync`, `sync-google-drive`, `crypto.ts`. Catch blocks and config objects are the main patterns. | 17 files                                                                                                                                                                                   |
| 11   | **No try/catch on 46/49 route handler files** — DB connection failures or unexpected errors will crash with Next.js raw 500 instead of a clean JSON error response.                     | All unguarded route files                                                                                                                                                                  |
| 12   | **Inconsistent `NextResponse.json()` vs `Response.json()`** — some routes use one, some the other. Cosmetic but confusing for new contributors.                                            | Multiple files                                                                                                                                                                             |
| 13   | **SSE notification events missing keepalive** — no heartbeat comment sent to the stream. Proxies and load balancers may drop the connection after idle timeout (often 60s).               | `src/app/api/notifications/events/route.ts`                                                                                                                                                  |
| 14   | **Public API leaks metadata** — `GET /api/notes/[id]` for `isPublic` notes returns `workspaceId`, `creator`, and `folder` metadata beyond what the share page renders.                      | `src/app/api/notes/[id]/route.ts` (public path)                                                                                                                                              |
| 15   | **Webhook: no retry, no delivery status** — failed dispatches are silently discarded. No event type registry exists. No delivery success/failure is stored for operators.                 | `src/lib/webhooks.ts`                                                                                                                                                                       |
| 16   | **`verifySSL` dead code in proxmox-inventory** — variable assigned at `line 22` but never referenced again. The settings toggle has no effect on actual HTTP requests.                     | `src/plugins/proxmox-inventory/index.ts:22`                                                                                                                                                  |
| 17   | **`getAccessToken` dead function in sync-pcloud** — exported module-level function at `lines 8-12`, never called. All routes access `config.accessToken` directly.                           | `src/plugins/sync-pcloud/index.ts:8-12`                                                                                                                                                      |
| 18   | **DB fallback password with placeholder** — `db/index.ts:7` has a hardcoded fallback connection string with `CHANGE_ME_DB_PASSWORD`. If `DATABASE_URL` is ever unset, it silently connects with a predictable credential. | `src/lib/db/index.ts:7`                                                                                                                                                                     |
| 19   | **`execSync` in git-sync blocks event loop** — synchronous `execSync()` calls for `git clone`, `git fetch`, `git commit`, and `git push` block all incoming Node.js requests during large repository operations. | `src/plugins/git-sync/index.ts`                                                                                                                                                              |

---

### 🟢 Low (14)

| #    | Area            | Finding                                                                                                                                                                | File(s)                                                                                   |
| ---- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 20   | Naming          | Plugin exports inconsistent: `syncPcloudPlugin` vs `opencodeAiPlugin` vs `unifiTopologyPlugin` vs `gitSyncPlugin`.                                                     | 7 plugin `index.ts` files                                                                   |
| 21   | CORS            | No CORS configured anywhere — safe for self-hosted but required before Phase 1 of v0.6.0 Desktop/Mobile Clients.                                                       | `next.config.ts`, all API routes                                                          |
| 22   | Console logging | 7 files with server-side `console.log`/`console.error` — should use a structured logger that respects `NODE_ENV`.                                                         | `email.ts`, `webhooks.ts`, `git-sync/index.ts`, `notes/[id]/route.ts`, `upload/route.ts`, `export/route.ts` |
| 23   | Gitignore       | `.env.*` not fully gitignored — `.env.production` or `.env.staging` could be accidentally committed.                                                                      | `.gitignore`                                                                                |
| 24   | Profile         | Theme and font values stored to DB but never validated against known lists (12 valid themes, 8 valid fonts).                                                           | `src/app/api/profile/route.ts`                                                              |
| 25   | Comments        | Comment body has no max length validation — could accept arbitrarily large payloads up to Next.js's 4MB default.                                                       | `src/app/api/notes/[id]/comments/route.ts`                                                  |
| 26   | Mermaid         | `innerHTML` assignment for Mermaid SVG output — low DOM XSS risk. Consider `securityLevel: 'strict'` config or DOMPurify sanitization.                                     | `src/hooks/use-mermaid.ts:40`                                                                |
| 27   | Sync routes     | pCloud and Google Drive sync routes only check user auth, not workspace membership.                                                                                    | `src/app/api/sync/pcloud/route.ts`, `sync/google-drive/route.ts`                            |
| 28   | Plugin imports  | 4 plugins use dynamic `import("@/lib/db")`, 3 use static imports — inconsistent pattern across plugin handlers.                                                         | `proxmox-inventory`, `unifi-topology`, `sync-pcloud`, `sync-google-drive`                    |
| 29   | Screenshots     | README PNG screenshots at 35-40MB+ each in `public/screenshots/` — significantly bloats `git clone` time. Consider Git LFS, `.gitignore` exclusion, or WebP conversion. | `public/screenshots/*.png`                                                                  |
| 30   | Server build    | Remote `npm run build` takes ~117s on the production server — consider `npm ci --prefer-offline` or caching node_modules to speed up deploys.                           | `scripts/deploy.sh`                                                                         |
| 31   | Tests           | Top 5 security-critical untested files: `security.ts`, `crypto.ts`, `rate-limit.ts`, `auth-helper.ts`, `api-token-auth.ts`                                               | `src/lib/security.ts`, `crypto.ts`, `rate-limit.ts`, `auth-helper.ts`, `api-token-auth.ts`      |
| 32   | Tests           | `webhooks.ts`, `email.ts`, `notifications.ts` — 0 tests on core infrastructure modules.                                                                                  | `src/lib/webhooks.ts`, `email.ts`, `notifications.ts`                                        |
| 33   | Tests           | `ai-assistant-panel.tsx` — 0 tests on a complex 330-line component with 3-attempt exponential backoff retry logic.                                                       | `src/components/editor/ai-assistant-panel.tsx`                                               |

---

### 📊 Summary

| Severity | Count |
| -------- | ----- |
| Critical | 1     |
| High     | 7     |
| Medium   | 11    |
| Low      | 14    |
| **Total**    | **33**    |

---

### 🎯 Recommended Fix Order (Top 10)

| Priority | #   | Rationale                                                                             |
| -------- | --- | ------------------------------------------------------------------------------------- |
| 1        | 1   | `Buffer` crash is a browser runtime break — prevents realtime collaboration in prod     |
| 2        | 7   | Middleware loading may be broken — means route protection is missing                   |
| 3        | 4   | Cross-user notification injection is a security bug affecting all users                |
| 4        | 5   | Plugin dispatcher needs gateway auth before new plugins are added in v0.6.0             |
| 5        | 6   | Upload endpoint needs workspace permission validation                                  |
| 6        | 3   | Rate limiting on all mutation endpoints (DoS protection)                               |
| 7        | 2   | Zod schema integration in core routes (notes, workspaces, folders, tags) — enables consistent validation before PWA/Tauri clients connect |
| 8        | 21  | CORS configuration required before Phase 1 of v0.6.0 Desktop/Mobile                    |
| 9        | 9   | Replace all inline slug generation with `toSlug()` — reduces duplication ahead of v0.6.0 |
| 10       | 31  | Add vitest coverage + tests for `crypto.ts` and `security.ts` (top 2 security-critical modules) |

---

### 📋 Test Coverage Gaps (Top 10, ranked by risk)

| Priority | File                                                                     | Risk      | Reason                                                                                   |
| -------- | ------------------------------------------------------------------------ | --------- | ---------------------------------------------------------------------------------------- |
| 1        | `src/lib/security.ts`                                                      | Critical | Sole SSRF defense for webhooks. Bug = RCE or internal network access.                    |
| 2        | `src/lib/crypto.ts`                                                        | Critical | Encrypts all plugin secrets, SMTP passwords, API keys, webhook secrets.                  |
| 3        | `src/lib/auth-helper.ts`                                                   | Critical | `getAuthUser()` used by nearly every API route. Bug = unauthorized access.                 |
| 4        | `src/lib/api-token-auth.ts`                                               | Critical | Validates all CLI/integration Bearer tokens. Bug = any token works.                      |
| 5        | `src/lib/rate-limit.ts`                                                    | High     | Frontline DoS defense for all rate-limited endpoints.                                    |
| 6        | `src/lib/webhooks.ts`                                                      | High     | Full webhook dispatch with SSRF, HMAC signatures, background execution.                  |
| 7        | `src/lib/email.ts`                                                         | High     | Verification emails, password resets, SMTP transport. Templates + variable substitution. |
| 8        | `src/hooks/use-realtime-note.ts`                                          | High     | Y.js CRDT + SSE + presence heartbeats — most complex client logic.                       |
| 9        | `src/app/api/notes/route.ts`                                               | High     | Most-used API endpoint — note listing + creation + filtering + webhook triggering.       |
| 10       | `src/app/api/workspaces/route.ts`                                          | High     | Workspace creation + slug uniqueness + membership setup.                                 |
