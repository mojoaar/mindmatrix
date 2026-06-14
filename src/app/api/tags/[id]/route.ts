import { NextResponse } from "next/server";
import { db, tag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.tag.findFirst({ where: eq(tag.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, color } = await request.json();
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (color !== undefined) update.color = color;

  const [updated] = await db.update(tag).set(update).where(eq(tag.id, id)).returning();

  await logAction(
    session.user.id,
    "TAG_UPDATE",
    `Updated tag "${found.name}" (${id})`,
    request
  );

  return NextResponse.json({ tag: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.tag.findFirst({ where: eq(tag.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logAction(
    session.user.id,
    "TAG_DELETE",
    `Deleted tag "${found.name}" (${id})`,
    request
  );

  await db.delete(tag).where(eq(tag.id, id));
  return NextResponse.json({ success: true });
}
