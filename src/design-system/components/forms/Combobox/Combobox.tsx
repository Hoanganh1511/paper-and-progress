"use client";

import { SelectRoot, type SelectRootProps } from "../Select/SelectRoot";

export type ComboboxProps = Omit<SelectRootProps, "mode">;

/**
 * Searchable select: ComboboxInput filters the ComboboxItem list as you type.
 * It shares the Select list parts: ComboboxContent, ComboboxItem and
 * ComboboxGroup are the same components as their Select counterparts.
 * Search ignores case and accents.
 */
export function Combobox(props: ComboboxProps) {
  return <SelectRoot mode="combobox" {...props} />;
}
