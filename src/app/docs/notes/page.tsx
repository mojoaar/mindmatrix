export default function NotesDocPage() {
  return (
    <div>
      <h1>Notes</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Notes are stored as plain Markdown with full editing support.
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
        <h2>Organizing Notes</h2>
        <ul style={{ paddingLeft: "1.5rem" }}>
          <li><strong>Folders</strong> — Create folders to organize notes hierarchically</li>
          <li><strong>Tags</strong> — Add color-coded tags for flexible categorization</li>
        </ul>
      </div>
    </div>
  );
}
