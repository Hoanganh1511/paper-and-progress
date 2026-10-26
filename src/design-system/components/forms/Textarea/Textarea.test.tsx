import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach } from "vitest";
import { FormField } from "../FormField";
import { Textarea } from "./Textarea";

expect.extend(toHaveNoViolations);

describe("Textarea", () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
  });

  it("renders 3 rows by default and accepts rows", () => {
    const { rerender } = render(<Textarea aria-label="Bio" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "3");
    rerender(<Textarea aria-label="Bio" rows={6} />);
    expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
  });

  it("renders each size", () => {
    const expected = {
      compact: "text-body-sm",
      default: "text-body-md",
      comfortable: "text-body-lg",
    } as const;
    (Object.keys(expected) as (keyof typeof expected)[]).forEach((size) => {
      const { unmount } = render(<Textarea aria-label="Bio" size={size} />);
      expect(screen.getByRole("textbox")).toHaveClass(expected[size]);
      unmount();
    });
  });

  it("is resizable vertically unless autoResize is set", () => {
    const { rerender } = render(<Textarea aria-label="Bio" />);
    expect(screen.getByRole("textbox")).toHaveClass("resize-y");
    rerender(<Textarea aria-label="Bio" autoResize />);
    expect(screen.getByRole("textbox")).toHaveClass(
      "resize-none",
      "overflow-hidden",
    );
  });

  it("grows to fit content when autoResize is set", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 120,
    });
    render(<Textarea aria-label="Bio" autoResize />);
    const textarea = screen.getByRole("textbox");
    expect(textarea.style.height).toBe("120px");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get: () => 200,
    });
    fireEvent.input(textarea, { target: { value: "more text" } });
    expect(textarea.style.height).toBe("200px");
  });

  it("reads FormField context", () => {
    render(
      <FormField label="Bio" description="Tell us" error="Too short" required>
        <Textarea />
      </FormField>,
    );
    const textarea = screen.getByLabelText(/Bio/);
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-required", "true");
    expect(textarea.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id,
    );
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Bio" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it("merges custom className", () => {
    render(<Textarea aria-label="Bio" className="custom-class" />);
    expect(screen.getByRole("textbox")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FormField label="Bio" error="Too short">
        <Textarea />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
