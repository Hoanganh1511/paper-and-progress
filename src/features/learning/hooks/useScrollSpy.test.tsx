import { vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import { useScrollSpy } from "./useScrollSpy";

const IDS = ["a", "b", "c"];

function mountSections(tops: Record<string, number>) {
  const sections = IDS.map((id) => {
    const element = document.createElement("section");
    element.id = id;
    element.scrollIntoView = vi.fn();
    document.body.append(element);
    return element;
  });
  const setTops = (next: Record<string, number>) =>
    sections.forEach((element) =>
      vi
        .spyOn(element, "getBoundingClientRect")
        .mockReturnValue({ top: next[element.id] } as DOMRect),
    );
  setTops(tops);
  return { sections, setTops };
}

function scrollWindow(y: number, { atBottom = false } = {}) {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    configurable: true,
    value: atBottom ? window.innerHeight + y : 5000,
  });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
    vi.advanceTimersToNextFrame();
  });
}

function mockReducedMotion(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

describe("useScrollSpy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 5000,
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("starts on the first section", () => {
    mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));
    expect(result.current.activeId).toBe("a");
  });

  it("makes the last section above the line the current one as the page scrolls", () => {
    const { setTops } = mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));

    setTops({ a: -500, b: 0, c: 600 });
    scrollWindow(500);
    expect(result.current.activeId).toBe("b");

    setTops({ a: -1100, b: -600, c: 0 });
    scrollWindow(1100);
    expect(result.current.activeId).toBe("c");

    setTops({ a: -100, b: 400, c: 1000 });
    scrollWindow(100);
    expect(result.current.activeId).toBe("a");
  });

  it("uses each section's scroll-margin-top as its line", () => {
    const { sections, setTops } = mountSections({ a: 0, b: 90, c: 700 });
    sections.forEach((element) => {
      element.style.scrollMarginTop = "80px";
    });
    const { result } = renderHook(() => useScrollSpy(IDS));

    setTops({ a: -300, b: 90, c: 700 });
    scrollWindow(300);
    expect(result.current.activeId).toBe("a");

    setTops({ a: -310, b: 85, c: 700 });
    scrollWindow(310);
    expect(result.current.activeId).toBe("b");
  });

  it("makes the last section current at the bottom of the page", () => {
    const { setTops } = mountSections({ a: -2000, b: -1000, c: 400 });
    const { result } = renderHook(() => useScrollSpy(IDS));
    setTops({ a: -2000, b: -1000, c: 400 });
    scrollWindow(2000, { atBottom: true });
    expect(result.current.activeId).toBe("c");
  });

  it("goTo scrolls smoothly, marks the section active and returns it", () => {
    const { sections } = mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));

    let element: HTMLElement | null = null;
    act(() => {
      element = result.current.goTo("c");
    });
    expect(element).toBe(sections[2]);
    expect(sections[2].scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(result.current.activeId).toBe("c");
  });

  it("scrolls without animation when the user prefers reduced motion", () => {
    mockReducedMotion(true);
    const { sections } = mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));
    act(() => {
      result.current.goTo("b");
    });
    expect(sections[1].scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
  });

  it("ignores scroll events while a programmatic scroll is under way, then resumes", () => {
    const { setTops } = mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));
    act(() => {
      result.current.goTo("c");
    });

    // The smooth scroll passes through "b"; the highlight must stay on "c".
    setTops({ a: -500, b: 0, c: 600 });
    scrollWindow(500);
    expect(result.current.activeId).toBe("c");

    // Once scrolling has been idle, normal tracking resumes.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    setTops({ a: -500, b: 0, c: 600 });
    scrollWindow(500);
    expect(result.current.activeId).toBe("b");
  });

  it("returns null from goTo for an unknown id", () => {
    mountSections({ a: 100, b: 600, c: 1200 });
    const { result } = renderHook(() => useScrollSpy(IDS));
    let element: HTMLElement | null = document.body;
    act(() => {
      element = result.current.goTo("missing");
    });
    expect(element).toBeNull();
    expect(result.current.activeId).toBe("a");
  });

  it("copes with no sections", () => {
    const { result } = renderHook(() => useScrollSpy([]));
    expect(result.current.activeId).toBeUndefined();
    scrollWindow(100);
    expect(result.current.activeId).toBeUndefined();
  });

  it("stops listening on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    mountSections({ a: 100, b: 600, c: 1200 });
    const { unmount } = renderHook(() => useScrollSpy(IDS));
    unmount();
    expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("works inside a component", () => {
    mountSections({ a: 100, b: 600, c: 1200 });
    function Probe() {
      const { activeId } = useScrollSpy(IDS);
      return <p>{activeId}</p>;
    }
    render(<Probe />);
    expect(screen.getByText("a")).toBeInTheDocument();
  });
});
