"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "../../../utils/cn";

export interface SelectGroupProps extends Omit<
  ComponentProps<"div">,
  "role" | "aria-labelledby"
> {
  /** Heading of the group, also its accessible name. */
  label: ReactNode;
}

/** Hidden automatically when every item inside it is filtered out. */
export function SelectGroup({
  label,
  className,
  children,
  ref,
  ...props
}: SelectGroupProps) {
  const labelId = useId();

  return (
    <div
      ref={ref}
      role="group"
      aria-labelledby={labelId}
      className={cn("hidden has-[[role=option]]:block", className)}
      {...props}
    >
      <div
        id={labelId}
        role="presentation"
        className="px-3 py-2 font-body text-overline font-semibold tracking-widest text-text-muted uppercase"
      >
        {label}
      </div>
      {children}
    </div>
  );
}
