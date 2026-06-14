import { describe, it, expect } from "vitest";
import { toSlug, generateShortHash, ensureUniqueSlug } from "@/lib/slug";

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

describe("generateShortHash", () => {
  it("generates correct length", () => {
    expect(generateShortHash(5)).toHaveLength(5);
    expect(generateShortHash(8)).toHaveLength(8);
  });

  it("only contains lowercase alphanumeric characters", () => {
    const hash = generateShortHash(50);
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });
});

describe("ensureUniqueSlug", () => {
  it("returns base slug directly if it is unique", async () => {
    const base = "my-workspace";
    const slug = await ensureUniqueSlug(base, async (s) => s === "my-workspace");
    expect(slug).toBe("my-workspace");
  });

  it("appends a 5-character short hash on collision", async () => {
    const base = "private";
    // base slug is not unique, but anything else is
    const slug = await ensureUniqueSlug(base, async (s) => s !== "private");
    expect(slug).toMatch(/^private-[a-z0-9]{5}$/);
  });

  it("handles consecutive collisions elegantly", async () => {
    const base = "private";
    const existingSlugs = ["private", "private-abcde", "private-12345"];
    const slug = await ensureUniqueSlug(base, async (s) => !existingSlugs.includes(s));
    expect(slug).toMatch(/^private-[a-z0-9]{5}$/);
    expect(existingSlugs).not.toContain(slug);
  });
});
