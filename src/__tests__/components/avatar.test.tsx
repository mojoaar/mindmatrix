import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/ui/avatar";

describe("Avatar", () => {
  it("renders initials when no image", () => {
    render(<Avatar name="John Doe" email="john@example.com" />);
    expect(screen.getByText("JD")).toBeTruthy();
  });

  it("renders single word initials", () => {
    render(<Avatar name="Admin" email="admin@test.com" />);
    expect(screen.getByText("AD")).toBeTruthy();
  });

  it("renders email-derived initials when name is empty", () => {
    render(<Avatar name="" email="john@example.com" />);
    const initials = screen.getByText("JO"); // first two chars of email
    expect(initials).toBeTruthy();
  });

  it("renders image when provided", () => {
    render(
      <Avatar
        name="John"
        email="john@example.com"
        image="/uploads/avatars/test.png"
      />
    );
    const img = screen.getByRole("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/uploads/avatars/test.png");
  });

  it("respects size prop", () => {
    render(<Avatar name="JD" email="j@d.com" size={64} />);
    const container = screen.getByTitle("JD").parentElement || screen.getByTitle("JD");
    // Check the div has correct style
    const el = document.querySelector('[style*="height: 64px"]');
    expect(el).toBeTruthy();
  });
});
