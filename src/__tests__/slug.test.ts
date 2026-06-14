import { describe, it, expect } from "vitest";
import { toSlug } from "@/lib/slug";

describe("toSlug", () => {
  it("lowercases input", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(toSlug("my team notes")).toBe("my-team-notes");
  });

  it("removes special characters", () => {
    expect(toSlug("Hello! @World#")).toBe("hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(toSlug("  hello world  ")).toBe("hello-world");
  });

  it("handles single word", () => {
    expect(toSlug("test")).toBe("test");
  });

  it("collapses multiple consecutive non-alphanumeric chars", () => {
    expect(toSlug("hello!!!world")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(toSlug("")).toBe("");
  });

  it("handles accented characters by removing them", () => {
    expect(toSlug("café résumé")).toBe("caf-r-sum");
  });
});
