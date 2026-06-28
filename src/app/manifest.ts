import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MindMatrix Knowledge Hub",
    short_name: "MindMatrix",
    description: "Markdown-first, self-hosted, multi-user knowledge hub for teams and thinkers.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#2e3440",
    theme_color: "#2e3440",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
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
    categories: ["productivity", "utilities"],
    prefer_related_applications: false,
  };
}
