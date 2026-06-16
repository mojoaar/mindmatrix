import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, systemConfig as systemConfigTable } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.query.systemConfig.findMany();
  const config: Record<string, string> = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }

  return NextResponse.json({ config });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { key, value } = await request.json();
  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  if (value === undefined || value === null) {
    return NextResponse.json({ error: "value is required" }, { status: 400 });
  }

  await db
    .insert(systemConfigTable)
    .values({ key, value: String(value), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: systemConfigTable.key,
      set: { value: String(value), updatedAt: new Date() },
    });

  return NextResponse.json({ key, value: String(value) });
}
