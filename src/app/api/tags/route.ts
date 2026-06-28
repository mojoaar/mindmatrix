import { NextResponse } from "next/server";
import { db, tag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { createTagSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tags = await db.query.tag.findMany({
    where: eq(tag.workspaceId, workspaceId),
    orderBy: (t) => [t.name],
  });

  return NextResponse.json({ tags });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`tags:${ip}`, 20, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workspaceId, name, color } = parsed.data;

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [newTag] = await db
    .insert(tag)
    .values({
      id: crypto.randomUUID(),
      workspaceId,
      name,
      color: color || "#88c0d0",
      createdById: session.user.id,
    })
    .returning();

  await logAction(
    session.user.id,
    "TAG_CREATE",
    `Created tag "${name}" (${newTag.id}) in workspace ${workspaceId}`,
    request
  );

  await triggerWebhooks(
    workspaceId,
    "tag.created",
    {
      id: newTag.id,
      name: newTag.name,
      color: newTag.color,
    },
    { id: session.user.id, name: session.user.name, email: session.user.email }
  );

  return NextResponse.json({ tag: newTag }, { status: 201 });
}
