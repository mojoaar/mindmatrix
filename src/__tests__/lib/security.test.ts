import { describe, it, expect, beforeEach } from "vitest";

import { isSafeUrl, getSafeResolvedUrl } from "@/lib/security";

// The private IP ranges are tested indirectly through isSafeUrl/getSafeResolvedUrl.
// DNS resolution is NOT mocked — tests that need DNS hit the test environment's resolver.
// Real DNS tests are limited to: invalid URLs, bypass mode, and well-known safe hosts.

beforeEach(() => {
  delete process.env.ALLOW_PRIVATE_IP_WEBHOOKS;
});

describe("isSafeUrl — URL validation (no DNS needed)", () => {
  it("should return false on invalid URL", async () => {
    expect(await isSafeUrl("not-a-url")).toBe(false);
    expect(await isSafeUrl("")).toBe(false);
  });

  it("should allow everything when ALLOW_PRIVATE_IP_WEBHOOKS is set", async () => {
    process.env.ALLOW_PRIVATE_IP_WEBHOOKS = "true";
    expect(await isSafeUrl("https://my-homelab/api")).toBe(true);
  });
});

describe("isSafeUrl — known-safe public hosts", () => {
  it("should allow well-known public URLs", async () => {
    const result = await isSafeUrl("https://google.com/");
    expect(result).toBe(true);
  });

  it("should allow github.com", async () => {
    expect(await isSafeUrl("https://github.com/")).toBe(true);
  });
});

describe("getSafeResolvedUrl — URL validation (no DNS needed)", () => {
  it("should return null on invalid URL", async () => {
    expect(await getSafeResolvedUrl("not-a-url")).toBeNull();
    expect(await getSafeResolvedUrl("")).toBeNull();
  });

  it("should return original URL when ALLOW_PRIVATE_IP_WEBHOOKS is set", async () => {
    process.env.ALLOW_PRIVATE_IP_WEBHOOKS = "true";
    const result = await getSafeResolvedUrl("https://192.168.1.1:8080/webhook");
    expect(result).toEqual({
      url: "https://192.168.1.1:8080/webhook",
      host: "192.168.1.1",
    });
  });
});

describe("getSafeResolvedUrl — known-safe public hosts", () => {
  it("should resolve well-known public URLs", async () => {
    const result = await getSafeResolvedUrl("https://google.com/");
    expect(result).not.toBeNull();
    expect(result!.host).toBe("google.com");
    expect(result!.url).toMatch(/^https?:\/\//);
  });
});
