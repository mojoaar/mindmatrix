import { describe, it, expect } from "vitest";
import { pluginMetadata } from "@/plugins/metadata";

describe("plugin metadata", () => {
  it("has 5 plugins", () => {
    expect(pluginMetadata).toHaveLength(5);
  });

  it("has unique IDs", () => {
    const ids = pluginMetadata.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all plugins have required fields", () => {
    for (const plugin of pluginMetadata) {
      expect(plugin.id).toBeTruthy();
      expect(plugin.name).toBeTruthy();
      expect(plugin.description).toBeTruthy();
      expect(plugin.version).toBeTruthy();
    }
  });

  it("includes opencode-ai", () => {
    expect(pluginMetadata.find((p) => p.id === "opencode-ai")).toBeTruthy();
  });

  it("includes sync-pcloud and sync-google-drive", () => {
    expect(pluginMetadata.find((p) => p.id === "sync-pcloud")).toBeTruthy();
    expect(pluginMetadata.find((p) => p.id === "sync-google-drive")).toBeTruthy();
  });
});
