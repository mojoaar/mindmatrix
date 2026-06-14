"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import "../auth.scss";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Missing reset token");
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.resetPassword({ token, newPassword: password });

      if (res.error) {
        setError(res.error.message || "Failed to reset password");
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    }

    setLoading(false);
  }

  if (!token) {
    return (
      <div className="card" style={{ padding: "1rem", borderColor: "var(--accent-red)", color: "var(--accent-red)" }}>
        Invalid or missing reset token. Please request a new password reset link.
      </div>
    );
  }

  if (done) {
    return (
      <div className="card" style={{ padding: "1rem", borderColor: "var(--accent-green)", color: "var(--accent-green)" }}>
        Password reset successfully. Redirecting to sign in...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="card" style={{ padding: "0.75rem", borderColor: "var(--accent-red)", color: "var(--accent-red)", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="password">New Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirm">Confirm Password</label>
        <input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="btn primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>MindMatrix</h1>
        <p className="text-muted text-sm" style={{ marginBottom: "1.5rem" }}>
          Choose a new password
        </p>
        <Suspense fallback={<p className="text-muted">Loading...</p>}>
          <ResetForm />
        </Suspense>
        <p className="text-muted text-sm" style={{ marginTop: "1rem", textAlign: "center" }}>
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
