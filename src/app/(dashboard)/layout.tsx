"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, Search, Settings, Folders, Cloud, type LucideIcon } from "lucide-react";
import { SearchOverlay } from "@/components/search/search-overlay";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface UserInfo {
  name: string;
  email: string;
  image: string | null;
}

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Workspaces", icon: BookOpen },
  { href: "/docs", label: "Documentation", icon: Folders },
  { href: "/apidocs", label: "API Reference", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/workspaces")
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return; }
        return res.json();
      })
      .then((data) => {
        if (data?.workspaces && !cancelled) setWorkspaces(data.workspaces);
      })
      .catch(() => {});

    fetch("/api/profile")
      .then((res) => {
        if (res.status === 401) { router.push("/login"); return; }
        return res.json();
      })
      .then((data) => {
        if (data?.profile && !cancelled) setUser(data.profile);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUser((prev) => (prev ? { ...prev, ...detail } : prev));
    };
    window.addEventListener("mindmatrix:profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("mindmatrix:profile-updated", handleProfileUpdate);
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "b") {
      e.preventDefault();
      setSidebarOpen((prev) => !prev);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === ",") {
      e.preventDefault();
      router.push("/dashboard/settings");
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "260px" : "0px",
          overflow: "hidden",
          transition: "width 0.2s",
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        <Link
          href="/dashboard/settings"
          style={{
            padding: "1rem",
            borderBottom: "1px solid var(--border-color)",
            display: "block",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <div className="flex align-center gap-2">
            <Avatar
              name={user?.name || "User"}
              email={user?.email || ""}
              image={user?.image}
              size={32}
            />
            <div>
              <div className="text-sm" style={{ fontWeight: 600, color: "var(--fg-primary)" }}>
                {user?.name || "MindMatrix"}
              </div>
              {user && (
                <div className="text-xs text-muted truncate" style={{ maxWidth: "160px" }}>
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Workspace list */}
        <div style={{ padding: "0.5rem", flex: 1, overflowY: "auto" }}>
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/w/${ws.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--border-radius)",
                color: "var(--fg-muted)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <BookOpen size={14} />
              <span className="truncate">{ws.name}</span>
            </Link>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ padding: "0.5rem", borderTop: "1px solid var(--border-color)" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--border-radius)",
                color: "var(--fg-muted)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <item.icon size={14} />
              {item.label}
            </Link>
          ))}

          <button
            className="btn ghost sm"
            style={{ width: "100%", justifyContent: "flex-start", marginTop: "0.25rem" }}
            onClick={handleLogout}
          >
            <LogOut size={14} style={{ marginRight: "0.5rem" }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          <div className="flex align-center gap-2">
            {!sidebarOpen && (
              <button
                className="btn ghost sm"
                onClick={() => setSidebarOpen(true)}
              >
                <BookOpen size={14} />
              </button>
            )}
            <button
              className="btn secondary sm"
              onClick={() => window.dispatchEvent(new CustomEvent("mindmatrix:search"))}
              style={{ opacity: 0.6, cursor: "pointer" }}
            >
              <Search size={14} style={{ marginRight: "0.5rem" }} />
              Search...
              <kbd
                style={{
                  marginLeft: "auto",
                  padding: "0 0.25rem",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-tertiary)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                Cmd+K
              </kbd>
            </button>
          </div>

          <div className="flex align-center gap-2">
            <Link href="/dashboard/sync" className="btn ghost sm">
              <Cloud size={14} />
            </Link>
            <Link href="/dashboard/settings" className="btn ghost sm">
              <Settings size={14} />
            </Link>
          </div>
        </header>

        <div className="container" style={{ paddingTop: "1.5rem" }}>
          {children}
        </div>
      </main>
      <SearchOverlay />
    </div>
  );
}
