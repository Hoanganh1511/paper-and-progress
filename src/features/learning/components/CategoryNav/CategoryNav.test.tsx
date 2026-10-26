import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { CategoryNav } from "./CategoryNav";

expect.extend(toHaveNoViolations);

const categories = [
  { id: "programming", title: "Lập trình" },
  { id: "data-ai", title: "Dữ liệu và AI" },
  { id: "devops", title: "Hạ tầng và DevOps" },
];

describe("CategoryNav", () => {
  it("renders a navigation with one button per category", () => {
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Phân loại" }),
    ).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) =>
      expect(button).toHaveAttribute("type", "button"),
    );
  });

  it("marks only the active category as the current location", () => {
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        activeId="data-ai"
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Dữ liệu và AI" }),
    ).toHaveAttribute("aria-current", "location");
    expect(
      screen.getByRole("button", { name: "Lập trình" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("styles the current button with more than color", () => {
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        activeId="programming"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Lập trình" })).toHaveClass(
      "aria-[current=location]:bg-accent-lime",
      "aria-[current=location]:font-semibold",
    );
  });

  it("reports the chosen category when its button is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Hạ tầng và DevOps" }),
    );
    expect(onSelect).toHaveBeenLastCalledWith("devops");
  });

  it("is operable from the keyboard", async () => {
    const onSelect = vi.fn();
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        onSelect={onSelect}
      />,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Dữ liệu và AI" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("data-ai");
  });

  it("keeps the current button in view when it changes", () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const { rerender } = render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        activeId="programming"
        onSelect={() => {}}
      />,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
    rerender(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        activeId="devops"
        onSelect={() => {}}
      />,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
    Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  });

  it("merges className", () => {
    render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        onSelect={() => {}}
        className="custom-class"
      />,
    );
    expect(screen.getByRole("navigation")).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <CategoryNav
        aria-label="Phân loại"
        categories={categories}
        activeId="programming"
        onSelect={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
