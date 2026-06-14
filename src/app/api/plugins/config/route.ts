import { NextResponse } from "next/server";
import { db, pluginConfig } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pluginId = searchParams.get("pluginId");
  const workspaceId = searchParams.get("workspaceId");

  if (!pluginId || !workspaceId) {
    return NextResponse.json({ error: "pluginId and workspaceId required" }, { status: 400 });
  }

  const config = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.pluginId, pluginId), eq(pluginConfig.workspaceId, workspaceId)),
  });

  return NextResponse.json({
    config: config
      ? { enabled: config.enabled, config: config.config }
      : { enabled: false, config: {} },
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pluginId, workspaceId, enabled, config } = await request.json();

  if (!pluginId || !workspaceId) {
    return NextResponse.json({ error: "pluginId and workspaceId required" }, { status: 400 });
  }

  const existing = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.pluginId, pluginId), eq(pluginConfig.workspaceId, workspaceId)),
  });

  if (existing) {
    await db
      .update(pluginConfig)
      .set({ enabled: enabled ?? existing.enabled, config: config ?? existing.config })
      .where(eq(pluginConfig.id, existing.id));
  } else {
    await db.insert(pluginConfig).values({
      id: crypto.randomUUID(),
      pluginId,
      workspaceId,
      enabled: enabled ?? false,
      config: config ?? {},
    });
  }

  return NextResponse.json({ saved: true });
}
