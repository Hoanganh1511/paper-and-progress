import { createRef, useState } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { FormField } from "../FormField";
import { RadioGroup } from "./RadioGroup";
import { RadioItem } from "./RadioItem";

expect.extend(toHaveNoViolations);

function Plans(props: Partial<React.ComponentProps<typeof RadioGroup>>) {
  return (
    <RadioGroup aria-label="Plan" {...props}>
      <RadioItem value="free" label="Free" />
      <RadioItem value="pro" label="Pro" />
      <RadioItem value="team" label="Team" />
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders a radiogroup with radios sharing one name", () => {
    render(<Plans />);
    expect(
      screen.getByRole("radiogroup", { name: "Plan" }),
    ).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    const names = new Set(radios.map((radio) => radio.getAttribute("name")));
    expect(names.size).toBe(1);
    expect(names.has(null)).toBe(false);
  });

  it("uses a provided name", () => {
    render(<Plans name="plan" />);
    screen.getAllByRole("radio").forEach((radio) => {
      expect(radio).toHaveAttribute("name", "plan");
    });
  });

  it("selects defaultValue and updates on click (uncontrolled)", async () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="free" onValueChange={onValueChange} />);
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();

    await userEvent.click(screen.getByText("Pro"));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Free" })).not.toBeChecked();
    expect(onValueChange).toHaveBeenCalledWith("pro");
  });

  it("supports controlled value", async () => {
    function Controlled() {
      const [value, setValue] = useState("free");
      return <Plans value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    await userEvent.click(screen.getByText("Team"));
    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();
  });

  it("moves selection with the Arrow keys and wraps around", async () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="free" onValueChange={onValueChange} />);

    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "Free" })).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Pro" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();

    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: "Free" })).toBeChecked();

    await userEvent.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: "Team" })).toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith("team");
  });

  it("disables every item when the group is disabled, or a single item", () => {
    const { rerender } = render(<Plans disabled />);
    screen.getAllByRole("radio").forEach((radio) => {
      expect(radio).toBeDisabled();
    });

    rerender(
      <RadioGroup aria-label="Plan">
        <RadioItem value="free" label="Free" />
        <RadioItem value="pro" label="Pro" disabled />
      </RadioGroup>,
    );
    expect(screen.getByRole("radio", { name: "Free" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Pro" })).toBeDisabled();
  });

  it("lays out horizontally or vertically", () => {
    const { rerender } = render(<Plans />);
    expect(screen.getByRole("radiogroup")).toHaveClass("flex-col");
    rerender(<Plans orientation="horizontal" />);
    expect(screen.getByRole("radiogroup")).toHaveClass("flex-row");
  });

  it("is labelled, described and flagged by the surrounding FormField", () => {
    render(
      <FormField label="Plan" description="Pick one" error="Required">
        <RadioGroup>
          <RadioItem value="free" label="Free" />
        </RadioGroup>
      </FormField>,
    );
    const group = screen.getByRole("radiogroup", { name: "Plan" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group.getAttribute("aria-describedby")).toContain(
      screen.getByRole("alert").id,
    );
  });

  it("throws when a RadioItem is rendered outside a RadioGroup", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<RadioItem value="x" label="X" />)).toThrow(
      "RadioItem must be used within a RadioGroup",
    );
    spy.mockRestore();
  });

  it("receives refs and merges className", () => {
    const groupRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLInputElement>();
    const { container } = render(
      <RadioGroup aria-label="Plan" ref={groupRef} className="group-class">
        <RadioItem
          value="free"
          label="Free"
          ref={itemRef}
          className="item-class"
        />
      </RadioGroup>,
    );
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLInputElement);
    expect(container.firstElementChild).toHaveClass("group-class");
    expect(screen.getByText("Free").closest("label")).toHaveClass("item-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <FormField label="Plan" description="Pick one">
        <Plans aria-label={undefined} defaultValue="pro" />
      </FormField>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
