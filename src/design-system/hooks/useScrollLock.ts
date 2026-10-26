import { useEffect } from "react";

// Reference-counted so stacked overlays don't unlock the page too early.
let lockCount = 0;
let savedStyles: { overflow: string; paddingRight: string } | null = null;

/** Prevents the page behind from scrolling while `isActive`. */
export function useScrollLock(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const { body, documentElement } = document;

    if (lockCount === 0) {
      savedStyles = {
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight,
      };
      // Replace the vanishing scrollbar with padding to avoid a layout jump.
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0 && savedStyles) {
        body.style.overflow = savedStyles.overflow;
        body.style.paddingRight = savedStyles.paddingRight;
        savedStyles = null;
      }
    };
  }, [isActive]);
}
