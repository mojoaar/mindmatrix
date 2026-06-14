import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Complete REST API reference for integrating and automating MindMatrix.",
};

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}