"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Plus, FileText, FolderPlus, Search, Tag } from "lucide-react";

interface Note {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  folderId: string | null;
  noteTags: { tag: { id: string; name: string; color: string } }[];
  creator: { name: string };
}

interface Folder {
  id: string;
  name: string;
  slug: string;
  children?: Folder[];
  notes?: { id: string }[];
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { error: toastError } = useToast();
  const slug = params.slug as string;
  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#88c0d0");
  const [showNewTag, setShowNewTag] = useState(false);

  async function loadNotes(workspaceId: string) {
    const params = new URLSearchParams({ workspaceId });
    if (selectedTag) params.set("tagId", selectedTag);
    if (searchQuery) params.set("q", searchQuery);
    const res = await fetch(`/api/notes?${params}`);
    const data = await res.json();
    if (data.notes) setNotes(data.notes);
  }

  async function loadFolders(workspaceId: string) {
    const res = await fetch(`/api/folders?workspaceId=${workspaceId}`);
    const data = await res.json();
    if (data.folders) setFolders(data.folders);
  }

  async function loadTags(workspaceId: string) {
    const res = await fetch(`/api/tags?workspaceId=${workspaceId}`);
    const data = await res.json();
    if (data.tags) setTags(data.tags);
  }

  async function loadTemplates(workspaceId: string) {
    const res = await fetch(`/api/templates?workspaceId=${workspaceId}`);
    const data = await res.json();
    if (data.templates) setTemplates(data.templates);
  }

  const loadData = useCallback(async () => {
    try {
      const wsRes = await fetch("/api/workspaces");
      const wsData = await wsRes.json();
      if (wsData.workspaces) {
        const ws = wsData.workspaces.find((w: { slug: string }) => w.slug === slug);
        if (ws) {
          setWorkspace(ws);
          loadNotes(ws.id);
          loadFolders(ws.id);
          loadTags(ws.id);
          loadTemplates(ws.id);
        } else {
          toastError("Workspace not found");
        }
      }
    } catch {
      toastError("Failed to load workspace");
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (workspace) {
      loadNotes(workspace.id);
    }
  }, [searchQuery, selectedTag, workspace]);

  async function createNote() {
    if (!newNoteTitle.trim() || !workspace) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        title: newNoteTitle,
        content: newNoteContent || "",
      }),
    });
    const data = await res.json();
    if (data.note) {
      setShowNewNote(false);
      setNewNoteTitle("");
      setNewNoteContent("");
      router.push(`/dashboard/w/${slug}/notes/${data.note.id}`);
    }
  }

  function createFromTemplate(tmpl: Template) {
    setNewNoteTitle(tmpl.name);
    setNewNoteContent(tmpl.content);
    setShowNewNote(true);
  }

  async function createFolder() {
    if (!newFolderName.trim() || !workspace) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        name: newFolderName,
      }),
    });
    setShowNewFolder(false);
    setNewFolderName("");
    if (workspace) loadFolders(workspace.id);
  }

  async function createTag() {
    if (!newTagName.trim() || !workspace) return;
    await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: workspace.id,
        name: newTagName,
        color: newTagColor,
      }),
    });
    setShowNewTag(false);
    setNewTagName("");
    if (workspace) loadTags(workspace.id);
  }

  if (!workspace) {
    return (
      <div className="container">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex align-center justify-between" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ marginBottom: 0 }}>{workspace.name}</h1>
        <div className="flex align-center gap-1">
          <Link href={`/dashboard/w/${slug}/settings`} className="btn secondary sm">
            Settings
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex align-center gap-2" style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)" }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2rem", width: "100%" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <button className="btn secondary sm flex align-center gap-1" onClick={() => { setNewNoteTitle(""); setNewNoteContent(""); setShowNewNote(true); }}>
            <Plus size={14} />
            New Note
          </button>
          {templates.length > 0 && (
            <select
              value=""
              className="btn secondary sm"
              style={{ marginLeft: "0.25rem", padding: "0.25rem 0.5rem" }}
              onChange={(e) => {
                const id = e.target.value;
                if (id) {
                  const tmpl = templates.find((t) => t.id === id);
                  if (tmpl) createFromTemplate(tmpl);
                  e.target.value = "";
                }
              }}
            >
              <option value="">From template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>
        <button className="btn secondary sm flex align-center gap-1" onClick={() => setShowNewFolder(true)}>
          <FolderPlus size={14} />
          New Folder
        </button>
        <button className="btn secondary sm flex align-center gap-1" onClick={() => setShowNewTag(true)}>
          <Tag size={14} />
          New Tag
        </button>
      </div>

      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="flex align-center gap-1" style={{ marginBottom: "1rem", flexWrap: "wrap" }}>
          <button
            className={`btn sm ${!selectedTag ? "primary" : "secondary"}`}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              className={`btn sm ${selectedTag === tag.id ? "primary" : "secondary"}`}
              onClick={() => setSelectedTag(tag.id)}
              style={selectedTag === tag.id ? { backgroundColor: tag.color } : {}}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* New note dialog */}
      {showNewNote && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Note title"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createNote()}
            autoFocus
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          {newNoteContent && (
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={8}
              style={{ width: "100%", marginBottom: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}
            />
          )}
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={createNote}>
              Create
            </button>
            <button className="btn secondary sm" onClick={() => setShowNewNote(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New folder dialog */}
      {showNewFolder && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
            autoFocus
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={createFolder}>
              Create
            </button>
            <button className="btn secondary sm" onClick={() => setShowNewFolder(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* New tag dialog */}
      {showNewTag && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="flex align-center gap-2" style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTag()}
              autoFocus
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              style={{ width: "40px", height: "32px", padding: "2px", border: "none", cursor: "pointer" }}
            />
          </div>
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={createTag}>
              Create
            </button>
            <button className="btn secondary sm" onClick={() => setShowNewTag(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Folders list */}
      {folders.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex align-center gap-2"
              style={{ padding: "0.5rem 0" }}
            >
              <FolderPlus size={14} style={{ color: "var(--accent-yellow)" }} />
              <span className="text-sm">{folder.name}</span>
              <span className="text-muted text-xs">
                ({folder.notes?.length || 0} notes)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Tags</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 && (
              <tr>
                <td colSpan={3} className="text-muted text-sm" style={{ textAlign: "center" }}>
                  No notes yet. Create your first note!
                </td>
              </tr>
            )}
            {notes.map((note) => (
              <tr key={note.id}>
                <td>
                  <Link
                    href={`/dashboard/w/${slug}/notes/${note.id}`}
                    style={{ color: "var(--fg-primary)", fontWeight: 500 }}
                  >
                    <FileText size={14} style={{ marginRight: "0.5rem", verticalAlign: "middle" }} />
                    {note.title}
                  </Link>
                </td>
                <td>
                  <div className="flex gap-1">
                    {note.noteTags?.map((nt) => (
                      <span key={nt.tag.id} className="badge" style={{ backgroundColor: nt.tag.color }}>
                        {nt.tag.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-muted text-xs">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
