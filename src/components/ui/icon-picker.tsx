"use client";

import { useState } from "react";
import { ICONS, ICON_LIST, getIcon } from "@/lib/icons";
import { Search } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search.trim()
    ? ICON_LIST.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : ICON_LIST;

  const IconComponent = getIcon(value);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn secondary flex align-center gap-1"
        onClick={() => setOpen(!open)}
      >
        <IconComponent size={16} />
        {value}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 20,
            width: "320px",
            maxHeight: "360px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "0.5rem",
            marginTop: "4px",
          }}
        >
          <div style={{ position: "relative", marginBottom: "0.5rem" }}>
            <Search size={14} style={{ position: "absolute", left: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)" }} />
            <input
              type="text"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{ paddingLeft: "2rem", width: "100%", fontSize: "0.75rem" }}
            />
          </div>
          <div
            style={{
              overflow: "auto",
              flex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: "4px",
            }}
          >
            {filtered.slice(0, 200).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                  setSearch("");
                }}
                title={name}
                style={{
                  padding: "6px",
                  borderRadius: "var(--border-radius)",
                  border: name === value ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                  backgroundColor: name === value ? "var(--bg-tertiary)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
              {(() => {
                const I = ICONS[name];
                return I ? <I size={16} style={{ color: "var(--fg-primary)" }} /> : null;
              })()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
