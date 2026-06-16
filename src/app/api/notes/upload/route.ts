import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "notes");
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const DEFAULT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const allowed = await rateLimit(ip, 10, 60000); // 10 uploads per minute
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many upload requests. Please wait 1 minute." },
      { status: 429 }
    );
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const configRow = await db.query.systemConfig.findMany();
    const config: Record<string, string> = {};
    for (const row of configRow) config[row.key] = row.value;

    const maxSize = config.uploadMaxSize
      ? parseInt(config.uploadMaxSize) * 1024 * 1024
      : DEFAULT_MAX_SIZE;
    const allowedTypes = config.uploadTypes
      ? config.uploadTypes.split(",").map((t) => t.trim()).filter(Boolean)
      : DEFAULT_TYPES;

    if (file.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      return NextResponse.json({ error: `File exceeds ${sizeMB}MB limit` }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Only ${allowedTypes.join(", ")} allowed` }, { status: 400 });
    }

    const ext = file.type.split("/")[1] || "png";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    const publicPath = `/uploads/notes/${filename}`;

    await mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify magic bytes
    const header = buffer.slice(0, 4).toString("hex");
    const validHeaders: Record<string, string[]> = {
      "image/jpeg": ["ffd8ff"],
      "image/png": ["89504e47"],
      "image/webp": ["52494646"],
      "image/gif": ["47494638"],
    };
    const expected = validHeaders[file.type];
    if (!expected || !expected.some((h) => header.startsWith(h))) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    await writeFile(filepath, buffer);

    return NextResponse.json({ url: publicPath, filename: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
