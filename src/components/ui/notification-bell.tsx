"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnread(data.notifications.filter((n: Notification) => !n.isRead).length);
      }
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications();

    try {
      const es = new EventSource("/api/notifications/events");
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "new_notification" && mountedRef.current) {
            fetchNotifications();
          }
        } catch {}
      };
      es.onerror = () => { es.close(); };
      eventSourceRef.current = es;
    } catch {}

    return () => {
      mountedRef.current = false;
      eventSourceRef.current?.close();
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {}
    setLoading(false);
  }

  async function markOneRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  const timeAgo = (iso: string) => {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button className="btn ghost sm" onClick={() => setOpen(!open)} style={{ position: "relative" }}>
        <Bell size={16} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              backgroundColor: "var(--accent-red)",
              color: "#fff",
              borderRadius: "50%",
              width: 16,
              height: 16,
              fontSize: "0.6rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            width: 360,
            maxHeight: 420,
            overflow: "auto",
            zIndex: 200,
            padding: 0,
          }}
        >
          <div
            className="flex align-center justify-between"
            style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)" }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Notifications</span>
            {unread > 0 && (
              <button className="btn ghost sm" onClick={markAllRead} disabled={loading}>
                <Check size={12} style={{ marginRight: "0.25rem" }} />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <p className="text-muted text-xs" style={{ padding: "1.5rem 1rem", textAlign: "center" }}>
              No notifications yet
            </p>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => { markOneRead(n.id); }}
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--border-color)",
                cursor: "pointer",
                backgroundColor: n.isRead ? "transparent" : "var(--bg-tertiary)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-sm" style={{ fontWeight: n.isRead ? 400 : 600, color: "var(--fg-primary)" }}>
                    {n.title}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
                    {n.message}
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="btn ghost sm"
                    style={{ flexShrink: 0, marginLeft: "0.5rem" }}
                  >
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
