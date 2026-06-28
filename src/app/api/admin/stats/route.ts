import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, user, workspace, note, folder, tag, pluginConfig, syncConnection } from "@/lib/db";
import { sql } from "@/lib/db";
import { count, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user || session.user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const [totalUsers] = await db.select({ value: count() }).from(user);
    const [totalWorkspaces] = await db.select({ value: count() }).from(workspace);
    const [totalNotes] = await db.select({ value: count() }).from(note);
    const [totalFolders] = await db.select({ value: count() }).from(folder);
    const [totalTags] = await db.select({ value: count() }).from(tag);
    const [totalPlugins] = await db.select({ value: count() }).from(pluginConfig).where(eq(pluginConfig.enabled, true));
    const [totalSyncs] = await db.select({ value: count() }).from(syncConnection);

    return NextResponse.json({
      stats: {
        users: totalUsers.value,
        workspaces: totalWorkspaces.value,
        notes: totalNotes.value,
        folders: totalFolders.value,
        tags: totalTags.value,
        enabledPlugins: totalPlugins.value,
        syncConnections: totalSyncs.value,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
