import { useEffect, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

/**
 * Keeps keyboard focus inside `ref` while `isActive`. On activation it focuses
 * the `[data-autofocus]` element, else the first focusable one, else the
 * container itself; on deactivation it gives focus back to where it was.
 * `isTopmost` lets stacked overlays hand the trap to the one on top.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  isTopmost: () => boolean = () => true,
) {
  useEffect(() => {
    const container = ref.current;
    if (!isActive || !container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.closest("[hidden]"));

    const initialTarget =
      container.querySelector<HTMLElement>("[data-autofocus]") ??
      getFocusable()[0] ??
      container;
    initialTarget.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab" || !isTopmost()) return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        container?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!container?.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === container)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function handleFocusIn(event: FocusEvent) {
      if (!isTopmost() || container?.contains(event.target as Node)) return;
      (getFocusable()[0] ?? container)?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      previouslyFocused?.focus();
    };
  }, [ref, isActive, isTopmost]);
}
