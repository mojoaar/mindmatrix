import { NextResponse } from "next/server";
import { db, notification } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, desc, count } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);

  try {
    const [totalResult] = await db
      .select({ count: count() })
      .from(notification)
      .where(eq(notification.userId, session.user.id));

    const items = await db.query.notification.findMany({
      where: eq(notification.userId, session.user.id),
      orderBy: [desc(notification.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    return NextResponse.json({
      notifications: items,
      total: totalResult.count,
      unread: items.filter((n) => !n.isRead).length,
      page,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, title, message, link } = await request.json();

  if (!type || !title || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const [notif] = await db
      .insert(notification)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        type,
        title,
        message,
        link: link || null,
      })
      .returning();

    return NextResponse.json({ notification: notif }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await db
      .update(notification)
      .set({ isRead: true })
      .where(eq(notification.userId, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
