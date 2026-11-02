import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { TOPIC_ACCENTS, TechTopicCard } from "./TechTopicCard";

expect.extend(toHaveNoViolations);

const item = {
  id: "react",
  title: "React",
  description: "",
  meta: "3 bài viết · 1 lộ trình · 2 tài liệu",
  href: "/topics/react",
};

describe("TechTopicCard", () => {
  it("links the whole card to the topic through its name", () => {
    render(<TechTopicCard item={item} index={0} />);
    expect(screen.getByRole("link", { name: "React" })).toHaveAttribute(
      "href",
      "/topics/react",
    );
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      "React",
    );
  });

  it("shows the counts with bullets, under the name", () => {
    render(<TechTopicCard item={item} index={0} />);
    expect(
      screen.getByText("3 bài viết • 1 lộ trình • 2 tài liệu"),
    ).toBeInTheDocument();
  });

  it("puts the first letter in a tile where a logo would be, hidden from assistive technology", () => {
    const { container } = render(<TechTopicCard item={item} index={0} />);
    const tile = container.querySelector("[data-tile]");
    expect(tile).toHaveTextContent("R");
    expect(tile).toHaveAttribute("aria-hidden", "true");
  });

  it("takes its accent from its place: pink, lime, violet, blue, and round again", () => {
    const accents = [0, 1, 2, 3, 4].map((index) => {
      const { container, unmount } = render(
        <TechTopicCard item={item} index={index} />,
      );
      const accent = (
        container.querySelector("article") as HTMLElement
      ).style.getPropertyValue("--accent");
      unmount();
      return accent;
    });
    expect(accents).toEqual([...TOPIC_ACCENTS, TOPIC_ACCENTS[0]]);
  });

  it("is white with a black border and an offset shadow in its accent, with no blur", () => {
    render(<TechTopicCard item={item} index={1} />);
    const card = screen.getByRole("article");
    expect(card).toHaveClass("bg-white", "border-2", "border-[#171717]");
    // An accent slab, with a thin black edge behind it.
    expect(card.className).toContain(
      "shadow-[5px_6px_0_0_var(--accent),7px_8px_0_0_#171717]",
    );
    expect(card.className).toContain(
      "sm:shadow-[8px_9px_0_0_var(--accent),10px_11px_0_0_#171717]",
    );
    expect(card).toHaveClass(
      "hover:-translate-y-[3px]",
      "active:translate-y-[3px]",
      "motion-reduce:transition-none",
    );
  });

  it("is not a link, and has no arrow, when the topic has no page", () => {
    render(<TechTopicCard item={{ ...item, href: undefined }} index={0} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("leaves the counts out when it has none", () => {
    render(<TechTopicCard item={{ ...item, meta: undefined }} index={0} />);
    expect(screen.queryByText(/bài viết/)).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TechTopicCard item={item} index={2} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
