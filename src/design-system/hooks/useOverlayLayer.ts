import { useCallback, useEffect, useId } from "react";

// Open overlays, oldest first. Only the last one reacts to Escape and Tab.
const overlayStack: string[] = [];

/**
 * Registers an overlay in the shared stack while `isActive`. Returns a function
 * telling whether this overlay is currently the topmost one. Call it before
 * useFocusTrap/useEscapeKey so it is also released first on cleanup.
 */
export function useOverlayLayer(isActive: boolean) {
  const id = useId();

  useEffect(() => {
    if (!isActive) return;
    overlayStack.push(id);
    return () => {
      const index = overlayStack.lastIndexOf(id);
      if (index !== -1) overlayStack.splice(index, 1);
    };
  }, [isActive, id]);

  return useCallback(() => overlayStack[overlayStack.length - 1] === id, [id]);
}
