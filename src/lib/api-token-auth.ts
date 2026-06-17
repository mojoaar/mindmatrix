import { db, apiToken } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function validateApiToken(token: string): Promise<string | null> {
  try {
    const found = await db.query.apiToken.findFirst({
      where: eq(apiToken.token, token),
    });

    if (!found) return null;

    if (found.expiresAt && new Date(found.expiresAt) < new Date()) return null;

    await db
      .update(apiToken)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiToken.id, found.id));

    return found.userId;
  } catch {
    return null;
  }
}
