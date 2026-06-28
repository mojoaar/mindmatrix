import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotification } from "@/lib/notifications";

// ---- Hoisted mocks ----

const { mockReturning, mockValues, mockInsert, mockNotify } = vi.hoisted(() => {
  const mReturning = vi.fn();
  const mValues = vi.fn(() => ({ returning: mReturning }));
  const mInsert = vi.fn(() => ({ values: mValues }));
  const mNotify = vi.fn().mockResolvedValue(undefined);
  return {
    mockReturning: mReturning,
    mockValues: mValues,
    mockInsert: mInsert,
    mockNotify: mNotify,
  };
});

// ---- Module mocks ----

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
  notification: {},
}));

vi.mock("@/lib/realtime/event-bus", () => ({
  getEventBus: vi.fn(() => ({ notify: mockNotify })),
}));

// ---- Tests ----

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNotification", () => {
  it("creates notification and returns the row", async () => {
    const fakeRow = {
      id: "notif-123",
      userId: "user-1",
      type: "mention",
      title: "You were mentioned",
      message: "Alice mentioned you in a note",
      link: "/dashboard/w/my-workspace/doc/my-note",
      isRead: false,
      createdAt: new Date(),
    };

    mockReturning.mockResolvedValue([fakeRow]);

    const result = await createNotification({
      userId: "user-1",
      type: "mention",
      title: "You were mentioned",
      message: "Alice mentioned you in a note",
      link: "/dashboard/w/my-workspace/doc/my-note",
    });

    expect(result).toEqual(fakeRow);

    // Verify db.insert was called
    expect(mockInsert).toHaveBeenCalledTimes(1);

    // Verify values were passed correctly
    expect(mockValues).toHaveBeenCalledTimes(1);
    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.userId).toBe("user-1");
    expect(valuesArg.type).toBe("mention");
    expect(valuesArg.title).toBe("You were mentioned");
    expect(valuesArg.message).toBe("Alice mentioned you in a note");
    expect(valuesArg.link).toBe("/dashboard/w/my-workspace/doc/my-note");
  });

  it("sets link to null when not provided", async () => {
    const fakeRow = {
      id: "notif-456",
      userId: "user-2",
      type: "system",
      title: "Welcome",
      message: "Welcome to MindMatrix",
      link: null,
      isRead: false,
      createdAt: new Date(),
    };

    mockReturning.mockResolvedValue([fakeRow]);

    const result = await createNotification({
      userId: "user-2",
      type: "system",
      title: "Welcome",
      message: "Welcome to MindMatrix",
    });

    expect(result!.link).toBeNull();

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.link).toBeNull();
  });

  it("sets link to provided value", async () => {
    const fakeRow = {
      id: "notif-789",
      userId: "user-3",
      type: "comment",
      title: "New comment",
      message: "Bob commented on your note",
      link: "/dashboard/w/ws/doc/note-1#comments",
      isRead: false,
      createdAt: new Date(),
    };

    mockReturning.mockResolvedValue([fakeRow]);

    const result = await createNotification({
      userId: "user-3",
      type: "comment",
      title: "New comment",
      message: "Bob commented on your note",
      link: "/dashboard/w/ws/doc/note-1#comments",
    });

    expect(result!.link).toBe("/dashboard/w/ws/doc/note-1#comments");

    const valuesArg = mockValues.mock.calls[0][0];
    expect(valuesArg.link).toBe("/dashboard/w/ws/doc/note-1#comments");
  });

  it("sends event via event bus for real-time delivery", async () => {
    const fakeRow = {
      id: "notif-101",
      userId: "user-4",
      type: "share",
      title: "Note shared",
      message: "A note was shared with you",
      link: "/dashboard/w/ws/doc/shared-note",
      isRead: false,
      createdAt: new Date(),
    };

    mockReturning.mockResolvedValue([fakeRow]);

    await createNotification({
      userId: "user-4",
      type: "share",
      title: "Note shared",
      message: "A note was shared with you",
      link: "/dashboard/w/ws/doc/shared-note",
    });

    // Event bus notify should have been called with the user channel
    expect(mockNotify).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith("user:user-4", {
      type: "new_notification",
      notification: fakeRow,
    });
  });

  it("returns undefined on DB insert error (doesn't throw)", async () => {
    // Simulate a DB error
    mockReturning.mockRejectedValue(new Error("DB connection lost"));

    const result = await createNotification({
      userId: "user-5",
      type: "error",
      title: "Test Error",
      message: "This should not crash",
    });

    // Should return undefined (not throw)
    expect(result).toBeUndefined();

    // Event bus should NOT have been called (caught before notify)
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
