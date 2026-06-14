"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="container">
          <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
            <AlertTriangle
              size={32}
              style={{ color: "var(--accent-red)", marginBottom: "1rem" }}
            />
            <h2 style={{ color: "var(--accent-red)", marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button className="btn primary" onClick={this.handleRetry}>
              <RefreshCw size={14} style={{ marginRight: "0.5rem" }} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
