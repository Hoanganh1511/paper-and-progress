import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LearningDomain } from "../../types";
import { DomainPanel } from "./DomainPanel";

expect.extend(toHaveNoViolations);

const topic = (
  id: string,
  title: string,
  meta = "0 bài viết · 0 lộ trình · 0 tài liệu",
) => ({
  id,
  title,
  description: "",
  meta,
  href: `/topics/${id}`,
});

const technology: LearningDomain = {
  id: "technology",
  label: "Công nghệ thông tin",
  icon: "technology",
  categories: [
    {
      id: "frontend",
      title: "Frontend",
      items: [
        topic("react", "React"),
        topic("vue", "Vue"),
        topic("angular", "Angular"),
      ],
    },
    { id: "backend", title: "Backend", items: [topic("nestjs", "NestJS")] },
    { id: "bao-mat", title: "Bảo mật", items: [topic("owasp", "OWASP")] },
  ],
};

describe("DomainPanel", () => {
  it("heads the domain with its name, what it is about and a picture for technology", () => {
    const { container } = render(<DomainPanel domain={technology} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Công nghệ thông tin" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Khám phá các công nghệ, framework và công cụ mình đang học, sử dụng và chia sẻ.",
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector("[data-decor='browser-code']"),
    ).not.toBeNull();
  });

  it("has no picture for another domain", () => {
    const { container } = render(
      <DomainPanel
        domain={{
          ...technology,
          id: "health",
          label: "Sức khỏe",
          icon: "health",
        }}
      />,
    );
    expect(container.querySelector("[data-decor='browser-code']")).toBeNull();
    expect(
      screen.getByText("Khám phá các chủ đề về sức khỏe và thói quen sống."),
    ).toBeInTheDocument();
  });

  it("lists the categories at the left, the first one chosen, each with its icon", () => {
    render(<DomainPanel domain={technology} />);
    const nav = screen.getByRole("navigation", {
      name: "Phân loại trong lĩnh vực Công nghệ thông tin",
    });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual([
      "Frontend",
      "Backend",
      "Bảo mật",
    ]);
    expect(buttons[0]).toHaveAttribute("aria-current", "true");
    for (const button of buttons) {
      expect(button.querySelector("svg")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    }
  });

  it("shows the chosen category's title with a lime stroke, and its topics as cards", () => {
    const { container } = render(<DomainPanel domain={technology} />);
    const title = screen.getByRole("heading", { level: 3, name: "Frontend" });
    expect(title.querySelector("[data-stroke]")).toHaveClass("bg-accent-lime");
    expect(container.querySelectorAll("article")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "React" })).toHaveAttribute(
      "href",
      "/topics/react",
    );
  });

  it("swaps the cards in place when another category is chosen, without moving the page", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    render(<DomainPanel domain={technology} />);
    await userEvent.click(screen.getByRole("button", { name: "Backend" }));
    expect(
      screen.getByRole("heading", { level: 3, name: "Backend" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NestJS" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "React" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Backend" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Frontend" }),
    ).not.toHaveAttribute("aria-current");
    expect(scroll).not.toHaveBeenCalled();
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("lays the cards out in columns that grow with the room", () => {
    const { container } = render(<DomainPanel domain={technology} />);
    expect(container.querySelector("ul.grid")).toHaveClass(
      "sm:grid-cols-2",
      "2xl:grid-cols-3",
    );
  });

  it("scrolls the category list sideways on a small screen and stacks it from md", () => {
    render(<DomainPanel domain={technology} />);
    const list = screen.getByRole("navigation").querySelector("ul");
    expect(list).toHaveClass("overflow-x-auto", "md:flex-col");
  });

  it("says so when a domain has no categories", () => {
    render(<DomainPanel domain={{ ...technology, categories: [] }} />);
    expect(
      screen.getByText("Chưa có chủ đề nào trong lĩnh vực này."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<DomainPanel domain={technology} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
