import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type DialogContentProps = ComponentProps<"div">;

/** Scrolls on its own when the dialog is taller than the viewport. */
export function DialogContent({
  className,
  ref,
  ...props
}: DialogContentProps) {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto px-6 py-4", className)}
      {...props}
    />
  );
}
