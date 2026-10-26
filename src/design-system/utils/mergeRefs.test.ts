import { vi } from "vitest";
import { mergeRefs } from "./mergeRefs";

describe("mergeRefs", () => {
  it("assigns object and callback refs, then clears them on cleanup", () => {
    const objectRef = { current: null as HTMLElement | null };
    const callbackRef = vi.fn();
    const node = document.createElement("div");

    const cleanup = mergeRefs<HTMLElement>(
      objectRef,
      callbackRef,
      undefined,
    )(node);

    expect(objectRef.current).toBe(node);
    expect(callbackRef).toHaveBeenCalledWith(node);

    (cleanup as () => void)();

    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(null);
  });
});
