"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Tag, Heading1, Heading2, Heading3, Bold, Italic, Code, Link2, List, CheckSquare, Table, Image as ImageIcon, Share2, Globe, Printer, GitFork, Bookmark, Quote, Strikethrough, Minus } from "lucide-react";
import Link from "next/link";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";

const rehypeSanitizeOptions = { ...defaultSchema };
import { useRealtimeNote } from "@/hooks/use-realtime-note";
import { formatDate as fmtDate } from "@/lib/date-format";
import { BacklinksPanel } from "@/components/editor/backlinks-panel";
import { VersionPanel } from "@/components/editor/version-panel";
import { PresenceAvatars } from "@/components/editor/presence-avatars";
import { useToast } from "@/components/ui/toast";
import { usePrism } from "@/hooks/use-prism";
import { useMermaid } from "@/hooks/use-mermaid";
import { CommentSection } from "@/components/ui/comment-section";
import { Avatar } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme/theme-provider";

interface Note {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  folderId: string | null;
  noteTags: { tag: { id: string; name: string; color: string } }[];
  creator: { name: string; email: string; image: string | null; role: string };
  updater: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
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

type EditorLayout = "split" | "edit" | "preview";

export default function NoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
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
  const [showCreatorCard, setShowCreatorCard] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#88c0d0");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const editorRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
      });
  }, []);

  const formatDate = (date: Date | string) =>
    fmtDate(date, {
      timezone: profile?.timezone || "UTC",
      timeFormat: (profile?.timeFormat as "browser" | "12h" | "24h") || "browser",
      dateFormat: (profile?.dateFormat as "browser" | "iso" | "us" | "eu" | "long" | "short") || "browser",
    });

  const { viewers, lastUpdate, clearUpdate, localUpdate } = useRealtimeNote(noteId, setContent);
  useEffect(() => {
    if (lastUpdate) {
      toastSuccess(`${lastUpdate.updatedBy} updated this note`);
      clearUpdate();
    }
  }, [lastUpdate, toastSuccess, clearUpdate]);

  usePrism([content, layout]);
  const mermaidRef = useMermaid([content, layout]);

  useEffect(() => {
    const savedLayout = localStorage.getItem("mindmatrix-editor-layout") as EditorLayout;
    if (savedLayout) setLayout(savedLayout);
  }, []);

  useEffect(() => {
    if (tags && tags.length > 0) {
      setNewTagColor(PALETTE_COLORS[tags.length % PALETTE_COLORS.length]);
    }
  }, [tags]);

  useEffect(() => {
    async function load() {
      const [noteRes, wsRes] = await Promise.all([
        fetch(`/api/notes/${noteId}`),
        fetch("/api/workspaces"),
      ]);

      const noteData = await noteRes.json();
      const wsData = await wsRes.json();

      if (noteData.note) {
        setNote(noteData.note);
        setTitle(noteData.note.title);
        setContent(noteData.note.content);
        setSelectedFolder(noteData.note.folderId || "");
        setNoteTags(noteData.note.noteTags?.map((nt: { tag: Tag }) => nt.tag.id) || []);
      }

      if (wsData.workspaces && noteData.note) {
        const activeWs = wsData.workspaces.find((w: any) => w.id === noteData.note.workspaceId);
        if (activeWs) {
          setTags(activeWs.tags || []);
          setFolders(activeWs.folders || []);
        }
      }
    }
    load();
  }, [noteId]);

  const save = useCallback(async (overrides?: { folderId?: string | null; tagIds?: string[] }) => {
    if (!note) return;
    setSaving(true);
    const fId = overrides && overrides.folderId !== undefined ? overrides.folderId : selectedFolder;
    const tIds = overrides && overrides.tagIds !== undefined ? overrides.tagIds : noteTags;
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          folderId: fId || null,
          tagIds: tIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError(data.error || "Failed to save note");
      } else {
        setSavedAt(new Date());
        if (fId !== note.folderId) {
          window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
        }
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Network error while saving");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [note, title, content, selectedFolder, noteTags, toastError]);

  useEffect(() => {
    const handleSave = () => { save(); };
    const togglePreview = () => {
      if (layout === "split") setLayoutAndPersist("edit");
      else if (layout === "edit") setLayoutAndPersist("preview");
      else setLayoutAndPersist("split");
    };
    const del = () => { deleteNote(); };
    const back = () => { router.push(`/dashboard/w/${slug}`); };
    const share = () => { togglePublicShare(); };

    window.addEventListener("mindmatrix:save-note", handleSave);
    window.addEventListener("mindmatrix:toggle-preview", togglePreview);
    window.addEventListener("mindmatrix:delete-note", del);
    window.addEventListener("mindmatrix:back-to-workspace", back);
    window.addEventListener("mindmatrix:share-note", share);
    return () => {
      window.removeEventListener("mindmatrix:save-note", handleSave);
      window.removeEventListener("mindmatrix:toggle-preview", togglePreview);
      window.removeEventListener("mindmatrix:delete-note", del);
      window.removeEventListener("mindmatrix:back-to-workspace", back);
      window.removeEventListener("mindmatrix:share-note", share);
    };
  }, [save, layout, slug]);

  // Debounced Auto-save to maintain DB sync
  useEffect(() => {
    if (!note || content === note.content) return;
    const timer = setTimeout(() => {
      save();
    }, 2000);
    return () => clearTimeout(timer);
  }, [content, note, save]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      if (window.innerWidth < 768) {
        if (layout === "split") setLayout("edit");
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [layout]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (note && content !== note.content) {
        navigator.sendBeacon(
          `/api/notes/${note.id}`,
          JSON.stringify({ title, content, folderId: selectedFolder || null, tagIds: noteTags })
        );
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [note, title, content, selectedFolder, noteTags]);

  function setLayoutAndPersist(l: EditorLayout) {
    setLayout(l);
    localStorage.setItem("mindmatrix-editor-layout", l);
  }

  const handleFormat = useCallback((type: string) => {
    const view = editorRef.current?.view;
    if (!view) return;

    const { state, dispatch } = view;
    const { from, to } = state.selection.main;
    const selectedText = state.sliceDoc(from, to);

    let replacement = "";
    let selectionOffsetStart = 0;
    let selectionOffsetEnd = 0;

    switch (type) {
      case "bold":
        replacement = `**${selectedText}**`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText.length + 2;
        break;
      case "italic":
        replacement = `*${selectedText}*`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText.length + 1;
        break;
      case "code":
        if (selectedText.includes("\n")) {
          replacement = `\`\`\`\n${selectedText}\n\`\`\``;
          selectionOffsetStart = 4;
          selectionOffsetEnd = selectedText.length + 4;
        } else {
          replacement = `\`${selectedText}\``;
          selectionOffsetStart = 1;
          selectionOffsetEnd = selectedText.length + 1;
        }
        break;
      case "link":
        replacement = `[${selectedText || "link"}](https://)`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = selectedText ? selectedText.length + 1 : 5;
        break;
      case "h1":
        replacement = `# ${selectedText}`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText.length + 2;
        break;
      case "h2":
        replacement = `## ${selectedText}`;
        selectionOffsetStart = 3;
        selectionOffsetEnd = selectedText.length + 3;
        break;
      case "h3":
        replacement = `### ${selectedText}`;
        selectionOffsetStart = 4;
        selectionOffsetEnd = selectedText.length + 4;
        break;
      case "list":
        replacement = `- ${selectedText}`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText.length + 2;
        break;
      case "todo":
        replacement = `- [ ] ${selectedText}`;
        selectionOffsetStart = 6;
        selectionOffsetEnd = selectedText.length + 6;
        break;
      case "table":
        replacement = `\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = replacement.length - 1;
        break;
      case "diagram":
        replacement = `\n\`\`\`mermaid\ngraph TD\n  A[Start] --> B(Process)\n  B --> C{Decision}\n  C -->|Yes| D[Result 1]\n  C -->|No| E[Result 2]\n\`\`\`\n`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = replacement.length - 1;
        break;
      case "embed":
        replacement = `![[${selectedText || "note-slug"}]]`;
        selectionOffsetStart = 4;
        selectionOffsetEnd = selectedText ? selectedText.length + 4 : 13;
        break;
      case "quote":
        replacement = `> ${selectedText}`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText.length + 2;
        break;
      case "strike":
        replacement = `~~${selectedText}~~`;
        selectionOffsetStart = 2;
        selectionOffsetEnd = selectedText.length + 2;
        break;
      case "hr":
        replacement = `\n---\n`;
        selectionOffsetStart = 1;
        selectionOffsetEnd = replacement.length - 1;
        break;
      default:
        return;
    }

    dispatch(
      state.update({
        changes: { from, to, insert: replacement },
        selection: { anchor: from + selectionOffsetStart, head: from + selectionOffsetEnd },
        scrollIntoView: true,
      })
    );
    view.focus();
  }, []);

  const uploadImageFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/notes/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        // Insert the image markdown into the editor
        const view = editorRef.current?.view;
        if (view) {
          const { state, dispatch } = view;
          const { from, to } = state.selection.main;
          const insertText = `![${file.name}](${data.url})`;
          dispatch(
            state.update({
              changes: { from, to, insert: insertText },
              selection: { anchor: from + insertText.length },
              scrollIntoView: true,
            })
          );
          view.focus();
        } else {
          // Fallback if view not ready: append to state
          setContent((prev) => prev + `\n![${file.name}](${data.url})`);
        }
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image");
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  }, [uploadImageFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        uploadImageFile(file);
      }
    }
  }, [uploadImageFile]);

  function toggleTag(tagId: string) {
    const nextTags = noteTags.includes(tagId)
      ? noteTags.filter((t) => t !== tagId)
      : [...noteTags, tagId];
    setNoteTags(nextTags);
    save({ tagIds: nextTags });
  }

  async function createTag() {
    if (!newTagName.trim() || !note) return;
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: note.workspaceId,
          name: newTagName.trim(),
          color: newTagColor,
        }),
      });
      const data = await res.json();
      if (data.tag) {
        setTags((prev) => [...prev, data.tag]);
        const nextTags = [...noteTags, data.tag.id];
        setNoteTags(nextTags);
        save({ tagIds: nextTags });
        setNewTagName("");
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteNote() {
    if (!note) return;
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
    window.dispatchEvent(new CustomEvent("mindmatrix:workspace-updated"));
    router.push(`/dashboard/w/${slug}`);
  }

  async function togglePublicShare() {
    if (!note) return;
    const targetState = !note.isPublic;
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: targetState }),
      });
      const data = await res.json();
      if (data.note) {
        setNote(data.note);
        toastSuccess(targetState ? "Note is now public" : "Note is now private");
      }
    } catch (e) {
      console.error(e);
    }
  }

  function copyShareLink() {
    if (!note) return;
    const shareUrl = `${window.location.origin}/share/${note.id}`;
    navigator.clipboard.writeText(shareUrl);
    toastSuccess("Share link copied to clipboard");
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
          <div className="flex align-center gap-2" style={{ flex: 1, minWidth: 0 }}>
            <Link href={`/dashboard/w/${slug}`} className="btn ghost sm" style={{ flexShrink: 0 }}>
              <ArrowLeft size={14} />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                flex: 1,
                minWidth: 0,
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

          <div className="flex align-center gap-1" style={{ flexShrink: 0 }}>
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

          <button className="btn primary sm flex align-center gap-1" onClick={() => save()} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving..." : savedAt ? "Saved" : "Save"}
          </button>

          <div style={{ position: "relative" }}>
            <button className="btn secondary sm flex align-center gap-1" onClick={() => setShowShareMenu(!showShareMenu)}>
              <Share2 size={14} />
              Share
            </button>
            {showShareMenu && (
              <div 
                className="card" 
                style={{ 
                  position: "absolute", 
                  right: 0, 
                  top: "100%", 
                  zIndex: 25, 
                  minWidth: "260px", 
                  padding: "1rem", 
                  marginTop: "0.25rem", 
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  textAlign: "left"
                }}
              >
                <h4 style={{ margin: 0, marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--fg-secondary)" }}>Public Sharing</h4>
                <p className="text-muted" style={{ fontSize: "0.75rem", marginBottom: "1rem" }}>
                  Anyone with the link can view this note in a distraction-free, read-only layout.
                </p>
                <div style={{ marginBottom: "1rem" }}>
                  <button
                    className={`btn sm ${note.isPublic ? "danger" : "primary"}`}
                    onClick={togglePublicShare}
                    style={{ width: "100%" }}
                  >
                    {note.isPublic ? "Unshare Note" : "Share Note"}
                  </button>
                </div>
                {note.isPublic && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <input
                      readOnly
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${note.id}`}
                      style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "3px" }}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      className="btn secondary sm"
                      style={{ width: "100%" }}
                      onClick={copyShareLink}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="btn secondary sm flex align-center gap-1"
            onClick={() => {
              window.open(`/api/export?workspaceId=${note.workspaceId}&format=pdf`, "_blank");
            }}
            title="Export for Print"
          >
            <Printer size={14} />
          </button>
          <button className="btn danger sm flex align-center gap-1" onClick={deleteNote}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <div className="flex align-center justify-between text-xs text-muted" style={{ marginBottom: "1rem" }}>
        <div className="flex align-center gap-2" style={{ overflow: "visible" }}>
          <div 
            style={{ position: "relative", display: "inline-flex", cursor: "help" }}
            onMouseEnter={() => setShowCreatorCard(true)}
            onMouseLeave={() => setShowCreatorCard(false)}
          >
            <span style={{ textDecoration: "underline", textDecorationStyle: "dotted" }}>
              Created by {note.creator.name}
            </span>
            {showCreatorCard && (
              <div 
                className="card"
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: "100%",
                  marginBottom: "0.5rem",
                  zIndex: 20,
                  width: "240px",
                  padding: "0.75rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "var(--fg-primary)",
                  backgroundColor: "var(--bg-secondary)",
                  borderColor: "var(--border-color)",
                  textAlign: "left"
                }}
              >
                <Avatar 
                  name={note.creator.name} 
                  email={note.creator.email} 
                  image={note.creator.image} 
                  size={40} 
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0, textAlign: "left" }}>
                  <span style={{ fontWeight: 600, color: "var(--fg-secondary)", fontSize: "0.875rem" }} className="truncate">
                    {note.creator.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }} className="truncate">
                    {note.creator.email}
                  </span>
                  <span 
                    className="badge" 
                    style={{ 
                      alignSelf: "flex-start", 
                      fontSize: "0.65rem", 
                      padding: "0.1rem 0.35rem", 
                      marginTop: "0.25rem",
                      backgroundColor: note.creator.role === "super_admin" ? "rgba(163, 190, 140, 0.15)" : "var(--bg-tertiary)",
                      color: note.creator.role === "super_admin" ? "var(--accent-green)" : "var(--fg-secondary)",
                      borderColor: note.creator.role === "super_admin" ? "var(--accent-green)" : "var(--border-color)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    {note.creator.role === "super_admin" ? "Super Admin" : "User"}
                  </span>
                </div>
              </div>
            )}
          </div>
          <span>·</span>
          <span>Updated {formatDate(note.updatedAt)}</span>
          <PresenceAvatars viewers={viewers} />
        </div>
        <div className="flex align-center gap-2">
          <select
            value={selectedFolder}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedFolder(val);
              save({ folderId: val });
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
              <div className="card" style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, minWidth: "220px", padding: "0.5rem" }}>
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
                <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      style={{ fontSize: "0.75rem", padding: "0.25rem", borderRadius: "3px", flex: 1 }}
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      style={{ width: "24px", height: "24px", padding: 0, border: "none", cursor: "pointer", borderRadius: "50%", overflow: "hidden", flexShrink: 0 }}
                    />
                    <button
                      className="btn primary sm"
                      onClick={createTag}
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ display: "flex", gap: "1rem", minHeight: "calc(100vh - 250px)", alignItems: "stretch" }}>
        {(layout === "split" || layout === "edit") && (
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              flexDirection: "column",
              border: isDragging ? "2px dashed var(--accent-cyan)" : "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              overflow: "hidden",
              backgroundColor: "var(--bg-secondary)"
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Markdown Formatting Toolbar */}
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.25rem", 
                backgroundColor: "var(--bg-tertiary)", 
                borderBottom: "1px solid var(--border-color)",
                padding: "0.4rem",
                flexWrap: "wrap",
                zIndex: 5
              }}
            >
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Heading 1" onClick={() => handleFormat("h1")}>
                <Heading1 size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Heading 2" onClick={() => handleFormat("h2")}>
                <Heading2 size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Heading 3" onClick={() => handleFormat("h3")}>
                <Heading3 size={14} />
              </button>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)", margin: "0 0.25rem" }} />
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Bold" onClick={() => handleFormat("bold")}>
                <Bold size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Italic" onClick={() => handleFormat("italic")}>
                <Italic size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Strikethrough" onClick={() => handleFormat("strike")}>
                <Strikethrough size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Code" onClick={() => handleFormat("code")}>
                <Code size={14} />
              </button>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)", margin: "0 0.25rem" }} />
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Link" onClick={() => handleFormat("link")}>
                <Link2 size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Blockquote" onClick={() => handleFormat("quote")}>
                <Quote size={14} />
              </button>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)", margin: "0 0.25rem" }} />
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Bullet List" onClick={() => handleFormat("list")}>
                <List size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Task List" onClick={() => handleFormat("todo")}>
                <CheckSquare size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Insert Table" onClick={() => handleFormat("table")}>
                <Table size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Insert Diagram" onClick={() => handleFormat("diagram")}>
                <GitFork size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Embed Note" onClick={() => handleFormat("embed")}>
                <Bookmark size={14} />
              </button>
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Horizontal Line" onClick={() => handleFormat("hr")}>
                <Minus size={14} />
              </button>
              <span style={{ width: "1px", height: "16px", backgroundColor: "var(--border-color)", margin: "0 0.25rem" }} />
              <button className="btn ghost sm" style={{ padding: "0.25rem" }} title="Insert Image" onClick={() => imageInputRef.current?.click()}>
                <ImageIcon size={14} />
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </div>

            <div style={{ flex: 1, overflow: "auto" }}>
              <CodeMirror
                ref={editorRef}
                value={content}
                onChange={(val) => {
                  if (val === undefined || val === null || (typeof val === "string" && content.length > 0 && val.length === 0)) return;
                  setContent(val);
                  localUpdate(val);
                }}
                extensions={[markdown()]}
                theme={theme.endsWith("-dark") ? "dark" : "light"}
                style={{ fontSize: "0.875rem", fontFamily: "var(--font-mono)", height: "100%", minHeight: "400px" }}
              />
            </div>
          </div>
        )}

        {(layout === "split" || layout === "preview") && (
          <div
            className="markdown-body"
            style={{
              flex: 1,
              overflow: "auto",
              backgroundColor: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius)",
              padding: "1.5rem",
            }}
          >
            <div ref={mermaidRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, rehypeSanitizeOptions]]}>
              {content || "*No content yet*"}
            </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
      <BacklinksPanel noteId={note.id} workspaceSlug={slug} />
      <CommentSection noteId={note.id} />
      <VersionPanel noteId={note.id} />
    </div>
  );
}
