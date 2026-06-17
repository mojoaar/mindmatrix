import { NextResponse } from "next/server";
import { db, syncConnection } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await db.query.syncConnection.findMany({
    where: eq(syncConnection.userId, session.user.id),
  });

  const safeConnections = connections.map((c) => ({
    ...c,
    accessToken: "••••••••",
    refreshToken: c.refreshToken ? "••••••••" : null,
  }));

  return NextResponse.json({ connections: safeConnections });
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

  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  if (existing) {
    const finalAccessToken = accessToken === "••••••••" ? existing.accessToken : encryptedAccessToken;
    const finalRefreshToken = refreshToken === "••••••••" ? existing.refreshToken : encryptedRefreshToken;

    const [updated] = await db
      .update(syncConnection)
      .set({ 
        accessToken: finalAccessToken, 
        refreshToken: finalRefreshToken, 
        expiresAt: expiresAt ? new Date(expiresAt) : null, 
        config 
      })
      .where(eq(syncConnection.id, existing.id))
      .returning();

    return NextResponse.json({ 
      connection: {
        ...updated,
        accessToken: "••••••••",
        refreshToken: updated.refreshToken ? "••••••••" : null,
      } 
    });
  }

  const [connection] = await db
    .insert(syncConnection)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      config: config || null,
    })
    .returning();

  return NextResponse.json({ 
    connection: {
      ...connection,
      accessToken: "••••••••",
      refreshToken: connection.refreshToken ? "••••••••" : null,
    } 
  }, { status: 201 });
}
