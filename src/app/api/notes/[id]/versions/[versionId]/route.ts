import { NextResponse } from "next/server";
import { db, noteVersion, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const version = await db.query.noteVersion.findFirst({
    where: and(eq(noteVersion.id, versionId), eq(noteVersion.noteId, id)),
  });
  if (!version) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const noteRecord = await db.query.note.findFirst({
    where: eq(noteVersion.noteId, id),
    columns: { workspaceId: true },
  });
  if (!noteRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, noteRecord.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    version: {
      id: version.id,
      title: version.title,
      content: version.content,
      changeSummary: version.changeSummary,
      createdAt: version.createdAt,
    },
  });
}
