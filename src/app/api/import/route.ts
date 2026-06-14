import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, notes: importedNotes } = await request.json();

  if (!workspaceId || !importedNotes || !Array.isArray(importedNotes)) {
    return NextResponse.json({ error: "workspaceId and notes[] are required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });

  if (!member || member.role === "viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const created: Array<{ id: string; title: string }> = [];

  for (const item of importedNotes) {
    if (!item.title) continue;

    const id = crypto.randomUUID();
    const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    await db.insert(note).values({
      id,
      workspaceId,
      title: item.title,
      slug,
      content: item.content || "",
      createdById: session.user.id,
      updatedById: session.user.id,
    });

    created.push({ id, title: item.title });
  }

  return NextResponse.json({ imported: created.length, notes: created }, { status: 201 });
}
