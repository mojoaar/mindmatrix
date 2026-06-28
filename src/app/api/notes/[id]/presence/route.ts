import { auth } from "@/lib/auth";
import { db, note, workspaceMember } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getEventBus } from "@/lib/realtime/event-bus";
import { NextResponse } from "next/server";

const presence = new Map<string, Map<string, { userName: string; lastSeen: number }>>();

function cleanupPresence() {
  const now = Date.now();
  for (const [noteId, users] of presence) {
    for (const [userId, data] of users) {
      if (now - data.lastSeen > 30000) {
        users.delete(userId);
      }
    }
    if (users.size === 0) {
      presence.delete(noteId);
    }
  }
}

setInterval(cleanupPresence, 15000);

export async function POST(
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

  if (!presence.has(id)) {
    presence.set(id, new Map());
  }

  const previousViewers = presence.get(id)!.size;
  presence.get(id)!.set(session.user.id, {
    userName: session.user.name,
    lastSeen: Date.now(),
  });

  const viewers = Array.from(presence.get(id)!.entries()).map(
    ([userId, data]) => ({ userId, userName: data.userName })
  );

  // Notify if someone joined
  if (presence.get(id)!.size !== previousViewers) {
    getEventBus().notify(`note:${id}`, {
      type: "presence_changed",
      viewers,
    });
  }

  return NextResponse.json({ viewers });
}
