import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { EnglishTopic, TopicColor } from "../../types";
import { TopicCard } from "./TopicCard";

expect.extend(toHaveNoViolations);

const topic: EnglishTopic = {
  id: "ielts",
  title: "IELTS",
  description: "Lộ trình từ 5.0 đến 7.5 với đề thật và chấm chữa chi tiết.",
  icon: "exam",
  color: "blue",
  mascot: "book",
  badge: "100+ ĐỀ",
  decor: ["star", "note", "leaf"],
};

describe("TopicCard", () => {
  it("is an article with the title, description and badge", () => {
    render(<TopicCard topic={topic} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "IELTS" }),
    ).toBeInTheDocument();
    expect(screen.getByText(topic.description)).toBeInTheDocument();
    expect(screen.getByText("100+ ĐỀ")).toBeInTheDocument();
  });

  it("is a tall 3:4 card, 75vw wide on a phone and 15rem from sm", () => {
    render(<TopicCard topic={topic} />);
    expect(screen.getByRole("article")).toHaveClass(
      "aspect-[3/4]",
      "w-[75vw]",
      "sm:w-60",
      "overflow-hidden",
      "relative",
    );
  });

  it("colors the whole card and a darker badge from the theme tokens", () => {
    const expected: Record<TopicColor, [string, string]> = {
      blue: ["bg-theme-blue", "bg-theme-blue-strong"],
      green: ["bg-theme-green", "bg-theme-green-strong"],
      orange: ["bg-theme-orange", "bg-theme-orange-strong"],
      pink: ["bg-theme-pink", "bg-theme-pink-strong"],
      purple: ["bg-theme-purple", "bg-theme-purple-strong"],
    };
    (Object.keys(expected) as TopicColor[]).forEach((color) => {
      const { unmount } = render(<TopicCard topic={{ ...topic, color }} />);
      const [card, badge] = expected[color];
      expect(screen.getByRole("article")).toHaveClass(card);
      expect(screen.getByRole("article")).toHaveAttribute("data-color", color);
      expect(screen.getByText("100+ ĐỀ")).toHaveClass(badge, "text-white");
      unmount();
    });
  });

  it("puts white text everywhere on the card", () => {
    render(<TopicCard topic={topic} />);
    expect(screen.getByRole("article")).toHaveClass("text-white");
    expect(screen.getByRole("heading", { name: "IELTS" })).toHaveClass(
      "text-white",
      "font-bold",
    );
    expect(screen.getByText(topic.description)).toHaveClass("text-white");
  });

  it("limits the description to three lines", () => {
    render(<TopicCard topic={topic} />);
    expect(screen.getByText(topic.description)).toHaveClass("line-clamp-3");
  });

  it("puts a translucent white icon tile top-left", () => {
    const { container } = render(<TopicCard topic={topic} />);
    const tile = container.querySelector(".bg-white\\/20") as HTMLElement;
    expect(tile).toHaveClass("size-10", "rounded-standard");
    expect(tile.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(tile.querySelector("svg")).toHaveClass("lucide-graduation-cap");
  });

  it("stands the mascot on the bottom edge, behind the text", () => {
    const { container } = render(<TopicCard topic={topic} />);
    const mascot = container.querySelector('svg[data-accessory="book"]');
    expect(mascot).toHaveClass(
      "absolute",
      "-bottom-2",
      "right-0",
      "-z-10",
      "w-3/5",
    );
    expect(mascot).toHaveAttribute("aria-hidden", "true");
  });

  it("scatters faint, hidden ornaments, at most one per slot", () => {
    const { container } = render(
      <TopicCard
        topic={{ ...topic, decor: ["note", "star", "leaf", "sparkle"] }}
      />,
    );
    const ornaments = container.querySelectorAll("[data-decor]");
    expect(
      Array.from(ornaments).map((o) => o.getAttribute("data-decor")),
    ).toEqual(["note", "star", "leaf"]);
    ornaments.forEach((ornament) => {
      expect(ornament).toHaveAttribute("aria-hidden", "true");
      expect(ornament).toHaveClass(
        "absolute",
        "opacity-30",
        "pointer-events-none",
      );
    });
  });

  it("is plain, with no link, when it has no href", () => {
    render(<TopicCard topic={topic} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveClass("hover:-translate-y-1");
  });

  it("makes the title a link stretched over the whole card when it has an href", () => {
    render(<TopicCard topic={{ ...topic, href: "/goals/english/ielts" }} />);
    const link = screen.getByRole("link", { name: "IELTS" });
    expect(link).toHaveAttribute("href", "/goals/english/ielts");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("article")).toHaveClass(
      "hover:-translate-y-1",
      "motion-reduce:hover:translate-y-0",
      "focus-within:outline-2",
    );
  });

  it("receives ref via props", () => {
    const ref = createRef<HTMLElement>();
    render(<TopicCard topic={topic} ref={ref} />);
    expect(ref.current).toBe(screen.getByRole("article"));
  });

  it("receives className and other props", () => {
    render(
      <TopicCard topic={topic} className="custom-class" data-testid="card" />,
    );
    expect(screen.getByTestId("card")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <TopicCard topic={topic} />
        <TopicCard topic={{ ...topic, id: "x", color: "pink", href: "/x" }} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
