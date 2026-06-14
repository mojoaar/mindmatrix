import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindMatrix Knowledge Hub",
    short_name: "MindMatrix",
    description: "Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.",
    start_url: "/",
    display: "standalone",
    background_color: "#2e3440",
    theme_color: "#5e81ac",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}