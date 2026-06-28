import { NextResponse } from "next/server";
import { db, note, noteTag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, or, ilike } from "drizzle-orm";
import { logAction } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { createNoteSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { toSlug } from "@/lib/slug" ;

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const folderId = searchParams.get("folderId");
  const tagId = searchParams.get("tagId");
  const q = searchParams.get("q");

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [eq(note.workspaceId, workspaceId)];
    if (folderId && folderId !== "root") conditions.push(eq(note.folderId, folderId));
    if (q) conditions.push(or(ilike(note.title, `%${q}%`), ilike(note.content, `%${q}%`)));

    const whereClause = conditions.length === 1 ? conditions[0] : and(conditions[0], conditions[1], ...conditions.slice(2));

    let notes = await db.query.note.findMany({
      where: whereClause,
      with: {
        noteTags: { with: { tag: true } },
        creator: true,
        folder: true,
      },
      orderBy: (n, { desc }) => [desc(n.updatedAt)],
    });

    if (tagId) {
      const noteIds = await db.query.noteTag.findMany({
        where: eq(noteTag.tagId, tagId),
        columns: { noteId: true },
      });
      const ids = new Set(noteIds.map((n) => n.noteId));
      notes = notes.filter((n) => ids.has(n.id));
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`notes:${ip}`, 30, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workspaceId, folderId, title, content, tagIds } = parsed.data;

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const id = crypto.randomUUID();
    const slug = toSlug(title);

    const [newNote] = await db
      .insert(note)
      .values({
        id,
        workspaceId,
        folderId: folderId || null,
        title,
        slug,
        content: content || "",
        createdById: session.user.id,
        updatedById: session.user.id,
      })
      .returning();

    if (tagIds && tagIds.length > 0) {
      await db.insert(noteTag).values(
        tagIds.map((tagId: string) => ({ noteId: id, tagId }))
      );
    }

    const created = await db.query.note.findFirst({
      where: eq(note.id, id),
      with: { noteTags: { with: { tag: true } }, creator: true, folder: true },
    });

    await logAction(
      session.user.id,
      "NOTE_CREATE",
      `Created note "${title}" (${id}) in workspace ${workspaceId}`,
      request
    );

    await triggerWebhooks(
      workspaceId,
      "note.created",
      {
        id: created!.id,
        title: created!.title,
        slug: created!.slug,
        content: created!.content,
        folderId: created!.folderId,
      },
      { id: session.user.id, name: session.user.name, email: session.user.email }
    );

    return NextResponse.json({ note: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
