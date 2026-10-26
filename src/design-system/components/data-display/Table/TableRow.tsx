import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableRowProps = ComponentProps<"tr">;

export function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border-subtle transition-colors duration-[var(--duration-fast)] [tbody>&:last-child]:border-b-0",
        className,
      )}
      {...props}
    />
  );
}
