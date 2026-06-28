import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-helper";
import { eq, and, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const since = searchParams.get("since");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, workspaceId),
      eq(workspaceMember.userId, user.id),
    ),
    columns: { role: true },
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const conditions = [eq(note.workspaceId, workspaceId)];
    if (since) {
      conditions.push(gte(note.updatedAt, new Date(since)));
    }

    const notes = await db.query.note.findMany({
      where: and(...conditions),
      columns: {
        id: true,
        title: true,
        slug: true,
        content: true,
        folderId: true,
        updatedAt: true,
        isPublic: true,
      },
      orderBy: (n, { asc }) => [asc(n.updatedAt)],
    });

    return NextResponse.json({
      notes: notes.map((n) => ({ ...n, isDeleted: false })),
      cursor: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Delta sync failed", { workspaceId, error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
