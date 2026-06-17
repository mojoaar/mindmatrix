"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useState, useEffect, useCallback, createElement, type ReactNode } from "react";

let embedCache: Record<string, { title: string; content: string }> = {};

function EmbedRenderer({ slug, workspaceId, depth = 0 }: { slug: string; workspaceId: string; depth: number }) {
  const [note, setNote] = useState<{ title: string; content: string } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (depth > 3) { setError(true); return; }
    const cacheKey = `${workspaceId}:${slug}`;
    if (embedCache[cacheKey]) { setNote(embedCache[cacheKey]); return; }

    let cancelled = false;
    fetch(`/api/notes/by-slug?workspaceId=${workspaceId}&slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.note) {
          embedCache[cacheKey] = data.note;
          setNote(data.note);
        } else if (!cancelled) {
          setError(true);
        }
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [slug, workspaceId, depth]);

  if (error && depth === 0) return createElement("p", { className: "text-muted text-sm" }, `⚠ Note not found: ${slug}`);
  if (error) return null;
  if (!note) return createElement("p", { className: "text-muted text-sm" }, "Loading...");

  return createElement("div", { className: "note-embed" },
    createElement("h4", null, note.title),
    createElement(ReactMarkdown, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSanitize],
      components: {
        p: ({ node, ...props }) => createElement("p", props),
        a: ({ node, ...props }) => createElement("a", { ...props, target: "_blank", rel: "noopener" }),
      },
    }, note.content)
  );
}

export function resolveEmbeds(content: string, workspaceId: string): ReactNode[] {
  if (!content) return [createElement("p", { className: "text-muted" }, "*Empty note*")];

  const parts: ReactNode[] = [];
  const regex = /!\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push(createElement(EmbedRenderer, { key: ++key, slug: match[1], workspaceId, depth: 0 }));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}
