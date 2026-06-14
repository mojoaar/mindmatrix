import { NextResponse } from "next/server";
import { db, workspaceMember, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, id), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await db.query.workspaceMember.findMany({
    where: eq(workspaceMember.workspaceId, id),
    with: { user: true },
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actingMember = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, id), eq(workspaceMember.userId, session.user.id)),
  });

  if (!actingMember || (actingMember.role !== "owner" && actingMember.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role } = await request.json();

  const targetUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [member] = await db
    .insert(workspaceMember)
    .values({
      id: crypto.randomUUID(),
      workspaceId: id,
      userId: targetUser.id,
      role: role || "member",
    })
    .returning();

  return NextResponse.json({ member }, { status: 201 });
}
