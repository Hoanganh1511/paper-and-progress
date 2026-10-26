import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LearningItem } from "../../types";
import { LearningItemCard } from "./LearningItemCard";

expect.extend(toHaveNoViolations);

const item: LearningItem = {
  id: "ts",
  title: "TypeScript thực chiến",
  description: "Kiểu dữ liệu, generic và cấu hình dự án thật.",
  level: "intermediate",
  duration: "6 giờ",
  lessons: 24,
};

describe("LearningItemCard", () => {
  it("renders an article with a level, title, description, duration and lessons", () => {
    render(<LearningItemCard item={item} />);
    const article = screen.getByRole("article");
    expect(article).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: item.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(item.description)).toBeInTheDocument();
    expect(screen.getByText("Trung cấp")).toBeInTheDocument();
    expect(screen.getByText("6 giờ")).toBeInTheDocument();
    expect(screen.getByText("24 bài học")).toBeInTheDocument();
  });

  it("shows each level as a labelled badge, so it never relies on color", () => {
    const labels = {
      beginner: "Cơ bản",
      intermediate: "Trung cấp",
      advanced: "Nâng cao",
    } as const;
    (Object.keys(labels) as (keyof typeof labels)[]).forEach((level) => {
      const { unmount } = render(
        <LearningItemCard item={{ ...item, level }} />,
      );
      expect(screen.getByText(labels[level])).toBeInTheDocument();
      unmount();
    });
  });

  it("hides the decorative icons from assistive technology", () => {
    const { container } = render(<LearningItemCard item={item} />);
    container
      .querySelectorAll("svg")
      .forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });

  it("is plain, with no link, when the item has no href", () => {
    render(<LearningItemCard item={item} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("article")).not.toHaveClass("cursor-pointer");
  });

  it("makes the title a link stretched over an interactive card when it has an href", () => {
    render(<LearningItemCard item={{ ...item, href: "/learn/ts" }} />);
    const link = screen.getByRole("link", { name: item.title });
    expect(link).toHaveAttribute("href", "/learn/ts");
    expect(link).toHaveClass("after:absolute", "after:inset-0");
    expect(screen.getByRole("article")).toHaveClass(
      "cursor-pointer",
      "relative",
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("merges className", () => {
    render(<LearningItemCard item={item} className="custom-class" />);
    expect(screen.getByRole("article")).toHaveClass("custom-class", "h-full");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <LearningItemCard item={item} />
        <LearningItemCard item={{ ...item, id: "x", href: "/learn/x" }} />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
