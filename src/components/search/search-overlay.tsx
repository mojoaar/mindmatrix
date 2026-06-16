"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, FileText, X, PlusSquare, FolderPlus, Settings } from "lucide-react";
import Link from "next/link";

interface SearchResult {
  id: string;
  title: string;
  workspaceSlug: string;
  workspaceName: string;
  folderName: string | null;
  snippet: string;
  updatedAt: string;
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => [
    { keys: ["⌥", "N"], winKeys: ["Alt", "N"], label: "New Note", icon: PlusSquare, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:new-note")) },
    { keys: ["⌥", "⇧", "F"], winKeys: ["Alt", "Shift", "F"], label: "New Folder", icon: FolderPlus, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:new-folder")) },
    { keys: ["⌘", "\\"], winKeys: ["Ctrl", "\\"], label: "Toggle Preview", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:toggle-preview")) },
    { keys: ["⌘", "↵"], winKeys: ["Ctrl", "Enter"], label: "Save Note", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:save-note")) },
    { keys: ["⌘", "⇧", "⌫"], winKeys: ["Ctrl", "Shift", "Backspace"], label: "Delete Note", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:delete-note")) },
    { keys: ["⌘", "⌥", "["], winKeys: ["Ctrl", "Alt", "["], label: "Back to Workspace", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:back-to-workspace")) },
    { keys: ["⌘", "⇧", "P"], winKeys: ["Ctrl", "Shift", "P"], label: "Share/Public Toggle", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:share-note")) },
    { keys: ["⌘", "B"], winKeys: ["Ctrl", "B"], label: "Toggle Sidebar", icon: FileText, action: () => window.dispatchEvent(new CustomEvent("mindmatrix:toggle-sidebar")) },
    { keys: ["⌘", ","], winKeys: ["Ctrl", ","], label: "Settings", icon: Settings, action: () => { window.location.href = "/dashboard/settings"; } },
  ], []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.notes || []);
      setSelectedIndex(0);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    const handleSearchEvent = () => setOpen(true);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mindmatrix:search", handleSearchEvent);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mindmatrix:search", handleSearchEvent);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    const maxIndex = query ? results.length - 1 : commands.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, Math.max(0, maxIndex)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query && results[selectedIndex]) {
        const r = results[selectedIndex];
        window.location.href = `/dashboard/w/${r.workspaceSlug}/notes/${r.id}`;
      } else if (!query && selectedIndex < commands.length) {
        commands[selectedIndex].action();
      }
      setOpen(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) setOpen(false);
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "560px",
          padding: "1rem",
          maxHeight: "70vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="flex align-center gap-2" style={{ marginBottom: "0.5rem" }}>
          <Search size={16} style={{ color: "var(--fg-muted)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes across all workspaces..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleItemKeyDown}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              color: "var(--fg-primary)",
              fontSize: "0.875rem",
              outline: "none",
            }}
          />
          <button
            className="btn ghost sm"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          >
            <X size={14} />
          </button>
        </div>

        {loading && <p className="text-muted text-xs" style={{ padding: "0.5rem" }}>Searching...</p>}

        {!loading && results.length > 0 && (
          <div style={{ overflow: "auto", flex: 1 }}>
            {results.map((r, i) => (
              <Link
                key={r.id}
                href={`/dashboard/w/${r.workspaceSlug}/notes/${r.id}`}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: i === selectedIndex ? "var(--bg-tertiary)" : "transparent",
                  color: "var(--fg-primary)",
                  textDecoration: "none",
                }}
              >
                <FileText size={16} style={{ marginTop: "2px", color: "var(--fg-muted)", flexShrink: 0 }} />
                <div style={{ overflow: "hidden" }}>
                  <div className="text-sm" style={{ fontWeight: 500 }}>{r.title}</div>
                  <div className="flex align-center gap-1 text-xs" style={{ marginTop: "2px" }}>
                    <span className="text-muted">{r.workspaceName}</span>
                    {r.folderName && (
                      <>
                        <span className="text-muted">/</span>
                        <span className="text-muted">{r.folderName}</span>
                      </>
                    )}
                  </div>
                  {r.snippet && (
                    <div
                      className="text-muted text-xs truncate"
                      style={{ marginTop: "4px" }}
                      dangerouslySetInnerHTML={{
                        __html: r.snippet.replace(
                          new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
                          "<mark>$1</mark>"
                        ),
                      }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <p className="text-muted text-xs" style={{ padding: "0.5rem" }}>
            No notes found.
          </p>
        )}

        {!query && (
          <div style={{ overflow: "auto", flex: 1 }}>
            <p className="text-muted text-xs" style={{ padding: "0.5rem" }}>
              Search notes by title or content
            </p>
            {commands.map((cmd, i) => (
              <div
                key={cmd.label}
                className="flex align-center justify-between"
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--border-radius)",
                  backgroundColor: i === selectedIndex ? "var(--bg-tertiary)" : "transparent",
                }}
              >
                <div className="flex align-center gap-2">
                  <cmd.icon size={14} style={{ color: "var(--fg-muted)" }} />
                  <span className="text-sm">{cmd.label}</span>
                </div>
                <div className="flex align-center gap-1 text-xs text-muted">
                  {cmd.keys.map((k, j) => (
                    <kbd key={j} style={{ padding: "0 4px", borderRadius: "3px", backgroundColor: "var(--bg-tertiary)", fontSize: "0.65rem", fontWeight: 600 }}>{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="flex align-center gap-2 text-xs"
          style={{
            marginTop: "0.5rem",
            paddingTop: "0.5rem",
            borderTop: "1px solid var(--border-color)",
            color: "var(--fg-muted)",
          }}
        >
          <span>
            <kbd>↑↓</kbd> Navigate
          </span>
          <span>
            <kbd>Enter</kbd> Open
          </span>
          <span>
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
