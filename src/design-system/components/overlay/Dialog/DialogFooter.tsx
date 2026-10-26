import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type DialogFooterProps = ComponentProps<"div">;

/**
 * Put the secondary action first and the primary one last in the DOM. They sit
 * in a row from `sm`; below that the column is reversed so the primary action
 * ends up on top, nearest the thumb-reachable content.
 */
export function DialogFooter({ className, ref, ...props }: DialogFooterProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse gap-3 px-6 pt-4 pb-6 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
