import { createRef } from "react";
import { vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Carousel, type CarouselProps } from "./Carousel";

expect.extend(toHaveNoViolations);

function setup(props: Partial<CarouselProps> = {}) {
  return render(
    <Carousel aria-label="Certificates" {...props}>
      <a href="/a" className="block w-60">
        IELTS
      </a>
      <a href="/b" className="block w-60">
        TOEIC
      </a>
      <a href="/c" className="block w-60">
        TOEFL
      </a>
    </Carousel>,
  );
}

const track = () => screen.getAllByRole("group")[0];

/** jsdom has no layout: describe the row's geometry by hand. */
function setGeometry(
  element: HTMLElement,
  {
    scrollLeft = 0,
    clientWidth = 300,
    scrollWidth = 800,
    slideWidth = 240,
  } = {},
) {
  Object.defineProperty(element, "scrollLeft", {
    configurable: true,
    writable: true,
    value: scrollLeft,
  });
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: clientWidth,
  });
  Object.defineProperty(element, "scrollWidth", {
    configurable: true,
    value: scrollWidth,
  });
  Object.defineProperty(
    element.firstElementChild as HTMLElement,
    "offsetWidth",
    {
      configurable: true,
      value: slideWidth,
    },
  );
  element.scrollBy = vi.fn();
  act(() => {
    fireEvent.scroll(element);
  });
}

describe("Carousel", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("is a named carousel region whose row is a focusable group", () => {
    setup();
    const region = screen.getByRole("region", { name: "Certificates" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(track()).toHaveAttribute("aria-label", "Certificates");
    expect(track()).toHaveAttribute("tabindex", "0");
  });

  it("scrolls sideways and snaps each slide to the start", () => {
    setup();
    expect(track()).toHaveClass(
      "flex",
      "overflow-x-auto",
      "snap-x",
      "snap-mandatory",
      "gap-4",
    );
    within(track())
      .getAllByRole("group")
      .forEach((slide) => expect(slide).toHaveClass("snap-start", "shrink-0"));
  });

  it("wraps each child in a slide named 'n of N'", () => {
    setup();
    const slides = within(track()).getAllByRole("group");
    expect(slides).toHaveLength(3);
    expect(slides.map((slide) => slide.getAttribute("aria-label"))).toEqual([
      "1 of 3",
      "2 of 3",
      "3 of 3",
    ]);
    slides.forEach((slide) =>
      expect(slide).toHaveAttribute("aria-roledescription", "slide"),
    );
    expect(
      within(slides[1]).getByRole("link", { name: "TOEIC" }),
    ).toBeInTheDocument();
  });

  it("scrolls with the keyboard because the row is a tab stop", async () => {
    setup();
    await userEvent.tab();
    expect(track()).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "IELTS" })).toHaveFocus();
  });

  describe("arrows", () => {
    it("have no buttons while everything fits", () => {
      setup();
      setGeometry(track(), { scrollWidth: 300, clientWidth: 300 });
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("appear when there is more to scroll to, with previous disabled at the start", () => {
      setup();
      setGeometry(track());
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    });

    it("enable previous mid-way, and disable next at the end", () => {
      setup();
      setGeometry(track(), { scrollLeft: 100 });
      expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();

      setGeometry(track(), { scrollLeft: 500 });
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("step one slide plus the gap, smoothly", async () => {
      setup();
      setGeometry(track(), { scrollLeft: 300 });
      await userEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(track().scrollBy).toHaveBeenLastCalledWith({
        left: 240 + 0,
        behavior: "smooth",
      });
      await userEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(track().scrollBy).toHaveBeenLastCalledWith({
        left: -(240 + 0),
        behavior: "smooth",
      });
    });

    it("jump without animation when the user prefers reduced motion", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
      setup();
      setGeometry(track());
      await userEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(track().scrollBy).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: "auto" }),
      );
    });

    it("show only from md, since touch screens swipe", () => {
      setup();
      setGeometry(track());
      expect(screen.getByRole("button", { name: "Next" })).toHaveClass(
        "hidden",
        "md:inline-flex",
      );
    });

    it("can be turned off", () => {
      setup({ showArrows: false });
      setGeometry(track());
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("accept translated labels", () => {
      setup({
        labels: { previous: "Trước", next: "Sau", slide: "{current}/{total}" },
      });
      setGeometry(track());
      expect(screen.getByRole("button", { name: "Trước" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sau" })).toBeInTheDocument();
      expect(within(track()).getAllByRole("group")[0]).toHaveAttribute(
        "aria-label",
        "1/3",
      );
    });
  });

  it("works with a single slide and with none", () => {
    const { rerender } = render(
      <Carousel aria-label="One">
        <p>Only</p>
      </Carousel>,
    );
    expect(screen.getByText("Only")).toBeInTheDocument();
    rerender(<Carousel aria-label="None">{null}</Carousel>);
    expect(screen.queryByText("Only")).not.toBeInTheDocument();
  });

  it("receives ref via props and merges classNames", () => {
    const ref = createRef<HTMLElement>();
    setup({ ref, className: "outer-class", trackClassName: "track-class" });
    expect(ref.current).toBe(screen.getByRole("region"));
    expect(ref.current).toHaveClass("outer-class");
    expect(track()).toHaveClass("track-class");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    setGeometry(track());
    expect(await axe(container)).toHaveNoViolations();
  });
});
