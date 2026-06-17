"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface Comment {
  id: string;
  noteId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

export function CommentSection({ noteId }: { noteId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/notes/${noteId}/comments`);
      const data = await res.json();
      if (data.comments) setComments(data.comments);
    } catch {}
  }, [noteId]);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile) setCurrentUserId(d.profile.id);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetchComments();

    const es = new EventSource(`/api/notes/${noteId}/events`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "comment_added") fetchComments();
      } catch {}
    };
    return () => es.close();
  }, [noteId, visible, fetchComments]);

  async function submit() {
    if (!body.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setBody("");
      }
    } catch {}
    setLoading(false);
  }

  async function remove(commentId: string) {
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <button className="btn ghost sm flex align-center gap-1" onClick={() => setVisible(!visible)}>
        <MessageCircle size={14} />
        Comments ({comments.length})
      </button>

      {visible && (
        <div className="card" style={{ marginTop: "0.75rem", padding: "1rem" }}>
          {comments.length === 0 && (
            <p className="text-muted text-sm">No comments yet.</p>
          )}

          {comments.map((c) => (
            <div key={c.id} style={{ marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border-color)" }}>
              <div className="flex align-center gap-2" style={{ marginBottom: "0.25rem" }}>
                <Avatar name={c.user.name} email="" image={c.user.image} size={20} />
                <span className="text-sm" style={{ fontWeight: 600 }}>{c.user.name}</span>
                <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleDateString()}</span>
                {c.userId === currentUserId && (
                  <button className="btn ghost sm" onClick={() => remove(c.id)} style={{ marginLeft: "auto" }}>
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <p className="text-sm" style={{ paddingLeft: "1.75rem" }}>{c.body}</p>
            </div>
          ))}

          <div className="flex gap-1" style={{ marginTop: "0.75rem" }}>
            <input
              placeholder="Add a comment..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              style={{ flex: 1 }}
            />
            <button className="btn primary sm" onClick={submit} disabled={loading || !body.trim()}>
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
