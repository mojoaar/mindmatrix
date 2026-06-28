import { NextResponse } from "next/server";
import { db, session, user as userTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { validateApiToken } from "@/lib/api-token-auth";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const userId = await validateApiToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userRecord = await db.query.user.findFirst({
      where: eq(userTable.id, userId),
    });
    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(session).values({
      id: crypto.randomUUID(),
      userId,
      token: sessionToken,
      expiresAt,
      ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "MindMatrix Desktop",
    });

    const cookieName =
      process.env.NODE_ENV === "production"
        ? "__Secure-better-auth.session_token"
        : "better-auth.session_token";

    const cookieValue = `${cookieName}=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
    if (process.env.NODE_ENV === "production") {
      const secureCookie = `${cookieValue}; Secure`;
      return NextResponse.json({ success: true }, {
        status: 200,
        headers: { "Set-Cookie": secureCookie },
      });
    }

    return NextResponse.json({ success: true }, {
      status: 200,
      headers: { "Set-Cookie": cookieValue },
    });
  } catch (error) {
    logger.error("SESSION_FROM_TOKEN failed", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
