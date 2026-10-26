import { vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollLock } from "./useScrollLock";

describe("useScrollLock", () => {
  afterEach(() => {
    document.body.removeAttribute("style");
  });

  it("hides the page overflow while active and restores it afterwards", () => {
    document.body.style.overflow = "auto";
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("does nothing while inactive", () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe("");
  });

  it("locks and unlocks as isActive changes", () => {
    const { rerender } = renderHook(({ isActive }) => useScrollLock(isActive), {
      initialProps: { isActive: false },
    });
    expect(document.body.style.overflow).toBe("");
    rerender({ isActive: true });
    expect(document.body.style.overflow).toBe("hidden");
    rerender({ isActive: false });
    expect(document.body.style.overflow).toBe("");
  });

  it("stays locked until the last of several locks is released", () => {
    const first = renderHook(() => useScrollLock(true));
    const second = renderHook(() => useScrollLock(true));
    first.unmount();
    expect(document.body.style.overflow).toBe("hidden");
    second.unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("restores the original padding after compensating for the scrollbar", () => {
    const innerWidth = vi
      .spyOn(window, "innerWidth", "get")
      .mockReturnValue(1024);
    const clientWidth = vi
      .spyOn(document.documentElement, "clientWidth", "get")
      .mockReturnValue(1009);
    document.body.style.paddingRight = "4px";

    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.paddingRight).toBe("15px");
    unmount();
    expect(document.body.style.paddingRight).toBe("4px");

    innerWidth.mockRestore();
    clientWidth.mockRestore();
  });

  it("leaves the padding alone when there is no scrollbar", () => {
    // jsdom has no layout, so give the document the same width as the window.
    const clientWidth = vi
      .spyOn(document.documentElement, "clientWidth", "get")
      .mockReturnValue(window.innerWidth);
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.paddingRight).toBe("");
    unmount();
    clientWidth.mockRestore();
  });
});
