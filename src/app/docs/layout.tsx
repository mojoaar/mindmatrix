import { SearchOverlay } from "@/components/search/search-overlay";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <>
      <div style={{ display: "flex", height: "100vh" }}>
        <aside
          style={{
            width: "240px",
            backgroundColor: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-color)",
            padding: "1.5rem 1rem",
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-muted)", marginBottom: "1rem" }}>
            Documentation
          </h3>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <a href="/docs" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Introduction
            </a>
            <a href="/docs/getting-started" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Getting Started
            </a>
            <a href="/docs/workspaces" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Workspaces
            </a>
            <a href="/docs/notes" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Notes
            </a>
            <a href="/docs/search" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Search
            </a>
            <a href="/docs/sync" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Cloud Sync
            </a>
            <a href="/docs/self-hosting" style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--border-radius)", color: "var(--fg-muted)", fontSize: "0.875rem" }}>
              Self-Hosting
            </a>
          </nav>

          {session && (
            <div style={{ marginTop: "2rem" }}>
              <a href="/dashboard" className="btn secondary sm" style={{ width: "100%", display: "flex" }}>
                Back to Dashboard
              </a>
            </div>
          )}
        </aside>
        <main style={{ flex: 1, overflow: "auto", padding: "2rem 3rem" }}>
          {children}
        </main>
      </div>
      <SearchOverlay />
    </>
  );
}
