"use client";

import { createContext, useContext, type RefObject } from "react";

export type MenuInitialFocus = "first" | "last";

export interface DropdownMenuContextValue {
  isOpen: boolean;
  triggerId: string;
  contentId: string;
  triggerRef: RefObject<HTMLElement | null>;
  /** Lets the trigger report its own `id`, which then labels the menu. */
  setCustomTriggerId: (id: string | undefined) => void;
  initialFocus: MenuInitialFocus;
  openMenu: (initialFocus: MenuInitialFocus) => void;
  /** Closes the menu; focus goes back to the trigger unless `returnFocus` is false. */
  closeMenu: (options?: { returnFocus?: boolean }) => void;
}

export const DropdownMenuContext =
  createContext<DropdownMenuContextValue | null>(null);

export function useDropdownMenu() {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("Menu parts must be used within a DropdownMenu");
  }
  return context;
}
