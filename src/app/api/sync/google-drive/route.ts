import { NextResponse } from "next/server";
import { db, syncConnection } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conn = await db.query.syncConnection.findFirst({
    where: eq(syncConnection.userId, session.user.id),
  });

  return NextResponse.json({ connected: !!conn, provider: conn?.provider });
}
