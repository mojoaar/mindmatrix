import type { Plugin } from "@/plugins/types";
import { requirePluginAccess } from "@/plugins";
import { NextResponse } from "next/server";
import { db, note } from "@/lib/db";
import { eq } from "drizzle-orm";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

async function getAccessToken(
  req: Request,
  workspaceId: string
): Promise<string | Response> {
  const access = await requirePluginAccess(req, workspaceId, "sync-google-drive");
  if (access instanceof Response) return access;
  const cfg = access.config;
  if (!cfg?.accessToken) return NextResponse.json({ error: "Not connected" }, { status: 400 });

  if (cfg.expiresAt && Date.now() > Number(cfg.expiresAt)) {
    const refreshRes = await fetch(GOOGLE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        refresh_token: cfg.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const refreshData = await refreshRes.json() as { access_token?: string; expires_in?: number };
    if (refreshData.access_token) {
      cfg.accessToken = refreshData.access_token;
      cfg.expiresAt = String(Date.now() + (refreshData.expires_in || 3600) * 1000);
    }
  }
  return cfg.accessToken || "not_connected";
}

async function findOrCreateFolder(token: string): Promise<string> {
  const searchRes = await fetch(
    `${DRIVE_API}/files?q=name='MindMatrix' and mimeType='application/vnd.google-apps.folder'`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json() as { files?: { id: string }[] };
  const searchFiles = searchData.files;
  if (searchFiles && searchFiles.length > 0) return searchFiles[0].id;

  const createRes = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "MindMatrix", mimeType: "application/vnd.google-apps.folder" }),
  });
  const createData = await createRes.json() as { id?: string };
  return createData.id ?? "";
}

export const syncGoogleDrivePlugin: Plugin = {
  id: "sync-google-drive",
  name: "Google Drive Sync",
  description: "Sync notes to your Google Drive storage",
  version: "0.1.0",
  apiRoutes: {
    "GET /api/plugins/sync-google-drive/auth": async () => {
      return NextResponse.json({ url: GOOGLE_AUTH });
    },

    "GET /api/plugins/sync-google-drive/callback": async (req) => {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const clientId = url.searchParams.get("clientId");
      const clientSecret = url.searchParams.get("clientSecret");
      const workspaceId = url.searchParams.get("workspaceId");
      const redirectUri = url.searchParams.get("redirectUri");
      if (!code || !clientId || !clientSecret || !workspaceId) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
      }

      const access = await requirePluginAccess(req, workspaceId, "sync-google-drive");
      if (access instanceof Response) return access;

      const tokenRes = await fetch(GOOGLE_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri || "",
          grant_type: "authorization_code",
        }),
      });
      const data = await tokenRes.json() as { access_token?: string; refresh_token?: string; expires_in?: number };

      if (data.access_token) {
        return NextResponse.json({
          connected: true,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
        });
      }
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });
    },

    "POST /api/plugins/sync-google-drive/sync": async (req) => {
      const { workspaceId } = await req.json();
      const tokenOrResp = await getAccessToken(req, workspaceId);
      if (tokenOrResp instanceof Response) return tokenOrResp;
      if (typeof tokenOrResp !== "string") {
        return NextResponse.json({ error: "Token not available" }, { status: 400 });
      }
      const token = tokenOrResp;

      const notes = await db.query.note.findMany({ where: eq(note.workspaceId, workspaceId) });

      const folderId = await findOrCreateFolder(token);
      let synced = 0;

      for (const n of notes) {
        try {
          const filename = `${n.slug || n.id}.md`;
          const metadata = { name: filename, mimeType: "text/markdown", parents: [folderId] };
          const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
          const contentBlob = new Blob([n.content], { type: "text/markdown" });
          const formData = new FormData();
          formData.append("metadata", metadataBlob);
          formData.append("media", contentBlob);

          await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          synced++;
        } catch { /* skip */ }
      }

      return NextResponse.json({ synced });
    },

    "GET /api/plugins/sync-google-drive/status": async (req) => {
      const { searchParams } = new URL(req.url);
      const workspaceId = searchParams.get("workspaceId");
      if (!workspaceId) return NextResponse.json({ connected: false });
      const access = await requirePluginAccess(req, workspaceId, "sync-google-drive");
      if (access instanceof Response) return access;
      return NextResponse.json({ connected: !!access.config?.accessToken });
    },
  },
};
