export default function SyncDocPage() {
  return (
    <div>
      <h1>Cloud Sync</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Back up and sync your notes to cloud storage providers. Sync is managed per workspace via the Plugin system.
      </p>
      <div className="card">
        <h2>Enabling Sync</h2>
        <p>
          Cloud sync is available as a <strong>per-workspace plugin</strong>. Navigate to your workspace settings
          (<code>/dashboard/w/[slug]/settings</code>) and scroll to the Plugins section. Enable the pCloud or Google Drive
          plugin, then click <strong>Configure</strong> to set up OAuth.
        </p>
        <p className="text-muted text-sm" style={{ marginTop: "0.75rem" }}>
          Each workspace can connect to its own cloud storage account independently.
        </p>
      </div>
      <div className="card">
        <h2>pCloud</h2>
        <p>
          Enable the <strong>pCloud Sync</strong> plugin in your workspace settings, enter your OAuth Client ID and Secret,
          then click <strong>Link pCloud Account</strong>. Notes are synced to a <code>MindMatrix/</code> folder in your pCloud.
        </p>
        <p className="text-muted text-sm" style={{ marginTop: "0.75rem" }}>
          Create an OAuth app at the <a href="https://docs.pcloud.com/my_apps/" target="_blank" rel="noopener">pCloud Developer Console</a>.
          Set the redirect URI to <code>{'{origin}'}/api/oauth/pcloud</code>.
        </p>
      </div>
      <div className="card">
        <h2>Google Drive</h2>
        <p>
          Enable the <strong>Google Drive Sync</strong> plugin in your workspace settings, enter your OAuth Client ID and Secret,
          then click <strong>Link Google Drive Account</strong>. Notes are synced to a <code>MindMatrix/</code> folder in your Drive.
        </p>
        <p className="text-muted text-sm" style={{ marginTop: "0.75rem" }}>
          Create an OAuth 2.0 client ID at the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a>.
          Add <code>{'{origin}'}/api/oauth/google-drive</code> as an authorized redirect URI.
        </p>
      </div>
    </div>
  );
}
