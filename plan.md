# MindMatrix v0.1.0 — Implementation Plan

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
- `sync_connections` — id, userId, provider, accessToken, refreshToken, expiresAt, config

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
- `GET /api/export?workspaceId=&format=zip` — Export as zip
- `POST /api/import` — Import markdown/zip

### Cloud Sync
- `GET/POST /api/sync/pcloud/*` — pCloud OAuth + sync
- `GET/POST /api/sync/google-drive/*` — Google Drive OAuth + sync

## Theme System

CSS custom properties with 4 themes:
- `data-theme="nord-dark"` (default)
- `data-theme="nord-light"`
- `data-theme="dracula-dark"`
- `data-theme="dracula-light"`

Stored in `localStorage` key `mindmatrix-theme`. Applied via inline script before first paint.

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
