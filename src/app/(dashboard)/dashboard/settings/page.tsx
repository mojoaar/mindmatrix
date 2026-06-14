"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";

interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  timezone: string;
  timeFormat: string;
  createdAt: string;
}

const TIMEZONES = [
  "browser",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function UserSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("browser");
  const [timeFormat, setTimeFormat] = useState("browser");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editorLayout, setEditorLayout] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mindmatrix-editor-layout") || "split";
    }
    return "split";
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return; }
        return r.json();
      })
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setName(data.profile.name);
          setTimezone(data.profile.timezone || "browser");
          setTimeFormat(data.profile.timeFormat || "browser");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, timezone, timeFormat }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        window.dispatchEvent(new CustomEvent("mindmatrix:profile-updated", { detail: data.profile }));
        setMessage({ type: "success", text: "Profile saved" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    }
    setSaving(false);
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.image) {
        setProfile((prev) => (prev ? { ...prev, image: data.image } : prev));
        window.dispatchEvent(new CustomEvent("mindmatrix:profile-updated", { detail: { image: data.image } }));
        setMessage({ type: "success", text: "Avatar updated" });
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Upload failed" });
    }
    setUploading(false);
  }

  async function removeAvatar() {
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json();
      if (data.image === null) {
        setProfile((prev) => (prev ? { ...prev, image: null } : prev));
        window.dispatchEvent(new CustomEvent("mindmatrix:profile-updated", { detail: { image: null } }));
        setMessage({ type: "success", text: "Avatar removed" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to remove" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to remove" });
    }
    setUploading(false);
  }

  function setAndSaveLayout(layout: string) {
    setEditorLayout(layout);
    localStorage.setItem("mindmatrix-editor-layout", layout);
  }

  if (loading || !profile) {
    return (
      <div>
        <h1>Settings</h1>
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Settings</h1>

      {message && (
        <div
          className="card"
          style={{
            padding: "0.75rem",
            marginBottom: "1rem",
            borderColor: message.type === "error" ? "var(--accent-red)" : "var(--accent-green)",
            color: message.type === "error" ? "var(--accent-red)" : "var(--accent-green)",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Profile */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Profile</h3>

        <div className="flex align-center gap-2" style={{ marginBottom: "1.5rem" }}>
          <Avatar
            name={profile.name}
            email={profile.email}
            image={profile.image}
            size={64}
          />
          <div>
            <div className="flex gap-1" style={{ marginBottom: "0.5rem" }}>
              <button
                className="btn secondary sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              {profile.image && (
                <button className="btn danger sm" onClick={removeAvatar} disabled={uploading}>
                  Remove
                </button>
              )}
            </div>
            <p className="text-muted text-xs">JPEG, PNG, or WebP. Max 2MB.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input value={profile.email} disabled style={{ opacity: 0.6 }} />
          <p className="text-muted text-xs" style={{ marginTop: "0.25rem" }}>
            Email cannot be changed.
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3>Preferences</h3>

        <div className="form-group">
          <label htmlFor="timezone">Timezone</label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz === "browser" ? "Browser Default" : tz}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Time Format</label>
          <div className="flex gap-1" style={{ marginTop: "0.5rem" }}>
            {(["browser", "12h", "24h"] as const).map((fmt) => (
              <button
                key={fmt}
                className={`btn ${timeFormat === fmt ? "primary" : "secondary"} sm`}
                onClick={() => setTimeFormat(fmt)}
              >
                {fmt === "browser" ? "Browser Default" : fmt === "12h" ? "12-hour (AM/PM)" : "24-hour"}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Default Editor Layout</label>
          <div className="flex gap-1" style={{ marginTop: "0.5rem" }}>
            {["split", "edit", "preview"].map((layout) => (
              <button
                key={layout}
                className={`btn ${editorLayout === layout ? "primary" : "secondary"} sm`}
                onClick={() => setAndSaveLayout(layout)}
                style={{ textTransform: "capitalize" }}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>

        <button className="btn primary" onClick={saveProfile} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="card">
        <h3>Keyboard Shortcuts</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><kbd>Cmd+K</kbd></td><td>Global search</td></tr>
              <tr><td><kbd>Cmd+Enter</kbd></td><td>Save current note</td></tr>
              <tr><td><kbd>Cmd+B</kbd></td><td>Toggle sidebar</td></tr>
              <tr><td><kbd>Escape</kbd></td><td>Close dialogs</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
