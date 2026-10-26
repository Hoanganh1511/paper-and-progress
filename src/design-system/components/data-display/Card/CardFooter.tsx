import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type CardFooterProps = ComponentProps<"div">;

export function CardFooter({ className, ref, ...props }: CardFooterProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap items-center gap-3", className)}
      {...props}
    />
  );
}
