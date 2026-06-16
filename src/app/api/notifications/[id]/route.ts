import { NextResponse } from "next/server";
import { db, notification } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.query.notification.findFirst({
    where: and(eq(notification.id, id), eq(notification.userId, session.user.id)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.update(notification).set({ isRead: true }).where(eq(notification.id, id));

  return NextResponse.json({ success: true });
}
