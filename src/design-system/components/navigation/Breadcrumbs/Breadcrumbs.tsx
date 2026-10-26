import { type ComponentProps, type ElementType, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";

export interface BreadcrumbItem {
  label: ReactNode;
  /** Items without an href render as plain text. The last item is the current page. */
  href?: string;
}

export interface BreadcrumbsProps extends ComponentProps<"nav"> {
  items: BreadcrumbItem[];
  /** Accessible name of the navigation landmark. */
  label?: string;
  /** Component used for the links, e.g. next/link. Defaults to "a". */
  linkComponent?: ElementType<{
    href: string;
    className?: string;
    children?: ReactNode;
  }>;
}

/** The path to the current page. The last item is marked aria-current="page" and is not a link. */
export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  linkComponent: LinkComponent = "a",
  className,
  ref,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav ref={ref} aria-label={label} className={cn(className)} {...props}>
      <ol className="flex flex-wrap items-center gap-x-1 font-body text-body-sm text-text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center gap-1">
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(isLast && "font-medium text-text-primary")}
                >
                  {item.label}
                </span>
              ) : (
                <LinkComponent
                  href={item.href}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-sharp underline-offset-4 hover:text-text-primary hover:underline",
                    focusRingClasses,
                  )}
                >
                  {item.label}
                </LinkComponent>
              )}
              {!isLast && (
                <ChevronRight
                  aria-hidden="true"
                  size={14}
                  className="shrink-0"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
