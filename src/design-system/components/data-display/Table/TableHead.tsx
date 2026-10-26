import { type ComponentProps } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";

export type SortDirection = "ascending" | "descending" | "none";

export interface TableHeadProps extends ComponentProps<"th"> {
  /** Makes the heading a button that calls `onSort`. */
  sortable?: boolean;
  /** Current sort of this column. The table sorting itself is up to the caller. */
  sortDirection?: SortDirection;
  onSort?: () => void;
}

const SORT_ICONS = {
  ascending: ArrowUp,
  descending: ArrowDown,
  none: ChevronsUpDown,
} as const;

export function TableHead({
  sortable = false,
  sortDirection = "none",
  onSort,
  scope = "col",
  className,
  children,
  ref,
  ...props
}: TableHeadProps) {
  const SortIcon = SORT_ICONS[sortDirection];

  return (
    <th
      ref={ref}
      scope={scope}
      aria-sort={sortable ? sortDirection : undefined}
      className={cn(
        "border-b border-border-default px-4 py-3 text-left font-body text-body-sm font-semibold text-text-primary group-data-[compact]/table:px-3 group-data-[compact]/table:py-2",
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "-mx-2 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-sharp px-2 font-[inherit] text-[length:inherit] font-semibold",
            focusRingClasses,
          )}
        >
          {children}
          <SortIcon
            aria-hidden="true"
            size={14}
            className={cn("shrink-0", sortDirection === "none" && "opacity-50")}
          />
        </button>
      ) : (
        children
      )}
    </th>
  );
}
