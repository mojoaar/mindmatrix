"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled route error:", error);
  }, [error]);

  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
        <h2 style={{ color: "var(--accent-red)", marginBottom: "0.5rem" }}>
          Something went wrong
        </h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          {error.message || "An unexpected error occurred"}
        </p>
        <button className="btn primary" onClick={reset}>
          Try Again
        </button>
      </div>
    </div>
  );
}
