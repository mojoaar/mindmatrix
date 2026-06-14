# MindMatrix

Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.

**Version**: 0.1.0 | **License**: AGPL-3.0

## Quick Start

### Docker Compose (Recommended)

```bash
git clone git@github.com:mojoaar/mindmatrix.git
cd mindmatrix
cp .env.example .env
# Generate a secure auth secret:
# openssl rand -base64 48
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
npx drizzle-kit push
npm run start
```

See `deploy/mindmatrix.service` for a systemd unit file.

## Development

```bash
npm install
cp .env.example .env
# Start PostgreSQL (e.g., via docker compose -f deploy/docker-compose.yml up -d postgres)
npx drizzle-kit push
npm run dev
```

## Features

- **Markdown-native** — Notes are stored and edited as plain .md content
- **Workspaces** — Team organization with role-based permissions (owner, admin, member, viewer)
- **Folders & Tags** — Hierarchical organization and flexible tagging
- **Global Search** — Press Cmd+K to search across all notes
- **Editor** — CodeMirror 6 with configurable layout (split/edit/preview)
- **Import/Export** — Export notes as markdown, import from markdown
- **Cloud Sync** — Connect pCloud and Google Drive for backups
- **Full REST API** — Complete API coverage for all features
- **Themes** — Nord and Dracula themes, light and dark variants
- **Self-hosted** — Docker Compose or systemd deployment

## Tech Stack

- [Next.js 16](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/) — Authentication
- [CodeMirror 6](https://codemirror.net/) — Editor
- [Radix UI](https://www.radix-ui.com/) — Accessible components
- [Sass/SCSS](https://sass-lang.com/) — Styling
- [Vitest](https://vitest.dev/) — Testing

## Keyboard Shortcuts

| Shortcut      | Action                |
| ------------- | --------------------- |
| `Cmd+K`       | Global search overlay |
| `Cmd+Enter`   | Save current note     |
| `Cmd+B`       | Toggle sidebar        |
| `Escape`      | Close dialogs         |

## API Documentation

Full API docs available at `/apidocs` when the app is running.

## Testing

```bash
npm run test
```

## License

MindMatrix is licensed under the GNU Affero General Public License v3.0. See [LICENSE](./LICENSE) for details.
