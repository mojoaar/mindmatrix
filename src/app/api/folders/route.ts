import { NextResponse } from "next/server";
import { db, folder, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const parentId = searchParams.get("parentId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const folders = await db.query.folder.findMany({
    where: parentId
      ? and(eq(folder.workspaceId, workspaceId), eq(folder.parentId, parentId))
      : and(eq(folder.workspaceId, workspaceId), isNull(folder.parentId)),
    orderBy: (f) => [f.position],
    with: {
      children: true,
      notes: { columns: { id: true } },
    },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, parentId, name } = await request.json();
  if (!name || !workspaceId) {
    return NextResponse.json({ error: "Name and workspaceId are required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = crypto.randomUUID();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const [newFolder] = await db
    .insert(folder)
    .values({
      id,
      workspaceId,
      parentId: parentId || null,
      name,
      slug,
      createdById: session.user.id,
      position: 0,
    })
    .returning();

  return NextResponse.json({ folder: newFolder }, { status: 201 });
}
