import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableBodyProps = ComponentProps<"tbody">;

// `striped` and `hoverable` only affect body rows, never header or footer rows.
export function TableBody({ className, ref, ...props }: TableBodyProps) {
  return (
    <tbody
      ref={ref}
      className={cn(
        "group-data-[striped]/table:[&>tr:nth-child(even)]:bg-surface-sunken/50",
        "group-data-[hoverable]/table:[&>tr:hover]:bg-surface-sunken",
        className,
      )}
      {...props}
    />
  );
}
