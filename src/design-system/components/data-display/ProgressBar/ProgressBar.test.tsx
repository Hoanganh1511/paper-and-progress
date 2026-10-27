import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ProgressBar } from "./ProgressBar";

expect.extend(toHaveNoViolations);

describe("ProgressBar", () => {
  it("exposes its value and name as a progressbar", () => {
    render(<ProgressBar value={70} label="Tiến độ React" />);
    const bar = screen.getByRole("progressbar", { name: "Tiến độ React" });
    expect(bar).toHaveAttribute("aria-valuenow", "70");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values outside 0 to 100", () => {
    const { rerender } = render(<ProgressBar value={140} label="Tiến độ" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    rerender(<ProgressBar value={-5} label="Tiến độ" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("prints the percentage beside the bar when asked", () => {
    render(<ProgressBar value={45} label="Tiến độ" showValue />);
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("forwards ref and merges className", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProgressBar ref={ref} value={10} label="Tiến độ" className="custom" />,
    );
    expect(ref.current).toHaveClass("custom");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <ProgressBar value={30} label="Tiến độ" showValue />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
