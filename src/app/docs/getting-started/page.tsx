export default function GettingStartedPage() {
  return (
    <div>
      <h1>Getting Started</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Set up MindMatrix on your own infrastructure in minutes.
      </p>

      <div className="card">
        <h2>Prerequisites</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Node.js 22 or later</li>
          <li>PostgreSQL 17</li>
          <li>npm or pnpm</li>
          <li>Docker and Docker Compose (optional)</li>
        </ul>
      </div>

      <div className="card">
        <h2>Option 1: Docker Compose (Recommended)</h2>
        <p style={{ marginBottom: "1rem" }}>The fastest way to get started:</p>
        <pre><code className="language-bash">
          {`git clone git@github.com:mojoaar/mindmatrix.git
cd mindmatrix
cp .env.example .env
# Edit .env with your secrets
docker compose -f deploy/docker-compose.yml up -d`}
        </code></pre>
        <p className="text-muted text-sm">Access the app at http://localhost:3000</p>
      </div>

      <div className="card">
        <h2>Option 2: Node.js with systemd</h2>
        <pre><code className="language-bash">
          {`git clone git@github.com:mojoaar/mindmatrix.git /opt/mindmatrix
cd /opt/mindmatrix
cp .env.example .env
# Edit .env with your database credentials and secrets
npm ci
npm run build
# Run database migrations
npx drizzle-kit push
# Start the app
npm run start`}
        </code></pre>
      </div>

      <div className="card">
        <h2>First Steps</h2>
        <ol style={{ paddingLeft: "1.5rem" }}>
          <li>Create your account at /register</li>
          <li>Create a workspace from the dashboard</li>
          <li>Invite team members from workspace settings</li>
          <li>Create your first note — press Cmd+K to search, Cmd+Enter to save</li>
          <li>Configure cloud sync from Settings &gt; Sync</li>
        </ol>
      </div>
    </div>
  );
}
