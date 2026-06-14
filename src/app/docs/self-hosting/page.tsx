export default function SelfHostingDocPage() {
  return (
    <div>
      <h1>Self-Hosting</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Deploy MindMatrix on your own infrastructure.
      </p>
      <div className="card">
        <h2>Requirements</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li>Node.js 22+</li>
          <li>PostgreSQL 17</li>
          <li>2GB RAM minimum</li>
        </ul>
      </div>
      <div className="card">
        <h2>Docker Compose</h2>
        <pre style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--border-radius)", overflow: "auto" }}>
          {`git clone git@github.com:mojoaar/mindmatrix.git
cd mindmatrix
cp .env.example .env
openssl rand -base64 48  # Generate BETTER_AUTH_SECRET
docker compose -f deploy/docker-compose.yml up -d`}
        </pre>
      </div>
      <div className="card">
        <h2>Node.js (systemd)</h2>
        <pre style={{ backgroundColor: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--border-radius)", overflow: "auto" }}>
          {`cp deploy/mindmatrix.service /etc/systemd/system/
sudo useradd -r -s /bin/false mindmatrix
sudo mkdir -p /opt/mindmatrix
sudo chown -R mindmatrix:mindmatrix /opt/mindmatrix
sudo systemctl daemon-reload
sudo systemctl enable mindmatrix
sudo systemctl start mindmatrix`}
        </pre>
      </div>
      <div className="card">
        <h2>Environment Variables</h2>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Variable</th><th>Required</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td><code>DATABASE_URL</code></td><td>Yes</td><td>PostgreSQL connection string</td></tr>
              <tr><td><code>BETTER_AUTH_SECRET</code></td><td>Yes</td><td>32+ char random secret</td></tr>
              <tr><td><code>BETTER_AUTH_URL</code></td><td>Yes</td><td>Base URL of the app</td></tr>
              <tr><td><code>NEXT_PUBLIC_APP_URL</code></td><td>Yes</td><td>Public URL for client</td></tr>
              <tr><td><code>DB_MAX_CONNECTIONS</code></td><td>No</td><td>Max DB connections (default 10)</td></tr>
              <tr><td><code>NODE_ENV</code></td><td>No</td><td>production or development</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
