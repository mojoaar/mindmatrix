import { NextResponse } from "next/server";
import { db, folder, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, isNull } from "drizzle-orm";
import { logAction } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { createFolderSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { toSlug } from "@/lib/slug" ;

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

  try {
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
  } catch (error) {
    console.error("GET /api/folders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`folders:${ip}`, 20, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createFolderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workspaceId, parentId, name, icon } = parsed.data;

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = crypto.randomUUID();
    const slug = toSlug(name);

    const [newFolder] = await db
      .insert(folder)
      .values({
        id,
        workspaceId,
        parentId: parentId || null,
        name,
        slug,
        icon: icon || "FolderPlus",
        createdById: session.user.id,
        position: 0,
      })
      .returning();

    await logAction(
      session.user.id,
      "FOLDER_CREATE",
      `Created folder "${name}" (${id}) in workspace ${workspaceId}`,
      request
    );

    await triggerWebhooks(
      workspaceId,
      "folder.created",
      {
        id: newFolder.id,
        name: newFolder.name,
        slug: newFolder.slug,
        parentId: newFolder.parentId,
      },
      { id: session.user.id, name: session.user.name, email: session.user.email }
    );

    return NextResponse.json({ folder: newFolder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/folders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
