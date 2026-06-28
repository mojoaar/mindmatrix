import type { Plugin } from "./types";
import { syncPcloudPlugin } from "./sync-pcloud";
import { syncGoogleDrivePlugin } from "./sync-google-drive";
import { opencodeAiPlugin } from "./opencode-ai";
import { opencodeZenPlugin } from "./opencode-zen";
import { proxmoxInventoryPlugin } from "./proxmox-inventory";
import { unifiTopologyPlugin } from "./unifi-topology";
import { gitSyncPlugin } from "./git-sync";
import { db, workspaceMember, pluginConfig } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { decryptConfig } from "@/lib/crypto";
import { NextResponse } from "next/server";

export const plugins: Plugin[] = [
  syncPcloudPlugin,
  syncGoogleDrivePlugin,
  opencodeAiPlugin,
  opencodeZenPlugin,
  proxmoxInventoryPlugin,
  unifiTopologyPlugin,
  gitSyncPlugin,
];

export function getPlugin(id: string): Plugin | undefined {
  return plugins.find((p) => p.id === id);
}

export async function requirePluginAccess(
  req: Request,
  workspaceId: string,
  pluginId: string
): Promise<{ userId: string; config: Record<string, string> } | Response> {
  const auth = await import("@/lib/auth");
  const session = await auth.auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(eq(workspaceMember.workspaceId, workspaceId), eq(workspaceMember.userId, session.user.id)),
  });
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.workspaceId, workspaceId), eq(pluginConfig.pluginId, pluginId)),
  });
  if (!config?.enabled) {
    return NextResponse.json({ error: "Plugin not enabled" }, { status: 400 });
  }

  return {
    userId: session.user.id,
    config: config.config ? decryptConfig(config.config as Record<string, string>) : {},
  };
}
