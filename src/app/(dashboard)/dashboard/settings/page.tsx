"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { Avatar } from "@/components/ui/avatar";
import { ShieldCheck, QrCode, KeySquare, Trash2, Copy, Check } from "lucide-react";

const FONT_OPTIONS = [
  { id: "jetbrains-mono", label: "JetBrains Mono" },
  { id: "fira-code", label: "Fira Code" },
  { id: "source-code-pro", label: "Source Code Pro" },
  { id: "ibm-plex-mono", label: "IBM Plex Mono" },
  { id: "ubuntu-mono", label: "Ubuntu Mono" },
  { id: "inconsolata", label: "Inconsolata" },
  { id: "roboto-mono", label: "Roboto Mono" },
  { id: "dm-mono", label: "DM Mono" },
] as const;

const FONT_STORAGE_KEY = "mindmatrix-font";

interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  timezone: string;
  timeFormat: string;
  twoFactorEnabled: boolean;
  createdAt: string;
}

function getTimezones(): string[] {
  try {
    return (Intl as any).supportedValuesOf?.("timeZone") || fallback;
  } catch {
    return fallback;
  }
}

const fallback = [
  "UTC",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Copenhagen",
  "Europe/Stockholm", "Europe/Oslo", "Europe/Helsinki", "Europe/Madrid",
  "Europe/Rome", "Europe/Amsterdam", "Europe/Brussels", "Europe/Vienna",
  "Europe/Zurich", "Europe/Warsaw", "Europe/Prague", "Europe/Budapest",
  "Europe/Bucharest", "Europe/Athens", "Europe/Istanbul", "Europe/Moscow",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore",
  "Asia/Kolkata", "Asia/Dubai", "Asia/Seoul", "Asia/Bangkok", "Asia/Jakarta",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Perth",
  "Pacific/Auckland", "Pacific/Fiji",
  "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
  "America/Mexico_City", "America/Sao_Paulo", "America/Argentina/Buenos_Aires",
  "America/Toronto", "America/Vancouver",
];
let cachedTimezones: string[] | null = null;

export default function UserSettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

  const [selectedFont, setSelectedFont] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(FONT_STORAGE_KEY) || "jetbrains-mono";
    }
    return "jetbrains-mono";
  });

  const [sidebarShowFolders, setSidebarShowFolders] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mindmatrix-show-sidebar-folders") === "true";
    }
    return false;
  });

  const [sidebarShowTags, setSidebarShowTags] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mindmatrix-show-sidebar-tags") === "true";
    }
    return false;
  });

  const handleToggleSidebarFolders = (val: boolean) => {
    setSidebarShowFolders(val);
    localStorage.setItem("mindmatrix-show-sidebar-folders", val ? "true" : "false");
    window.dispatchEvent(new CustomEvent("mindmatrix:sidebar-prefs-updated"));
  };

  const handleToggleSidebarTags = (val: boolean) => {
    setSidebarShowTags(val);
    localStorage.setItem("mindmatrix-show-sidebar-tags", val ? "true" : "false");
    window.dispatchEvent(new CustomEvent("mindmatrix:sidebar-prefs-updated"));
  };

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState<"idle" | "qrcode" | "verify" | "done">("idle");
  const [totpURI, setTotpURI] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaPassword, setMfaPassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [mfaMessage, setMfaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function startMfaSetup() {
    if (!mfaPassword) {
      setMfaMessage({ type: "error", text: "Enter your password to enable MFA" });
      return;
    }
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await fetch("/api/auth/two-factor/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: mfaPassword }),
      });
      const data = await res.json();
      if (data?.totpURI) {
        setTotpURI(data.totpURI);
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
        }
        setMfaSetupStep("qrcode");
        setMfaPassword("");
      } else {
        setMfaMessage({ type: "error", text: data?.message || "Failed to start MFA setup" });
      }
    } catch {
      setMfaMessage({ type: "error", text: "Failed to start MFA setup" });
    }
    setMfaLoading(false);
  }

  async function verifyMfaSetup() {
    if (!totpCode || totpCode.length < 6) {
      setMfaMessage({ type: "error", text: "Enter the 6-digit code from your authenticator app" });
      return;
    }
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await fetch("/api/auth/two-factor/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setMfaSetupStep("done");
        setMfaEnabled(true);
        setMfaMessage({ type: "success", text: "Two-factor authentication enabled" });
      } else {
        setMfaMessage({ type: "error", text: data?.message || "Invalid code. Try again." });
      }
    } catch (e: any) {
      setMfaMessage({ type: "error", text: e?.message || "Verification failed" });
    }
    setMfaLoading(false);
  }

  async function disableMfa() {
    if (!mfaPassword) {
      setMfaMessage({ type: "error", text: "Enter your password to disable MFA" });
      return;
    }
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await fetch("/api/auth/two-factor/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: mfaPassword }),
      });
      if (res.ok) {
        setMfaEnabled(false);
        setMfaSetupStep("idle");
        setBackupCodes([]);
        setMfaPassword("");
        setMfaMessage({ type: "success", text: "Two-factor authentication disabled" });
      } else {
        const data = await res.json();
        setMfaMessage({ type: "error", text: data?.message || "Failed to disable MFA" });
      }
    } catch {
      setMfaMessage({ type: "error", text: "Failed to disable MFA" });
    }
    setMfaLoading(false);
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCode("all");
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function finishMfaSetup() {
    setMfaSetupStep("idle");
    setTotpURI("");
    setTotpCode("");
    setMfaPassword("");
    setBackupCodes([]);
    setMfaMessage(null);
  }

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
          setEmail(data.profile.email);
          setTimezone(data.profile.timezone || "browser");
          setTimeFormat(data.profile.timeFormat || "browser");
          setMfaEnabled(data.profile.twoFactorEnabled || false);
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
        body: JSON.stringify({ name, email, timezone, timeFormat }),
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

  function setAndSaveFont(fontId: string) {
    setSelectedFont(fontId);
    localStorage.setItem(FONT_STORAGE_KEY, fontId);
    document.documentElement.setAttribute("data-font", fontId);
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
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            {["browser", ...getTimezones()].map((tz) => (
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
          <label>Theme</label>
          <div className="flex gap-1" style={{ marginTop: "0.5rem", flexWrap: "wrap" }}>
            {([
              "nord-dark", "nord-light",
              "dracula-dark", "dracula-light",
              "github-dark", "github-light",
              "catppuccin-dark", "catppuccin-light",
              "cyberpunk-dark", "cyberpunk-light",
              "one-dark", "one-light",
            ] as Theme[]).map((t) => (
              <button
                key={t}
                className={`btn ${theme === t ? "primary" : "secondary"} sm`}
                onClick={() => setTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Font</label>
          <div className="flex gap-1" style={{ marginTop: "0.5rem", flexWrap: "wrap" }}>
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.id}
                className={`btn ${selectedFont === font.id ? "primary" : "secondary"} sm`}
                onClick={() => setAndSaveFont(font.id)}
                style={{ fontFamily: `var(--font-${font.id})`, fontSize: "0.875rem" }}
              >
                {font.label}
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

        <div className="form-group">
          <label>Left Sidebar Layout</label>
          <div className="flex gap-2" style={{ marginTop: "0.5rem" }}>
            <button
              className={`btn ${sidebarShowFolders ? "primary" : "secondary"} sm`}
              onClick={() => handleToggleSidebarFolders(!sidebarShowFolders)}
            >
              {sidebarShowFolders ? "Showing Folders" : "Show Folders in Sidebar"}
            </button>
            <button
              className={`btn ${sidebarShowTags ? "primary" : "secondary"} sm`}
              onClick={() => handleToggleSidebarTags(!sidebarShowTags)}
            >
              {sidebarShowTags ? "Showing Tags" : "Show Tags in Sidebar"}
            </button>
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
                <th>Action</th>
                <th>macOS</th>
                <th>Windows / Linux</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Search</td><td><kbd>Cmd+K</kbd></td><td><kbd>Ctrl+K</kbd></td></tr>
              <tr><td>New Note</td><td><kbd>Opt+N</kbd></td><td><kbd>Alt+N</kbd></td></tr>
              <tr><td>New Folder</td><td><kbd>Opt+Shift+F</kbd></td><td><kbd>Alt+Shift+F</kbd></td></tr>
              <tr><td>Save Note</td><td><kbd>Cmd+Enter</kbd></td><td><kbd>Ctrl+Enter</kbd></td></tr>
              <tr><td>Toggle Sidebar</td><td><kbd>Cmd+B</kbd></td><td><kbd>Ctrl+B</kbd></td></tr>
              <tr><td>Settings</td><td><kbd>Cmd+,</kbd></td><td><kbd>Ctrl+,</kbd></td></tr>
              <tr><td>Close Dialog</td><td><kbd>Escape</kbd></td><td><kbd>Escape</kbd></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={18} style={{ color: mfaEnabled ? "var(--accent-green)" : "var(--fg-muted)" }} />
          Two-Factor Authentication (TOTP)
        </h3>

        {mfaMessage && (
          <div
            className="card"
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              borderColor: mfaMessage.type === "error" ? "var(--accent-red)" : "var(--accent-green)",
              color: mfaMessage.type === "error" ? "var(--accent-red)" : "var(--accent-green)",
            }}
          >
            {mfaMessage.text}
          </div>
        )}

        {!mfaEnabled && mfaSetupStep === "idle" && (
          <div>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              Add an extra layer of security to your account. After enabling, you'll need to enter a 6-digit code from your authenticator app each time you sign in.
            </p>
            <div className="form-group">
              <label htmlFor="mfa-enable-password">Current password</label>
              <input
                id="mfa-enable-password"
                type="password"
                value={mfaPassword}
                onChange={(e) => setMfaPassword(e.target.value)}
                placeholder="Enter your password to enable MFA"
                onKeyDown={(e) => e.key === "Enter" && startMfaSetup()}
              />
            </div>
            <button className="btn primary" onClick={startMfaSetup} disabled={mfaLoading}>
              {mfaLoading ? "Setting up..." : "Enable Two-Factor Auth"}
            </button>
          </div>
        )}

        {mfaSetupStep === "qrcode" && (
          <div>
            <p className="text-sm" style={{ marginBottom: "1rem" }}>
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </p>
            <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "var(--border-radius)" }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`}
                alt="TOTP QR Code"
                width={200}
                height={200}
                style={{ display: "block", margin: "0 auto" }}
              />
            </div>
            <div className="form-group">
              <label htmlFor="totp-code">Verification code</label>
              <input
                id="totp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && verifyMfaSetup()}
                style={{ fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5rem", fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn primary" onClick={verifyMfaSetup} disabled={mfaLoading}>
                {mfaLoading ? "Verifying..." : "Verify Code"}
              </button>
              <button className="btn secondary" onClick={() => { setMfaSetupStep("idle"); setMfaMessage(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {mfaSetupStep === "done" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <KeySquare size={18} style={{ color: "var(--accent-green)" }} />
              <strong style={{ color: "var(--accent-green)" }}>Two-factor authentication is active</strong>
            </div>

            {backupCodes.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <p className="text-sm" style={{ marginBottom: "0.75rem", color: "var(--accent-orange)" }}>
                  Save these backup codes in a safe place. Each code can only be used once.
                </p>
                <div
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--border-radius)",
                    padding: "1rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  {backupCodes.map((code) => (
                    <div key={code} style={{ color: "var(--fg-primary)" }}>{code}</div>
                  ))}
                </div>
                <button
                  className="btn secondary sm"
                  onClick={copyBackupCodes}
                  style={{ marginTop: "0.5rem" }}
                >
                  {copiedCode === "all" ? <Check size={12} /> : <Copy size={12} />}
                  <span style={{ marginLeft: "0.25rem" }}>{copiedCode === "all" ? "Copied" : "Copy All"}</span>
                </button>
                <button className="btn primary sm" onClick={finishMfaSetup} style={{ marginTop: "0.5rem", marginLeft: "0.5rem" }}>
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {mfaEnabled && mfaSetupStep === "idle" && (
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <KeySquare size={18} style={{ color: "var(--accent-green)" }} />
              <strong style={{ color: "var(--accent-green)" }}>Two-factor authentication is active</strong>
            </div>
            <p className="text-muted text-sm" style={{ marginBottom: "1rem" }}>
              Your account is protected with TOTP-based two-factor authentication.
            </p>
            <div className="form-group">
              <label htmlFor="mfa-disable-password">Current password</label>
              <input
                id="mfa-disable-password"
                type="password"
                value={mfaPassword}
                onChange={(e) => setMfaPassword(e.target.value)}
                placeholder="Enter your password to disable MFA"
                onKeyDown={(e) => e.key === "Enter" && disableMfa()}
              />
            </div>
            <button className="btn danger" onClick={disableMfa} disabled={mfaLoading}>
              <Trash2 size={14} />
              {mfaLoading ? "Disabling..." : "Disable Two-Factor Auth"}
            </button>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card">
        <h3>About</h3>
        <div className="text-sm" style={{ lineHeight: 1.8 }}>
          <p>
            <strong>MindMatrix</strong> v0.2.0
          </p>
          <p className="text-muted">
            Markdown-first, self-hosted, multi-user knowledge hub.
          </p>
          <p className="text-muted text-xs" style={{ marginTop: "0.75rem" }}>
            Licensed under AGPL-3.0 · Built by <a href="https://github.com/mojoaar" target="_blank" rel="noopener">mojoaar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
