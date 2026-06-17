import { NextResponse } from "next/server";
import { db, apiToken } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await db.query.apiToken.findMany({
    where: eq(apiToken.userId, session.user.id),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json({
    tokens: tokens.map((t) => ({
      id: t.id,
      name: t.name,
      token: t.token.slice(0, 8) + "••••••••" + t.token.slice(-4),
      lastUsedAt: t.lastUsedAt,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(`tokens:${ip}`, 10, 60000); // 10 tokens per minute
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const token = "mm_" + crypto.randomBytes(32).toString("hex");

  const [created] = await db
    .insert(apiToken)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      name,
      token,
    })
    .returning();

  return NextResponse.json({ token: created }, { status: 201 });
}
