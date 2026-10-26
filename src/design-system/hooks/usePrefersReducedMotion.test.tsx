import { vi } from "vitest";
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_event: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;

  return {
    change(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}

describe("usePrefersReducedMotion", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("is false where matchMedia does not exist", () => {
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reflects the current preference", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
  });

  it("updates when the preference changes, and stops listening on unmount", () => {
    const media = mockMatchMedia(false);
    const { result, unmount } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    expect(media.listenerCount()).toBe(1);

    act(() => media.change(true));
    expect(result.current).toBe(true);
    act(() => media.change(false));
    expect(result.current).toBe(false);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("is false while rendering on the server", () => {
    mockMatchMedia(true);
    function Probe() {
      return <span>{String(usePrefersReducedMotion())}</span>;
    }
    expect(renderToString(<Probe />)).toContain("false");
  });
});
