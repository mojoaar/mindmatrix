import type { Plugin } from "./types";
import { syncPcloudPlugin } from "./sync-pcloud";
import { syncGoogleDrivePlugin } from "./sync-google-drive";
import { opencodeAiPlugin } from "./opencode-ai";
import { proxmoxInventoryPlugin } from "./proxmox-inventory";
import { unifiTopologyPlugin } from "./unifi-topology";

export const plugins: Plugin[] = [
  syncPcloudPlugin,
  syncGoogleDrivePlugin,
  opencodeAiPlugin,
  proxmoxInventoryPlugin,
  unifiTopologyPlugin,
];

export function getPlugin(id: string): Plugin | undefined {
  return plugins.find((p) => p.id === id);
}
