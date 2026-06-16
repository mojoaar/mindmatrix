import { NextResponse } from "next/server";
import { db, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { logAction } from "@/lib/audit";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const found = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: {
      id: true,
      name: true,
      email: true,
      image: true,
      timezone: true,
      timeFormat: true,
      role: true,
      twoFactorEnabled: true,
      theme: true,
      font: true,
      sidebarFolders: true,
      sidebarTags: true,
      editorLayout: true,
      dateFormat: true,
      createdAt: true,
    },
  });

  if (!found) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ profile: found });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, timezone, timeFormat, email, theme, font, sidebarFolders, sidebarTags, editorLayout, dateFormat } = await request.json();

  const update: Record<string, unknown> = {};
  if (name !== undefined && typeof name === "string" && name.trim().length > 0) {
    update.name = name.trim();
  }
  if (timezone !== undefined) update.timezone = timezone;
  if (timeFormat !== undefined) update.timeFormat = timeFormat;
  if (theme !== undefined && typeof theme === "string") update.theme = theme;
  if (font !== undefined && typeof font === "string") update.font = font;
  if (sidebarFolders !== undefined && typeof sidebarFolders === "boolean") update.sidebarFolders = sidebarFolders;
  if (sidebarTags !== undefined && typeof sidebarTags === "boolean") update.sidebarTags = sidebarTags;
  if (editorLayout !== undefined && typeof editorLayout === "string") update.editorLayout = editorLayout;
  if (dateFormat !== undefined && typeof dateFormat === "string") update.dateFormat = dateFormat;

  if (email !== undefined && typeof email === "string") {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return NextResponse.json({ error: "Email cannot be empty" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    // Check if email is already in use by another user
    const existing = await db.query.user.findFirst({
      where: and(eq(user.email, trimmedEmail), ne(user.id, session.user.id)),
    });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    if (trimmedEmail !== session.user.email) {
      update.email = trimmedEmail;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(user)
    .set(update)
    .where(eq(user.id, session.user.id))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      timezone: user.timezone,
      timeFormat: user.timeFormat,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled,
      theme: user.theme,
      font: user.font,
      sidebarFolders: user.sidebarFolders,
      sidebarTags: user.sidebarTags,
      editorLayout: user.editorLayout,
      dateFormat: user.dateFormat,
      createdAt: user.createdAt,
    });

  if (update.email) {
    await logAction(session.user.id, "USER_EMAIL_CHANGED", `Email changed to ${update.email}`, request);
  }

  return NextResponse.json({ profile: updated });
}
