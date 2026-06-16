import { NextResponse } from "next/server";
import { db, note, noteTag, workspaceMember, noteVersion, noteLink } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { getEventBus } from "@/lib/realtime/event-bus";
import { logAction } from "@/lib/audit";
import { triggerWebhooks } from "@/lib/webhooks";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });

  const found = await db.query.note.findFirst({
    where: eq(note.id, id),
    with: {
      noteTags: { with: { tag: true } },
      creator: true,
      updater: true,
      folder: true,
    },
  });

  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (found.isPublic) {
    return NextResponse.json({ note: found });
  }

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ note: found });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, folderId, tagIds, isPublic } = await request.json();
  const update: Record<string, unknown> = { updatedById: session.user.id };
  if (title !== undefined) {
    update.title = title;
    update.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  if (content !== undefined) update.content = content;
  if (folderId !== undefined) update.folderId = folderId || null;
  if (isPublic !== undefined) update.isPublic = isPublic;

  await db.update(note).set(update).where(eq(note.id, id));

  if (content !== undefined && content !== found.content) {
    await db.insert(noteVersion).values({
      id: crypto.randomUUID(),
      noteId: id,
      title: found.title,
      content: found.content,
      createdById: session.user.id,
    });
  }

  if (tagIds !== undefined) {
    await db.delete(noteTag).where(eq(noteTag.noteId, id));
    if (tagIds.length > 0) {
      await db.insert(noteTag).values(tagIds.map((tagId: string) => ({ noteId: id, tagId })));
    }
  }

  // Parse backlinks from content
  if (content !== undefined) {
    const linkPattern = /\[\[([^\]]+)\]\]/g;
    const refs = [...content.matchAll(linkPattern)].map((m) => m[1]);
    if (refs.length > 0) {
      const linkedNotes = await db.query.note.findMany({
        where: and(
          eq(note.workspaceId, found.workspaceId),
        ),
        columns: { id: true, slug: true },
      });
      const slugMap = new Map(linkedNotes.map((n) => [n.slug, n.id]));

      await db.delete(noteLink).where(eq(noteLink.sourceNoteId, id));
      for (const ref of refs) {
        const targetId = slugMap.get(ref);
        if (targetId && targetId !== id) {
          await db.insert(noteLink).values({
            id: crypto.randomUUID(),
            sourceNoteId: id,
            targetNoteId: targetId,
          });
        }
      }
    }
  }

  // Notify realtime listeners
  try {
    getEventBus().notify(`note:${id}`, {
      type: "note_updated",
      noteId: id,
      updatedBy: session.user.name,
      updatedAt: new Date().toISOString(),
    });
  } catch {}

  const updated = await db.query.note.findFirst({
    where: eq(note.id, id),
    with: { noteTags: { with: { tag: true } }, creator: true, updater: true, folder: true },
  });

  await logAction(
    session.user.id,
    "NOTE_UPDATE",
    `Updated note "${updated?.title}" (${id})`,
    request
  );

  if (updated) {
    try {
      await triggerWebhooks(
        updated.workspaceId,
        "note.updated",
        {
          id: updated.id,
          title: updated.title,
          slug: updated.slug,
          content: updated.content,
          folderId: updated.folderId,
        },
        { id: session.user.id, name: session.user.name, email: session.user.email }
      );
    } catch {}

    if (updated.createdById && updated.createdById !== session.user.id) {
      await createNotification({
        userId: updated.createdById,
        type: "note_updated",
        title: `Note updated: ${updated.title}`,
        message: `${session.user.name} edited your note`,
        link: `/dashboard/w/[slug]/notes/${updated.id}`,
      });
    }
  }

  return NextResponse.json({ note: updated });
  } catch (err) {
    console.error("PATCH /api/notes/[id] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, id) });
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, found.workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logAction(
    session.user.id,
    "NOTE_DELETE",
    `Deleted note "${found.title}" (${id})`,
    request
  );

  await triggerWebhooks(
    found.workspaceId,
    "note.deleted",
    {
      id: found.id,
      title: found.title,
      slug: found.slug,
    },
    { id: session.user.id, name: session.user.name, email: session.user.email }
  );

  await db.delete(note).where(eq(note.id, id));
  return NextResponse.json({ success: true });
}
