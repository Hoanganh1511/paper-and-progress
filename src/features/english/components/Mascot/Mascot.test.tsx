import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { TopicMascot } from "../../types";
import { Mascot } from "./Mascot";

expect.extend(toHaveNoViolations);

const ACCESSORIES: TopicMascot[] = [
  "headphones",
  "microphone",
  "book",
  "pencil",
  "trophy",
  "speech",
];

describe("Mascot", () => {
  it.each(ACCESSORIES)("draws a decorative panda with %s", (accessory) => {
    const { container } = render(
      <Mascot accessory={accessory} className="w-24" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("data-accessory", accessory);
    expect(svg).toHaveClass("w-24");
    // Two ears, the head and two eyes are always there.
    expect(svg?.querySelectorAll("circle").length).toBeGreaterThanOrEqual(5);
  });

  it("draws a different picture for each accessory", () => {
    const markup = ACCESSORIES.map(
      (accessory) =>
        render(<Mascot accessory={accessory} />).container.innerHTML,
    );
    expect(new Set(markup).size).toBe(ACCESSORIES.length);
  });

  it("says Hi! in the speech bubble", () => {
    const { container } = render(<Mascot accessory="speech" />);
    expect(container.querySelector("text")).toHaveTextContent("Hi!");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        {ACCESSORIES.map((accessory) => (
          <Mascot key={accessory} accessory={accessory} />
        ))}
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
