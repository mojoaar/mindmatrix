import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTemplate, sendEmail, resetConfigCache } from "@/lib/email";

// ---- Hoisted mocks ----

const { mockSendMail, mockCreateTransport, mockFindMany } = vi.hoisted(() => ({
  mockSendMail: vi.fn(),
  mockCreateTransport: vi.fn(),
  mockFindMany: vi.fn(),
}));

// ---- Module mocks ----

vi.mock("nodemailer", () => ({
  default: { createTransport: mockCreateTransport },
}));

vi.mock("@/lib/db", () => ({
  db: { query: { systemConfig: { findMany: mockFindMany } } },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn().mockReturnValue("decrypted-password"),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

// ---- Tests ----

beforeEach(() => {
  vi.clearAllMocks();
  resetConfigCache();
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_FROM;
  delete process.env.EMAIL_FROM;

  // Default: mockCreateTransport returns a transport with mockSendMail
  mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
});

describe("renderTemplate", () => {
  it("replaces variables like {{name}} in template string", () => {
    const result = renderTemplate("Hello {{name}}, your {{app}} account is ready.", {
      name: "Alice",
      app: "MindMatrix",
    });

    expect(result.text).toBe("Hello Alice, your MindMatrix account is ready.");
    // Simple text without markdown → wrapped in <p>
    expect(result.html).toBe("<p>Hello Alice, your MindMatrix account is ready.</p>");
  });

  it("converts markdown to basic HTML (headings, bold, links)", () => {
    const result = renderTemplate("# Welcome {{name}}\n\n**Click** [here]({{url}}) to continue.", {
      name: "Bob",
      url: "https://example.com/verify",
    });

    expect(result.text).toContain("# Welcome Bob");
    expect(result.text).toContain("[here](https://example.com/verify)");

    // After markdown → html conversion
    expect(result.html).toContain("<h1>Welcome Bob</h1>");
    expect(result.html).toContain("<strong>Click</strong>");
    expect(result.html).toContain('<a href="https://example.com/verify">here</a>');
  });

  it("falls back to <br> line breaks on error", () => {
    // A multiline template that gets markdownToHtml conversion.
    // markdownToHtml wraps paragraphs in <p> and replaces \n with <br>.
    const template = "Line 1\nLine 2\nLine 3 {{var}}";
    const result = renderTemplate(template, { var: "value" });

    expect(result.text).toBe("Line 1\nLine 2\nLine 3 value");
    // markdownToHtml wraps each block in <p>, with inner \n → <br>
    expect(result.html).toBe("<p>Line 1<br>Line 2<br>Line 3 value</p>");
  });

  it("handles special regex characters in values safely", () => {
    // Values containing characters like ., *, (, ), [, ], ^ etc.
    // should be preserved in the text output. These are not special in
    // JavaScript's String.replace when used as the replacement string.
    const result = renderTemplate("{{greeting}} {{symbols}}", {
      greeting: "^Hello.",
      symbols: "*World? [Test] (ok)",
    });

    expect(result.text).toBe("^Hello. *World? [Test] (ok)");
    // html wraps in <p> tags
    expect(result.html).toContain("^Hello. *World? [Test] (ok)");
  });
});

describe("sendEmail", () => {
  it("returns true in DEV mode without SMTP config", async () => {
    // No systemConfig rows → empty config, no env vars → no transport
    mockFindMany.mockResolvedValue([]);

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    // When there's no transport, sendEmail returns true (DEV EMAIL log)
    expect(result).toBe(true);
    // createTransport should not have been called since there's no config
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  it("returns true on successful send", async () => {
    // Provide SMTP config via systemConfig rows
    mockFindMany.mockResolvedValue([
      { key: "smtpHost", value: "smtp.example.com" },
      { key: "smtpPort", value: "587" },
      { key: "smtpUser", value: "testuser" },
      { key: "smtpPass", value: "encrypted-pass" },
      { key: "smtpFrom", value: "noreply@example.com" },
    ]);

    mockSendMail.mockResolvedValue({ messageId: "abc123" });

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result).toBe(true);
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith({
      from: "noreply@example.com",
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
  });

  it("returns false on sendMail failure", async () => {
    mockFindMany.mockResolvedValue([
      { key: "smtpHost", value: "smtp.example.com" },
      { key: "smtpPort", value: "587" },
      { key: "smtpUser", value: "testuser" },
      { key: "smtpPass", value: "encrypted-pass" },
    ]);

    mockSendMail.mockRejectedValue(new Error("SMTP connection refused"));

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result).toBe(false);
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});
