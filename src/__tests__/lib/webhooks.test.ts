import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triggerWebhooks } from "@/lib/webhooks";

// ---- Hoisted mocks (must be hoisted so vi.mock factories can reference them) ----

const { mockFindMany, mockInsertValues, mockGetSafeResolvedUrl, mockFetch } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockInsertValues: vi.fn().mockResolvedValue(undefined),
  mockGetSafeResolvedUrl: vi.fn(),
  mockFetch: vi.fn(),
}));

// ---- Module mocks ----

vi.mock("@/lib/db", () => ({
  db: {
    query: { webhook: { findMany: mockFindMany } },
    insert: vi.fn(() => ({ values: mockInsertValues })),
  },
  webhook: { workspaceId: "workspace_id", active: "active" },
  webhookDeliveryLog: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: (_a: unknown, _b: unknown) => ({ _type: "eq" }),
  and: (...args: unknown[]) => ({ _type: "and", args }),
}));

vi.mock("@/lib/security", () => ({
  getSafeResolvedUrl: mockGetSafeResolvedUrl,
  isSafeUrl: vi.fn(),
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

globalThis.fetch = mockFetch;

// ---- Helpers ----

function createMockWebhook(overrides: Record<string, unknown> = {}) {
  return {
    id: "wh-1",
    workspaceId: "ws-1",
    name: "Test Webhook",
    url: "https://example.com/hook",
    secret: null,
    events: ["note.created", "note.updated"],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ---- Tests ----

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSafeResolvedUrl.mockResolvedValue({ url: "https://example.com/hook", host: "example.com" });
  mockFetch.mockResolvedValue({ ok: true, status: 200 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("triggerWebhooks", () => {
  it("dispatches to active hooks matching event", async () => {
    const hook = createMockWebhook();
    mockFindMany.mockResolvedValue([hook]);

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    await vi.waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    // Verify the fetch call arguments
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toBe("https://example.com/hook");
    expect(fetchCall[1].method).toBe("POST");
    expect(fetchCall[1].headers["Content-Type"]).toBe("application/json");
    expect(fetchCall[1].headers["User-Agent"]).toContain("MindMatrix-Webhook");

    // Verify body is valid JSON with correct structure
    const body = JSON.parse(fetchCall[1].body);
    expect(body.event).toBe("note.created");
    expect(body.workspaceId).toBe("ws-1");
    expect(body.data).toEqual({ title: "Test" });
  });

  it("skips hooks whose events array doesn't include triggered event", async () => {
    const hook = createMockWebhook({ events: ["folder.created"] });
    mockFindMany.mockResolvedValue([hook]);

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    // Give the async IIFE time to run; eligibleHooks will be empty
    await new Promise((r) => setTimeout(r, 100));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("skips hooks blocked by SSRF (getSafeResolvedUrl returns null)", async () => {
    const hook = createMockWebhook();
    mockFindMany.mockResolvedValue([hook]);
    mockGetSafeResolvedUrl.mockResolvedValue(null);

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    await new Promise((r) => setTimeout(r, 100));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("dispatchWithRetry stops on first success (verify 1 fetch call)", async () => {
    const hook = createMockWebhook();
    mockFindMany.mockResolvedValue([hook]);
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    await vi.waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );

    // Still only 1 call — no retry needed
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("dispatchWithRetry retries on failure up to 3 attempts (first 2 fail, 3rd succeeds)", async () => {
    vi.useFakeTimers();

    const hook = createMockWebhook();
    mockFindMany.mockResolvedValue([hook]);

    // First two fetch calls throw (network error), third succeeds
    mockFetch
      .mockRejectedValueOnce(new Error("Network failure 1"))
      .mockRejectedValueOnce(new Error("Network failure 2"))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    // Run all pending timers and microtasks to let retries complete
    await vi.runAllTimersAsync();

    expect(mockFetch).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it("dispatchWithRetry logs failure after all attempts exhausted", async () => {
    vi.useFakeTimers();

    const hook = createMockWebhook();
    mockFindMany.mockResolvedValue([hook]);

    // All fetch calls fail
    mockFetch.mockRejectedValue(new Error("Persistent failure"));

    triggerWebhooks("ws-1", "note.created", { title: "Test" });

    await vi.runAllTimersAsync();

    // On each failed attempt, dispatchWithRetry inserts a failure delivery log.
    // 3 attempts → 3 calls to db.insert(...).values({ success: false, ... })
    expect(mockInsertValues).toHaveBeenCalledTimes(3);

    // Verify each call logged a failure
    for (const call of mockInsertValues.mock.calls) {
      expect(call[0].success).toBe(false);
      expect(call[0].error).toBeTruthy();
    }

    vi.useRealTimers();
  });
});
