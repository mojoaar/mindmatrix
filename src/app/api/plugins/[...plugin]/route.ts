import { NextResponse } from "next/server";
import { getPlugin } from "@/plugins";
import { auth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ plugin: string[] }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plugin } = await params;
  const [pluginId, ...rest] = plugin;
  const route = rest.join("/") || "";
  const pluginDef = getPlugin(pluginId);

  if (!pluginDef?.apiRoutes) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const handler = pluginDef.apiRoutes[`POST /api/plugins/${pluginId}/${route}`];
  if (!handler) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return handler(request);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ plugin: string[] }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plugin } = await params;
  const [pluginId, ...rest] = plugin;
  const route = rest.join("/") || "";
  const pluginDef = getPlugin(pluginId);

  if (!pluginDef?.apiRoutes) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const handler = pluginDef.apiRoutes[`GET /api/plugins/${pluginId}/${route}`];
  if (!handler) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  return handler(request);
}
