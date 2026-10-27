import { useState } from "react";
import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import {
  FilterPanel,
  countActiveFilters,
  type FilterGroup,
  type FilterValue,
} from "./FilterPanel";

expect.extend(toHaveNoViolations);

const groups: FilterGroup[] = [
  {
    id: "level",
    label: "Level",
    options: [
      { value: "beginner", label: "Beginner", count: 3 },
      { value: "advanced", label: "Advanced", count: 1 },
    ],
  },
  {
    id: "tag",
    label: "Tags",
    display: "chips",
    options: [
      { value: "react", label: "React" },
      { value: "aws", label: "AWS" },
    ],
  },
  {
    id: "saved",
    label: "Saved",
    selection: "single",
    options: [
      { value: "today", label: "Today" },
      { value: "week", label: "This week" },
    ],
  },
];

function Harness({
  initial = {},
  onChange,
}: {
  initial?: FilterValue;
  onChange?: (value: FilterValue) => void;
}) {
  const [value, setValue] = useState<FilterValue>(initial);
  return (
    <FilterPanel
      groups={groups}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe("FilterPanel", () => {
  it("renders each group with its options", () => {
    render(<Harness />);
    const panel = screen.getByRole("group", { name: "Filters" });
    expect(
      within(panel).getByRole("checkbox", { name: /Beginner/ }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByRole("button", { name: "React" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(panel).getByRole("radio", { name: "Today" }),
    ).toBeInTheDocument();
  });

  it("selects several checkbox options and reports them", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Beginner/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Advanced/ }));
    expect(onChange).toHaveBeenLastCalledWith({
      level: ["beginner", "advanced"],
    });
    await userEvent.click(screen.getByRole("checkbox", { name: /Beginner/ }));
    expect(onChange).toHaveBeenLastCalledWith({ level: ["advanced"] });
  });

  it("toggles chips and keeps one choice in a single group", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "React" }));
    expect(screen.getByRole("button", { name: "React" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("radio", { name: "Today" }));
    await userEvent.click(screen.getByRole("radio", { name: "This week" }));
    expect(onChange).toHaveBeenLastCalledWith({
      tag: ["react"],
      saved: ["week"],
    });
  });

  it("collapses and expands a group", async () => {
    render(<Harness />);
    const toggle = screen.getByRole("button", { name: "Level" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("checkbox", { name: /Beginner/ }),
    ).not.toBeInTheDocument();
  });

  it("clears every filter, and is disabled when none is set", async () => {
    const onChange = vi.fn();
    const { unmount } = render(<Harness onChange={onChange} />);
    expect(
      screen.getByRole("button", { name: "Clear all filters" }),
    ).toBeDisabled();
    unmount();

    render(<Harness initial={{ level: ["beginner"] }} onChange={onChange} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Clear all filters" }),
    );
    expect(onChange).toHaveBeenLastCalledWith({});
  });

  it("counts the selected options", () => {
    expect(countActiveFilters({ a: ["1", "2"], b: [], c: ["3"] })).toBe(3);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Harness initial={{ tag: ["react"] }} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
