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
        <p className="text-sm text-muted" style={{ marginTop: "0.75rem" }}>
          When empty, the overlay shows a command palette with all available keyboard shortcuts.
        </p>
      </div>
      <div className="card">
        <h2>Note Editor Shortcuts</h2>
        <p>From inside a note:</p>
        <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
          <li><kbd>Cmd+\</kbd> / <kbd>Ctrl+\</kbd> — Toggle preview mode (split → edit → preview)</li>
          <li><kbd>Cmd+Enter</kbd> / <kbd>Ctrl+Enter</kbd> — Save note</li>
          <li><kbd>Cmd+Shift+Backspace</kbd> / <kbd>Ctrl+Shift+Backspace</kbd> — Delete note (with confirmation)</li>
          <li><kbd>Cmd+Opt+[</kbd> / <kbd>Ctrl+Alt+[</kbd> — Back to workspace notes list</li>
          <li><kbd>Cmd+Shift+P</kbd> / <kbd>Ctrl+Shift+P</kbd> — Toggle public sharing</li>
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
