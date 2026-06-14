export default function NotesDocPage() {
  return (
    <div>
      <h1>Notes</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Notes are stored as plain Markdown with full editing support, backlinks, version history, and realtime collaboration.
      </p>
      <div className="card">
        <h2>Creating a Note</h2>
        <p>Click <strong>New Note</strong> from the workspace view. Enter a title and press Enter. You'll be taken to the editor.</p>
      </div>
      <div className="card">
        <h2>Editor Layouts</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li><strong>Split</strong> — Code editor on the left, preview on the right</li>
          <li><strong>Edit</strong> — Full-width code editor</li>
          <li><strong>Preview</strong> — Full-width rendered preview</li>
        </ul>
        <p className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>
          Set your default layout in Settings.
        </p>
      </div>
      <div className="card">
        <h2>Organizing & Managing Notes</h2>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
          <li><strong>Folders</strong> — Create folders to organize notes hierarchically. Select a folder to filter your notes table dynamically.</li>
          <li><strong>Tags</strong> — Add custom color-coded tags for flexible categorization and multi-tag filtering.</li>
        </ul>
        <p>
          To edit or organize your taxonomy, click the general <strong>Edit</strong> button next to the folder bar.
          While in Edit mode, you can rename or delete folders, as well as rename and change colors for any tag instantly.
        </p>
      </div>
      <div className="card">
        <h2>Backlinks</h2>
        <p>Link between notes using <code>[[note-slug]]</code> wiki-style syntax. The Backlinks panel in the editor shows incoming and outgoing links for every note. Links are automatically extracted on save.</p>
      </div>
      <div className="card">
        <h2>Version History</h2>
        <p>Every time you save a note, a snapshot is automatically created. Use the Version History panel to browse previous versions and restore any snapshot with one click.</p>
      </div>
      <div className="card">
        <h2>Note Templates</h2>
        <p>Workspace-level templates let you create new notes from predefined structures. Choose from built-in templates (ADR, runbook, meeting notes) or create your own. Select from the <strong>New from Template</strong> dropdown next to the New Note button.</p>
      </div>
      <div className="card">
        <h2>Realtime Collaboration</h2>
        <p>See who else is viewing a note via presence avatars in the editor header. When someone else saves changes, you'll get a toast notification. No page refresh needed — powered by SSE and PostgreSQL LISTEN/NOTIFY.</p>
      </div>
      <div className="card">
        <h2>Keyboard Shortcuts</h2>
        <p>Save notes with <kbd>Cmd+Enter</kbd>. See Settings for all available shortcuts.</p>
      </div>
    </div>
  );
}
