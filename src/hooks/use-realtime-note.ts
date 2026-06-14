"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Viewer {
  userId: string;
  userName: string;
}

interface NoteUpdateEvent {
  type: "note_updated";
  noteId: string;
  updatedBy: string;
  updatedAt: string;
}

interface PresenceEvent {
  type: "presence_changed";
  viewers: Viewer[];
}

type RealtimeEvent = NoteUpdateEvent | PresenceEvent;

export function useRealtimeNote(noteId: string | undefined) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [lastUpdate, setLastUpdate] = useState<NoteUpdateEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearUpdate = useCallback(() => setLastUpdate(null), []);

  useEffect(() => {
    if (!noteId) return;

    // SSE connection
    const es = new EventSource(`/api/notes/${noteId}/events`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data);

        if (data.type === "note_updated") {
          setLastUpdate(data as NoteUpdateEvent);
        } else if (data.type === "presence_changed") {
          setViewers((data as PresenceEvent).viewers);
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          // EventSource auto-reconnects
        }
      }, 3000);
    };

    // Presence heartbeat
    const heartbeat = () => {
      fetch(`/api/notes/${noteId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.viewers) setViewers(data.viewers);
        })
        .catch(() => {});
    };

    heartbeat(); // Initial
    heartbeatRef.current = setInterval(heartbeat, 15000);

    return () => {
      es.close();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      eventSourceRef.current = null;
    };
  }, [noteId]);

  return { viewers, lastUpdate, connected, clearUpdate };
}
