import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { workspace, workspaceMember } from "@/lib/db";
import { inArray, eq } from "drizzle-orm";
import { toSlug, ensureUniqueSlug } from "@/lib/slug";
import { logAction } from "@/lib/audit";
import { createWorkspaceSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
        folders: true,
        tags: true,
        notes: {
          columns: {
            id: true,
            folderId: true,
          },
        },
      },
      orderBy: (ws, { asc }) => [asc(ws.name)],
    });

    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("GET /api/workspaces error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`workspaces:${ip}`, 10, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, description, icon } = parsed.data;

  try {
    const id = crypto.randomUUID();
    const baseSlug = toSlug(name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const existing = await db.query.workspace.findFirst({ where: eq(workspace.slug, s) });
      return !existing;
    });

    const [ws] = await db
      .insert(workspace)
      .values({
        id,
        name,
        slug,
        description: description || null,
        icon: icon || "BookOpen",
        createdById: session.user.id,
      })
      .returning();

    await db.insert(workspaceMember).values({
      id: crypto.randomUUID(),
      workspaceId: id,
      userId: session.user.id,
      role: "owner",
    });

    await logAction(
      session.user.id,
      "WORKSPACE_CREATE",
      `Created workspace "${name}" (${slug})`,
      request
    );

    return NextResponse.json({ workspace: ws }, { status: 201 });
  } catch (error) {
    console.error("POST /api/workspaces error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
