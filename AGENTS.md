# MindMatrix — Agent Guide

## Project Overview
MindMatrix is a markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.
- **Version**: 0.1.0
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
| react-markdown    | 10.1.0  | Markdown rendering        |
| @radix-ui/react-* | —       | UI primitives             |
| lucide-react      | 1.18.0  | Icons                     |
| clsx              | 2.1.1   | Class merging             |
| zod               | ^3.23+  | Validation                |
| vitest            | 4.1.8   | Testing                   |

## Styling
- **No Tailwind CSS** — uses Sass/SCSS with CSS custom properties (design tokens)
- 4 themes via `data-theme` attribute: `nord-dark`, `nord-light`, `dracula-dark`, `dracula-light`
- Theme persistence: `localStorage` key `mindmatrix-theme`, applied via inline `<script>` before first paint
- Global utility classes: `.btn`, `.card`, `.form-group`, `.badge`, `.table-wrapper`, etc.
- Font: JetBrains Mono via `next/font/google`, applied as `--font-jetbrains-mono`
- CSS variables defined in `src/app/globals.scss`

## Project Structure
```
src/
├── app/
│   ├── (auth)/login/, register/    # Auth pages
│   ├── (dashboard)/dashboard/       # Authenticated routes
│   │   ├── w/[slug]/                # Workspace views
│   │   ├── settings/                # User settings
│   │   └── sync/                    # Cloud sync management
│   ├── api/                         # REST API routes
│   ├── docs/                        # User documentation
│   ├── apidocs/                     # API reference
│   ├── layout.tsx                   # Root layout (font, theme, providers)
│   └── globals.scss                 # Theme CSS vars + global styles
├── components/
│   ├── theme/                       # ThemeProvider, ThemeToggle
│   └── search/                      # SearchOverlay (Cmd+K)
├── lib/
│   ├── auth.ts                      # Better Auth server config
│   ├── auth-client.ts              # Better Auth client config
│   └── db/
│       ├── schema.ts                # All Drizzle table definitions
│       └── index.ts                 # Drizzle client + postgres pool
├── middleware.ts                    # Route protection via cookie check
└── __tests__/                       # Vitest tests
```

## Database
- PostgreSQL via Docker Compose (`deploy/docker-compose.yml`)
- Drizzle ORM with `postgres` driver (not `pg`)
- Schema in `src/lib/db/schema.ts` — auth tables + app tables
- Migrations via `npx drizzle-kit push` (dev) or `drizzle-kit generate && migrate` (prod)
- Connection pooling: hot-reload-safe singleton on `globalThis`

## API Routes
All routes under `/api/` require auth (except `/api/auth/*`). Auth checked via `auth.api.getSession()`.
- `/api/auth/[...all]` — Better Auth handler (GET/POST)
- `/api/workspaces` — CRUD workspaces, members
- `/api/notes` — CRUD notes with filters
- `/api/folders` — CRUD folders
- `/api/tags` — CRUD tags
- `/api/search` — Full-text search
- `/api/export` — Export as markdown
- `/api/import` — Import markdown
- `/api/sync/pcloud`, `/api/sync/google-drive` — Cloud sync

## Keyboard Shortcuts
| Shortcut         | macOS              | Windows / Linux       |
| ---------------- | ------------------ | --------------------- |
| Search           | Cmd+K              | Ctrl+K                |
| New Note         | Cmd+N              | Ctrl+N                |
| New Folder       | Cmd+Shift+F        | Ctrl+Shift+F          |
| Save Note        | Cmd+Enter          | Ctrl+Enter            |
| Toggle Sidebar   | Cmd+B              | Ctrl+B                |
| Settings         | Cmd+,              | Ctrl+,                |
| Close Dialogs    | Escape             | Escape                |

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
