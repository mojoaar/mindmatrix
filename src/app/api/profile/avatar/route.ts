import { NextResponse } from "next/server";
import { db, user } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No avatar file provided" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 2MB limit" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] || "png";
  const filename = `${session.user.id}_${Date.now()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  const publicPath = `/uploads/avatars/${filename}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify magic bytes
    const header = buffer.slice(0, 4).toString("hex");
    const validHeaders: Record<string, string[]> = {
      "image/jpeg": ["ffd8ff"],
      "image/png": ["89504e47"],
      "image/webp": ["52494646"],
    };
    const expected = validHeaders[file.type];
    if (!expected || !expected.some((h) => header.startsWith(h))) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    // Delete previous avatar file (any extension)
    const prev = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
      columns: { image: true },
    });
    if (prev?.image) {
      const prevPath = prev.image.replace("/uploads/avatars/", "");
      const prevFull = path.join(UPLOAD_DIR, prevPath);
      try { await unlink(prevFull); } catch { /* old file may not exist */ }
    }

    await writeFile(filepath, buffer);

    await db
      .update(user)
      .set({ image: publicPath })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ image: publicPath });
  } catch {
    return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prev = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
    columns: { image: true },
  });

  if (prev?.image) {
    const prevPath = prev.image.replace("/uploads/avatars/", "");
    const prevFull = path.join(UPLOAD_DIR, prevPath);
    try { await unlink(prevFull); } catch { /* ignore */ }
  }

  await db
    .update(user)
    .set({ image: null })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ image: null });
}
