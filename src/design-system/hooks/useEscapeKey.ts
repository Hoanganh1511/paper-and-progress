import { useEffect } from "react";

/**
 * Calls `onEscape` when Escape is pressed while `isActive`, unless something
 * else already handled the key or another overlay is on top (`isTopmost`).
 */
export function useEscapeKey(
  isActive: boolean,
  onEscape: () => void,
  isTopmost: () => boolean = () => true,
) {
  useEffect(() => {
    if (!isActive) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented || !isTopmost()) {
        return;
      }
      event.preventDefault();
      onEscape();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape, isTopmost]);
}
