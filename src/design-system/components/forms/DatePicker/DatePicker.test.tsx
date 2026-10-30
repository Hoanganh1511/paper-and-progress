import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { FormField } from "../FormField";
import { DatePicker, parseDateValue, toDateValue } from "./DatePicker";

expect.extend(toHaveNoViolations);

function Controlled({
  initial = "",
  ...props
}: Partial<React.ComponentProps<typeof DatePicker>> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <FormField label="Deadline">
      <DatePicker value={value} onValueChange={setValue} {...props} />
    </FormField>
  );
}

const trigger = () => screen.getByRole("button", { name: /Deadline/ });

describe("DatePicker", () => {
  it("shows the placeholder, or the chosen date as dd/MM/yyyy", () => {
    const { unmount } = render(<Controlled />);
    expect(trigger()).toHaveTextContent("Select a date");
    unmount();
    render(<Controlled initial="2026-10-30" />);
    expect(trigger()).toHaveTextContent("30/10/2026");
  });

  it("opens a calendar on the month of the value and picks a day", async () => {
    const onValueChange = vi.fn();
    render(
      <FormField label="Deadline">
        <DatePicker value="2026-10-30" onValueChange={onValueChange} />
      </FormField>,
    );
    await userEvent.click(trigger());
    const calendar = screen.getByRole("dialog", { name: "Calendar" });
    expect(within(calendar).getByText("10/2026")).toBeInTheDocument();
    await userEvent.click(
      within(calendar).getByRole("button", { name: "15/10/2026" }),
    );
    expect(onValueChange).toHaveBeenCalledWith("2026-10-15");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("marks the chosen day and moves between months", async () => {
    render(<Controlled initial="2026-10-30" />);
    await userEvent.click(trigger());
    const calendar = screen.getByRole("dialog");
    expect(
      within(calendar)
        .getByRole("button", { name: "30/10/2026" })
        .closest("[role=gridcell]"),
    ).toHaveAttribute("aria-selected", "true");
    await userEvent.click(
      within(calendar).getByRole("button", { name: "Next month" }),
    );
    expect(within(calendar).getByText("11/2026")).toBeInTheDocument();
    await userEvent.click(
      within(calendar).getByRole("button", { name: "Previous month" }),
    );
    await userEvent.click(
      within(calendar).getByRole("button", { name: "Previous month" }),
    );
    expect(within(calendar).getByText("9/2026")).toBeInTheDocument();
  });

  it("works from the keyboard: arrows move, Enter picks, Escape closes", async () => {
    const onValueChange = vi.fn();
    render(
      <FormField label="Deadline">
        <DatePicker value="2026-10-30" onValueChange={onValueChange} />
      </FormField>,
    );
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("button", { name: "30/10/2026" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{ArrowDown}");
    expect(screen.getByRole("button", { name: "07/11/2026" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("2026-11-07");

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it("will not pick a day outside min and max", async () => {
    const onValueChange = vi.fn();
    render(
      <FormField label="Deadline">
        <DatePicker
          value="2026-10-15"
          onValueChange={onValueChange}
          min="2026-10-10"
          max="2026-10-20"
        />
      </FormField>,
    );
    await userEvent.click(trigger());
    expect(screen.getByRole("button", { name: "09/10/2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "21/10/2026" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "12/10/2026" })).toBeEnabled();
  });

  it("clears the date", async () => {
    render(<Controlled initial="2026-10-30" />);
    await userEvent.click(trigger());
    await userEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(trigger()).toHaveTextContent("Select a date");
  });

  it("closes when the user clicks outside", async () => {
    render(
      <>
        <button>Outside</button>
        <Controlled />
      </>,
    );
    await userEvent.click(trigger());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not open while disabled", async () => {
    render(<Controlled disabled />);
    await userEvent.click(trigger());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations, closed and open", async () => {
    const { container } = render(<Controlled initial="2026-10-30" />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(trigger());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("date helpers", () => {
  it("round-trips a local day and rejects dates that do not exist", () => {
    expect(toDateValue(new Date(2026, 9, 5))).toBe("2026-10-05");
    expect(parseDateValue("2026-10-05")).toEqual(new Date(2026, 9, 5));
    expect(parseDateValue("2026-02-30")).toBeUndefined();
    expect(parseDateValue("30/10/2026")).toBeUndefined();
  });
});
