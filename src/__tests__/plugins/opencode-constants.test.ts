import { describe, it, expect } from "vitest";
import { FALLBACK_MODELS, GO_ENDPOINT, GO_DOCS_URL } from "@/plugins/opencode-ai/constants";

describe("opencode-ai constants", () => {
  it("has correct endpoint", () => {
    expect(GO_ENDPOINT).toBe("https://opencode.ai/zen/go/v1");
  });

  it("has docs URL", () => {
    expect(GO_DOCS_URL).toBe("https://opencode.ai/docs/go/");
  });

  it("has 13 fallback models", () => {
    expect(FALLBACK_MODELS).toHaveLength(13);
  });

  it("all models have id and name", () => {
    for (const m of FALLBACK_MODELS) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
    }
  });
});
