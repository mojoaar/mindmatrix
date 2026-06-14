import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, user } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetId } = await params;
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { role, emailVerified } = body;

  const updateData: Record<string, unknown> = {};

  if (role !== undefined) {
    if (!["user", "super_admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'user' or 'super_admin'" },
        { status: 400 }
      );
    }
    updateData.role = role;
  }

  if (emailVerified !== undefined) {
    if (typeof emailVerified !== "boolean") {
      return NextResponse.json(
        { error: "Invalid emailVerified. Must be boolean" },
        { status: 400 }
      );
    }
    updateData.emailVerified = emailVerified;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  if (emailVerified !== undefined && !role && targetId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot verify yourself" },
      { status: 400 }
    );
  }

  if (role && targetId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const target = await db.query.user.findFirst({
    where: eq(user.id, targetId),
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(user)
    .set(updateData as any)
    .where(eq(user.id, targetId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
    });

  const actions: string[] = [];
  if (role) actions.push(`role → ${role}`);
  if (emailVerified !== undefined) actions.push(`verified → ${emailVerified}`);

  await logAction(
    session.user.id,
    "USER_UPDATED",
    `${updated.name} (${updated.email}): ${actions.join(", ")}`,
    request
  );

  return NextResponse.json({ user: updated });
}
