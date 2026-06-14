import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { workspace, workspaceMember } from "@/lib/db";
import { inArray } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db.query.workspaceMember.findMany({
    where: (wm, { eq }) => eq(wm.userId, session.user!.id),
    columns: { workspaceId: true },
  });

  const workspaceIds = memberships.map((m) => m.workspaceId);

  if (workspaceIds.length === 0) {
    return NextResponse.json({ workspaces: [] });
  }

  const workspaces = await db.query.workspace.findMany({
    where: inArray(workspace.id, workspaceIds),
    with: {
      members: true,
    },
    orderBy: (ws, { desc }) => [desc(ws.createdAt)],
  });

  return NextResponse.json({ workspaces });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description } = await request.json();
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const [ws] = await db
    .insert(workspace)
    .values({
      id,
      name,
      slug,
      description: description || null,
      createdById: session.user.id,
    })
    .returning();

  await db.insert(workspaceMember).values({
    id: crypto.randomUUID(),
    workspaceId: id,
    userId: session.user.id,
    role: "owner",
  });

  return NextResponse.json({ workspace: ws }, { status: 201 });
}
