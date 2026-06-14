"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";

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

interface YjsUpdateEvent {
  type: "yjs_update";
  update: string;
  sender: string;
  clientID: number;
}

type RealtimeEvent = NoteUpdateEvent | PresenceEvent | YjsUpdateEvent;

export function useRealtimeNote(
  noteId: string | undefined,
  onRemoteUpdate?: (text: string) => void
) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [lastUpdate, setLastUpdate] = useState<NoteUpdateEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ydocRef = useRef<Y.Doc | null>(null);
  const ytextRef = useRef<Y.Text | null>(null);
  const suppressUpdateRef = useRef(false);

  const clearUpdate = useCallback(() => setLastUpdate(null), []);

  // Initialize Y.js Document
  if (!ydocRef.current && typeof window !== "undefined") {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    ytextRef.current = ydoc.getText("markdown");
  }

  const localUpdate = useCallback((newText: string) => {
    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;
    if (!ydoc || !ytext || suppressUpdateRef.current) return;

    const currentText = ytext.toString();
    if (currentText === newText) return;

    // Standard character-by-character O(N) diff and sync
    let start = 0;
    while (start < currentText.length && start < newText.length && currentText[start] === newText[start]) {
      start++;
    }

    let endCurrent = currentText.length - 1;
    let endNew = newText.length - 1;
    while (endCurrent >= start && endNew >= start && currentText[endCurrent] === newText[endNew]) {
      endCurrent--;
      endNew--;
    }

    ydoc.transact(() => {
      if (endCurrent >= start) {
        ytext.delete(start, endCurrent - start + 1);
      }
      if (endNew >= start) {
        ytext.insert(start, newText.slice(start, endNew + 1));
      }
    }, "local");
  }, []);

  useEffect(() => {
    if (!noteId) return;

    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;

    // Handle local updates and POST to server
    const handleLocalUpdate = (update: Uint8Array, origin: any) => {
      if (origin === "local") {
        const base64Update = Buffer.from(update).toString("base64");
        fetch(`/api/notes/${noteId}/delta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ update: base64Update, clientID: ydoc?.clientID }),
        }).catch(() => {});
      }
    };

    if (ydoc) {
      ydoc.on("update", handleLocalUpdate);
    }

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
        } else if (data.type === "yjs_update") {
          const yjsData = data as YjsUpdateEvent;
          // Ignore updates sent by our own client ID or session user to avoid echo bounce
          if (ydoc && yjsData.clientID !== ydoc.clientID && ytext) {
            suppressUpdateRef.current = true;
            try {
              const updateBinary = new Uint8Array(Buffer.from(yjsData.update, "base64"));
              Y.applyUpdate(ydoc, updateBinary, "remote");
              if (onRemoteUpdate) {
                onRemoteUpdate(ytext.toString());
              }
            } catch (err) {
              console.error("Y.js application failed:", err);
            } finally {
              suppressUpdateRef.current = false;
            }
          }
        }
      } catch { /* ignore malformed */ }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
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
      if (ydoc) {
        ydoc.off("update", handleLocalUpdate);
      }
    };
  }, [noteId, onRemoteUpdate]);

  return { viewers, lastUpdate, connected, clearUpdate, localUpdate };
}
