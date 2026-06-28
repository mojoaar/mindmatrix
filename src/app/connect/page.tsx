"use client";

import { useState } from "react";
import { Server, Key, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import styles from "./connect.module.scss";

export default function ConnectPage() {
  const [tab, setTab] = useState<"signin" | "token">("signin");
  const [serverUrl, setServerUrl] = useState(
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      : "http://localhost:3000"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }
      await saveAndRedirect(serverUrl, {
        email,
        sessionToken: data.token || "",
      });
    } catch {
      setError("Connection failed. Check your server URL.");
      setLoading(false);
    }
  }

  async function handleTokenAuth() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${serverUrl}/api/profile`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (!res.ok) {
        setError("Invalid API token. Check the token and server URL.");
        setLoading(false);
        return;
      }
      await saveAndRedirect(serverUrl, {
        apiToken,
      });
    } catch {
      setError("Connection failed. Check your server URL.");
      setLoading(false);
    }
  }

  async function saveAndRedirect(serverUrl: string, authData: Record<string, string>) {
    if (typeof window !== "undefined" && window.__TAURI__) {
      try {
        const { load } = await import("@tauri-apps/plugin-store");
        const store = await load("mindmatrix-config.json", { autoSave: true } as any);
        await store.set("serverUrl", serverUrl);
        for (const [key, value] of Object.entries(authData)) {
          await store.set(key, value);
        }
      } catch {
        // Fall through to localStorage fallback
      }
    }
    // Always write to localStorage as a browser fallback (and Tauri uses it too)
    localStorage.setItem("mindmatrix-desktop-url", serverUrl);
    for (const [key, value] of Object.entries(authData)) {
      localStorage.setItem(`mindmatrix-desktop-${key}`, value);
    }
    window.location.href = serverUrl + "/dashboard";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "signin") {
      handleSignIn();
    } else {
      handleTokenAuth();
    }
  }

  const isValid =
    tab === "signin"
      ? email.trim().length > 0 && password.trim().length > 0
      : apiToken.trim().length > 0;

  return (
    <div className={styles["connect-page"]}>
      <div className={`card ${styles["connect-card"]}`}>
        <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          <Server
            size={40}
            style={{ color: "var(--accent-color, #5e81ac)" }}
          />
        </div>
        <h1>MindMatrix Desktop</h1>
        <p
          className="text-muted"
          style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "0.875rem" }}
        >
          Connect to your self-hosted server
        </p>

        {/* Server URL */}
        <div className="form-group">
          <label htmlFor="serverUrl">
            <Server size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
            Server URL
          </label>
          <input
            id="serverUrl"
            type="url"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://localhost:3000"
            required
          />
        </div>

        {/* Tab toggle */}
        <div className={styles["connect-tabs"]}>
          <button
            type="button"
            className={`${styles["connect-tab"]} ${tab === "signin" ? styles["active"] : ""}`}
            onClick={() => setTab("signin")}
          >
            <Mail size={14} />
            Sign In
          </button>
          <button
            type="button"
            className={`${styles["connect-tab"]} ${tab === "token" ? styles["active"] : ""}`}
            onClick={() => setTab("token")}
          >
            <Key size={14} />
            API Token
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === "signin" ? (
            <>
              <div className="form-group">
                <label htmlFor="email">
                  <Mail size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="apiToken">
                <Key size={14} style={{ verticalAlign: "middle", marginRight: "0.4rem" }} />
                API Token
              </label>
              <input
                id="apiToken"
                type="password"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                required
                placeholder="mm_••••••••••••••••"
                autoComplete="off"
              />
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className={styles["connect-error"]}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%", marginTop: "0.5rem" }}
            disabled={loading || !isValid}
          >
            {loading ? (
              "Connecting..."
            ) : (
              <>
                Connect
                <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
              </>
            )}
          </button>
        </form>

        <p className={styles["connect-footer"]}>
          Find your API token in Settings → API Tokens on the server.
        </p>
      </div>
    </div>
  );
}
