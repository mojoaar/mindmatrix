import { db } from "@/lib/db";
import { note } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";
import { DocsPrismHighlight } from "@/components/ui/docs-prism-highlight";
import { PublicShareContent } from "@/components/ui/public-share-content";
import { Globe, BookOpen } from "lucide-react";

const rehypeSanitizeOptions = { ...defaultSchema };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const found = await db.query.note.findFirst({
    where: eq(note.id, id),
  });

  if (!found || !found.isPublic) {
    return {
      title: "Document Not Found",
    };
  }

  const snippet = found.content ? found.content.substring(0, 150) + "..." : "Shared document on MindMatrix";

  return {
    title: found.title,
    description: snippet,
    openGraph: {
      title: `${found.title} | MindMatrix`,
      description: snippet,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: found.title,
      description: snippet,
    },
  };
}

export default async function PublicSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const found = await db.query.note.findFirst({
    where: eq(note.id, id),
    with: {
      creator: true,
    },
  });

  if (!found || !found.isPublic) {
    notFound();
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--fg-primary)", fontFamily: "var(--font-sans)" }}>
      {/* Public Top Bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 2rem",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: "600", color: "var(--fg-secondary)" }}>
          <BookOpen size={18} style={{ color: "var(--accent-indigo)" }} />
          <span>MindMatrix</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--accent-green)", fontWeight: 600 }}>
          <Globe size={14} className="spin" />
          <span>Public Document</span>
        </div>
      </header>

      {/* Reading container */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--fg-secondary)", border: "none", padding: 0 }}>
          {found.title}
        </h1>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--fg-muted)", marginBottom: "2rem" }}>
          <span>Published by {found.creator.name}</span>
          <span>·</span>
          <span>Updated {new Date(found.updatedAt).toLocaleDateString()}</span>
        </div>

        <div className="markdown-body" style={{ lineHeight: 1.7, fontSize: "1rem" }}>
          <PublicShareContent content={found.content || ""} noteId={found.id}>
          <DocsPrismHighlight>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, rehypeSanitizeOptions]]}>
              {found.content || "*Empty note*"}
            </ReactMarkdown>
          </DocsPrismHighlight>
          </PublicShareContent>
        </div>
      </div>
    </div>
  );
}
