export default function SearchDocPage() {
  return (
    <div>
      <h1>Search</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        MindMatrix provides full-text search across all your notes.
      </p>
      <div className="card">
        <h2>Global Search Overlay</h2>
        <p>Press <kbd>Cmd+K</kbd> (or <kbd>Ctrl+K</kbd>) to open the global search overlay. Start typing to search across all workspaces.</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li><kbd>↑↓</kbd> — Navigate results</li>
          <li><kbd>Enter</kbd> — Open selected note</li>
          <li><kbd>Esc</kbd> — Close overlay</li>
        </ul>
      </div>
      <div className="card">
        <h2>Workspace Search</h2>
        <p>Each workspace has a search bar for filtering notes within that workspace by title and content.</p>
      </div>
      <div className="card">
        <h2>API Search</h2>
        <p>Search is available via the API at <code>/api/search?q=query</code>. Supports optional <code>workspaceId</code> parameter.</p>
      </div>
    </div>
  );
}
