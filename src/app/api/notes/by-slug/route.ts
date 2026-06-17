import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const slug = searchParams.get("slug");

  if (!workspaceId || !slug) {
    return NextResponse.json({ error: "workspaceId and slug required" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });

  const found = await db.query.note.findFirst({
    where: and(eq(note.workspaceId, workspaceId), eq(note.slug, slug)),
    columns: { id: true, title: true, slug: true, content: true, workspaceId: true, isPublic: true },
  });

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (found.isPublic) {
    return NextResponse.json({ note: { title: found.title, slug: found.slug, content: found.content } });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ note: { title: found.title, slug: found.slug, content: found.content } });
}
