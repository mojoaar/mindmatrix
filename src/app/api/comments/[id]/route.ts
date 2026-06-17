import { NextResponse } from "next/server";
import { db, noteComment } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.query.noteComment.findFirst({
    where: eq(noteComment.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(noteComment).where(and(eq(noteComment.id, id)));

  return NextResponse.json({ success: true });
}
