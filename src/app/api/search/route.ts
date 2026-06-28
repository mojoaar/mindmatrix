import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`search:${ip}`, 60, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const workspaceId = searchParams.get("workspaceId");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ notes: [] });
  }

  if (workspaceId) {
    const member = await db.query.workspaceMember.findFirst({
      where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const userWorkspaces = await db.query.workspaceMember.findMany({
      where: eq(workspaceMember.userId, session.user.id),
      columns: { workspaceId: true },
    });

    const workspaceIds = userWorkspaces.map((m) => m.workspaceId);

    const notes = await db.query.note.findMany({
      where: and(
        or(ilike(note.title, `%${q}%`), ilike(note.content, `%${q}%`)),
        workspaceIds.length > 0 ? inArray(note.workspaceId, workspaceIds) : undefined,
      ),
      with: {
        workspace: { columns: { name: true, slug: true } },
        folder: { columns: { name: true } },
      },
      limit: 20,
    });

    return NextResponse.json({
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        slug: n.slug,
        workspaceId: n.workspaceId,
        workspaceName: n.workspace?.name,
        workspaceSlug: n.workspace?.slug,
        folderName: n.folder?.name,
        snippet: n.content.slice(0, 150),
        updatedAt: n.updatedAt,
      })),
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
