import { describe, it, expect } from "vitest";

describe("MindMatrix", () => {
  it("should have correct package name", () => {
    const pkg = require("../../package.json");
    expect(pkg.name).toBe("mindmatrix");
  });

  it("should have correct version", () => {
    const pkg = require("../../package.json");
    expect(pkg.version).toBe("0.2.0");
  });

  it("should have required dependencies", () => {
    const pkg = require("../../package.json");
    expect(pkg.dependencies).toHaveProperty("next");
    expect(pkg.dependencies).toHaveProperty("better-auth");
    expect(pkg.dependencies).toHaveProperty("drizzle-orm");
  });
});
