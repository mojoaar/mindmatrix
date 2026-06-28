"use client";

import { useEffect, useRef, useCallback } from "react";

let initialized = false;

async function loadMermaid(): Promise<void> {
  if (initialized) return;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
    script.onload = () => {
      (window as any).mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
      initialized = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export function useMermaid(deps: unknown[]) {
  const containerRef = useRef<HTMLDivElement>(null);

  const render = useCallback(async () => {
    if (!containerRef.current) return;
    await loadMermaid();

    const blocks = containerRef.current.querySelectorAll<HTMLElement>("pre code.language-mermaid");
    for (const block of blocks) {
      try {
        const pre = block.parentElement;
        if (!pre) continue;
        const text = block.textContent || "";
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;

        const mermaid = (window as any).mermaid;
        const { svg } = await mermaid.render(id, text);
        const container = document.createElement("div");
        container.className = "mermaid-container";
        container.innerHTML = svg;
        pre.replaceWith(container);
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
