import { act, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { AutoScroll } from "./AutoScroll";

expect.extend(toHaveNoViolations);

// jsdom has no layout: the sizes are set by hand and the observer is fired by hand.
let notify: () => void = () => {};
let contentHeight = 0;
let viewportHeight = 0;

beforeEach(() => {
  contentHeight = 0;
  viewportHeight = 0;
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        notify = callback;
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(
    () => contentHeight,
  );
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
    () => viewportHeight,
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  // @ts-expect-error jsdom has no matchMedia unless a test adds it
  delete window.matchMedia;
});

function measure(content: number, viewport: number) {
  contentHeight = content;
  viewportHeight = viewport;
  act(() => notify());
}

const setup = (props = {}) =>
  render(
    <AutoScroll role="region" aria-label="Hoạt động" {...props}>
      <p>Row</p>
    </AutoScroll>,
  );

describe("AutoScroll", () => {
  it("stays still when the content fits", () => {
    setup();
    measure(100, 300);
    expect(screen.getAllByText("Row")).toHaveLength(1);
    expect(
      screen.getByText("Row").parentElement?.parentElement,
    ).not.toHaveClass("animate-auto-scroll");
  });

  it("drifts by one copy of the content, at the given speed, when it does not fit", () => {
    setup({ speed: 20 });
    measure(400, 300);

    const rows = screen.getAllByText("Row");
    expect(rows).toHaveLength(2);
    const track = rows[0].parentElement?.parentElement as HTMLElement;
    expect(track).toHaveClass("animate-auto-scroll");
    expect(track.style.getPropertyValue("--auto-scroll-distance")).toBe(
      "400px",
    );
    expect(track.style.animationDuration).toBe("20s");
  });

  it("hides the second copy from assistive technology and keyboard focus", () => {
    setup();
    measure(400, 300);
    const copy = screen.getAllByText("Row")[1].parentElement as HTMLElement;
    expect(copy).toHaveAttribute("aria-hidden", "true");
    expect(copy).toHaveAttribute("inert");
    expect(screen.getAllByText("Row")[0].parentElement).not.toHaveAttribute(
      "aria-hidden",
    );
  });

  it("stops while paused and carries on afterwards", () => {
    const { rerender } = setup({ isPaused: true });
    measure(400, 300);
    const track = () =>
      screen.getAllByText("Row")[0].parentElement?.parentElement as HTMLElement;
    expect(track().style.animationPlayState).toBe("paused");

    rerender(
      <AutoScroll role="region" aria-label="Hoạt động">
        <p>Row</p>
      </AutoScroll>,
    );
    expect(track().style.animationPlayState).toBe("");
  });

  it("reports when it starts and stops moving", () => {
    const onActiveChange = vi.fn();
    setup({ onActiveChange });
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
    measure(400, 300);
    expect(onActiveChange).toHaveBeenLastCalledWith(true);
    measure(100, 300);
    expect(onActiveChange).toHaveBeenLastCalledWith(false);
  });

  it("does not move with reduced motion: it becomes a scroll area instead", () => {
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    setup();
    measure(400, 300);

    expect(screen.getAllByText("Row")).toHaveLength(1);
    const region = screen.getByRole("region", { name: "Hoạt động" });
    expect(region).toHaveClass("overflow-y-auto");
    expect(region).toHaveAttribute("tabindex", "0");
  });

  it("has no accessibility violations while moving", async () => {
    const { container } = setup();
    measure(400, 300);
    expect(await axe(container)).toHaveNoViolations();
  });
});
