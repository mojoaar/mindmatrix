import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, auditLog, user } from "@/lib/db";
import { eq, desc, count } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(10, parseInt(url.searchParams.get("limit") || "50")));
  const search = url.searchParams.get("search") || "";

  const offset = (page - 1) * limit;

  const logs = await db.query.auditLog.findMany({
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
    },
    orderBy: [desc(auditLog.createdAt)],
    limit,
    offset,
  });

  let filtered = logs;
  if (search) {
    const q = search.toLowerCase();
    filtered = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q) ||
        l.user?.name?.toLowerCase().includes(q) ||
        l.user?.email?.toLowerCase().includes(q)
    );
  }

  const [total] = await db.select({ value: count() }).from(auditLog);

  return NextResponse.json({
    logs: filtered,
    pagination: {
      page,
      limit,
      total: Number(total?.value || 0),
      totalPages: Math.ceil(Number(total?.value || 0) / limit),
    },
  });
}
