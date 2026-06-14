"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import "../auth.scss";

export default function ForgotPasswordPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toastError(data.message || "Failed to send reset email");
      } else {
        setSent(true);
        toastSuccess("Check your email for a reset link");
      }
    } catch {
      toastError("An unexpected error occurred");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>MindMatrix</h1>
        <p className="text-muted text-sm" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          Reset your password
        </p>

        {sent ? (
          <div className="card" style={{ padding: "1rem", borderColor: "var(--accent-green)", color: "var(--accent-green)" }}>
            <p>If an account with that email exists, we&apos;ve sent a password reset link. Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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
