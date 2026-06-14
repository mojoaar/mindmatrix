import { NextResponse } from "next/server";
import { db, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      timezone: true,
      timeFormat: true,
      createdAt: true,
    },
  });

  if (!found) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: found });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, timezone, timeFormat } = await request.json();

  const update: Record<string, unknown> = {};
  if (name !== undefined && typeof name === "string" && name.trim().length > 0) {
    update.name = name.trim();
  }
  if (timezone !== undefined) update.timezone = timezone;
  if (timeFormat !== undefined) update.timeFormat = timeFormat;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(user)
    .set(update)
    .where(eq(user.id, session.user.id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      timezone: user.timezone,
      timeFormat: user.timeFormat,
      createdAt: user.createdAt,
    });

  return NextResponse.json({ profile: updated });
}
