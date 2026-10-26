"use client";

import { createContext, useContext, type RefObject } from "react";

export type SelectMode = "select" | "combobox";
export type SelectOpenTarget = "selected" | "first" | "last";
export type SelectMove = "next" | "prev" | "first" | "last";

export interface SelectItemRecord {
  textValue: string;
  disabled: boolean;
}

export interface SelectContextValue {
  mode: SelectMode;
  value: string | undefined;
  /** Text of the selected item, once that item has mounted. */
  selectedLabel: string | undefined;
  isOpen: boolean;
  isDisabled: boolean;
  /** Id of the trigger / input; the FormField id when inside one. */
  controlId: string;
  listboxId: string;
  /** Id of the FormField label, if any. */
  labelId: string | undefined;
  controlRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  activeValue: string | undefined;
  setActiveValue: (value: string | undefined) => void;
  getOptionId: (value: string) => string;
  /** Combobox only: the text to show in the input. */
  inputValue: string;
  onInputChange: (text: string) => void;
  /** Number of items matching the current search text. */
  visibleCount: number;
  hasItems: boolean;
  matches: (textValue: string) => boolean;
  registerItem: (value: string, record: SelectItemRecord) => () => void;
  getOptions: () => HTMLElement[];
  openList: (target: SelectOpenTarget) => void;
  closeList: () => void;
  moveActive: (move: SelectMove) => void;
  selectValue: (value: string) => void;
}

export const SelectContext = createContext<SelectContextValue | null>(null);

export function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select parts must be used within a Select or Combobox");
  }
  return context;
}

const ENABLED_OPTION_SELECTOR = '[role="option"]:not([aria-disabled="true"])';

/** Enabled options in DOM order (filtered-out items are not rendered). */
export function queryOptions(container: HTMLElement | null) {
  return Array.from(
    container?.querySelectorAll<HTMLElement>(ENABLED_OPTION_SELECTOR) ?? [],
  );
}

/** Lowercases and strips accents so "Da Nang" finds "Đà Nẵng". */
export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// Values may contain spaces or symbols, which are not valid in an id.
export function toOptionId(baseId: string, value: string) {
  return `${baseId}-option-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}
