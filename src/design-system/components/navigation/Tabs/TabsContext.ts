"use client";

import { createContext, useContext } from "react";

export type TabsVariant = "underline" | "pill";

export interface TabsContextValue {
  /** Selected tab value, or undefined when nothing is selected yet. */
  value: string | undefined;
  onValueChange: (value: string) => void;
  variant: TabsVariant;
  baseId: string;
}

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs parts must be used within Tabs");
  }
  return context;
}

// Values may contain spaces or symbols, which are not valid in an id.
function toIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function getTabId(baseId: string, value: string) {
  return `${baseId}-tab-${toIdPart(value)}`;
}

export function getPanelId(baseId: string, value: string) {
  return `${baseId}-panel-${toIdPart(value)}`;
}
