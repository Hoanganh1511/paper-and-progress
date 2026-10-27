"use client";

import {
  useMemo,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";
import { mergeRefs } from "../../../utils/mergeRefs";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { useFieldControlProps } from "../FormField/FormFieldContext";
import { normalizeText, useSelect } from "./SelectContext";

// Class names are written out in full so Tailwind can detect them statically.
export const selectControlVariants = cva(
  [
    "flex w-full items-center gap-2 rounded-standard border-2 bg-surface-card text-left font-body text-text-primary",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:opacity-50",
  ],
  {
    variants: {
      size: {
        compact: "h-[var(--height-compact)] px-2 text-body-sm",
        default: "h-[var(--height-default)] px-3 text-body-md",
        comfortable: "h-[var(--height-comfortable)] px-4 text-body-lg",
      },
      hasError: {
        true: "border-danger-text",
        false: "border-border-strong",
      },
    },
    defaultVariants: {
      size: "default",
      hasError: false,
    },
  },
);

const TYPEAHEAD_RESET_MS = 500;

export interface SelectTriggerProps
  extends
    Omit<ComponentProps<"button">, "type" | "role" | "children">,
    Pick<VariantProps<typeof selectControlVariants>, "size"> {
  /** Shown while nothing is selected. */
  placeholder?: ReactNode;
}

/**
 * The button that shows the selected item and opens the list (a select-only
 * combobox). Enter, Space and ArrowDown open it; typing letters jumps to a
 * matching item. Inside a FormField the field label names it.
 */
export function SelectTrigger({
  size,
  placeholder,
  className,
  id,
  disabled,
  onClick,
  onKeyDown,
  onKeyUp,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
  "aria-labelledby": ariaLabelledBy,
  ref,
  ...props
}: SelectTriggerProps) {
  const select = useSelect();
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });
  const controlId = control.id ?? select.controlId;
  const mergedRef = useMemo(
    () => mergeRefs(select.controlRef, ref),
    [select.controlRef, ref],
  );
  const typeahead = useRef({
    text: "",
    timer: undefined as number | undefined,
  });

  const isDisabled = disabled ?? select.isDisabled;
  const hasValue = select.selectedLabel !== undefined;

  function runTypeahead(character: string) {
    window.clearTimeout(typeahead.current.timer);
    typeahead.current.text += character;
    typeahead.current.timer = window.setTimeout(() => {
      typeahead.current.text = "";
    }, TYPEAHEAD_RESET_MS);

    const typed = typeahead.current.text;
    // Pressing the same letter again cycles through the items starting with it.
    const isRepeated =
      typed.length > 1 && [...typed].every((char) => char === typed[0]);
    const needle = normalizeText(isRepeated ? typed[0] : typed);
    const options = select.getOptions();
    const start = Math.max(
      options.findIndex(
        (option) => option.dataset.value === select.activeValue,
      ),
      0,
    );
    const offset = needle.length === 1 ? 1 : 0;
    for (let step = 0; step < options.length; step += 1) {
      const option = options[(start + offset + step) % options.length];
      if (normalizeText(option.textContent ?? "").startsWith(needle)) {
        if (!select.isOpen) select.openList("selected");
        select.setActiveValue(option.dataset.value);
        return;
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (!select.isOpen) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        select.openList("selected");
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        select.openList(select.value !== undefined ? "selected" : "last");
        return;
      }
    } else {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          select.moveActive("next");
          return;
        case "ArrowUp":
          event.preventDefault();
          select.moveActive("prev");
          return;
        case "Home":
          event.preventDefault();
          select.moveActive("first");
          return;
        case "End":
          event.preventDefault();
          select.moveActive("last");
          return;
        case "Enter":
        case " ":
          event.preventDefault();
          if (select.activeValue !== undefined) {
            select.selectValue(select.activeValue);
          } else {
            select.closeList();
          }
          return;
        case "Tab":
          select.closeList();
          return;
      }
    }

    if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      runTypeahead(event.key);
    }
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyUp?.(event);
    // Space already acted on keydown; stop the browser's follow-up click.
    if (event.key === " ") event.preventDefault();
  }

  return (
    <button
      ref={mergedRef}
      type="button"
      role="combobox"
      id={controlId}
      disabled={isDisabled}
      aria-haspopup="listbox"
      aria-expanded={select.isOpen}
      aria-controls={select.listboxId}
      aria-activedescendant={
        select.isOpen && select.activeValue !== undefined
          ? select.getOptionId(select.activeValue)
          : undefined
      }
      aria-labelledby={
        ariaLabelledBy ??
        (select.labelId ? `${select.labelId} ${controlId}` : undefined)
      }
      aria-describedby={control["aria-describedby"]}
      aria-invalid={control["aria-invalid"]}
      aria-required={control["aria-required"]}
      className={cn(
        selectControlVariants({ size, hasError: control.hasError }),
        focusRingClasses,
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (select.isOpen) select.closeList();
        else select.openList("selected");
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      {...props}
    >
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          !hasValue && "text-text-muted",
        )}
      >
        {hasValue ? select.selectedLabel : placeholder}
      </span>
      <ChevronDown
        aria-hidden="true"
        size={16}
        className={cn(
          "shrink-0 text-text-muted transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none",
          select.isOpen && "rotate-180",
        )}
      />
    </button>
  );
}
