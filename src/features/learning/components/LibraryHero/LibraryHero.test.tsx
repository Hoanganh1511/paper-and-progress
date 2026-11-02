import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { LibraryHero } from "./LibraryHero";

expect.extend(toHaveNoViolations);

describe("LibraryHero", () => {
  it("names the page with the title and says what it is for", () => {
    render(<LibraryHero />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Thư viện kiến thức" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Khám phá kiến thức theo lĩnh vực, rồi đi qua từng phân loại và chủ đề.",
      ),
    ).toBeInTheDocument();
  });

  it("is not in a card", () => {
    const { container } = render(<LibraryHero />);
    const hero = container.querySelector("header");
    expect(hero).not.toHaveClass("border-2");
    expect(hero).not.toHaveClass("bg-surface-card");
  });

  it("holds the search over the learning area", () => {
    render(<LibraryHero />);
    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/search");
    expect(screen.getByRole("searchbox")).toHaveAttribute(
      "placeholder",
      "Tìm chủ đề, bài viết, lộ trình...",
    );
  });

  it("draws a panda at a laptop on a lime patch, hidden from assistive technology", () => {
    const { container } = render(<LibraryHero />);
    const panda = container.querySelector("[data-decor='panda-coder']");
    expect(panda).not.toBeNull();
    expect(panda?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(container.querySelector(".bg-accent-lime\\/45")).not.toBeNull();
  });

  it("has yellow flicks beside the title and above the search", () => {
    const { container } = render(<LibraryHero />);
    expect(container.querySelectorAll("[data-decor='ticks']")).toHaveLength(2);
  });

  it("is one row from xl: the title, the panda and the search of 450px", () => {
    const { container } = render(<LibraryHero />);
    expect(container.querySelector("header")?.className).toContain(
      "xl:grid-cols-[minmax(0,1fr)_auto_28.125rem]",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(<LibraryHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
