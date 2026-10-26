import { Separator, type SeparatorProps } from "../../../primitives/Separator";
import { cn } from "../../../utils/cn";

export type MenuSeparatorProps = Omit<SeparatorProps, "orientation">;

export function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  return <Separator className={cn("my-1", className)} {...props} />;
}
