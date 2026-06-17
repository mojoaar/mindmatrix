import { db, workspaceMember, user } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";

export async function resolveMentions(
  body: string,
  workspaceId: string
): Promise<{ text: string; mentions: string[] }> {
  const pattern = /@(\w+)/g;
  const matches = [...body.matchAll(pattern)];
  if (matches.length === 0) return { text: body, mentions: [] };

  const usernames = [...new Set(matches.map((m) => m[1]))];
  const members = await db.query.workspaceMember.findMany({
    where: eq(workspaceMember.workspaceId, workspaceId),
    columns: { userId: true },
  });

  const memberIds = members.map((m) => m.userId);
  if (memberIds.length === 0) return { text: body, mentions: [] };

  const users = await db.query.user.findMany({
    where: and(inArray(user.id, memberIds), inArray(user.name, usernames)),
    columns: { id: true, name: true },
  });

  return { text: body, mentions: users.map((u) => u.id) };
}
