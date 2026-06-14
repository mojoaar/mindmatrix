import { describe, it, expect } from "vitest";
import { OpenCodeClient } from "@/plugins/opencode-ai/opencode-client";

describe("OpenCodeClient", () => {
  const client = new OpenCodeClient();

  it("getFallbackModels returns 13 models", () => {
    const models = client.getFallbackModels();
    expect(models).toHaveLength(13);
    expect(models[0]).toHaveProperty("id");
    expect(models[0]).toHaveProperty("name");
  });

  it("getFallbackModels includes deepseek-v4-pro", () => {
    const models = client.getFallbackModels();
    expect(models.find((m) => m.id === "deepseek-v4-pro")).toBeTruthy();
  });
});
