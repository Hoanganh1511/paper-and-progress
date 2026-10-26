import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { LAUNCHER_MODULES } from "../../data";
import { ModuleGrid, type ModuleGridProps } from "./ModuleGrid";

expect.extend(toHaveNoViolations);

function setup(props: Partial<ModuleGridProps> = {}) {
  return render(
    <ModuleGrid
      modules={LAUNCHER_MODULES}
      title="What would you like to do?"
      {...props}
    />,
  );
}

describe("ModuleGrid", () => {
  it("is a section with a heading and a navigation named after it", () => {
    setup({ description: "Pick a module to get started." });
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What would you like to do?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pick a module to get started."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "What would you like to do?" }),
    ).toBeInTheDocument();
  });

  it("lists all 15 modules as links, in order, to their pages", () => {
    setup();
    const links = within(screen.getByRole("navigation")).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(
      LAUNCHER_MODULES.map((m) => m.label),
    );
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      LAUNCHER_MODULES.map((m) => m.href),
    );
    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(15);
  });

  it("wraps with flex, not a grid", () => {
    setup();
    const list = screen.getByRole("list");
    expect(list).toHaveClass("flex", "flex-wrap");
    expect(list).not.toHaveClass("grid");
    expect(list.className).not.toMatch(/grid-cols/);
  });

  it("gives every item the same fixed width, a little wider on desktop", () => {
    setup();
    screen
      .getAllByRole("listitem")
      .forEach((item) => expect(item).toHaveClass("w-24", "lg:w-26"));
  });

  it("caps the list at the width of 3 items on phone and tablet and 5 on desktop, so 15 items wrap into 5 or 3 rows", () => {
    setup();
    // 3 x 6rem + 2 x 0.5rem, 3 x 6rem + 2 x 0.75rem, 5 x 6.5rem + 4 x 0.75rem.
    expect(screen.getByRole("list")).toHaveClass(
      "max-w-[19rem]",
      "sm:max-w-[19.5rem]",
      "lg:max-w-[35.5rem]",
    );
  });

  it("keeps the items close together", () => {
    setup();
    expect(screen.getByRole("list")).toHaveClass(
      "gap-x-2",
      "gap-y-1",
      "sm:gap-x-3",
      "sm:gap-y-2",
    );
  });

  it("sizes the circles 48px, and 64px on desktop", () => {
    const { container } = setup();
    const circle = container.querySelector(".rounded-pill") as HTMLElement;
    expect(circle).toHaveClass("size-12", "sm:size-12", "lg:size-16");
  });

  it("fills each fixed-width item with its link, which centers the picture and the name", () => {
    setup();
    const link = within(screen.getAllByRole("listitem")[0]).getByRole("link");
    expect(link).toHaveClass("w-full", "items-center", "text-center");
  });

  it("pulls the list left by half the space around the picture, so the first picture meets the heading's edge", () => {
    setup();
    // (6rem item - 3rem picture) / 2 = 1.5rem; (6.5rem - 4rem) / 2 = 1.25rem.
    expect(screen.getByRole("list")).toHaveClass("-ml-6", "lg:-ml-5");
  });

  it("takes an explicit navigation label and heading level", () => {
    setup({ navLabel: "Modules", titleAs: "h1" });
    expect(
      screen.getByRole("navigation", { name: "Modules" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("works with fewer modules and with none", () => {
    const { rerender } = setup({ modules: LAUNCHER_MODULES.slice(0, 4) });
    expect(screen.getAllByRole("link")).toHaveLength(4);
    rerender(<ModuleGrid modules={[]} title="Empty" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("moves through the modules with Tab in reading order", async () => {
    setup();
    for (const entry of LAUNCHER_MODULES.slice(0, 4)) {
      await userEvent.tab();
      expect(document.activeElement).toHaveAccessibleName(entry.label);
    }
  });

  it("receives ref via props and merges className", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "custom-class" });
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toHaveClass("custom-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
