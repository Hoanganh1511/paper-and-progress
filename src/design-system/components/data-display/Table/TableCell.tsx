import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableCellProps = ComponentProps<"td">;

export function TableCell({ className, ref, ...props }: TableCellProps) {
  return (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 align-middle group-data-[compact]/table:px-3 group-data-[compact]/table:py-2",
        className,
      )}
      {...props}
    />
  );
}
