"use client";

import { useState } from "react";

export default function UserSettingsPage() {
  const [editorLayout, setEditorLayout] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mindmatrix-editor-layout") || "split";
    }
    return "split";
  });

  function setAndSave(layout: string) {
    setEditorLayout(layout);
    localStorage.setItem("mindmatrix-editor-layout", layout);
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <h3>Editor Preferences</h3>
        <div className="form-group">
          <label>Default Editor Layout</label>
          <div className="flex gap-1" style={{ marginTop: "0.5rem" }}>
            {["split", "edit", "preview"].map((layout) => (
              <button
                key={layout}
                className={`btn ${editorLayout === layout ? "primary" : "secondary"} sm`}
                onClick={() => setAndSave(layout)}
                style={{ textTransform: "capitalize" }}
              >
                {layout}
              </button>
            ))}
          </div>
          <p className="text-muted text-xs" style={{ marginTop: "0.5rem" }}>
            Choose how notes are displayed by default in the editor. Override per note via the toolbar.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Keyboard Shortcuts</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><kbd>Cmd+K</kbd></td><td>Global search</td></tr>
              <tr><td><kbd>Cmd+Enter</kbd></td><td>Save current note</td></tr>
              <tr><td><kbd>Cmd+B</kbd></td><td>Toggle sidebar</td></tr>
              <tr><td><kbd>Escape</kbd></td><td>Close dialogs</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
