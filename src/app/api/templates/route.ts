import { NextResponse } from "next/server";
import { db, noteTemplate, workspaceMember } from "@/lib/db";
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
    where: and(
      eq(workspaceMember.workspaceId, workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const templates = await db.query.noteTemplate.findMany({
    where: eq(noteTemplate.workspaceId, workspaceId),
    orderBy: (t) => [t.name],
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, name, content } = await request.json();
  if (!name || !workspaceId) {
    return NextResponse.json(
      { error: "Name and workspaceId are required" },
      { status: 400 }
    );
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [tmpl] = await db
    .insert(noteTemplate)
    .values({
      id: crypto.randomUUID(),
      workspaceId,
      name,
      content: content || "",
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ template: tmpl }, { status: 201 });
}
