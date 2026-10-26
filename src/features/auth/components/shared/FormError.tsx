import { type ComponentProps } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/design-system";

export type FormErrorProps = Omit<ComponentProps<"div">, "role">;

/** A form-level error (wrong password, network failure, ...), announced when it appears. */
export function FormError({ className, children, ...props }: FormErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-standard border border-danger-text bg-danger-bg p-3 font-body text-body-sm text-danger-text",
        className,
      )}
      {...props}
    >
      <CircleAlert aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
