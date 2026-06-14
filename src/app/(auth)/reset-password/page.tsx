"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import "../auth.scss";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: toastError, success: toastSuccess } = useToast();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toastError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toastError("Passwords do not match");
      return;
    }
    if (!token) {
      toastError("Missing reset token");
      return;
    }

    setLoading(true);

    try {
      const res = await authClient.resetPassword({ token, newPassword: password });

      if (res.error) {
        toastError(res.error.message || "Failed to reset password");
      } else {
        setDone(true);
        toastSuccess("Password reset successfully. Redirecting...");
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      toastError("An unexpected error occurred");
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
    return <p className="text-muted">Password reset successfully. Redirecting to sign in...</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
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
        <p className="text-muted text-sm" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
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
