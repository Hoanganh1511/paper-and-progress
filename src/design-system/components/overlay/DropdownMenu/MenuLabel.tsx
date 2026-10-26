import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type MenuLabelProps = Omit<ComponentProps<"div">, "role">;

/** A non-interactive heading for a group of items; arrow keys skip it. */
export function MenuLabel({ className, ref, ...props }: MenuLabelProps) {
  return (
    <div
      ref={ref}
      role="presentation"
      className={cn(
        "px-3 py-2 font-body text-overline font-semibold tracking-widest text-text-muted uppercase",
        className,
      )}
      {...props}
    />
  );
}
