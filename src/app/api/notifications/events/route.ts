import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEventBus } from "@/lib/realtime/event-bus";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const channel = `user:${session.user.id}`;
  const eventBus = getEventBus();

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = eventBus.subscribe(channel, (event: any) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
