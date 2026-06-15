"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import "../auth.scss";

export default function LoginPage() {
  const { error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({ email, password });
      if (data) {
        window.location.href = "/dashboard";
        return;
      }
      if (error) {
        if (error.status === 422) {
          window.location.href = "/dashboard";
          return;
        }
        toastError(error.message || "Invalid email or password");
      }
    } catch (err) {
      const e = err as { status?: number };
      if (e.status === 422) {
        window.location.href = "/dashboard";
        return;
      }
      toastError("An unexpected error occurred");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>MindMatrix</h1>
        <p className="text-muted text-sm" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          Sign in to your knowledge hub
        </p>

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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p
          className="text-muted text-sm"
          style={{ marginTop: "0.75rem", textAlign: "center" }}
        >
          <Link href="/forgot-password">Forgot password?</Link>
        </p>

        <p
          className="text-muted text-sm"
          style={{ marginTop: "0.5rem", textAlign: "center" }}
        >
          Don&apos;t have an account?{" "}
          <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
