"use client";

import { useEffect, useRef } from "react";
import Prism from "prismjs";
import "prismjs/plugins/autoloader/prism-autoloader";

let initialized = false;

function initAutoloader() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  Prism.plugins.autoloader.languages_path =
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/";
}

export function usePrism(deps: unknown[] = []) {
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initAutoloader();
      initRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      Prism.highlightAll();
    }
  }, deps);
}
