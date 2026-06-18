import { NextResponse } from "next/server";
import { db, pluginConfig, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { encryptConfig, decryptConfig, maskConfig } from "@/lib/crypto";
import { logAction } from "@/lib/audit";

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

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.pluginId, pluginId), eq(pluginConfig.workspaceId, workspaceId)),
  });

  if (!config) {
    return NextResponse.json({ enabled: false, config: {} });
  }

  const decodedConfig = typeof config.config === "object" ? (config.config as Record<string, any>) : {};
  return NextResponse.json({
    enabled: config.enabled,
    config: maskConfig(decodedConfig),
    lastSync: (config.config as any)?.lastSync || null,
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pluginId, workspaceId, enabled, config: incomingConfig } = await request.json();

  if (!pluginId || !workspaceId) {
    return NextResponse.json({ error: "pluginId and workspaceId required" }, { status: 400 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.pluginId, pluginId), eq(pluginConfig.workspaceId, workspaceId)),
  });

  let encryptedConfig = existing ? existing.config : {};

  if (incomingConfig !== undefined && incomingConfig !== null) {
    const newConfig = { ...incomingConfig };

    // Merge with existing: preserve encrypted values when mask placeholder "••••••••" is sent
    if (existing) {
      const existingConfig = typeof existing.config === "object" ? (existing.config as Record<string, any>) : {};
      for (const key of Object.keys(existingConfig)) {
        if (newConfig[key] === "••••••••") {
          newConfig[key] = existingConfig[key];
        }
      }
    }

    encryptedConfig = encryptConfig(newConfig);
  }

  if (existing) {
    await db
      .update(pluginConfig)
      .set({ enabled: enabled ?? existing.enabled, config: encryptedConfig })
      .where(eq(pluginConfig.id, existing.id));
  } else {
    await db.insert(pluginConfig).values({
      id: crypto.randomUUID(),
      pluginId,
      workspaceId,
      enabled: enabled ?? false,
      config: encryptedConfig,
    });
  }

  await logAction(session.user.id, "PLUGIN_CONFIG_UPDATED", `Plugin ${pluginId}: ${enabled ? "enabled" : "disabled"}`, request);

  return NextResponse.json({ saved: true });
}
