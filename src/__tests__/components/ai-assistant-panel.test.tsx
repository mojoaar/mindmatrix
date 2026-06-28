import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { AIAssistantPanel } from "@/components/editor/ai-assistant-panel";

// ── JSDOM polyfills ──────────────────────────────────
beforeAll(() => {
  // jsdom doesn't implement scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

// ── Toast Mocks ───────────────────────────────────────
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

// ── Clipboard Mock ────────────────────────────────────
const mockWriteText = vi.fn();
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

// ── Helpers ───────────────────────────────────────────
function mockJsonResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  };
}

function renderPanel(props = {}) {
  const defaults = {
    noteId: "note-1",
    workspaceId: "ws-1",
    noteContent: "# Test Note",
    setContent: vi.fn(),
    insertAtCursor: vi.fn(),
    onClose: vi.fn(),
    onStatusLoaded: vi.fn(),
    userName: "Test User",
  };
  return render(<AIAssistantPanel {...defaults} {...props} />);
}

/** Get the Send button (icon-only, next to the input) */
function getSendButton(): HTMLElement {
  const input = screen.getByPlaceholderText("Ask AI anything...");
  return input.parentElement!.querySelector("button")!;
}

/** Get the Close button (icon-only, in the header) */
function getCloseButton(): HTMLElement {
  const buttons = screen.getAllByRole("button");
  const iconButtons = buttons.filter((b) => b.textContent === "");
  // Close button is first icon-only button (in header), Send is second
  return iconButtons[0];
}

/** Flush pending microtasks + timers so React state updates settle */
async function flushAsync() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
}

// ── setTimeout override for fast retries ──────────────
// We directly replace globalThis.setTimeout (NOT via vi.spyOn) to avoid
// infinite recursion with RTL's waitFor which also calls setTimeout.
// Retry delays ≥ 1000 ms are shortened to 0 ms; shorter intervals pass through.
let _originalSetTimeout: typeof setTimeout | null = null;

function speedUpRetryDelays() {
  if (_originalSetTimeout) return; // already installed
  _originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = ((fn: TimerHandler, ms?: number, ...args: any[]) => {
    const delay = ms != null && ms >= 1000 ? 0 : (ms ?? 0);
    return _originalSetTimeout!(fn, delay, ...args);
  }) as typeof setTimeout;
}

function restoreSetTimeout() {
  if (_originalSetTimeout) {
    globalThis.setTimeout = _originalSetTimeout;
    _originalSetTimeout = null;
  }
}

// ── Test Suite ────────────────────────────────────────

describe("AIAssistantPanel", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch as unknown as typeof fetch;

    // Default: both plugins enabled
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ enabled: true })) // opencode-ai
      .mockResolvedValueOnce(mockJsonResponse({ enabled: true })); // opencode-zen
  });

  afterEach(() => {
    vi.useRealTimers();
    restoreSetTimeout(); // safety net
  });

  // ── Basic Rendering ───────────────────────────────

  it("renders nothing (null) while config is loading", () => {
    const { container } = renderPanel();
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when both plugins are disabled", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ enabled: false }))
      .mockResolvedValueOnce(mockJsonResponse({ enabled: false }));

    const { container } = renderPanel();

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.innerHTML).toBe("");
  });

  it('shows "Ask the AI to improve..." prompt when plugins enabled and no messages yet', async () => {
    renderPanel();

    await waitFor(() => {
      expect(
        screen.getByText(/Ask the AI to improve, summarize, rewrite, or analyze this note\./)
      ).toBeTruthy();
    });
  });

  it("shows provider toggle (Go/Zen buttons) when both Go and Zen are enabled", async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByText("Go")).toBeTruthy();
      expect(screen.getByText("Zen")).toBeTruthy();
    });
  });

  it("hides provider toggle when only Go is enabled", async () => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ enabled: true })) // Go
      .mockResolvedValueOnce(mockJsonResponse({ enabled: false })); // Zen

    renderPanel();

    await waitFor(() => {
      expect(screen.getByText(/AI Assistant/)).toBeTruthy();
    });

    expect(screen.queryByText("Zen")).toBeFalsy();
  });

  // ── User Interaction ──────────────────────────────

  it("submit button is disabled when input is empty", async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const sendButton = getSendButton();
    expect(sendButton).toBeDisabled();
  });

  it("user message appears in chat after typing and clicking send", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Here is my response." })
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Hello AI" } });

    const sendButton = getSendButton();
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText("Hello AI")).toBeTruthy();
    });
  });

  it("input clears after submit", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Response" })
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText(
      "Ask AI anything..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Test message" } });
    expect(input.value).toBe("Test message");

    fireEvent.click(getSendButton());

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("close button calls onClose prop", async () => {
    const onClose = vi.fn();
    renderPanel({ onClose });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    fireEvent.click(getCloseButton());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("Enter key submits message", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "AI says hello back" })
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Enter submit test" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Enter submit test")).toBeTruthy();
    });
  });

  // ── API Interaction (non-retry) ───────────────────
  // These tests run BEFORE the retry tests to avoid any leaked
  // global setTimeout modifications.

  it("assistant message appears after successful API response", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "I have analyzed your note and here are suggestions." })
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Please analyze this" } });
    fireEvent.click(getSendButton());

    await waitFor(() => {
      expect(
        screen.getByText("I have analyzed your note and here are suggestions.")
      ).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByText("Copy")).toBeTruthy();
      expect(screen.getByText("Insert")).toBeTruthy();
      expect(screen.getByText("Append")).toBeTruthy();
    });
  });

  it("copy button copies message content to clipboard", async () => {
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Copy this text" })
    );

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText("Ask AI anything..."), {
      target: { value: "Generate text" },
    });
    fireEvent.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("Copy")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Copy"));

    expect(mockWriteText).toHaveBeenCalledWith("Copy this text");
    expect(mockToastSuccess).toHaveBeenCalledWith("Copied to clipboard");
  });

  it("insert button calls insertAtCursor prop", async () => {
    const insertAtCursor = vi.fn();

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Inserted content" })
    );

    renderPanel({ insertAtCursor });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText("Ask AI anything..."), {
      target: { value: "Give me text" },
    });
    fireEvent.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("Insert")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Insert"));

    expect(insertAtCursor).toHaveBeenCalledWith("Inserted content");
  });

  it("append button calls setContent prop", async () => {
    const setContent = vi.fn();
    const noteContent = "# Existing Content";

    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Appended content" })
    );

    renderPanel({ setContent, noteContent });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    fireEvent.change(screen.getByPlaceholderText("Ask AI anything..."), {
      target: { value: "Give text to append" },
    });
    fireEvent.click(getSendButton());

    await waitFor(() => {
      expect(screen.getByText("Append")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Append"));

    expect(setContent).toHaveBeenCalledWith(
      "# Existing Content\n\nAppended content"
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("Appended to note");
  });

  // ── Retry Tests ──────────────────────────────────
  // These use speedUpRetryDelays() to collapse 1s/2s retry delays to 0ms.
  // They use explicit flushAsync() instead of long waitFor timeouts because
  // the replaced setTimeout can interact subtly with RTL's internal polling.

  it("shows error toast after 3 failed retry attempts", async () => {
    speedUpRetryDelays();

    // 3 failed chat responses (one per retry)
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ error: "Server error" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Server error" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Server error" }, false, 500));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Message that will fail" } });
    fireEvent.click(getSendButton());

    // Flush all retry attempts (each originally 1s/2s, now 0ms)
    await flushAsync();
    await flushAsync();

    expect(mockToastError).toHaveBeenCalled();

    restoreSetTimeout();
  });

  it('shows retry banner with "AI failed to respond" when last message is user and no assistant response', async () => {
    speedUpRetryDelays();

    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ error: "Error" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Error" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Error" }, false, 500));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Failing message" } });
    fireEvent.click(getSendButton());

    await flushAsync();
    await flushAsync();

    expect(screen.getByText("AI failed to respond.")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();

    restoreSetTimeout();
  });

  it("retry button resends the last message", async () => {
    speedUpRetryDelays();

    // First batch: 3 failed chat responses
    mockFetch
      .mockResolvedValueOnce(mockJsonResponse({ error: "Fail" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Fail" }, false, 500))
      .mockResolvedValueOnce(mockJsonResponse({ error: "Fail" }, false, 500));

    renderPanel();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Ask AI anything...")).toBeTruthy();
    });

    const input = screen.getByPlaceholderText("Ask AI anything...");
    fireEvent.change(input, { target: { value: "Retry me" } });
    fireEvent.click(getSendButton());

    await flushAsync();
    await flushAsync();

    // Retry banner should be visible
    expect(screen.getByText("Retry")).toBeTruthy();

    const callsBeforeRetry = mockFetch.mock.calls.length;

    // Queue a successful response for the retry
    mockFetch.mockResolvedValueOnce(
      mockJsonResponse({ content: "Retry succeeded!" })
    );

    // Click Retry
    fireEvent.click(screen.getByText("Retry"));

    await flushAsync();

    // Verify fetch was called again
    expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBeforeRetry);

    // The assistant response should appear
    expect(screen.getByText("Retry succeeded!")).toBeTruthy();

    restoreSetTimeout();
  });
});
