import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableFooterProps = ComponentProps<"tfoot">;

export function TableFooter({ className, ref, ...props }: TableFooterProps) {
  return (
    <tfoot
      ref={ref}
      className={cn(
        "border-t border-border-default bg-surface-sunken font-medium",
        className,
      )}
      {...props}
    />
  );
}
