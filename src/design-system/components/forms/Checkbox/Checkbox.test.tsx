import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Checkbox } from "./Checkbox";

expect.extend(toHaveNoViolations);

describe("Checkbox", () => {
  it("renders a checkbox named by its label", () => {
    render(<Checkbox label="Accept terms" />);
    expect(
      screen.getByRole("checkbox", { name: "Accept terms" }),
    ).not.toBeChecked();
  });

  it("toggles when the label is clicked (uncontrolled)", async () => {
    render(<Checkbox label="Accept terms" />);
    await userEvent.click(screen.getByText("Accept terms"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    await userEvent.click(screen.getByText("Accept terms"));
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("toggles with the Space key", async () => {
    render(<Checkbox label="Accept terms" />);
    await userEvent.tab();
    expect(screen.getByRole("checkbox")).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("works controlled and calls onChange", async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          label="Accept terms"
          checked={checked}
          onChange={(event) => {
            onChange(event.target.checked);
            setChecked(event.target.checked);
          }}
        />
      );
    }
    render(<Controlled />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("sets the indeterminate property and keeps it while the prop is true", async () => {
    const { rerender } = render(<Checkbox label="All" indeterminate />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    expect(input).toBePartiallyChecked();

    await userEvent.click(input);
    expect(input.indeterminate).toBe(true);

    rerender(<Checkbox label="All" />);
    expect(input.indeterminate).toBe(false);
  });

  it("does not toggle when disabled", async () => {
    const onChange = vi.fn();
    render(<Checkbox label="Accept terms" disabled onChange={onChange} />);
    await userEvent.click(screen.getByText("Accept terms"));
    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("receives ref on the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Accept terms" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("merges custom className onto the label", () => {
    const { container } = render(
      <Checkbox label="Accept terms" className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Checkbox label="Accept terms" />
        <Checkbox label="All" indeterminate />
        <Checkbox aria-label="Select row" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
