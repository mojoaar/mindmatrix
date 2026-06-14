"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag } from "lucide-react";
import Link from "next/link";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  noteTags: { tag: { id: string; name: string; color: string } }[];
  creator: { name: string };
  updater: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Folder {
  id: string;
  name: string;
}

type EditorLayout = "split" | "edit" | "preview";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const noteId = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [layout, setLayout] = useState<EditorLayout>("split");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const savedLayout = localStorage.getItem("mindmatrix-editor-layout") as EditorLayout;
    if (savedLayout) setLayout(savedLayout);
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();
      if (data.note) {
        setNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.content);
        setSelectedFolder(data.note.folderId || "");
        setNoteTags(data.note.noteTags?.map((nt: { tag: Tag }) => nt.tag.id) || []);

        const wsRes = await fetch(`/api/workspaces/${data.note.workspaceId}`);
        const wsData = await wsRes.json();
        if (wsData.workspace) {
          setTags(wsData.workspace.tags || []);
          setFolders(wsData.workspace.folders || []);
        }
      }
    }
    load();
  }, [noteId]);

  const save = useCallback(async () => {
    if (!note) return;
    setSaving(true);
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        folderId: selectedFolder || null,
        tagIds: noteTags,
      }),
    });
    setSavedAt(new Date());
    setSaving(false);
  }, [note, title, content, selectedFolder, noteTags]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        save();
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [save]);

  function setLayoutAndPersist(l: EditorLayout) {
    setLayout(l);
    localStorage.setItem("mindmatrix-editor-layout", l);
  }

  function toggleTag(tagId: string) {
    setNoteTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  async function deleteNote() {
    if (!note) return;
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    router.push(`/dashboard/w/${slug}`);
  }

  if (!note) {
    return (
      <div className="container">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex align-center justify-between" style={{ marginBottom: "1rem" }}>
        <div className="flex align-center gap-2">
          <Link href={`/dashboard/w/${slug}`} className="btn ghost sm">
            <ArrowLeft size={14} />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => save()}
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              backgroundColor: "transparent",
              border: "none",
              color: "var(--fg-secondary)",
              outline: "none",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        <div className="flex align-center gap-1">
          <div className="flex align-center" style={{ backgroundColor: "var(--bg-tertiary)", borderRadius: "var(--border-radius)", padding: "2px" }}>
            {(["split", "edit", "preview"] as EditorLayout[]).map((l) => (
              <button
                key={l}
                className={`btn sm ${layout === l ? "primary" : "ghost"}`}
                onClick={() => setLayoutAndPersist(l)}
                style={{ textTransform: "capitalize" }}
              >
                {l}
              </button>
            ))}
          </div>

          <button className="btn primary sm flex align-center gap-1" onClick={save} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving..." : savedAt ? "Saved" : "Save"}
          </button>

          <button className="btn danger sm flex align-center gap-1" onClick={deleteNote}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex align-center justify-between text-xs text-muted" style={{ marginBottom: "1rem" }}>
        <div className="flex align-center gap-2">
          <span>Created by {note.creator.name}</span>
          <span>·</span>
          <span>Updated {new Date(note.updatedAt).toLocaleString()}</span>
        </div>
        <div className="flex align-center gap-2">
          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              save();
            }}
            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
          >
            <option value="">No folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <button className="btn ghost sm flex align-center gap-1" onClick={() => setShowTagPicker(!showTagPicker)}>
              <Tag size={12} />
              Tags
            </button>
            {showTagPicker && (
              <div className="card" style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, minWidth: "200px", padding: "0.5rem" }}>
                {tags.map((tag) => (
                  <label key={tag.id} className="flex align-center gap-1" style={{ padding: "0.25rem 0", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input
                      type="checkbox"
                      checked={noteTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span style={{ color: tag.color, width: "8px", height: "8px", borderRadius: "50%", display: "inline-block", backgroundColor: tag.color }} />
                    {tag.name}
                  </label>
                ))}
                {tags.length === 0 && <span className="text-muted text-xs">No tags created</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ display: "flex", gap: "1rem", minHeight: "calc(100vh - 250px)" }}>
        {(layout === "split" || layout === "edit") && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <CodeMirror
              value={content}
              onChange={(val) => setContent(val)}
              extensions={[markdown()]}
              theme={document.documentElement.getAttribute("data-theme")?.includes("dark") ? "dark" : "light"}
              style={{ fontSize: "0.875rem", fontFamily: "var(--font-mono)", height: "100%", minHeight: "400px" }}
            />
          </div>
        )}

        {(layout === "split" || layout === "preview") && (
          <div
            style={{
              flex: 1,
              overflow: "auto",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              padding: "1.5rem",
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*No content yet*"}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
