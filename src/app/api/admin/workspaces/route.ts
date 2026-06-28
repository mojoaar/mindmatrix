import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, note } from "@/lib/db";
import { eq, count } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const workspaces = await db.query.workspace.findMany({
      with: {
        owner: {
          columns: { id: true, name: true, email: true },
        },
        members: {
          with: {
            user: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: (ws, { asc }) => [asc(ws.name)],
    });

    const result = await Promise.all(
      workspaces.map(async (ws) => {
        const [noteCount] = await db
          .select({ value: count() })
          .from(note)
          .where(eq(note.workspaceId, ws.id));

        return {
          ...ws,
          noteCount: noteCount.value,
        };
      })
    );

    return NextResponse.json({ workspaces: result });
  } catch (error) {
    console.error("GET /api/admin/workspaces error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
