"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useEscapeKey } from "../../../hooks/useEscapeKey";
import { useOverlayLayer } from "../../../hooks/useOverlayLayer";
import {
  DropdownMenuContext,
  type MenuInitialFocus,
} from "./DropdownMenuContext";

export interface DropdownMenuProps extends ComponentProps<"div"> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Owns the open state and wires MenuTrigger to MenuContent. The menu is
 * rendered next to its trigger (not in a portal), so it stays above its
 * surroundings, including inside a Dialog. `className` and `ref` apply to
 * the wrapping element.
 */
export function DropdownMenu({
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ref,
  ...props
}: DropdownMenuProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const triggerRef = useRef<HTMLElement>(null);

  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [customTriggerId, setCustomTriggerId] = useState<string>();
  const [initialFocus, setInitialFocus] = useState<MenuInitialFocus>("first");
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const openMenu = useCallback(
    (focus: MenuInitialFocus) => {
      setInitialFocus(focus);
      setOpen(true);
    },
    [setOpen],
  );

  const closeMenu = useCallback(
    ({ returnFocus = true }: { returnFocus?: boolean } = {}) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [setOpen],
  );

  const isTopmost = useOverlayLayer(isOpen);
  useEscapeKey(isOpen, closeMenu, isTopmost);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu({ returnFocus: false });
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, closeMenu]);

  const context = useMemo(
    () => ({
      isOpen,
      triggerId: customTriggerId ?? `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      triggerRef,
      setCustomTriggerId,
      initialFocus,
      openMenu,
      closeMenu,
    }),
    [isOpen, baseId, customTriggerId, initialFocus, openMenu, closeMenu],
  );

  return (
    <DropdownMenuContext value={context}>
      <div
        ref={mergedRef}
        className={cn("relative inline-flex", className)}
        {...props}
      >
        {children}
      </div>
    </DropdownMenuContext>
  );
}
