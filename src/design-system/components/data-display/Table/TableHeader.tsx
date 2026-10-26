import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export type TableHeaderProps = ComponentProps<"thead">;

export function TableHeader({ className, ref, ...props }: TableHeaderProps) {
  return <thead ref={ref} className={cn(className)} {...props} />;
}
