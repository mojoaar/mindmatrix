import { NextResponse } from "next/server";
import { db, note, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { logAction } from "@/lib/audit";
import { importNotesSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  if (!(await rateLimit(`import:${ip}`, 5, 120000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = importNotesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { workspaceId, notes: importedNotes } = parsed.data;

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

  await logAction(session.user.id, "NOTE_IMPORT", `Imported ${created.length} notes to workspace`, request);

  return NextResponse.json({ imported: created.length, notes: created }, { status: 201 });
}
