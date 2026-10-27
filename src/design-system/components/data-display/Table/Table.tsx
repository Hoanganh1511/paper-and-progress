import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export interface TableProps extends ComponentProps<"table"> {
  /** Shade every other body row. */
  striped?: boolean;
  /** Highlight the body row under the pointer. */
  hoverable?: boolean;
  /** Tighter cell padding. */
  compact?: boolean;
  /** Class for the scroll container around the <table>. */
  containerClassName?: string;
}

/**
 * The options are exposed as data attributes on a named group (`group/table`),
 * which TableBody, TableHead and TableCell react to with `group-data-*`
 * variants. No context is needed, so these parts also work in Server
 * Components. `className` and `ref` apply to the <table>; it scrolls
 * horizontally inside its container when too wide.
 */
export function Table({
  striped = false,
  hoverable = false,
  compact = false,
  containerClassName,
  className,
  ref,
  ...props
}: TableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-standard border-2 border-border-strong",
        containerClassName,
      )}
    >
      <table
        ref={ref}
        data-striped={striped || undefined}
        data-hoverable={hoverable || undefined}
        data-compact={compact || undefined}
        className={cn(
          "group/table w-full border-collapse text-left font-body text-body-md text-text-primary",
          className,
        )}
        {...props}
      />
    </div>
  );
}
