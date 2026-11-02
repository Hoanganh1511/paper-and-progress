import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { TECH_ACCENTS, TechItemCard } from "./TechItemCard";

expect.extend(toHaveNoViolations);

const react = {
  id: "react",
  title: "React",
  icon: "code" as const,
  description: "Thư viện JavaScript để xây dựng giao diện người dùng.",
};

describe("TechItemCard", () => {
  it("shows the name, what it is, and the three counts", () => {
    render(
      <TechItemCard
        item={react}
        index={0}
        counts={{ articles: 2, paths: 1, resources: 3 }}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "React" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Thư viện JavaScript để xây dựng giao diện người dùng."),
    ).toBeInTheDocument();
    expect(screen.getByText("2 bài viết")).toBeInTheDocument();
    expect(screen.getByText("1 lộ trình")).toBeInTheDocument();
    expect(screen.getByText("3 tài liệu")).toBeInTheDocument();
  });

  it("shows zeros when it has no counts", () => {
    render(<TechItemCard item={react} index={0} />);
    expect(screen.getByText("0 bài viết")).toBeInTheDocument();
    expect(screen.getByText("0 lộ trình")).toBeInTheDocument();
    expect(screen.getByText("0 tài liệu")).toBeInTheDocument();
  });

  it("links the whole card through its name, with an arrow button to say so", () => {
    const { container } = render(
      <TechItemCard item={react} index={0} href="/topics/react" />,
    );
    expect(screen.getByRole("link", { name: "React" })).toHaveAttribute(
      "href",
      "/topics/react",
    );
    expect(container.querySelector("[data-arrow]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("is not a link, and has no arrow, when it leads nowhere", () => {
    const { container } = render(<TechItemCard item={react} index={0} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(container.querySelector("[data-arrow]")).toBeNull();
  });

  it("takes its accent from its place: pink, lime, violet, blue, and round again", () => {
    const accents = [0, 1, 2, 3, 4].map((index) => {
      const { container, unmount } = render(
        <TechItemCard item={react} index={index} />,
      );
      const accent = (
        container.querySelector("article") as HTMLElement
      ).style.getPropertyValue("--accent");
      unmount();
      return accent;
    });
    expect(accents).toEqual([...TECH_ACCENTS, TECH_ACCENTS[0]]);
  });

  it("is white with a black border and an accent shadow with a black edge behind it, no blur", () => {
    render(<TechItemCard item={react} index={1} href="/x" />);
    const card = screen.getByRole("article");
    expect(card).toHaveClass("bg-white", "border-2", "border-[#171717]");
    expect(card.className).toContain(
      "shadow-[5px_6px_0_0_var(--accent),7px_8px_0_0_#171717]",
    );
    expect(card).toHaveClass(
      "hover:-translate-y-[3px]",
      "motion-reduce:transition-none",
    );
  });

  it("puts the icon in a tile hidden from assistive technology", () => {
    const { container } = render(<TechItemCard item={react} index={0} />);
    expect(container.querySelector("[data-tile]")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TechItemCard item={react} index={2} href="/topics/react" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
