"use client";

import {
  useMemo,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { ChevronDown } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { focusRingWithinClasses } from "../../../primitives/FocusRing";
import { useFieldControlProps } from "../FormField/FormFieldContext";
import { useSelect } from "../Select/SelectContext";
import { selectControlVariants } from "../Select/SelectTrigger";

export interface ComboboxInputProps
  extends
    Omit<
      ComponentProps<"input">,
      "size" | "type" | "role" | "value" | "defaultValue"
    >,
    Pick<VariantProps<typeof selectControlVariants>, "size"> {}

/**
 * The editable text field of a Combobox (a list-autocomplete combobox).
 * Typing opens and filters the list; ArrowDown/ArrowUp move through it,
 * Enter picks the active item and Escape closes it. Closing without
 * picking restores the selected item's text.
 */
export function ComboboxInput({
  size,
  className,
  id,
  disabled,
  onChange,
  onKeyDown,
  onClick,
  onBlur,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: ComboboxInputProps) {
  const select = useSelect();
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });
  const mergedRef = useMemo(
    () => mergeRefs(select.controlRef, ref),
    [select.controlRef, ref],
  );
  const isDisabled = disabled ?? select.isDisabled;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event);
    select.onInputChange(event.target.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (select.isOpen) select.moveActive("next");
        else select.openList("selected");
        break;
      case "ArrowUp":
        event.preventDefault();
        if (select.isOpen) select.moveActive("prev");
        else select.openList(select.value !== undefined ? "selected" : "last");
        break;
      case "Enter":
        if (select.isOpen && select.activeValue !== undefined) {
          event.preventDefault();
          select.selectValue(select.activeValue);
        }
        break;
      case "Tab":
        select.closeList();
        break;
    }
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    if (
      !event.currentTarget
        .closest("[data-select-root]")
        ?.contains(event.relatedTarget)
    ) {
      select.closeList();
    }
  }

  function handleClick(event: MouseEvent<HTMLInputElement>) {
    onClick?.(event);
    if (!select.isOpen && !event.defaultPrevented) select.openList("selected");
  }

  return (
    <div
      className={cn(
        selectControlVariants({ size, hasError: control.hasError }),
        "relative cursor-text focus-within:border-border-strong",
        focusRingWithinClasses,
        className,
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget)
          select.controlRef.current?.focus();
      }}
    >
      <input
        ref={mergedRef}
        type="text"
        role="combobox"
        id={control.id ?? select.controlId}
        value={select.inputValue}
        disabled={isDisabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={select.isOpen}
        aria-controls={select.listboxId}
        aria-activedescendant={
          select.isOpen && select.activeValue !== undefined
            ? select.getOptionId(select.activeValue)
            : undefined
        }
        aria-labelledby={ariaLabelledBy}
        aria-describedby={control["aria-describedby"]}
        aria-invalid={control["aria-invalid"]}
        aria-required={control["aria-required"]}
        className="h-full min-w-0 flex-1 bg-transparent text-inherit placeholder:text-text-muted focus:outline-none disabled:cursor-not-allowed"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onClick={handleClick}
        {...props}
      />
      <ChevronDown
        aria-hidden="true"
        size={16}
        className={cn(
          "shrink-0 text-text-muted transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
          select.isOpen && "rotate-180",
        )}
      />
    </div>
  );
}
