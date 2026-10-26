"use client";

import { SelectRoot, type SelectRootProps } from "./SelectRoot";

export type SelectProps = Omit<SelectRootProps, "mode">;

/**
 * Custom single-select dropdown (a button that opens a listbox). Compose it
 * with SelectTrigger and SelectContent holding SelectItem / SelectGroup.
 * `className` and `ref` apply to the wrapping element.
 */
export function Select(props: SelectProps) {
  return <SelectRoot mode="select" {...props} />;
}
