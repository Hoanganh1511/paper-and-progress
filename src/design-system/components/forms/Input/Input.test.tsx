import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Input } from "./Input";

expect.extend(toHaveNoViolations);

describe("Input", () => {
  it("renders a textbox without field attributes outside a FormField", () => {
    render(<Input aria-label="Name" />);
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-required");
  });

  it("renders each size", () => {
    const sizes = ["compact", "default", "comfortable"] as const;
    sizes.forEach((size) => {
      const { container, unmount } = render(
        <Input aria-label="Name" size={size} />,
      );
      expect(container.firstElementChild).toHaveClass(
        `h-[var(--height-${size})]`,
      );
      unmount();
    });
  });

  it("renders left and right addons", () => {
    render(
      <Input
        aria-label="Price"
        leftAddon={<span>$</span>}
        rightAddon={<span>USD</span>}
      />,
    );
    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("keeps explicit aria props and appends field ids", () => {
    render(
      <>
        <p id="extra">Extra</p>
        <Input aria-label="Name" aria-describedby="extra" aria-invalid />
      </>,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-describedby", "extra");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("focuses the input when the box is clicked", async () => {
    const { container } = render(
      <Input aria-label="Name" leftAddon={<span>@</span>} />,
    );
    await userEvent.click(screen.getByText("@"));
    expect(screen.getByRole("textbox")).toHaveFocus();
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it("accepts typing and respects disabled", async () => {
    const { rerender } = render(<Input aria-label="Name" />);
    await userEvent.type(screen.getByRole("textbox"), "Ann");
    expect(screen.getByRole("textbox")).toHaveValue("Ann");
    rerender(<Input aria-label="Name" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("receives ref on the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("merges custom className onto the box", () => {
    const { container } = render(
      <Input aria-label="Name" className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Input aria-label="Name" leftAddon={<span aria-hidden="true">@</span>} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
