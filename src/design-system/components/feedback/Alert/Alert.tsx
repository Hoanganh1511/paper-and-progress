import { type ComponentProps, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../../utils/cn";

// Class names are written out in full so Tailwind can detect them statically.
const alertVariants = cva(
  "flex w-full items-start gap-3 rounded-standard border-2 p-3 font-body text-body-sm",
  {
    variants: {
      variant: {
        info: "border-info-text bg-info-bg text-info-text",
        success: "border-success-text bg-success-bg text-success-text",
        warning: "border-warning-text bg-warning-bg text-warning-text",
        danger: "border-danger-text bg-danger-bg text-danger-text",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

// A different icon per variant, so the status never relies on color alone.
const VARIANT_ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

export interface AlertProps
  extends
    Omit<ComponentProps<"div">, "title">,
    VariantProps<typeof alertVariants> {
  title?: ReactNode;
}

/**
 * An inline message. Warnings and errors are announced immediately
 * (role="alert"), the rest politely (role="status"); pass `role` to change it.
 */
export function Alert({
  variant,
  title,
  role,
  className,
  children,
  ref,
  ...props
}: AlertProps) {
  const Icon = VARIANT_ICONS[variant ?? "info"];
  const isUrgent = variant === "danger" || variant === "warning";

  return (
    <div
      ref={ref}
      role={role ?? (isUrgent ? "alert" : "status")}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
