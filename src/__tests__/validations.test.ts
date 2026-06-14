import { describe, it, expect } from "vitest";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  createNoteSchema,
  updateNoteSchema,
  createFolderSchema,
  updateFolderSchema,
  createTagSchema,
  updateTagSchema,
  importNotesSchema,
  syncConnectionSchema,
} from "@/lib/validations";

describe("createWorkspaceSchema", () => {
  it("accepts valid input", () => {
    const result = createWorkspaceSchema.safeParse({ name: "My Team" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createWorkspaceSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createWorkspaceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = createWorkspaceSchema.safeParse({ name: "Test", description: "A workspace" });
    expect(result.success).toBe(true);
  });

  it("rejects name over 100 chars", () => {
    const result = createWorkspaceSchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("createNoteSchema", () => {
  it("accepts valid input", () => {
    const result = createNoteSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      title: "My Note",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing workspaceId", () => {
    const result = createNoteSchema.safeParse({ title: "Note" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid uuid workspaceId", () => {
    const result = createNoteSchema.safeParse({
      workspaceId: "not-a-uuid",
      title: "Note",
    });
    expect(result.success).toBe(false);
  });

  it("defaults content to empty string", () => {
    const result = createNoteSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Note",
    });
    if (result.success) {
      expect(result.data.content).toBe("");
    }
  });
});

describe("createTagSchema", () => {
  it("accepts valid input", () => {
    const result = createTagSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      name: "important",
    });
    expect(result.success).toBe(true);
  });

  it("defaults color to #88c0d0", () => {
    const result = createTagSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      name: "tag",
    });
    if (result.success) {
      expect(result.data.color).toBe("#88c0d0");
    }
  });

  it("rejects invalid color format", () => {
    const result = createTagSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      name: "tag",
      color: "red",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid hex color", () => {
    const result = createTagSchema.safeParse({
      workspaceId: "550e8400-e29b-41d4-a716-446655440000",
      name: "tag",
      color: "#ff5500",
    });
    expect(result.success).toBe(true);
  });
});

describe("addMemberSchema", () => {
  it("accepts valid email", () => {
    const result = addMemberSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = addMemberSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("defaults role to member", () => {
    const result = addMemberSchema.safeParse({ email: "user@example.com" });
    if (result.success) {
      expect(result.data.role).toBe("member");
    }
  });

  it("accepts admin role", () => {
    const result = addMemberSchema.safeParse({ email: "user@example.com", role: "admin" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid role", () => {
    const result = addMemberSchema.safeParse({ email: "user@example.com", role: "superadmin" });
    expect(result.success).toBe(false);
  });
});

describe("updateNoteSchema", () => {
  it("allows partial updates", () => {
    const result = updateNoteSchema.safeParse({ title: "New Title" });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = updateNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects null instead of string for title", () => {
    const result = updateNoteSchema.safeParse({ title: null });
    expect(result.success).toBe(false);
  });
});

describe("syncConnectionSchema", () => {
  it("accepts pcloud provider", () => {
    const result = syncConnectionSchema.safeParse({
      provider: "pcloud",
      accessToken: "token123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider", () => {
    const result = syncConnectionSchema.safeParse({
      provider: "dropbox",
      accessToken: "token",
    });
    expect(result.success).toBe(false);
  });
});
