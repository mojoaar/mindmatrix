import { db, auditLog } from "@/lib/db";

export async function logAction(
  userId: string,
  action: string,
  details?: string,
  request?: Request
): Promise<void> {
  try {
    let ipAddress: string | undefined;
    if (request) {
      const forwarded = request.headers.get("x-forwarded-for");
      ipAddress = forwarded ? forwarded.split(",")[0].trim() : undefined;
    }

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId,
      action,
      details: details || null,
      ipAddress: ipAddress || null,
    });
  } catch {
    // audit logging should never break the app
  }
}
