import type { Plugin } from "@/plugins/types";

export const unifiTopologyPlugin: Plugin = {
  id: "unifi-topology",
  name: "Unifi Topology",
  description: "Scan Unifi network devices, clients, and WiFi into a note",
  version: "0.1.0",
  apiRoutes: {
    "POST /api/plugins/unifi-topology/scan": async (req: Request) => {
      try {
        const { workspaceId } = await req.json();
        const auth = await import("@/lib/auth");
        const db = await import("@/lib/db");
        const session = await auth.auth.api.getSession({ headers: req.headers });
        if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const config = await db.db.query.pluginConfig.findFirst({
          where: (pc: any, { and, eq }: any) =>
            and(eq(pc.workspaceId, workspaceId), eq(pc.pluginId, "unifi-topology")),
        });
        if (!config?.enabled) return Response.json({ error: "Plugin not enabled" }, { status: 400 });

        const cfg = config.config as any;
        const host = cfg?.host;
        const port = cfg?.port || 443;
        const username = cfg?.username;
        const password = cfg?.password;
        const site = cfg?.site || "default";

        if (!host || !username || !password) {
          return Response.json({ error: "Host, username, and password required" }, { status: 400 });
        }

        const base = `https://${host}:${port}`;

        // Login
        const loginRes = await fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!loginRes.ok) return Response.json({ error: "Unifi login failed" }, { status: 400 });
        const cookie = loginRes.headers.get("set-cookie") || "";
        const fetchOpts = { headers: { Cookie: cookie } } as RequestInit;

        let md = `# Unifi Network Topology — ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n`;

        // Devices
        try {
          const devRes = await fetch(`${base}/api/s/${site}/stat/device`, fetchOpts);
          const devData = await devRes.json();
          const devices = devData.data || [];
          if (devices.length > 0) {
            md += `## Devices\n| Name | Model | Type | IP | Status |\n| --- | --- | --- | --- | --- |\n`;
            for (const d of devices) {
              md += `| ${d.name || "-"} | ${d.model || "-"} | ${d.type || "-"} | ${d.ip || "-"} | ${d.state === 1 ? "online" : "offline"} |\n`;
            }
            md += "\n";
          }
        } catch { /* skip */ }

        // WiFi networks
        try {
          const wlanRes = await fetch(`${base}/api/s/${site}/rest/wlanconf`, fetchOpts);
          const wlanData = await wlanRes.json();
          const wlans = wlanData.data || [];
          if (wlans.length > 0) {
            md += `## WiFi Networks\n| Name | Band | Security |\n| --- | --- | --- |\n`;
            for (const w of wlans) {
              md += `| ${w.name || "-"} | ${w.radio || "-"} | ${w.security || "-"} |\n`;
            }
            md += "\n";
          }
        } catch { /* skip */ }

        // Clients
        try {
          const staRes = await fetch(`${base}/api/s/${site}/stat/sta`, fetchOpts);
          const staData = await staRes.json();
          const clients = staData.data || [];
          if (clients.length > 0) {
            md += `## Clients\n| Name | IP | MAC | Signal |\n| --- | --- | --- | --- |\n`;
            for (const c of clients.slice(0, 50)) {
              md += `| ${c.hostname || c.name || "-"} | ${c.ip || "-"} | ${c.mac || "-"} | ${c.signal ? c.signal + "dBm" : "-"} |\n`;
            }
            if (clients.length > 50) md += `| ... | ${clients.length - 50} more clients | ... | ... |\n`;
            md += "\n";
          }
        } catch { /* skip */ }

        const noteId = crypto.randomUUID();
        const now = new Date();
        await db.db.insert(db.note).values({
          id: noteId,
          workspaceId,
          title: `Unifi Topology — ${now.toISOString().slice(0, 10)}`,
          slug: `unifi-topology-${now.toISOString().slice(0, 10)}`,
          content: md,
          createdById: session.user.id,
          updatedById: session.user.id,
        });

        return Response.json({ noteId });
      } catch (e: any) {
        return Response.json({ error: e.message || "Scan failed" }, { status: 500 });
      }
    },
  },
};
