import type { Plugin } from "@/plugins/types";
import { NextResponse } from "next/server";

const PCLOUD_AUTH = "https://e.pcloud.com/oauth2/authorize";
const PCLOUD_TOKEN = "https://api.pcloud.com/oauth2_token";
const PCLOUD_API = "https://api.pcloud.com";

async function getAccessToken(workspaceId: string): Promise<string | null> {
  const { db } = await import("@/lib/db");
  const { pluginConfig } = await import("@/lib/db");
  const { and, eq } = await import("drizzle-orm");
  const config = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.workspaceId, workspaceId), eq(pluginConfig.pluginId, "sync-pcloud")),
  });
  if (!config?.enabled) return null;
  return (config.config as any)?.accessToken || null;
}

export const syncPcloudPlugin: Plugin = {
  id: "sync-pcloud",
  name: "pCloud Sync",
  description: "Sync notes to your pCloud storage",
  version: "0.1.0",
  apiRoutes: {
    "GET /api/plugins/sync-pcloud/auth": async () => {
      const url = new URL(PCLOUD_AUTH);
      // clientId passed via query param from settings
      return NextResponse.json({ url: PCLOUD_AUTH });
    },

    "GET /api/plugins/sync-pcloud/callback": async (req) => {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const clientId = url.searchParams.get("clientId");
      const clientSecret = url.searchParams.get("clientSecret");
      const workspaceId = url.searchParams.get("workspaceId");
      if (!code || !clientId || !clientSecret || !workspaceId) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
      }

      const tokenUrl = `${PCLOUD_TOKEN}?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`;
      const res = await fetch(tokenUrl);
      const data = await res.json();

      if (data.access_token) {
        return NextResponse.json({ connected: true, accessToken: data.access_token });
      }
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    },

    "POST /api/plugins/sync-pcloud/sync": async (req) => {
      const { workspaceId } = await req.json();
      const token = await getAccessToken(workspaceId);
      if (!token) return NextResponse.json({ error: "Not connected" }, { status: 400 });

      const { db, note } = await import("@/lib/db");
      const { eq } = await import("drizzle-orm");
      const notes = await db.query.note.findMany({ where: eq(note.workspaceId, workspaceId) });

      const folderPath = "/MindMatrix";
      let synced = 0;

      for (const n of notes) {
        try {
          const filename = `${n.slug || n.id}.md`;
          const path = `${folderPath}/${filename}`;
          const uploadUrl = `${PCLOUD_API}/uploadfile?path=${encodeURIComponent(path)}&access_token=${token}`;
          await fetch(uploadUrl, {
            method: "PUT",
            body: n.content,
          });
          synced++;
        } catch { /* skip */ }
      }

      return NextResponse.json({ synced });
    },

    "GET /api/plugins/sync-pcloud/status": async (req) => {
      const { searchParams } = new URL(req.url);
      const workspaceId = searchParams.get("workspaceId");
      const token = workspaceId ? await getAccessToken(workspaceId) : null;
      return NextResponse.json({ connected: !!token });
    },
  },
};
