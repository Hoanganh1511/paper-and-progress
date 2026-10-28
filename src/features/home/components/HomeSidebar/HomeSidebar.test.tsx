import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { HomeSidebar } from "./HomeSidebar";

expect.extend(toHaveNoViolations);

describe("HomeSidebar", () => {
  it("lists the header's three buttons as links under a Khám phá heading", () => {
    render(<HomeSidebar />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Bạn muốn làm gì hôm nay?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Khám phá" }),
    ).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Khám phá" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/goals/english",
      "/goals/tech",
      "/learn",
    ]);
    expect(links[0]).toHaveTextContent("Tiếng Anh");
    expect(links[1]).toHaveTextContent("Công nghệ thông tin");
    expect(links[2]).toHaveTextContent("Học tập");
  });

  it("sorts the buttons under Ngôn ngữ, Công nghệ and Bắt đầu", () => {
    render(<HomeSidebar />);
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(["Ngôn ngữ", "Công nghệ", "Bắt đầu"]);
    const english = screen.getByRole("link", { name: /Tiếng Anh/ });
    expect(english.closest("li")).toHaveTextContent("Ngôn ngữ");
  });

  it("stacks the buttons in a column", () => {
    render(<HomeSidebar />);
    expect(screen.getByRole("list")).toHaveClass("flex", "flex-col");
  });

  it("sits higher than the cards: a modal-sized shadow", () => {
    const { container } = render(<HomeSidebar />);
    expect(container.querySelector(".shadow-modal")).not.toBeNull();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<HomeSidebar />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
