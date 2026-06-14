import { NextResponse } from "next/server";
import { db, workspace, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { toSlug } from "@/lib/slug";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ws = await db.query.workspace.findFirst({
    where: eq(workspace.id, id),
    with: { members: { with: { user: true } }, folders: true, tags: true },
  });

  if (!ws) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const membership = ws.members.find((m) => m.userId === session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ workspace: ws });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, id),
      eq(workspaceMember.userId, session.user.id),
      eq(workspaceMember.role, "owner")
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description, icon } = await request.json();
  const update: Record<string, unknown> = {};
  if (name && typeof name === "string") {
    update.name = name;
    const slug = toSlug(name);
    const existing = await db.query.workspace.findFirst({
      where: and(eq(workspace.slug, slug), ne(workspace.id, id)),
    });
    update.slug = existing ? `${slug}-${crypto.randomUUID().split("-")[0]}` : slug;
  }
  if (description !== undefined) update.description = description;
  if (icon !== undefined) update.icon = icon;

  const [updated] = await db.update(workspace).set(update).where(eq(workspace.id, id)).returning();

  return NextResponse.json({ workspace: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, id),
      eq(workspaceMember.userId, session.user.id),
      eq(workspaceMember.role, "owner")
    ),
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(workspace).where(eq(workspace.id, id));

  return NextResponse.json({ success: true });
}
