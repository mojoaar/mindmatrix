"use client";

import { useState } from "react";
import Link from "next/link";
import "../auth.scss";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to send reset email");
      } else {
        setSent(true);
      }
    } catch {
      setError("An unexpected error occurred");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>MindMatrix</h1>
        <p className="text-muted text-sm" style={{ marginBottom: "1.5rem" }}>
          Reset your password
        </p>

        {sent ? (
          <div className="card" style={{ padding: "1rem", borderColor: "var(--accent-green)", color: "var(--accent-green)" }}>
            <p>If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="card" style={{ padding: "0.75rem", borderColor: "var(--accent-red)", color: "var(--accent-red)", marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button type="submit" className="btn primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-muted text-sm" style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
