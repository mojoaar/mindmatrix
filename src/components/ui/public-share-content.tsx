"use client";

import { useMermaid } from "@/hooks/use-mermaid";
import { CommentSection } from "@/components/ui/comment-section";

export function PublicShareContent({
  content,
  noteId,
  children,
}: {
  content: string;
  noteId: string;
  children: React.ReactNode;
}) {
  const mermaidRef = useMermaid([content]);
  return (
    <div ref={mermaidRef}>
      {children}
      <CommentSection noteId={noteId} />
    </div>
  );
}
