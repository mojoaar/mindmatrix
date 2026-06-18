"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Plus, FileText, FolderPlus, Search, Tag, Pencil, Trash } from "lucide-react";
import { IconPicker } from "@/components/ui/icon-picker";
import { getIcon } from "@/lib/icons";
import { formatDate } from "@/lib/date-format";
import type { DateFormat, TimeFormat } from "@/lib/date-format";

interface Profile {
  dateFormat: string;
  timezone: string;
  timeFormat: string;
}

interface Note {
  id: string;
  title: string;
  slug: string;
  updatedAt: string;
  folderId: string | null;
  folder?: { id: string; name: string } | null;
  noteTags: { tag: { id: string; name: string; color: string } }[];
  creator: { name: string };
}

interface Folder {
  id: string;
  name: string;
  slug: string;
  icon?: string;
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

const PALETTE_COLORS = [
  "#88c0d0", // Cyan
  "#a3be8c", // Green
  "#b48ead", // Purple
  "#ebcb8b", // Yellow
  "#d08770", // Orange
  "#bf616a", // Red
  "#81a1c1", // Blue-grey
  "#8fbcbb", // Blue-green
] as const;

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { error: toastError } = useToast();
  const slug = params.slug as string;
  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortBy, setSortBy] = useState<"title" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tagId");
    }
    return null;
  });
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState<Folder | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("FolderPlus");
  const [renameFolderIcon, setRenameFolderIcon] = useState("FolderPlus");
  const [editMode, setEditMode] = useState(false);
  const [showRenameTag, setShowRenameTag] = useState<Tag | null>(null);
  const [renameTagName, setRenameTagName] = useState("");
  const [renameTagColor, setRenameTagColor] = useState("#88c0d0");
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#88c0d0");
  const [showNewTag, setShowNewTag] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("folderId");
    }
    return null;
  });
  const [profile, setProfile] = useState<Profile>({ dateFormat: "browser", timezone: "browser", timeFormat: "browser" });

  async function loadNotes(workspaceId: string, customFolderId?: string | null) {
    const params = new URLSearchParams({ workspaceId });
    if (selectedTag) params.set("tagId", selectedTag);
    if (searchQuery) params.set("q", searchQuery);
    
    // Use custom passed folderId or the state variable
    const folderToUse = customFolderId !== undefined ? customFolderId : activeFolderId;
    if (folderToUse) params.set("folderId", folderToUse);

    const res = await fetch(`/api/notes?${params}`, { cache: "no-store" });
    const data = await res.json();
    if (data.notes) setNotes(data.notes);
  }

  async function loadFolders(workspaceId: string) {
    try {
      const res = await fetch(`/api/folders?workspaceId=${workspaceId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.folders) setFolders(data.folders);
    } catch { /* API may be unavailable */ }
  }

  async function loadTags(workspaceId: string) {
    const res = await fetch(`/api/tags?workspaceId=${workspaceId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.tags) setTags(data.tags);
  }

  async function loadTemplates(workspaceId: string) {
    const res = await fetch(`/api/templates?workspaceId=${workspaceId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.templates) setTemplates(data.templates);
  }

  const loadData = useCallback(async () => {
    try {
      const wsRes = await fetch("/api/workspaces", { cache: "no-store" });
      const wsData = await wsRes.json();
      if (wsData.workspaces) {
        const ws = wsData.workspaces.find((w: { slug: string }) => w.slug === slug);
        if (ws) {
          setWorkspace(ws);
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
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            dateFormat: data.profile.dateFormat || "browser",
            timezone: data.profile.timezone || "browser",
            timeFormat: data.profile.timeFormat || "browser",
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tags && tags.length > 0) {
      setNewTagColor(PALETTE_COLORS[tags.length % PALETTE_COLORS.length]);
    }
  }, [tags]);

  useEffect(() => {
    const handleNewNote = () => {
      setNewNoteTitle("");
      setNewNoteContent("");
      setShowNewNote(true);
    };
    const handleNewFolder = () => setShowNewFolder(true);
    window.addEventListener("mindmatrix:new-note", handleNewNote);
    window.addEventListener("mindmatrix:new-folder", handleNewFolder);
    return () => {
      window.removeEventListener("mindmatrix:new-note", handleNewNote);
      window.removeEventListener("mindmatrix:new-folder", handleNewFolder);
    };
  }, []);

  useEffect(() => {
    const handleFilterFolder = (e: Event) => {
      const folderId = (e as CustomEvent).detail;
      setActiveFolderId(folderId);
    };
    const handleFilterTag = (e: Event) => {
      const tagId = (e as CustomEvent).detail;
      setSelectedTag(tagId);
    };
    const handleClearFilters = () => {
      setActiveFolderId(null);
      setSelectedTag(null);
    };
    
    window.addEventListener(`mindmatrix:filter-folder:${slug}`, handleFilterFolder);
    window.addEventListener(`mindmatrix:filter-tag:${slug}`, handleFilterTag);
    window.addEventListener("mindmatrix:clear-filters", handleClearFilters);
    
    return () => {
      window.removeEventListener(`mindmatrix:filter-folder:${slug}`, handleFilterFolder);
      window.removeEventListener(`mindmatrix:filter-tag:${slug}`, handleFilterTag);
      window.removeEventListener("mindmatrix:clear-filters", handleClearFilters);
    };
  }, [slug]);

  useEffect(() => {
    if (workspace) {
      loadNotes(workspace.id);
    }
  }, [searchQuery, selectedTag, activeFolderId, workspace]);

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
      window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
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
        icon: newFolderIcon,
      }),
    });
    setShowNewFolder(false);
    setNewFolderName("");
    setNewFolderIcon("FolderPlus");
    if (workspace) loadFolders(workspace.id);
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
  }

  async function updateFolder() {
    if (!renameFolderName.trim() || !showRenameFolder || !workspace) return;
    await fetch(`/api/folders/${showRenameFolder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: renameFolderName,
        icon: renameFolderIcon,
      }),
    });
    setShowRenameFolder(null);
    setRenameFolderName("");
    setRenameFolderIcon("FolderPlus");
    loadFolders(workspace.id);
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
  }

  async function deleteFolder(folderId: string) {
    if (!confirm("Are you sure you want to delete this folder? Notes inside this folder will not be deleted.")) return;
    await fetch(`/api/folders/${folderId}`, {
      method: "DELETE",
    });
    if (activeFolderId === folderId) {
      setActiveFolderId(null);
    }
    if (workspace) loadFolders(workspace.id);
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
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
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
  }

  async function updateTag() {
    if (!renameTagName.trim() || !showRenameTag || !workspace) return;
    await fetch(`/api/tags/${showRenameTag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: renameTagName,
        color: renameTagColor,
      }),
    });
    setShowRenameTag(null);
    setRenameTagName("");
    loadTags(workspace.id);
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
  }

  async function deleteTag(tagId: string) {
    if (!confirm("Are you sure you want to delete this tag? This will remove the tag from all notes.")) return;
    await fetch(`/api/tags/${tagId}`, {
      method: "DELETE",
    });
    if (selectedTag === tagId) {
      setSelectedTag(null);
    }
    if (workspace) loadTags(workspace.id);
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
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
        <button
          className={`btn sm ${editMode ? "primary" : "secondary"}`}
          style={editMode ? { backgroundColor: "var(--accent-red)", borderColor: "var(--accent-red)", color: "#fff" } : {}}
          onClick={() => {
            setEditMode((prev) => {
              if (prev) {
                setShowRenameFolder(null);
                setShowRenameTag(null);
              }
              return !prev;
            });
          }}
          title="Toggle Edit mode"
        >
          <Pencil size={12} style={{ marginRight: "0.25rem" }} />
          {editMode ? "Done Editing" : "Edit"}
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
          {tags.map((tag) => {
            const isSelected = selectedTag === tag.id;
            return (
              <div
                key={tag.id}
                className={`btn sm ${isSelected ? "primary" : "secondary"} flex align-center gap-1`}
                style={{
                  paddingRight: editMode ? "0.25rem" : "0.75rem",
                  ...(isSelected ? { backgroundColor: tag.color, borderColor: tag.color, color: "#fff" } : {})
                }}
              >
                <div
                  className="flex align-center gap-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedTag(isSelected ? null : tag.id)}
                >
                  <span 
                    style={{ 
                      display: "inline-block", 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      backgroundColor: isSelected ? "#fff" : tag.color,
                      flexShrink: 0
                    }} 
                  />
                  <span>{tag.name}</span>
                </div>
                {editMode && (
                  <div className="flex align-center" style={{ marginLeft: "0.25rem", gap: "0.15rem" }}>
                    <button
                      className="btn ghost sm"
                      style={{
                        padding: "0.1rem",
                        minHeight: "auto",
                        display: "inline-flex",
                        alignSelf: "center",
                        color: "inherit",
                        opacity: 0.6,
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRenameTag(tag);
                        setRenameTagName(tag.name);
                        setRenameTagColor(tag.color);
                      }}
                      title="Rename tag"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      className="btn ghost sm"
                      style={{
                        padding: "0.1rem",
                        minHeight: "auto",
                        display: "inline-flex",
                        alignSelf: "center",
                        color: "inherit",
                        opacity: 0.6,
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTag(tag.id);
                      }}
                      title="Delete tag"
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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
          <div style={{ marginBottom: "0.5rem" }}>
            <IconPicker value={newFolderIcon} onChange={setNewFolderIcon} />
          </div>
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={createFolder}>
              Create
            </button>
            <button className="btn secondary sm" onClick={() => { setShowNewFolder(false); setNewFolderIcon("FolderPlus"); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Rename folder dialog */}
      {showRenameFolder && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Folder name"
            value={renameFolderName}
            onChange={(e) => setRenameFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && updateFolder()}
            autoFocus
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
          <div style={{ marginBottom: "0.5rem" }}>
            <IconPicker value={renameFolderIcon} onChange={setRenameFolderIcon} />
          </div>
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={updateFolder}>
              Save
            </button>
            <button className="btn secondary sm" onClick={() => { setShowRenameFolder(null); setRenameFolderName(""); setRenameFolderIcon("FolderPlus"); }}>
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

      {/* Rename tag dialog */}
      {showRenameTag && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="flex align-center gap-2" style={{ marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Tag name"
              value={renameTagName}
              onChange={(e) => setRenameTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && updateTag()}
              autoFocus
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={renameTagColor}
              onChange={(e) => setRenameTagColor(e.target.value)}
              style={{ width: "40px", height: "32px", padding: "2px", border: "none", cursor: "pointer" }}
            />
          </div>
          <div className="flex gap-1">
            <button className="btn primary sm" onClick={updateTag}>
              Save
            </button>
            <button className="btn secondary sm" onClick={() => { setShowRenameTag(null); setRenameTagName(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Folders list */}
      {folders.length > 0 && (
        <div style={{ marginBottom: "1.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className={`btn sm ${!activeFolderId ? "primary" : "secondary"}`}
            onClick={() => setActiveFolderId(null)}
          >
            All Folders
          </button>
          {folders.map((folder) => {
            const isActive = activeFolderId === folder.id;
            return (
              <div
                key={folder.id}
                className={`btn sm ${isActive ? "primary" : "secondary"} flex align-center gap-1`}
                style={{
                  paddingRight: editMode ? "0.25rem" : "0.75rem",
                  ...(isActive ? { backgroundColor: "var(--accent-orange)", borderColor: "var(--accent-orange)", color: "#fff" } : {})
                }}
              >
                <div
                  className="flex align-center gap-1"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveFolderId(isActive ? null : folder.id)}
                >
                  {(() => { const I = getIcon(folder.icon || "FolderPlus"); return <I size={12} style={{ color: isActive ? "#fff" : "var(--accent-yellow)", flexShrink: 0 }} />; })()}
                  <span>{folder.name}</span>
                  <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>
                    ({folder.notes?.length || 0})
                  </span>
                </div>
                {editMode && (
                  <div className="flex align-center" style={{ marginLeft: "0.25rem", gap: "0.15rem" }}>
                    <button
                      className="btn ghost sm"
                      style={{
                        padding: "0.1rem",
                        minHeight: "auto",
                        display: "inline-flex",
                        alignSelf: "center",
                        color: "inherit",
                        opacity: 0.6,
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRenameFolder(folder);
                        setRenameFolderName(folder.name);
                        setRenameFolderIcon((folder as any).icon || "FolderPlus");
                      }}
                      title="Rename folder"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      className="btn ghost sm"
                      style={{
                        padding: "0.1rem",
                        minHeight: "auto",
                        display: "inline-flex",
                        alignSelf: "center",
                        color: "inherit",
                        opacity: 0.6,
                        border: "none",
                        backgroundColor: "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder(folder.id);
                      }}
                      title="Delete folder"
                    >
                      <Trash size={10} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notes list */}
      {(() => {
        const sortedNotes = [...notes].sort((a, b) => {
          if (sortBy === "title") {
            const valA = (a.title || "").toLowerCase();
            const valB = (b.title || "").toLowerCase();
            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
          } else {
            const valA = new Date(a.updatedAt || 0).getTime();
            const valB = new Date(b.updatedAt || 0).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
          }
        });

        return (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th
                    onClick={() => {
                      if (sortBy === "title") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("title");
                        setSortOrder("asc");
                      }
                    }}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by Title"
                  >
                    <div className="flex align-center" style={{ gap: "0.25rem" }}>
                      Title {sortBy === "title" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </div>
                  </th >
                  <th>Tags</th>
                  <th
                    onClick={() => {
                      if (sortBy === "updatedAt") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy("updatedAt");
                        setSortOrder("desc");
                      }
                    }}
                    style={{ cursor: "pointer", userSelect: "none" }}
                    title="Click to sort by Last Updated"
                  >
                    <div className="flex align-center" style={{ gap: "0.25rem" }}>
                      Updated {sortBy === "updatedAt" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedNotes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-muted text-sm" style={{ textAlign: "center" }}>
                      No notes yet. Create your first note!
                    </td>
                  </tr>
                )}
                {sortedNotes.map((note) => (
              <tr key={note.id}>
                <td>
                  <div className="flex align-center" style={{ gap: "0.25rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/dashboard/w/${slug}/notes/${note.id}`}
                      style={{ color: "var(--fg-primary)", fontWeight: 500, display: "inline-flex", alignItems: "center" }}
                    >
                      <FileText size={14} style={{ marginRight: "0.5rem" }} />
                      {note.title}
                    </Link>
                    {note.folder && (
                      <span 
                        className="badge" 
                        style={{ 
                          marginLeft: "0.25rem", 
                          backgroundColor: "rgba(208, 135, 112, 0.12)", 
                          color: "var(--accent-orange)",
                          borderColor: "rgba(208, 135, 112, 0.3)",
                          borderWidth: "1px",
                          borderStyle: "solid",
                          fontSize: "0.65rem",
                          padding: "0.05rem 0.25rem"
                        }}
                      >
                        {note.folder.name}
                      </span>
                    )}
                  </div>
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
                                    {formatDate(note.updatedAt, {
                              includeTime: false,
                              dateFormat: profile.dateFormat as DateFormat,
                              timezone: profile.timezone,
                              timeFormat: profile.timeFormat as TimeFormat,
                            })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  })()}
  </div>
);
}
