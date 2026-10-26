"use client";

import { useEffect, type ComponentProps, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "../../../utils/cn";
import { useSelect } from "./SelectContext";

export interface SelectItemProps extends Omit<
  ComponentProps<"div">,
  "role" | "children"
> {
  value: string;
  disabled?: boolean;
  /** Plain text of the item, used for the trigger, search and typeahead. Defaults to `children` when that is a string. */
  textValue?: string;
  children: ReactNode;
}

/**
 * One option. The selected item shows a check mark (not color alone), the
 * active one an outline. Hidden while the Combobox search does not match it.
 */
export function SelectItem({
  value,
  disabled = false,
  textValue,
  className,
  children,
  onClick,
  onPointerMove,
  ref,
  ...props
}: SelectItemProps) {
  const select = useSelect();
  const text = textValue ?? (typeof children === "string" ? children : value);
  const { registerItem } = select;

  useEffect(
    () => registerItem(value, { textValue: text, disabled }),
    [registerItem, value, text, disabled],
  );

  const isActive = select.activeValue === value;
  const isSelected = select.value === value;

  // Keep the active option in view during keyboard navigation.
  useEffect(() => {
    if (isActive && select.isOpen) {
      document
        .getElementById(select.getOptionId(value))
        ?.scrollIntoView?.({ block: "nearest" });
    }
  }, [isActive, select.isOpen, select, value]);

  if (!select.matches(text)) return null;

  return (
    <div
      ref={ref}
      id={select.getOptionId(value)}
      role="option"
      data-value={value}
      data-active={isActive || undefined}
      aria-selected={isSelected}
      aria-disabled={disabled || undefined}
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-2 rounded-sharp px-3 py-2 font-body text-body-md text-text-primary",
        "data-[active]:bg-surface-sunken data-[active]:outline-2 data-[active]:-outline-offset-2 data-[active]:outline-solid data-[active]:outline-border-focus",
        "aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) select.selectValue(value);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!disabled && !isActive) select.setActiveValue(value);
      }}
      {...props}
    >
      <span className="min-w-0 flex-1">{children}</span>
      {isSelected && (
        <Check aria-hidden="true" size={16} className="shrink-0" />
      )}
    </div>
  );
}
