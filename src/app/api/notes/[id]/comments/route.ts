import { NextResponse } from "next/server";
import { db, note, noteComment, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { getEventBus } from "@/lib/realtime/event-bus";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;

  const found = await db.query.note.findFirst({
    where: eq(note.id, noteId),
    columns: { id: true, workspaceId: true, isPublic: true },
  });

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (found.isPublic) {
    const comments = await db.query.noteComment.findMany({
      where: eq(noteComment.noteId, noteId),
      with: { user: { columns: { id: true, name: true, image: true } } },
      orderBy: [asc(noteComment.createdAt)],
    });
    return NextResponse.json({ comments });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comments = await db.query.noteComment.findMany({
    where: eq(noteComment.noteId, noteId),
    with: { user: { columns: { id: true, name: true, image: true } } },
    orderBy: [asc(noteComment.createdAt)],
  });

  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: noteId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, noteId) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { body, parentId } = await request.json();
  if (!body || typeof body !== "string" || !body.trim()) {
    return NextResponse.json({ error: "Comment body required" }, { status: 400 });
  }

  const commentId = crypto.randomUUID();

  try {
    const eventBus = getEventBus();
    eventBus.notify(`note:${noteId}`, {
      type: "comment_added",
      comment: { id: commentId, noteId, userId: session.user.id, parentId: parentId || null, body: body.trim() },
    });
  } catch {}

  const [comment] = await db
    .insert(noteComment)
    .values({ id: commentId, noteId, userId: session.user.id, parentId: parentId || null, body: body.trim() })
    .returning();

  const withUser = await db.query.noteComment.findFirst({
    where: eq(noteComment.id, comment.id),
    with: { user: { columns: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({ comment: withUser }, { status: 201 });
}
