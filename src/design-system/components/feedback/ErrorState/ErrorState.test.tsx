import { createRef } from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { WifiOff } from "lucide-react";
import { ErrorState } from "./ErrorState";

expect.extend(toHaveNoViolations);

describe("ErrorState", () => {
  it("renders an alert with a hidden error icon and a default title", () => {
    const { container } = render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".lucide-circle-alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Something went wrong" }),
    ).toBeInTheDocument();
  });

  it("renders a custom title, message and icon", () => {
    const { container } = render(
      <ErrorState
        icon={WifiOff}
        title="You are offline"
        message="Check your connection."
        titleAs="h2"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "You are offline" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Check your connection.")).toBeInTheDocument();
    expect(container.querySelector(".lucide-wifi-off")).toBeInTheDocument();
  });

  it("has no retry button without onRetry", () => {
    render(<ErrorState message="Failed" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRetry from the retry button", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("supports a custom retry label", () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Thử lại" />);
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });

  it("shows the retry button as busy and ignores clicks while retrying", async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} isRetrying />);
    const button = screen.getByRole("button", { name: "Try again" });
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ErrorState ref={ref} className="custom-class" />);
    expect(ref.current).toBe(screen.getByRole("alert"));
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ErrorState
        titleAs="h2"
        message="We could not load your projects."
        onRetry={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
