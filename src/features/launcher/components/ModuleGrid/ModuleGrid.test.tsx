import { createRef } from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
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

  it("lists all modules as links, in order, to their pages", () => {
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
    ).toHaveLength(LAUNCHER_MODULES.length);
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

  it("caps the list at the width of 3 items on phone and tablet and 5 on desktop, so a longer list wraps into rows", () => {
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
    const { rerender } = setup({ modules: LAUNCHER_MODULES.slice(0, 2) });
    expect(screen.getAllByRole("link")).toHaveLength(2);
    rerender(<ModuleGrid modules={[]} title="Empty" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("moves through the modules with Tab in reading order", async () => {
    setup();
    for (const entry of LAUNCHER_MODULES.slice(0, 2)) {
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

describe("ModuleGrid choosing a module", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const learn = () => screen.getByRole("link", { name: "Daily Logs" });

  it("fades the others out, then enlarges the chosen one and shows its panel", async () => {
    setup({ panels: { "daily-logs": <p>Log content</p> } });
    await userEvent.click(learn());

    // Phase 1: the others fade, nothing else has happened yet.
    const others = screen
      .getAllByRole("listitem")
      .filter((item) => !within(item).queryByText("Daily Logs"));
    others.forEach((item) => expect(item).toHaveClass("opacity-0"));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(learn().closest("li")).not.toHaveClass("scale-120");

    // Phase 2: the others are gone, the chosen one grows, the panel appears.
    act(() => {
      vi.advanceTimersByTime(250);
    });
    others.forEach((item) => expect(item).toHaveClass("hidden"));
    expect(learn().closest("li")).toHaveClass("scale-120");
    expect(learn()).toHaveAttribute("aria-current", "true");
    const panel = screen.getByRole("region", { name: "Daily Logs" });
    expect(within(panel).getByText("Log content")).toBeInTheDocument();
    expect(panel).toHaveFocus();
  });

  it("explains a module without a panel", async () => {
    setup({ emptyPanelTitle: "{label} is coming soon" });
    await userEvent.click(screen.getByRole("link", { name: "Bài viết" }));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(
      screen.getByRole("heading", { name: "Bài viết is coming soon" }),
    ).toBeInTheDocument();
  });

  it("brings every module back on the close button and on Escape", async () => {
    setup({ closeLabel: "Pick another" });
    await userEvent.click(learn());
    act(() => {
      vi.advanceTimersByTime(250);
    });
    await userEvent.click(screen.getByRole("button", { name: "Pick another" }));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(
      LAUNCHER_MODULES.length,
    );
    screen
      .getAllByRole("listitem")
      .forEach((item) => expect(item).not.toHaveClass("hidden", "opacity-0"));

    await userEvent.click(learn());
    act(() => {
      vi.advanceTimersByTime(250);
    });
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("leaves modified clicks to the browser", async () => {
    setup();
    fireEvent.click(learn(), { ctrlKey: true });
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("skips the fade with reduced motion", async () => {
    // jsdom has no matchMedia; the hook treats its absence as "no preference".
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    setup();
    await userEvent.click(learn());
    expect(screen.getByRole("region", { name: "Daily Logs" })).toBeVisible();
    // @ts-expect-error restoring jsdom's missing matchMedia
    delete window.matchMedia;
  });

  it("has no accessibility violations while open", async () => {
    const { container } = setup();
    await userEvent.click(learn());
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
