import { NextResponse } from "next/server";
import { db, webhook, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const { id: workspaceId, webhookId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existingHook = await db.query.webhook.findFirst({
    where: and(eq(webhook.id, webhookId), eq(webhook.workspaceId, workspaceId)),
  });

  if (!existingHook) {
    return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
  }

  const { name, url, secret, events, active } = await request.json();

  const updateData: Partial<typeof webhook.$inferInsert> = {};
  if (name !== undefined) updateData.name = name;
  if (url !== undefined) updateData.url = url;
  if (events !== undefined) updateData.events = events;
  if (active !== undefined) updateData.active = active;

  if (secret !== undefined) {
    if (secret === "••••••••") {
      // Do nothing, leave existing encrypted secret untouched
    } else if (secret === "" || secret === null) {
      updateData.secret = null;
    } else {
      updateData.secret = encrypt(secret);
    }
  }

  await db.update(webhook).set(updateData).where(eq(webhook.id, webhookId));

  const updatedHook = await db.query.webhook.findFirst({
    where: eq(webhook.id, webhookId),
  });

  return NextResponse.json({
    webhook: {
      ...updatedHook,
      secret: updatedHook?.secret ? "••••••••" : null,
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; webhookId: string }> }
) {
  const { id: workspaceId, webhookId } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(webhook).where(and(eq(webhook.id, webhookId), eq(webhook.workspaceId, workspaceId)));

  return NextResponse.json({ success: true });
}
