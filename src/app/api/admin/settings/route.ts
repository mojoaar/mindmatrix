import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, systemConfig as systemConfigTable } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";
import { resetConfigCache } from "@/lib/email";

const SENSITIVE_CONFIG_KEYS = ["smtpPass"];

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user || (session.user as any).role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db.query.systemConfig.findMany();
  const config: Record<string, string> = {};
  for (const row of rows) {
    const val = SENSITIVE_CONFIG_KEYS.includes(row.key) && row.value ? "••••••••" : row.value;
    config[row.key] = val;
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

  let storedValue = String(value);

  if (SENSITIVE_CONFIG_KEYS.includes(key)) {
    if (value === "••••••••") {
      const existing = await db.query.systemConfig.findFirst({
        where: (sc, { eq }) => eq(sc.key, key),
      });
      storedValue = existing?.value || "";
    } else if (value) {
      storedValue = encrypt(value);
    }
  }

  await db
    .insert(systemConfigTable)
    .values({ key, value: storedValue, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: systemConfigTable.key,
      set: { value: storedValue, updatedAt: new Date() },
    });

  resetConfigCache();

  return NextResponse.json({ key, value: String(value) });
}
