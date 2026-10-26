import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type CardHeaderProps = ComponentProps<"div">;

export function CardHeader({ className, ref, ...props }: CardHeaderProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}
