import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { LearningSearch } from "./LearningSearch";

expect.extend(toHaveNoViolations);

describe("LearningSearch", () => {
  it("is a plain GET form to /search with the text as ?q", () => {
    render(<LearningSearch />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/search");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("searchbox")).toHaveAttribute("name", "q");
  });

  it("is named for what it searches", () => {
    render(<LearningSearch />);
    expect(
      screen.getByRole("searchbox", { name: "Tìm trong khu vực học tập" }),
    ).toBeInTheDocument();
  });

  it("keeps what was searched", () => {
    render(<LearningSearch query="react" />);
    expect(screen.getByRole("searchbox")).toHaveValue("react");
  });

  it("is a taller box with a hard shadow in the hero", () => {
    const { container } = render(<LearningSearch variant="hero" />);
    const box = container.querySelector("input")?.parentElement;
    expect(box).toHaveClass("rounded-[10px]");
    expect(box?.className).toContain("shadow-[3px_3px_0_0");
  });

  it("has no axe violations", async () => {
    const { container } = render(<LearningSearch variant="hero" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
