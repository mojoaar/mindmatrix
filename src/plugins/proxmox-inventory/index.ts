import type { Plugin } from "@/plugins/types";
import { requirePluginAccess } from "@/plugins";

export const proxmoxInventoryPlugin: Plugin = {
  id: "proxmox-inventory",
  name: "Proxmox Inventory",
  description: "Scan Proxmox VMs, containers, and storage into a note",
  version: "0.1.0",
  apiRoutes: {
    "POST /api/plugins/proxmox-inventory/scan": async (req: Request) => {
      try {
        const { workspaceId } = await req.json();
        const access = await requirePluginAccess(req, workspaceId, "proxmox-inventory");
        if (access instanceof Response) return access;

        const cfg = access.config;
        const host = cfg?.host;
        const port = cfg?.port || 8006;
        const tokenId = cfg?.tokenId;
        const secret = cfg?.secret;
        const verifySSL = cfg?.verifySSL !== false;

        if (!host || !tokenId || !secret) {
          return Response.json({ error: "Host, tokenId, and secret required" }, { status: 400 });
        }

        const base = `https://${host}:${port}/api2/json`;
        const headers = {
          Authorization: `PVEAPIToken=${tokenId}=${secret}`,
        };
        const fetchOpts = { headers } as RequestInit;

        const clusterRes = await fetch(`${base}/cluster/status`, fetchOpts);
        const clusterData = await clusterRes.json();
        const isCluster = clusterData.data && clusterData.data.length > 0;
        const clusterInfo = isCluster ? clusterData.data[0] : null;

        const nodesRes = await fetch(`${base}/nodes`, fetchOpts);
        const nodesData = await nodesRes.json();
        const nodes = nodesData.data || [];

        let md = `# Proxmox Inventory — ${new Date().toISOString().slice(0, 16).replace("T", " ")}\n\n`;

        if (isCluster && clusterInfo) {
          md += `## Cluster: ${clusterInfo.name}\n`;
          md += `| Property | Value |\n| --- | --- |\n`;
          md += `| Nodes | ${clusterInfo.nodes} |\n`;
          md += `| Quorate | ${clusterInfo.quorate ? "Yes" : "No"} |\n\n`;
        }

        for (const node of nodes) {
          md += `## Node: ${node.node}\n\n`;

          try {
            const statusRes = await fetch(`${base}/nodes/${node.node}/status`, fetchOpts);
            const status = await statusRes.json();
            if (status.data) {
              const s = status.data;
              md += `| CPU | Memory | Uptime |\n| --- | --- | --- |\n`;
              md += `| ${(s.cpu * 100).toFixed(0)}% | ${(s.memory.used / 1024 / 1024 / 1024).toFixed(0)}/${(s.memory.total / 1024 / 1024 / 1024).toFixed(0)}GB | ${Math.floor(s.uptime / 86400)}d |\n\n`;
            }
          } catch { /* skip */ }

          try {
            const vmRes = await fetch(`${base}/nodes/${node.node}/qemu`, fetchOpts);
            const vmData = await vmRes.json();
            const vms = vmData.data || [];
            if (vms.length > 0) {
              md += `### Virtual Machines (${node.node})\n`;
              md += `| ID | Name | CPUs | Memory | Status |\n| --- | --- | --- | --- | --- |\n`;
              for (const vm of vms) {
                md += `| ${vm.vmid} | ${vm.name || "-"} | ${vm.cpus || "-"} | ${vm.maxmem ? (vm.maxmem / 1024 / 1024 / 1024).toFixed(0) + "GB" : "-"} | ${vm.status} |\n`;
              }
              md += "\n";
            }
          } catch { /* skip */ }

          try {
            const ctRes = await fetch(`${base}/nodes/${node.node}/lxc`, fetchOpts);
            const ctData = await ctRes.json();
            const cts = ctData.data || [];
            if (cts.length > 0) {
              md += `### Containers (${node.node})\n`;
              md += `| ID | Name | CPUs | Memory | Status |\n| --- | --- | --- | --- | --- |\n`;
              for (const ct of cts) {
                md += `| ${ct.vmid} | ${ct.name || "-"} | ${ct.cpus || "-"} | ${ct.maxmem ? (ct.maxmem / 1024 / 1024 / 1024).toFixed(0) + "GB" : "-"} | ${ct.status} |\n`;
              }
              md += "\n";
            }
          } catch { /* skip */ }

          try {
            const storageRes = await fetch(`${base}/nodes/${node.node}/storage`, fetchOpts);
            const storageData = await storageRes.json();
            const storageList = storageData.data || [];
            if (storageList.length > 0) {
              md += `### Storage (${node.node})\n`;
              md += `| Name | Type | Size | Used |\n| --- | --- | --- | --- |\n`;
              for (const s of storageList) {
                md += `| ${s.storage} | ${s.type} | ${s.total ? (s.total / 1024 / 1024 / 1024).toFixed(0) + "GB" : "-"} | ${s.used ? (s.used / 1024 / 1024 / 1024).toFixed(0) + "GB" : "-"} |\n`;
              }
              md += "\n";
            }
          } catch { /* skip */ }
        }

        const db = await import("@/lib/db");
        const noteId = crypto.randomUUID();
        const now = new Date();
        await db.db.insert(db.note).values({
          id: noteId,
          workspaceId,
          title: `Proxmox Inventory — ${now.toISOString().slice(0, 10)}`,
          slug: `proxmox-inventory-${now.toISOString().slice(0, 10)}`,
          content: md,
          createdById: access.userId,
          updatedById: access.userId,
        });

        return Response.json({ noteId });
      } catch (e: any) {
        return Response.json({ error: e.message || "Scan failed" }, { status: 500 });
      }
    },
  },
};
