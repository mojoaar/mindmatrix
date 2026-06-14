import { auth } from "@/lib/auth";
import { db, note, workspaceMember } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { getEventBus } from "@/lib/realtime/event-bus";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const found = await db.query.note.findFirst({ where: eq(note.id, id) });
  if (!found) {
    return new Response("Not found", { status: 404 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, found.workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });
  if (!member) {
    return new Response("Forbidden", { status: 403 });
  }

  const channel = `note:${id}`;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const unsubscribe = getEventBus().subscribe(channel, (payload) => {
        const data = `data: ${JSON.stringify(payload)}\n\n`;
        controller.enqueue(encoder.encode(data));
      });

      // Keep-alive ping every 15s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
