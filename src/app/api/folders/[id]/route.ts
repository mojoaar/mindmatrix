import { NextResponse } from "next/server";
import { db, folder, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.folder.findFirst({ where: eq(folder.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, parentId } = await request.json();
  const update: Record<string, unknown> = {};
  if (name !== undefined) {
    update.name = name;
    update.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (parentId !== undefined) update.parentId = parentId || null;

  const [updated] = await db.update(folder).set(update).where(eq(folder.id, id)).returning();

  await logAction(
    session.user.id,
    "FOLDER_UPDATE",
    `Updated folder "${found.name}" (${id})`,
    request
  );

  return NextResponse.json({ folder: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.folder.findFirst({ where: eq(folder.id, id) });
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
    "FOLDER_DELETE",
    `Deleted folder "${found.name}" (${id})`,
    request
  );

  await db.delete(folder).where(eq(folder.id, id));
  return NextResponse.json({ success: true });
}
