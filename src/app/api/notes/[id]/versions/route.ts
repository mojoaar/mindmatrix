import { NextResponse } from "next/server";
import { db, note, noteVersion, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, found.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const versions = await db.query.noteVersion.findMany({
    where: eq(noteVersion.noteId, id),
    orderBy: [desc(noteVersion.createdAt)],
    limit: 50,
  });

  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      title: v.title,
      changeSummary: v.changeSummary,
      createdAt: v.createdAt,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, found.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });
  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { versionId } = await request.json();
  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  const version = await db.query.noteVersion.findFirst({
    where: and(eq(noteVersion.id, versionId), eq(noteVersion.noteId, id)),
  });
  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  await db.insert(noteVersion).values({
    id: crypto.randomUUID(),
    noteId: id,
    title: found.title,
    content: found.content,
    changeSummary: "Restored from version " + versionId.slice(0, 8),
    createdById: session.user.id,
  });

  await db
    .update(note)
    .set({
      title: version.title,
      content: version.content,
      updatedById: session.user.id,
    })
    .where(eq(note.id, id));

  await logAction(session.user.id, "NOTE_VERSION_RESTORED", `Restored note "${found.title}" to version ${versionId.slice(0, 8)}`, request);

  return NextResponse.json({ restored: true });
}
