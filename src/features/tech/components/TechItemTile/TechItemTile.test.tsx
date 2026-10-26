import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { TechItem } from "../../types";
import { TechItemTile } from "./TechItemTile";

expect.extend(toHaveNoViolations);

const item: TechItem = {
  id: "react",
  title: "React",
  icon: "code",
};

describe("TechItemTile", () => {
  it("is a square article with the title and icon", () => {
    render(<TechItemTile item={item} />);
    const tile = screen.getByRole("article");
    expect(tile).toBeInTheDocument();
    expect(tile).toHaveClass("aspect-square");
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(tile.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("is plain, with no link, when it has no href", () => {
    render(<TechItemTile item={item} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveClass("hover:-translate-y-1");
  });

  it("makes the title a link stretched over the whole tile when it has an href", () => {
    render(<TechItemTile item={{ ...item, href: "/tech/react" }} />);
    const link = screen.getByRole("link", { name: "React" });
    expect(link).toHaveAttribute("href", "/tech/react");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(screen.getByRole("article")).toHaveClass(
      "hover:-translate-y-1",
      "hover:shadow-accent",
      "motion-reduce:hover:translate-y-0",
    );
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<TechItemTile item={item} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("article"));
  });

  it("receives className and other props", () => {
    render(
      <TechItemTile item={item} className="custom-class" data-testid="tile" />,
    );
    expect(screen.getByTestId("tile")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <TechItemTile item={item} />
        <TechItemTile item={{ ...item, id: "x", href: "/tech/x" }} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
