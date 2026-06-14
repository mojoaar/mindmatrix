import { NextResponse } from "next/server";
import { db, syncConnection } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.query.syncConnection.findMany({
    where: eq(syncConnection.userId, session.user.id),
  });

  return NextResponse.json({ connections });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { provider, accessToken, refreshToken, expiresAt, config } = await request.json();

  if (!provider || !accessToken) {
    return NextResponse.json({ error: "Provider and accessToken are required" }, { status: 400 });
  }

  const existing = await db.query.syncConnection.findFirst({
    where: and(
      eq(syncConnection.userId, session.user.id),
      eq(syncConnection.provider, provider)
    ),
  });

  if (existing) {
    const [updated] = await db
      .update(syncConnection)
      .set({ accessToken, refreshToken, expiresAt: expiresAt ? new Date(expiresAt) : null, config })
      .where(eq(syncConnection.id, existing.id))
      .returning();

    return NextResponse.json({ connection: updated });
  }

  const [connection] = await db
    .insert(syncConnection)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      provider,
      accessToken,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      config: config || null,
    })
    .returning();

  return NextResponse.json({ connection }, { status: 201 });
}
