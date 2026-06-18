# MindMatrix v0.5.0 — Implementation Plan

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
