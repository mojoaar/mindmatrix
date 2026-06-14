export default function WorkspacesDocPage() {
  return (
    <div>
      <h1>Workspaces</h1>
      <p className="text-muted" style={{ marginBottom: "2rem" }}>
        Workspaces are the top-level organizational unit in MindMatrix.
      </p>
      <div className="card">
        <h2>Creating a Workspace</h2>
        <p>From the dashboard, click the workspace selector and create a new workspace. Give it a name and optional description.</p>
      </div>
      <div className="card">
        <h2>Workspace Roles</h2>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Role</th><th>Permissions</th></tr></thead>
            <tbody>
              <tr><td><strong>Owner</strong></td><td>Full control — manage settings, members, delete workspace</td></tr>
              <tr><td><strong>Admin</strong></td><td>Manage members, create/edit/delete all content</td></tr>
              <tr><td><strong>Member</strong></td><td>Create and edit notes, folders, and tags</td></tr>
              <tr><td><strong>Viewer</strong></td><td>Read-only access to all content</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <h2>Inviting Members</h2>
        <p>Navigate to Workspace Settings to invite members by email. Assign roles when inviting.</p>
      </div>
    </div>
  );
}
