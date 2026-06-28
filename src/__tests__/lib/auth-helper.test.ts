import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so the factory variables are available when vi.mock is hoisted
const { mockGetSession, mockValidateApiToken } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockValidateApiToken = vi.fn();
  return { mockGetSession, mockValidateApiToken };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mockGetSession } },
}));

vi.mock("@/lib/api-token-auth", () => ({
  validateApiToken: mockValidateApiToken,
}));

import { getAuthUser } from "@/lib/auth-helper";

describe("getAuthUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user when session is valid", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Alice",
        email: "alice@example.com",
        role: "admin",
      },
    });

    const request = new Request("http://localhost/api/test");
    const result = await getAuthUser(request);

    expect(result).toEqual({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      role: "admin",
    });
  });

  it('returns user with role "user" when session user has no role field', async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "user-2",
        name: "Bob",
        email: "bob@example.com",
      },
    });

    const request = new Request("http://localhost/api/test");
    const result = await getAuthUser(request);

    expect(result).toEqual({
      id: "user-2",
      name: "Bob",
      email: "bob@example.com",
      role: "user",
    });
  });

  it("returns user when Bearer token is valid and no session", async () => {
    mockGetSession.mockResolvedValue(null); // no session
    mockValidateApiToken.mockResolvedValue("user-3");

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer valid-api-token-123" },
    });
    const result = await getAuthUser(request);

    expect(result).toEqual({
      id: "user-3",
      name: "API Token",
      email: "",
      role: "user",
    });
    expect(mockValidateApiToken).toHaveBeenCalledWith("valid-api-token-123");
  });

  it("returns null when no session and no Authorization header", async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/test");
    const result = await getAuthUser(request);

    expect(result).toBeNull();
    expect(mockValidateApiToken).not.toHaveBeenCalled();
  });

  it('returns null when Authorization header is not "Bearer " prefixed', async () => {
    mockGetSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const result = await getAuthUser(request);

    expect(result).toBeNull();
    expect(mockValidateApiToken).not.toHaveBeenCalled();
  });

  it("returns null when Bearer token exists but validateApiToken returns null", async () => {
    mockGetSession.mockResolvedValue(null);
    mockValidateApiToken.mockResolvedValue(null);

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer invalid-token" },
    });
    const result = await getAuthUser(request);

    expect(result).toBeNull();
    expect(mockValidateApiToken).toHaveBeenCalledWith("invalid-token");
  });

  it("returns session user over Bearer token when both present", async () => {
    mockGetSession.mockResolvedValue({
      user: {
        id: "session-user",
        name: "SessionUser",
        email: "session@example.com",
        role: "member",
      },
    });
    mockValidateApiToken.mockResolvedValue("bearer-user");

    const request = new Request("http://localhost/api/test", {
      headers: { Authorization: "Bearer some-token" },
    });
    const result = await getAuthUser(request);

    // Session wins — should return session user, not bearer token user
    expect(result).toEqual({
      id: "session-user",
      name: "SessionUser",
      email: "session@example.com",
      role: "member",
    });

    // validateApiToken should NOT be called since session was valid
    expect(mockValidateApiToken).not.toHaveBeenCalled();
  });
});
