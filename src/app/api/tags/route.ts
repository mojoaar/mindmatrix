import { NextResponse } from "next/server";
import { db, tag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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

  const { workspaceId, name, color } = await request.json();
  if (!name || !workspaceId) {
    return NextResponse.json({ error: "Name and workspaceId are required" }, { status: 400 });
  }

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

  return NextResponse.json({ tag: newTag }, { status: 201 });
}
