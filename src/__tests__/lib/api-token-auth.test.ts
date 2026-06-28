import { describe, it, expect, beforeEach, vi } from "vitest";

// Use vi.hoisted() so the factory variables are available when vi.mock is hoisted
const { mockFindFirst, mockSet, mockWhere, mockUpdate } = vi.hoisted(() => {
  const mockFindFirst = vi.fn();
  const mockSet = vi.fn();
  const mockWhere = vi.fn();
  const mockUpdate = vi.fn();
  mockSet.mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
  return { mockFindFirst, mockSet, mockWhere, mockUpdate };
});

vi.mock("@/lib/db", () => ({
  db: {
    query: { apiToken: { findFirst: mockFindFirst } },
    update: mockUpdate,
  },
  apiToken: {},
}));

import { validateApiToken } from "@/lib/api-token-auth";

describe("validateApiToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSet.mockReturnValue({ where: mockWhere });
    mockUpdate.mockReturnValue({ set: mockSet });
  });

  it("returns userId for valid non-expired token", async () => {
    mockFindFirst.mockResolvedValue({
      id: "token-id-1",
      userId: "user-abc",
      token: "valid-token-123",
      expiresAt: null,
    });

    const result = await validateApiToken("valid-token-123");
    expect(result).toBe("user-abc");

    // Should update lastUsedAt
    expect(mockUpdate).toHaveBeenCalledWith({});
    expect(mockSet).toHaveBeenCalledWith({ lastUsedAt: expect.any(Date) });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("returns userId for token with future expiresAt", async () => {
    const futureDate = new Date(Date.now() + 86400000); // 1 day in future
    mockFindFirst.mockResolvedValue({
      id: "token-id-2",
      userId: "user-def",
      token: "future-token",
      expiresAt: futureDate,
    });

    const result = await validateApiToken("future-token");
    expect(result).toBe("user-def");
  });

  it("returns null for expired token (expiresAt in past)", async () => {
    const pastDate = new Date(Date.now() - 86400000); // 1 day in past
    mockFindFirst.mockResolvedValue({
      id: "token-id-3",
      userId: "user-ghi",
      token: "expired-token",
      expiresAt: pastDate,
    });

    const result = await validateApiToken("expired-token");
    expect(result).toBeNull();

    // Should NOT update lastUsedAt for expired token
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns null for non-existent token (findFirst → undefined)", async () => {
    mockFindFirst.mockResolvedValue(undefined);

    const result = await validateApiToken("nonexistent-token");
    expect(result).toBeNull();

    // Should NOT update
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns null when DB query throws", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB connection error"));

    const result = await validateApiToken("any-token");
    expect(result).toBeNull();
  });

  it("updates lastUsedAt on successful validation", async () => {
    mockFindFirst.mockResolvedValue({
      id: "token-id-4",
      userId: "user-jkl",
      token: "active-token",
      expiresAt: null,
    });

    await validateApiToken("active-token");

    expect(mockUpdate).toHaveBeenCalledWith({});
    expect(mockSet).toHaveBeenCalledWith({ lastUsedAt: expect.any(Date) });
    expect(mockWhere).toHaveBeenCalled();
  });
});
