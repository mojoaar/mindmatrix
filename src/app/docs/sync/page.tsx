export default function SyncDocPage() {
  return (
    <div>
      <h1>Cloud Sync</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Back up and sync your notes to cloud storage providers.
      </p>
      <div className="card">
        <h2>pCloud</h2>
        <p>Connect your pCloud account from Settings &gt; Sync. Notes are synced to a <code>MindMatrix/</code> folder in your pCloud.</p>
      </div>
      <div className="card">
        <h2>Google Drive</h2>
        <p>Connect your Google Drive account from Settings &gt; Sync. Notes are synced to a <code>MindMatrix/</code> folder in your Drive.</p>
      </div>
      <div className="card">
        <h2>Manual Sync</h2>
        <p>Use the <strong>Sync Now</strong> button to trigger a manual sync for all connected providers.</p>
      </div>
    </div>
  );
}
