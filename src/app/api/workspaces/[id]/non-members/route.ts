import { NextResponse } from "next/server";
import { db, workspaceMember, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, notInArray, sql } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actingMember = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, id),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!actingMember || (actingMember.role !== "owner" && actingMember.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const memberIds = await db
    .select({ userId: workspaceMember.userId })
    .from(workspaceMember)
    .where(eq(workspaceMember.workspaceId, id));

  const memberIdList = memberIds.map((m) => m.userId);

  const nonMembers = await db.query.user.findMany({
    columns: {
      id: true,
      name: true,
      email: true,
    },
    where: memberIdList.length > 0
      ? notInArray(user.id, memberIdList)
      : undefined,
    orderBy: (u, { asc }) => [asc(u.name)],
  });

  return NextResponse.json({ users: nonMembers });
}
