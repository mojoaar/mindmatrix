"use client";

import { useEffect, useRef, useCallback } from "react";

let initialized = false;

async function initMermaid() {
  if (initialized) return;
  try {
    const mermaid = (await import("mermaid")).default;
    mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
    initialized = true;
  } catch {}
}

export function useMermaid(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  const render = useCallback(async () => {
    if (!containerRef.current) return;
    await initMermaid();

    const blocks = containerRef.current.querySelectorAll<HTMLElement>("pre code.language-mermaid");
    for (const block of blocks) {
      try {
        const pre = block.parentElement;
        if (!pre || pre.dataset.mermaidRendered) continue;

        const mermaid = (await import("mermaid")).default;
        const { svg } = await mermaid.render(`mermaid-${Math.random().toString(36).slice(2)}`, block.textContent || "");
        const container = document.createElement("div");
        container.className = "mermaid-container";
        container.innerHTML = svg;
        pre.replaceWith(container);
        pre.dataset.mermaidRendered = "true";
      } catch {
        block.textContent = `[Mermaid error]\n${block.textContent}`;
      }
    }
  }, []);

  useEffect(() => {
    render();
  }, deps);

  return containerRef;
}
