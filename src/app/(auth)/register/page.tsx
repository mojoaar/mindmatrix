"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import "../auth.scss";

export default function RegisterPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (password.length < 8) {
      toastError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await authClient.signUp.email({ name, email, password });

      if (res.error) {
        toastError(res.error.message || "Registration failed");
      } else {
        router.push("/dashboard");
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
          Create your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p
          className="text-muted text-sm"
          style={{ marginTop: "1rem", textAlign: "center" }}
        >
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
