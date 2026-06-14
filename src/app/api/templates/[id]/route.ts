import { NextResponse } from "next/server";
import { db, noteTemplate, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tmpl = await db.query.noteTemplate.findFirst({
    where: eq(noteTemplate.id, id),
  });

  if (!tmpl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, tmpl.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ template: tmpl });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tmpl = await db.query.noteTemplate.findFirst({
    where: eq(noteTemplate.id, id),
  });

  if (!tmpl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, tmpl.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, content } = await request.json();
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (content !== undefined) update.content = content;

  const [updated] = await db
    .update(noteTemplate)
    .set(update)
    .where(eq(noteTemplate.id, id))
    .returning();

  return NextResponse.json({ template: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tmpl = await db.query.noteTemplate.findFirst({
    where: eq(noteTemplate.id, id),
  });

  if (!tmpl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, tmpl.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(noteTemplate).where(eq(noteTemplate.id, id));
  return NextResponse.json({ success: true });
}
