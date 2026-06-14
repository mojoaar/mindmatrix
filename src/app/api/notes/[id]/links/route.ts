import { NextResponse } from "next/server";
import { db, note, noteLink, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    where: and(
      eq(workspaceMember.workspaceId, found.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const outgoing = await db.query.noteLink.findMany({
    where: eq(noteLink.sourceNoteId, id),
    with: { target: { columns: { id: true, title: true, slug: true } } },
  });

  const incoming = await db.query.noteLink.findMany({
    where: eq(noteLink.targetNoteId, id),
    with: { source: { columns: { id: true, title: true, slug: true } } },
  });

  return NextResponse.json({
    links: {
      outgoing: outgoing.map((l) => l.target),
      incoming: incoming.map((l) => l.source),
    },
  });
}
