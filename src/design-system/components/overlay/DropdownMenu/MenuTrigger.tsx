"use client";

import {
  cloneElement,
  useLayoutEffect,
  useMemo,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from "react";
import { mergeRefs } from "../../../utils/mergeRefs";
import { useDropdownMenu } from "./DropdownMenuContext";

export interface MenuTriggerProps {
  /** A single focusable element, typically a Button or IconButton. */
  children: ReactElement<ComponentProps<"button">>;
}

/**
 * Turns its child into the menu button: Enter, Space or a click toggles the
 * menu, ArrowDown opens it on the first item and ArrowUp on the last.
 */
export function MenuTrigger({ children }: MenuTriggerProps) {
  const {
    isOpen,
    triggerId,
    contentId,
    triggerRef,
    setCustomTriggerId,
    openMenu,
    closeMenu,
  } = useDropdownMenu();
  const { id, ref, onClick, onKeyDown } = children.props;
  useLayoutEffect(() => {
    setCustomTriggerId(id);
    return () => setCustomTriggerId(undefined);
  }, [id, setCustomTriggerId]);

  const childRef = ref as ComponentProps<"button">["ref"];
  const mergedRef = useMemo(
    () => mergeRefs(triggerRef, childRef),
    [triggerRef, childRef],
  );

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isOpen) closeMenu();
    else openMenu("first");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openMenu(event.key === "ArrowDown" ? "first" : "last");
    }
  }

  return cloneElement(children, {
    ref: mergedRef,
    id: id ?? triggerId,
    "aria-haspopup": "menu",
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? contentId : undefined,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  });
}
