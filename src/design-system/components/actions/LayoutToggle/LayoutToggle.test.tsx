import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { LayoutToggle } from "./LayoutToggle";

expect.extend(toHaveNoViolations);

describe("LayoutToggle", () => {
  it("is a named group with a grid and a list button", () => {
    render(<LayoutToggle value="grid" onValueChange={() => {}} />);
    expect(screen.getByRole("group", { name: "Layout" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Grid view" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "List view" }),
    ).toBeInTheDocument();
  });

  it("marks only the chosen layout as pressed", () => {
    render(<LayoutToggle value="list" onValueChange={() => {}} />);
    expect(screen.getByRole("button", { name: "List view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports the clicked layout", async () => {
    const onValueChange = vi.fn();
    render(<LayoutToggle value="grid" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: "List view" }));
    expect(onValueChange).toHaveBeenCalledWith("list");
  });

  it("takes translated labels", () => {
    render(
      <LayoutToggle
        value="grid"
        onValueChange={() => {}}
        label="Kiểu hiển thị"
      />,
    );
    expect(
      screen.getByRole("group", { name: "Kiểu hiển thị" }),
    ).toBeInTheDocument();
  });

  it("forwards ref and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <LayoutToggle
        ref={ref}
        value="grid"
        onValueChange={() => {}}
        className="custom"
      />,
    );
    expect(ref.current).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <LayoutToggle value="grid" onValueChange={() => {}} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
