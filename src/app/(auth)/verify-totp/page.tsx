"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, KeyRound } from "lucide-react";

export default function VerifyTotpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = useBackup
        ? "/api/auth/two-factor/verify-backup-code"
        : "/api/auth/two-factor/verify-totp";

      const body = useBackup
        ? { code: backupCode }
        : { code, trustDevice };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(useBackup ? "Invalid backup code" : "Invalid verification code");
      }
    } catch {
      setError("Verification failed. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", padding: "0.75rem", backgroundColor: "var(--bg-tertiary)", borderRadius: "50%", marginBottom: "1rem" }}>
            <ShieldCheck size={32} style={{ color: "var(--accent-green)" }} />
          </div>
          <h1>Two-Factor Authentication</h1>
          <p className="text-muted text-sm" style={{ marginTop: "0.5rem" }}>
            {useBackup
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <form onSubmit={handleVerify}>
          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "var(--border-radius)",
                backgroundColor: "rgba(191, 97, 106, 0.1)",
                color: "var(--accent-red)",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          {!useBackup ? (
            <div className="form-group">
              <label htmlFor="totp-input">Authentication code</label>
              <input
                id="totp-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ fontSize: "1.5rem", textAlign: "center", letterSpacing: "0.5rem", fontFamily: "var(--font-mono)" }}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="backup-input">Backup code</label>
              <input
                id="backup-input"
                type="text"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="XXXXXXXXXX"
                style={{ fontFamily: "var(--font-mono)", textAlign: "center" }}
              />
            </div>
          )}

          {!useBackup && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <input
                id="trust-device"
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                style={{ accentColor: "var(--accent-indigo)" }}
              />
              <label htmlFor="trust-device" style={{ fontSize: "0.875rem", color: "var(--fg-muted)", cursor: "pointer" }}>
                Trust this device for 30 days
              </label>
            </div>
          )}

          <button className="btn primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            <KeyRound size={16} />
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            className="btn ghost sm"
            onClick={() => { setUseBackup(!useBackup); setError(""); setCode(""); setBackupCode(""); }}
          >
            {useBackup ? "Use authenticator app instead" : "Use a backup code instead"}
          </button>
        </div>
      </div>
    </div>
  );
}