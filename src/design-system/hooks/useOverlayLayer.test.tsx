import { renderHook } from "@testing-library/react";
import { useOverlayLayer } from "./useOverlayLayer";

describe("useOverlayLayer", () => {
  it("is not topmost while inactive", () => {
    const { result } = renderHook(() => useOverlayLayer(false));
    expect(result.current()).toBe(false);
  });

  it("is topmost while it is the only active overlay", () => {
    const { result } = renderHook(() => useOverlayLayer(true));
    expect(result.current()).toBe(true);
  });

  it("makes the most recently opened overlay the topmost", () => {
    const first = renderHook(() => useOverlayLayer(true));
    const second = renderHook(() => useOverlayLayer(true));
    expect(first.result.current()).toBe(false);
    expect(second.result.current()).toBe(true);
  });

  it("hands the top back to the one below when the top closes", () => {
    const first = renderHook(() => useOverlayLayer(true));
    const second = renderHook(() => useOverlayLayer(true));
    second.unmount();
    expect(first.result.current()).toBe(true);
  });

  it("releases its place when it turns inactive", () => {
    const first = renderHook(() => useOverlayLayer(true));
    const second = renderHook(({ isActive }) => useOverlayLayer(isActive), {
      initialProps: { isActive: true },
    });
    expect(first.result.current()).toBe(false);
    second.rerender({ isActive: false });
    expect(first.result.current()).toBe(true);
    expect(second.result.current()).toBe(false);
  });

  it("tracks the order of opening, not of mounting", () => {
    const first = renderHook(({ isActive }) => useOverlayLayer(isActive), {
      initialProps: { isActive: false },
    });
    const second = renderHook(() => useOverlayLayer(true));
    first.rerender({ isActive: true });
    expect(first.result.current()).toBe(true);
    expect(second.result.current()).toBe(false);
  });

  it("returns a stable function across renders", () => {
    const { result, rerender } = renderHook(() => useOverlayLayer(true));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });
});
