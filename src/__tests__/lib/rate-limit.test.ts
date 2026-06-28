import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    const buckets = (globalThis as any).buckets;
    if (buckets) buckets.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("first request from an IP always allowed", async () => {
    const result = await rateLimit("192.168.1.1", 5, 60000);
    expect(result).toBe(true);
  });

  it("up to limit requests allowed within window", async () => {
    const limit = 5;
    for (let i = 0; i < limit; i++) {
      const result = await rateLimit("10.0.0.1", limit, 60000);
      expect(result).toBe(true);
    }
  });

  it("request limit+1 is denied", async () => {
    const limit = 3;
    const ip = "10.0.0.2";
    for (let i = 0; i < limit; i++) {
      await rateLimit(ip, limit, 60000);
    }
    const overLimit = await rateLimit(ip, limit, 60000);
    expect(overLimit).toBe(false);
  });

  it("different IPs get independent buckets", async () => {
    const limit = 2;
    // Exhaust ip-a
    await rateLimit("ip-a", limit, 60000);
    await rateLimit("ip-a", limit, 60000);
    expect(await rateLimit("ip-a", limit, 60000)).toBe(false);

    // ip-b should still have full budget
    expect(await rateLimit("ip-b", limit, 60000)).toBe(true);
    expect(await rateLimit("ip-b", limit, 60000)).toBe(true);
    expect(await rateLimit("ip-b", limit, 60000)).toBe(false);
  });

  it("old timestamps expire (manual)", async () => {
    const ip = "10.0.0.3";
    const limit = 2;
    const windowMs = 1000; // 1 second window

    // Use up the limit
    await rateLimit(ip, limit, windowMs);
    await rateLimit(ip, limit, windowMs);
    expect(await rateLimit(ip, limit, windowMs)).toBe(false);

    // Manually set old timestamps in the bucket so they fall outside the window
    const buckets = (globalThis as any).buckets as Map<string, { timestamps: number[] }>;
    const bucket = buckets.get(ip);
    if (bucket) {
      bucket.timestamps = [Date.now() - windowMs - 1, Date.now() - windowMs - 2];
    }

    // Now a request should be allowed (old timestamps are expired)
    expect(await rateLimit(ip, limit, windowMs)).toBe(true);
  });

  it("empty string IP works as key", async () => {
    const result = await rateLimit("", 5, 60000);
    expect(result).toBe(true);

    // Empty string should be usable as a key just like any other string
    await rateLimit("", 5, 60000);
    await rateLimit("", 5, 60000);
    const result2 = await rateLimit("", 5, 60000);
    expect(result2).toBe(true);
  });

  it("very short window expiration works", async () => {
    const ip = "10.0.0.4";
    const limit = 1;
    const windowMs = 1; // 1 ms window

    // First request allowed
    expect(await rateLimit(ip, limit, windowMs)).toBe(true);

    // Immediately second request denied (within 1ms window)
    expect(await rateLimit(ip, limit, windowMs)).toBe(false);

    // Manually expire by setting old timestamp
    const buckets = (globalThis as any).buckets as Map<string, { timestamps: number[] }>;
    const bucket = buckets.get(ip);
    if (bucket) {
      bucket.timestamps = [Date.now() - 10]; // 10ms ago, well outside 1ms window
    }

    // Now should be allowed again
    expect(await rateLimit(ip, limit, windowMs)).toBe(true);
  });
});
