"use client";

import { useTheme, type Theme } from "./theme-provider";
import { Sun, Moon, Palette } from "lucide-react";

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "nord-dark", label: "Nord Dark", icon: <Moon size={14} /> },
  { value: "nord-light", label: "Nord Light", icon: <Sun size={14} /> },
  { value: "dracula-dark", label: "Dracula Dark", icon: <Moon size={14} /> },
  { value: "dracula-light", label: "Dracula Light", icon: <Sun size={14} /> },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const idx = themes.findIndex((t) => t.value === theme);
    const next = themes[(idx + 1) % themes.length];
    setTheme(next.value);
  };

  const current = themes.find((t) => t.value === theme);

  return (
    <button className="btn ghost sm flex align-center gap-1" onClick={cycle} title={`Theme: ${current?.label}`} aria-label="Toggle theme">
      <Palette size={14} />
      <span className="text-xs">{current?.label}</span>
    </button>
  );
}
