import { vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
// The membership card reads the account; a guest is enough for these tests.
vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));
vi.mock("@/features/membership", () => ({ getMyMembership: vi.fn() }));

import { HomeSidebar } from "./HomeSidebar";

expect.extend(toHaveNoViolations);

describe("HomeSidebar", () => {
  it("lists the header's buttons plus the English Diary as links under a Khám phá heading", () => {
    render(<HomeSidebar />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Trang chủ" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Bạn muốn làm gì hôm nay?")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Khám phá" }),
    ).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Khám phá" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/goals/english",
      "/goals/english/diary",
      "/goals/tech",
      "/learn",
      "/certificates",
    ]);
    expect(links[0]).toHaveTextContent("English Diary");
    expect(links[1]).toHaveTextContent("English Logs");
    expect(links[2]).toHaveTextContent("Công nghệ thông tin");
    expect(links[3]).toHaveTextContent("Học tập");
    expect(links[4]).toHaveTextContent("Chứng chỉ");
  });

  it("sorts the buttons under Ngôn ngữ, Công nghệ and Bắt đầu", () => {
    render(<HomeSidebar />);
    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(["Ngôn ngữ", "Công nghệ", "Bắt đầu"]);
    const english = screen.getByRole("link", { name: /English Diary/ });
    expect(english.closest("li")).toHaveTextContent("Ngôn ngữ");
  });

  describe("tiles on a phone", () => {
    it("gives each way in a small English line, which is not part of its name", () => {
      render(<HomeSidebar />);
      for (const [name, subtitle] of [
        [/English Diary/, "Language"],
        [/English Logs/, "Daily practice"],
        [/Công nghệ thông tin/, "Technology"],
        [/Học tập/, "Learning space"],
        [/Chứng chỉ/, "Certificates"],
      ] as const) {
        const link = screen.getByRole("link", { name });
        const line = within(link).getByText(subtitle);
        expect(line).toHaveAttribute("aria-hidden", "true");
        expect(line).toHaveAttribute("lang", "en");
        // Only a tile shows it: the bars from lg leave it out.
        expect(line).toHaveClass("hidden", "max-lg:block");
        expect(link).not.toHaveAccessibleName(new RegExp(subtitle));
      }
    });

    it("lays the links out as a grid of tiles under lg, and as bars from lg", () => {
      render(<HomeSidebar />);
      const nav = screen.getByRole("navigation", { name: "Khám phá" });
      expect(within(nav).getByRole("list")).toHaveClass(
        "grid",
        "grid-cols-2",
        "sm:grid-cols-3",
        "lg:flex",
        "lg:flex-col",
      );
      for (const link of within(nav).getAllByRole("link")) {
        expect(link).toHaveClass(
          "max-lg:min-h-36",
          "max-lg:rounded-2xl",
          "max-lg:flex-col",
        );
      }
    });

    it("puts the two language tiles in one row", () => {
      render(<HomeSidebar />);
      const english = screen.getByRole("link", { name: /English Diary/ });
      expect(english.closest("li")).toHaveClass("col-span-2", "grid-cols-2");
    });

    it("keeps the group headings for screen readers only", () => {
      render(<HomeSidebar />);
      for (const heading of screen.getAllByRole("heading", { level: 3 })) {
        expect(heading).toHaveClass("max-lg:sr-only");
      }
    });

    it("puts a large icon on each tile and an arrow on the bar of Học tập", () => {
      render(<HomeSidebar />);
      for (const href of [
        "/goals/english",
        "/goals/english/diary",
        "/goals/tech",
        "/learn",
        "/certificates",
      ]) {
        const link = document.querySelector(`a[href="${href}"]`)!;
        const icons = link.querySelectorAll("svg");
        expect(icons.length).toBeGreaterThan(0);
        icons.forEach((icon) =>
          expect(icon).toHaveAttribute("aria-hidden", "true"),
        );
      }
      const start = document.querySelector('a[href="/learn"]')!;
      expect(start.querySelector("svg")).toHaveClass("lg:hidden");
      expect(start).toHaveTextContent("→");
    });
  });

  it("lets a page that has its own visible h1 leave out the hidden one", () => {
    const { rerender } = render(<HomeSidebar />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    rerender(<HomeSidebar pageTitle={false} />);
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    rerender(<HomeSidebar pageTitle="Tên khác" />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Tên khác" }),
    ).toBeInTheDocument();
  });

  it("ends with the About me card", () => {
    render(<HomeSidebar />);
    expect(
      screen.getByRole("heading", { name: "Về tôi (Chủ web)" }),
    ).toBeInTheDocument();
  });

  it("puts the membership card under the About me card", () => {
    render(<HomeSidebar />);
    const about = screen.getByRole("heading", { name: "Về tôi (Chủ web)" });
    const membership = screen.getByRole("heading", {
      name: "Baolingo Membership",
    });
    expect(
      about.compareDocumentPosition(membership) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Khám phá quyền lợi" }),
    ).toHaveAttribute("href", "/membership");
  });

  it("stacks the buttons in a column from lg", () => {
    render(<HomeSidebar />);
    const nav = screen.getByRole("navigation", { name: "Khám phá" });
    expect(within(nav).getByRole("list")).toHaveClass("lg:flex", "lg:flex-col");
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
