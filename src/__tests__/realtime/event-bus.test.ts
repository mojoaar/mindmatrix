import { describe, it, expect, vi } from "vitest";
import { getEventBus } from "@/lib/realtime/event-bus";

vi.mock("@/lib/db", () => ({
  sql: {
    listen: vi.fn().mockResolvedValue(undefined),
    notify: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("event-bus", () => {
  it("returns singleton", () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();
    expect(bus1).toBe(bus2);
  });

  it("subscribe returns unsubscribe function", () => {
    const bus = getEventBus();
    const unsub = bus.subscribe("test-channel", () => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("notify does not throw", async () => {
    const bus = getEventBus();
    await expect(bus.notify("test", { foo: "bar" })).resolves.toBeUndefined();
  });
});
