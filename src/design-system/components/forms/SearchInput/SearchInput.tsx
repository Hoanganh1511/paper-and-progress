"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { Search, X } from "lucide-react";
import { mergeRefs } from "../../../utils/mergeRefs";
import { IconButton } from "../../actions/Button/IconButton";
import { Input, type InputProps } from "../Input";

export interface SearchInputProps extends Omit<
  InputProps,
  "type" | "leftAddon" | "rightAddon"
> {
  /** Called when the clear button (or Escape) empties the field. */
  onClear?: () => void;
  clearLabel?: string;
}

export function SearchInput({
  value,
  defaultValue = "",
  disabled,
  clearLabel = "Clear search",
  onChange,
  onClear,
  onKeyDown,
  ref,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMemo(() => mergeRefs(inputRef, ref), [ref]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue));
  const currentValue = isControlled ? String(value) : internalValue;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!isControlled) setInternalValue(event.target.value);
    onChange?.(event);
  }

  function clear() {
    if (!isControlled) setInternalValue("");
    onClear?.();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.key === "Escape" && currentValue && !event.defaultPrevented) {
      event.preventDefault();
      clear();
    }
  }

  const canClear = currentValue !== "" && !disabled;

  return (
    <Input
      {...props}
      ref={mergedRef}
      type="search"
      value={currentValue}
      disabled={disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      leftAddon={<Search aria-hidden="true" size={16} />}
      rightAddon={
        canClear && (
          <IconButton
            icon={X}
            aria-label={clearLabel}
            variant="ghost"
            size="compact"
            className="size-6 rounded-sharp"
            onClick={clear}
          />
        )
      }
    />
  );
}
