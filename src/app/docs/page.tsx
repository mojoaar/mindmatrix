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
          <li>Markdown-native editing with live preview</li>
          <li>Workspaces for teams with role-based permissions</li>
          <li>Folders and tags for organization</li>
          <li>Global search (Cmd+K)</li>
          <li>Import/export markdown notes</li>
          <li>Cloud sync to pCloud and Google Drive</li>
          <li>Full REST API for all operations</li>
          <li>Light/dark themes (Nord and Dracula)</li>
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
