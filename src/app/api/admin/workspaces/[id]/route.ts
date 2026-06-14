import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, workspace } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: wsId } = await params;
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ws = await db.query.workspace.findFirst({
    where: eq(workspace.id, wsId),
  });

  if (!ws) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  await db.delete(workspace).where(eq(workspace.id, wsId));

  await logAction(
    session.user.id,
    "WORKSPACE_ADMIN_DELETE",
    `Super admin deleted workspace "${ws.name}" (${wsId})`,
    request
  );

  return NextResponse.json({ deleted: true });
}
