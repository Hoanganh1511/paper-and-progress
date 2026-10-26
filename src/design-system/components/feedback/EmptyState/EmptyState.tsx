import { type ComponentProps, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Text, type TextElement } from "../../../primitives/Text";

export interface EmptyStateProps extends Omit<ComponentProps<"div">, "title"> {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Usually a Button or LinkButton offering the way forward. */
  action?: ReactNode;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: Extract<TextElement, "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p">;
}

/** Shown where content would be when there is none yet (no results, new account, ...). */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  titleAs = "h3",
  className,
  ref,
  ...props
}: EmptyStateProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {Icon && (
        <span className="mb-1 flex size-12 items-center justify-center rounded-pill bg-surface-sunken text-text-muted">
          <Icon aria-hidden="true" size={24} />
        </span>
      )}
      <Text as={titleAs} size="heading-md" weight="semibold">
        {title}
      </Text>
      {description && (
        <Text size="body-md" color="secondary" className="max-w-sm">
          {description}
        </Text>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
