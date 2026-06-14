import { NextResponse } from "next/server";
import { db, note, noteTag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({
    where: eq(note.id, id),
    with: {
      noteTags: { with: { tag: true } },
      creator: true,
      updater: true,
      folder: true,
    },
  });

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ note: found });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, folderId, tagIds } = await request.json();
  const update: Record<string, unknown> = { updatedById: session.user.id };
  if (title !== undefined) {
    update.title = title;
    update.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (content !== undefined) update.content = content;
  if (folderId !== undefined) update.folderId = folderId || null;

  await db.update(note).set(update).where(eq(note.id, id));

  if (tagIds !== undefined) {
    await db.delete(noteTag).where(eq(noteTag.noteId, id));
    if (tagIds.length > 0) {
      await db.insert(noteTag).values(tagIds.map((tagId: string) => ({ noteId: id, tagId })));
    }
  }

  const updated = await db.query.note.findFirst({
    where: eq(note.id, id),
    with: { noteTags: { with: { tag: true } }, creator: true, updater: true, folder: true },
  });

  return NextResponse.json({ note: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(note).where(eq(note.id, id));
  return NextResponse.json({ success: true });
}
