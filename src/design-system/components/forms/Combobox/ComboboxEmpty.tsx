"use client";

import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";
import { useSelect } from "../Select/SelectContext";

export type ComboboxEmptyProps = Omit<ComponentProps<"div">, "role">;

/** Place inside ComboboxContent; it only renders when the search matches nothing. */
export function ComboboxEmpty({
  className,
  ref,
  ...props
}: ComboboxEmptyProps) {
  const select = useSelect();
  if (!select.hasItems || select.visibleCount > 0) return null;

  return (
    <div
      ref={ref}
      role="presentation"
      className={cn(
        "px-3 py-4 text-center font-body text-body-md text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
