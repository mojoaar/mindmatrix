"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, LogOut, Search, Settings, Folders, ShieldCheck, Sun, Moon, Tag, type LucideIcon } from "lucide-react";
import { SearchOverlay } from "@/components/search/search-overlay";
import { Avatar } from "@/components/ui/avatar";
import { getIcon } from "@/lib/icons";
import { useTheme } from "@/components/theme/theme-provider";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  folders?: { id: string; name: string; icon?: string }[];
  tags?: { id: string; name: string; color: string }[];
  notes?: { id: string; folderId: string | null }[];
}

interface UserInfo {
  name: string;
  email: string;
  image: string | null;
  role?: string;
  sidebarFolders?: boolean;
  sidebarTags?: boolean;
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
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFolders, setShowFolders] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    const loadPrefs = () => {
      const lsFolders = localStorage.getItem("mindmatrix-show-sidebar-folders");
      const lsTags = localStorage.getItem("mindmatrix-show-sidebar-tags");
      setShowFolders(lsFolders === "true");
      setShowTags(lsTags === "true");
    };
    loadPrefs();
    window.addEventListener("mindmatrix:sidebar-prefs-updated", loadPrefs);
    return () => {
      window.removeEventListener("mindmatrix:sidebar-prefs-updated", loadPrefs);
    };
  }, []);

  useEffect(() => {
    if (user?.sidebarFolders !== undefined) {
      setShowFolders(user.sidebarFolders);
      localStorage.setItem("mindmatrix-show-sidebar-folders", user.sidebarFolders ? "true" : "false");
    }
    if (user?.sidebarTags !== undefined) {
      setShowTags(user.sidebarTags);
      localStorage.setItem("mindmatrix-show-sidebar-tags", user.sidebarTags ? "true" : "false");
    }
  }, [user?.sidebarFolders, user?.sidebarTags]);

  const toggleTheme = () => {
    if (theme.endsWith("-dark")) {
      setTheme(theme.replace("-dark", "-light") as any);
    } else if (theme.endsWith("-light")) {
      setTheme(theme.replace("-light", "-dark") as any);
    }
  };

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
    const handleWorkspaceUpdate = () => {
      fetch("/api/workspaces")
        .then((res) => res.json())
        .then((data) => {
          if (data.workspaces) setWorkspaces(data.workspaces);
        })
        .catch(() => {});
    };
    window.addEventListener("mindmatrix:profile-updated", handleProfileUpdate);
    window.addEventListener("mindmatrix:workspace-updated", handleWorkspaceUpdate);
    return () => {
      window.removeEventListener("mindmatrix:profile-updated", handleProfileUpdate);
      window.removeEventListener("mindmatrix:workspace-updated", handleWorkspaceUpdate);
    };
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
    if (e.altKey && e.code === "KeyN") {
      e.preventDefault();
      if (pathname === "/dashboard" && workspaces.length > 0) {
        router.push(`/dashboard/w/${workspaces[0].slug}`);
        return;
      }
      window.dispatchEvent(new CustomEvent("mindmatrix:new-note"));
    }
    if (e.altKey && e.shiftKey && e.code === "KeyF") {
      e.preventDefault();
      if (pathname === "/dashboard" && workspaces.length > 0) {
        router.push(`/dashboard/w/${workspaces[0].slug}`);
        return;
      }
      window.dispatchEvent(new CustomEvent("mindmatrix:new-folder"));
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
        <div style={{ padding: "0.5rem", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          {workspaces.map((ws) => (
            <div key={ws.id}>
              <Link
                href={`/dashboard/w/${ws.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--border-radius)",
                  color: "var(--fg-muted)",
                  fontSize: "0.875rem",
                  fontWeight: pathname.includes(`/w/${ws.slug}`) ? 600 : 400,
                  backgroundColor: pathname.includes(`/w/${ws.slug}`) ? "rgba(255, 255, 255, 0.04)" : "transparent",
                }}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("mindmatrix:clear-filters"));
                }}
                onMouseEnter={(e) => {
                  if (!pathname.includes(`/w/${ws.slug}`)) {
                    e.currentTarget.style.backgroundColor = "var(--bg-tertiary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pathname.includes(`/w/${ws.slug}`)) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {(() => { const I = getIcon(ws.icon || "BookOpen"); return <I size={16} />; })()}
                <span className="truncate" style={{ flex: 1 }}>{ws.name}</span>
              </Link>

              {/* Nested Folders */}
              {showFolders && ws.folders && ws.folders.length > 0 && (
                <div style={{ paddingLeft: "1.75rem", marginTop: "0.15rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  {ws.folders.map((f: any) => {
                    const count = ws.notes?.filter((n) => n.folderId === f.id).length || 0;
                    return (
                      <div
                        key={f.id}
                        className="flex align-center gap-1 text-xs"
                        style={{ 
                          color: "var(--fg-muted)", 
                          padding: "0.25rem 0.5rem",
                          cursor: "pointer",
                          borderRadius: "var(--border-radius)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        onClick={() => {
                          router.push(`/dashboard/w/${ws.slug}?folderId=${f.id}`);
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent(`mindmatrix:filter-folder:${ws.slug}`, { detail: f.id }));
                          }, 50);
                        }}
                        title={f.name}
                      >
                        {(() => { const FI = getIcon(f.icon || "FolderPlus"); return <FI size={12} style={{ color: "var(--accent-yellow)", flexShrink: 0 }} />; })()}
                        <span className="truncate" style={{ flex: 1, maxWidth: "140px" }}>{f.name}</span>
                        <span style={{ fontSize: "0.7rem", opacity: 0.6, flexShrink: 0 }}>({count})</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Nested Tags */}
              {showTags && ws.tags && ws.tags.length > 0 && (
                <div style={{ paddingLeft: "1.75rem", marginTop: "0.15rem", display: "flex", flexDirection: "row", gap: "0.25rem", flexWrap: "wrap", paddingBottom: "0.25rem" }}>
                  {ws.tags.map((t: any) => (
                    <span
                      key={t.id}
                      className="badge"
                      style={{ 
                        backgroundColor: t.color, 
                        fontSize: "0.6rem", 
                        padding: "0.05rem 0.25rem",
                        cursor: "pointer",
                        maxWidth: "100px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        borderRadius: "3px"
                      }}
                      onClick={() => {
                        router.push(`/dashboard/w/${ws.slug}?tagId=${t.id}`);
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent(`mindmatrix:filter-tag:${ws.slug}`, { detail: t.id }));
                        }, 50);
                      }}
                      title={t.name}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
          {user?.role === "super_admin" && (
            <Link
              href="/dashboard/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 0.75rem",
                borderRadius: "var(--border-radius)",
                color: "var(--accent-green)",
                fontSize: "0.875rem",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <ShieldCheck size={16} />
              Admin Area
            </Link>
          )}

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--border-radius)",
              color: "var(--fg-muted)",
              fontSize: "0.875rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              marginTop: "0.25rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <LogOut size={16} />
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
              <BookOpen size={16} />
              </button>
            )}
            <button
              className="btn secondary sm"
              onClick={() => window.dispatchEvent(new CustomEvent("mindmatrix:search"))}
              style={{ opacity: 0.6, cursor: "pointer" }}
            >
              <Search size={16} style={{ marginRight: "0.5rem" }} />
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

          <div className="flex align-center gap-1">
            <button 
              className="btn ghost sm" 
              onClick={toggleTheme} 
              title={theme.endsWith("-dark") ? "Switch to light mode" : "Switch to dark mode"}
              style={{ padding: "0.25rem 0.5rem" }}
            >
              {theme.endsWith("-dark") ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link href="/dashboard/settings" className="btn ghost sm">
              <Settings size={16} />
            </Link>
          </div>
        </header>

        <div 
          className={pathname.includes("/notes/") ? "" : "container"} 
          style={{ 
            paddingLeft: pathname.includes("/notes/") ? "1.5rem" : undefined, 
            paddingRight: pathname.includes("/notes/") ? "1.5rem" : undefined, 
            paddingBottom: pathname.includes("/notes/") ? "1.5rem" : undefined, 
            paddingTop: "1.5rem" 
          }}
        >
          {children}
        </div>
      </main>
      <SearchOverlay />
    </div>
  );
}
