import { NextResponse } from "next/server";
import { db, pluginConfig, workspace, workspaceMember } from "@/lib/db";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { encryptConfig, decryptConfig } from "@/lib/crypto";

const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  let workspaceId: string;
  try {
    const decoded = JSON.parse(atob(state));
    workspaceId = decoded.workspaceId;
  } catch {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, workspaceId),
      eq(workspaceMember.userId, session.user.id)
    ),
  });

  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await db.query.pluginConfig.findFirst({
    where: and(eq(pluginConfig.pluginId, "sync-google-drive"), eq(pluginConfig.workspaceId, workspaceId)),
  });

  if (!config?.config) {
    return NextResponse.json({ error: "Plugin not configured" }, { status: 400 });
  }

  const cfg = decryptConfig(config.config as Record<string, string>);
  const clientId = cfg.clientId as string;
  const clientSecret = cfg.clientSecret as string;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing client credentials" }, { status: 400 });
  }

  const redirectUri = `${new URL(request.url).origin}/api/oauth/google-drive`;

  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; refresh_token?: string; expires_in?: number };

  if (!tokenData.access_token) {
    const ws = await db.query.workspace.findFirst({ where: eq(workspace.id, workspaceId) });
    const slug = ws?.slug || workspaceId;
    return NextResponse.redirect(new URL(`/dashboard/w/${slug}/settings`, request.url));
  }

  const updatedConfig: Record<string, string> = {
    ...cfg,
    accessToken: tokenData.access_token,
    expiresAt: String(Date.now() + (tokenData.expires_in || 3600) * 1000),
  };
  if (tokenData.refresh_token) {
    updatedConfig.refreshToken = tokenData.refresh_token;
  }
  const encrypted = encryptConfig(updatedConfig);

  await db
    .update(pluginConfig)
    .set({ config: encrypted, enabled: true })
    .where(eq(pluginConfig.id, config.id));

  const ws = await db.query.workspace.findFirst({ where: eq(workspace.id, workspaceId) });
  const slug = ws?.slug || workspaceId;
  return NextResponse.redirect(new URL(`/dashboard/w/${slug}/settings`, request.url));
}
