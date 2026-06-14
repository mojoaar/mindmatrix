import { NextResponse } from "next/server";
import { db, note, noteTag, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, or, ilike } from "drizzle-orm";

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
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, folderId, title, content, tagIds } = await request.json();
  if (!title || !workspaceId) {
    return NextResponse.json({ error: "Title and workspaceId are required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = crypto.randomUUID();
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

  return NextResponse.json({ note: created }, { status: 201 });
}
