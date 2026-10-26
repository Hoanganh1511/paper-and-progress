import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableCaptionProps = ComponentProps<"caption">;

/** Names the table for assistive technology; use `className="sr-only"` to hide it visually. */
export function TableCaption({ className, ref, ...props }: TableCaptionProps) {
  return (
    <caption
      ref={ref}
      className={cn(
        "caption-top pb-3 text-left font-body text-body-sm text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
