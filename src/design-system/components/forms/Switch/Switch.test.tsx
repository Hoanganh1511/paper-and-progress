import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Switch } from "./Switch";

expect.extend(toHaveNoViolations);

describe("Switch", () => {
  it("renders role=switch named by its label", () => {
    render(<Switch label="Notifications" />);
    const el = screen.getByRole("switch", { name: "Notifications" });
    expect(el).not.toBeChecked();
  });

  it("toggles on click and on Space, calling onChange", async () => {
    const onChange = vi.fn();
    render(<Switch label="Notifications" onChange={onChange} />);
    await userEvent.click(screen.getByText("Notifications"));
    expect(screen.getByRole("switch")).toBeChecked();

    expect(screen.getByRole("switch")).toHaveFocus();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("supports controlled checked", () => {
    render(<Switch label="Notifications" checked onChange={() => {}} />);
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    render(<Switch label="Notifications" disabled />);
    await userEvent.click(screen.getByText("Notifications"));
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("receives ref on the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch label="Notifications" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("merges custom className onto the label", () => {
    const { container } = render(
      <Switch label="Notifications" className="custom-class" />,
    );
    expect(container.firstElementChild).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Switch label="Notifications" />
        <Switch aria-label="Dark mode" defaultChecked />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
