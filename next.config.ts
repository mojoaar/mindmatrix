import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "node:child_process/promises"],
};

export default nextConfig;
