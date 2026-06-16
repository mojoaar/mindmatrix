"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Globe,
  GitBranch,
  ShieldAlert,
  Zap,
  Layout,
  History,
  Terminal,
  Sun,
  Moon,
  ArrowRight,
} from "lucide-react";

const VALID_THEMES = [
  "nord-dark", "nord-light",
  "dracula-dark", "dracula-light",
  "github-dark", "github-light",
  "catppuccin-dark", "catppuccin-light",
  "cyberpunk-dark", "cyberpunk-light",
  "one-dark", "one-light",
];

export function LandingClient() {
  const [theme, setTheme] = useState("dracula-dark");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("mindmatrix-theme");
      if (savedTheme && VALID_THEMES.includes(savedTheme)) {
        setTheme(savedTheme);
      } else {
        // Default landing page theme to dracula-dark if none is saved
        localStorage.setItem("mindmatrix-theme", "dracula-dark");
        document.documentElement.setAttribute("data-theme", "dracula-dark");
        setTheme("dracula-dark");
      }
    } catch {
      // localStorage fallback
    }
  }, []);

  const toggleTheme = () => {
    let nextTheme = "dracula-dark";
    if (theme.endsWith("-dark")) {
      nextTheme = theme.replace("-dark", "-light");
    } else if (theme.endsWith("-light")) {
      nextTheme = theme.replace("-light", "-dark");
    }
    setTheme(nextTheme);
    try {
      localStorage.setItem("mindmatrix-theme", nextTheme);
    } catch {}
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" style={{ borderRadius: "5px" }}>
            <defs>
              <linearGradient id="ribbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bf616a" />
                <stop offset="100%" stopColor="#b48ead" />
              </linearGradient>
              <linearGradient id="ribbon2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#88c0d0" />
                <stop offset="100%" stopColor="#5e81ac" />
              </linearGradient>
              <linearGradient id="ribbon3" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a3be8c" />
                <stop offset="100%" stopColor="#ebcb8b" />
              </linearGradient>
              <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="2" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
              </filter>
            </defs>
            <rect width="512" height="512" rx="112" fill="#2e3440" />
            <g filter="url(#subtle-shadow)">
              <path d="M 100,380 L 160,150 L 220,150 L 160,380 Z" fill="url(#ribbon1)" />
              <path d="M 160,150 L 256,280 L 290,260 L 220,150 Z" fill="url(#ribbon2)" opacity="0.95" />
              <path d="M 256,280 L 352,150 L 392,165 L 290,260 Z" fill="url(#ribbon3)" opacity="0.9" />
              <path d="M 352,150 L 412,380 L 352,380 L 306,210 Z" fill="url(#ribbon1)" opacity="0.85" />
              <path d="M 160,380 L 256,310 L 352,380 L 256,340 Z" fill="url(#ribbon2)" style={{ mixBlendMode: "overlay" }} />
            </g>
          </svg>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--fg-secondary)", letterSpacing: "-0.03em" }}>
            MindMatrix
          </span>
        </div>

        <nav className="landing-nav-links">
          <Link href="/docs">Docs</Link>
          <Link href="/apidocs">API</Link>
          <button
            onClick={toggleTheme}
            className="btn ghost sm"
            style={{ padding: "0.5rem", borderRadius: "50%" }}
            title="Toggle Dracula Light/Dark"
          >
            {theme === "dracula-dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/login" className="btn secondary sm">
            Sign In
          </Link>
          <Link href="/register" className="btn primary sm">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero presentation area */}
      <section className="landing-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 1rem", borderRadius: "100px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-purple)", textTransform: "uppercase", letterSpacing: "0.05em" }}>v0.3.0 is live</span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border-color)" }}></span>
          <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Fully Self-Hosted & Secure</span>
        </div>
        <h1>The Markdown-First, Realtime Collaborative Knowledge Hub</h1>
        <p>
          A self-hosted, multi-user workspace for teams and thinkers who want structure, speed, and absolute data ownership. Notes are compiled as clean plain text, synchronized via offline-capable Y.js, and fortified with secure integrations.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
          <Link href="/register" className="btn primary" style={{ padding: "0.75rem 1.75rem", fontSize: "1rem", gap: "0.5rem" }}>
            Get Started Free <ArrowRight size={18} />
          </Link>
          <a href="#deploy" className="btn secondary" style={{ padding: "0.75rem 1.75rem", fontSize: "1rem" }}>
            Self-Host Now
          </a>
        </div>
      </section>

      {/* Interactive Mockup */}
      <div className="landing-mockup-wrapper">
        <div className="landing-mockup">
          <div className="landing-mockup-header">
            <div className="landing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
              ~/dashboard/w/marketing/notes/campaign-strategy
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-green)" }}></span>
              <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Collab Active</span>
            </div>
          </div>

          <div style={{ display: "flex", height: "380px" }}>
            {/* Mock Sidebar */}
            <div style={{ width: "220px", borderRight: "1px solid var(--border-color)", padding: "1rem", backgroundColor: "rgba(var(--bg-tertiary), 0.5)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "0.5rem" }}>Folders</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.85rem" }}>
                  <div style={{ color: "var(--accent-cyan)" }}>📁 Campaigns</div>
                  <div style={{ paddingLeft: "0.75rem", color: "var(--fg-muted)" }}>📄 Q3 Planning</div>
                  <div style={{ paddingLeft: "0.75rem", color: "var(--accent-orange)", fontWeight: 600 }}>📄 Strategy</div>
                  <div style={{ color: "var(--fg-muted)" }}>📁 Archive</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "var(--fg-muted)", marginBottom: "0.5rem" }}>Tags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  <span className="badge" style={{ backgroundColor: "rgba(180, 142, 173, 0.2)", color: "var(--accent-purple)", fontSize: "0.7rem" }}>#active</span>
                  <span className="badge" style={{ backgroundColor: "rgba(163, 190, 140, 0.2)", color: "var(--accent-green)", fontSize: "0.7rem" }}>#q3</span>
                </div>
              </div>
            </div>

            {/* Mock Editor */}
            <div style={{ flex: 1, padding: "1.5rem", overflow: "hidden", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--fg-secondary)" }}>
                  Campaign Strategy
                </div>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--accent-cyan)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "white", fontWeight: "700" }}>JM</span>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "var(--accent-purple)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "white", fontWeight: "700" }}>AN</span>
                </div>
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--fg-primary)", lineHeight: 1.6, flex: 1 }}>
                <p><span style={{ color: "var(--accent-cyan)" }}># Product Launch Strategy</span></p>
                <p style={{ marginTop: "0.5rem" }}>This campaign focuses on the v0.2 roll-out of <span style={{ color: "var(--accent-purple)" }}>[[marketing-blast]]</span>.</p>
                <p style={{ marginTop: "0.5rem" }}>Key Milestones:</p>
                <p>- [x] Sync cloud backup structures to Google Drive & pCloud.</p>
                <p>- [ ] Dispatch webhook triggers on launch updates <span style={{ backgroundColor: "rgba(235, 203, 139, 0.15)", color: "var(--accent-yellow)", padding: "0.125rem 0.25rem", borderRadius: "3px" }}>| user typing...</span></p>
                <p>- [ ] Scan cluster health indicators via Proxmox endpoints.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <section className="landing-features-section">
        <h2>Engineered with Premium Features</h2>
        <div className="landing-features-grid">
          {/* Card 1 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <Zap size={24} />
            </div>
            <h3>Conflict-Free Realtime Collab</h3>
            <p>
              Simultaneous, multi-user co-authoring powered by Y.js CRDT algorithms and lightweight Server-Sent Events (SSE). No socket overlays or third-party cloud licensing required.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">Y.js CRDT</span>
              <span className="badge">SSE Streams</span>
              <span className="badge">PG Pub/Sub</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <History size={24} />
            </div>
            <h3>Wiki Backlinks & Snapshots</h3>
            <p>
              Establish clean linkages between notes using standard <code>[[wiki-style]]</code> syntax. Browse incoming and outgoing connection grids while taking incremental database snapshot rollbacks.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">Backlinks Panel</span>
              <span className="badge">Versions history</span>
              <span className="badge">YAML Metadata</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <GitBranch size={24} />
            </div>
            <h3>Gated Plugin Marketplace</h3>
            <p>
              Extend workspaces dynamically with secure integrations for Git-Sync repositories, OpenCode Zen LLMs, Proxmox clustering scanners, or Unifi controller topology mappings.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">AES-256-GCM</span>
              <span className="badge">Git Pull/Push</span>
              <span className="badge">Proxmox scan</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <Layout size={24} />
            </div>
            <h3>Pro Markdown Editor</h3>
            <p>
              CodeMirror 6 core featuring split-view preview blocks, multi-language highlight bindings (297 languages), immediate table builders, and drag-and-drop file uploads.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">CodeMirror 6</span>
              <span className="badge">PrismJS</span>
              <span className="badge">Drag &amp; Drop</span>
            </div>
          </div>

          {/* Card 5 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <ShieldAlert size={24} />
            </div>
            <h3>Multi-Tenant Security</h3>
            <p>
              Robust workspace role guards (Owner, Admin, Member, Viewer). Outgoing webhooks are fortified with SSRF subnet blocks, payload hashing, and rate-limiting limits.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">SSRF Blocker</span>
              <span className="badge">HMAC Signatures</span>
              <span className="badge">Rate Limiting</span>
            </div>
          </div>

          {/* Card 6 */}
          <div className="landing-feature-card">
            <div className="icon-wrapper">
              <Globe size={24} />
            </div>
            <h3>Super Admin Control Panel</h3>
            <p>
              Secure gated console mapping all system-wide statistics, audit trails tracing all CRUD actions, dynamic user validations, and workspace force-deletion management.
            </p>
            <div className="landing-tags-wrapper">
              <span className="badge">Gated Console</span>
              <span className="badge">Audit Trail</span>
              <span className="badge">IP Mapping</span>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal showcase block */}
      <section className="landing-terminal-section" id="deploy">
        <h2 style={{ color: "var(--fg-secondary)" }}>Deploy on Your Terms in 30 Seconds</h2>
        <p className="text-muted" style={{ maxWidth: "600px", margin: "0 auto 1.5rem" }}>
          Deploy your personal instance on your local machine, homelab cluster, or cloud server.
        </p>

        <div className="landing-terminal-container">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", backgroundColor: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--accent-red)" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--accent-orange)" }}></span>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--accent-green)" }}></span>
            <span style={{ marginLeft: "0.5rem", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--fg-muted)" }}>setup.sh</span>
          </div>
          <div style={{ padding: "1.5rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem", lineHeight: 1.6, overflowX: "auto" }}>
            <p><span style={{ color: "var(--accent-cyan)" }}># Clone the repository</span></p>
            <p><span style={{ color: "var(--accent-purple)" }}>git clone</span> git@github.com:mojoaar/mindmatrix.git</p>
            <p style={{ marginTop: "0.5rem" }}><span style={{ color: "var(--accent-cyan)" }}># Generate secure session encryption key</span></p>
            <p>openssl rand -base64 48</p>
            <p style={{ marginTop: "0.5rem" }}><span style={{ color: "var(--accent-cyan)" }}># Boot the stack on Port 5434</span></p>
            <p>docker compose -f deploy/docker-compose.yml up -d</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p style={{ marginBottom: "0.5rem" }}>
          MindMatrix is licensed under the <strong>AGPL-3.0</strong> License. Free, secure, and open-source.
        </p>
        <p className="text-muted" style={{ fontSize: "0.8rem" }}>
          © {new Date().getFullYear()} MindMatrix. Built by <a href="https://github.com/mojoaar" target="_blank" rel="noopener">mojoaar</a>.
        </p>
      </footer>
    </div>
  );
}