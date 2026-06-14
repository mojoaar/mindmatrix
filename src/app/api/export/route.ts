import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const format = searchParams.get("format") || "zip";

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notes = await db.query.note.findMany({
    where: eq(note.workspaceId, workspaceId),
    orderBy: (n) => [n.title],
  });

  if (format === "json") {
    return NextResponse.json({ notes });
  }

  // Return as newline-separated markdown with frontmatter
  const md = notes
    .map(
      (n) =>
        `---\ntitle: ${n.title}\nslug: ${n.slug}\ncreated: ${n.createdAt}\nupdated: ${n.updatedAt}\n---\n\n${n.content}`
    )
    .join("\n\n---\n\n");

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": 'attachment; filename="export.md"',
    },
  });
}
