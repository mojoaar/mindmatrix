import { NextResponse } from "next/server";
import { db, webhook, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
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

  const hooks = await db.query.webhook.findMany({
    where: eq(webhook.workspaceId, workspaceId),
    orderBy: (wh, { desc }) => [desc(wh.createdAt)],
  });

  // Mask secrets
  const safeHooks = hooks.map((h) => ({
    ...h,
    secret: h.secret ? "••••••••" : null,
  }));

  return NextResponse.json({ webhooks: safeHooks });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: workspaceId } = await params;
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

  const { name, url, secret, events, active } = await request.json();
  if (!name || !url) {
    return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
  }

  const webhookId = crypto.randomUUID();
  const encryptedSecret = secret ? encrypt(secret) : null;

  await db.insert(webhook).values({
    id: webhookId,
    workspaceId,
    name,
    url,
    secret: encryptedSecret,
    events: events || [],
    active: active !== false,
  });

  return NextResponse.json({
    webhook: {
      id: webhookId,
      workspaceId,
      name,
      url,
      secret: secret ? "••••••••" : null,
      events: events || [],
      active: active !== false,
    },
  });
}
