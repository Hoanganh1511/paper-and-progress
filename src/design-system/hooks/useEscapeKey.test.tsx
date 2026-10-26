import { vi } from "vitest";
import { fireEvent, renderHook } from "@testing-library/react";
import { useEscapeKey } from "./useEscapeKey";

describe("useEscapeKey", () => {
  it("calls the handler when Escape is pressed while active", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("ignores other keys", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(true, onEscape));
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "a" });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("does nothing while inactive", () => {
    const onEscape = vi.fn();
    renderHook(() => useEscapeKey(false, onEscape));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("starts and stops listening as isActive changes", () => {
    const onEscape = vi.fn();
    const { rerender } = renderHook(
      ({ isActive }) => useEscapeKey(isActive, onEscape),
      { initialProps: { isActive: false } },
    );
    rerender({ isActive: true });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
    rerender({ isActive: false });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("stops listening on unmount", () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => useEscapeKey(true, onEscape));
    unmount();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("does not act when another overlay is on top", () => {
    const onEscape = vi.fn();
    let isTop = false;
    renderHook(() => useEscapeKey(true, onEscape, () => isTop));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).not.toHaveBeenCalled();
    isTop = true;
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not act on a key someone else already handled", () => {
    const onEscape = vi.fn();
    const handled = (event: KeyboardEvent) => event.preventDefault();
    document.addEventListener("keydown", handled, true);
    renderHook(() => useEscapeKey(true, onEscape));
    fireEvent.keyDown(document, { key: "Escape" });
    document.removeEventListener("keydown", handled, true);
    expect(onEscape).not.toHaveBeenCalled();
  });

  it("prevents the default action of the key it handles", () => {
    renderHook(() => useEscapeKey(true, () => {}));
    const notCancelled = fireEvent.keyDown(document, { key: "Escape" });
    expect(notCancelled).toBe(false);
  });

  it("calls the latest handler", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(
      ({ handler }) => useEscapeKey(true, handler),
      {
        initialProps: { handler: first },
      },
    );
    rerender({ handler: second });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
