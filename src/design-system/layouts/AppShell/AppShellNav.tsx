import { type ElementType, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import { focusRingClasses } from "../../primitives/FocusRing";

export interface AppShellNavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Marks the page the user is on (aria-current="page"). */
  isActive?: boolean;
}

export type AppShellLinkComponent = ElementType<{
  href: string;
  className?: string;
  children?: ReactNode;
  "aria-current"?: "page";
  onClick?: () => void;
}>;

interface NavProps {
  items: AppShellNavItem[];
  linkComponent: AppShellLinkComponent;
  /** Called after an item was chosen, e.g. to close the drawer. */
  onNavigate?: () => void;
}

// Class names are written out in full so Tailwind can detect them statically.
// The current page is shown by the filled background and the bold label, not
// by color alone.
const linkClasses = cn(
  "flex min-h-11 items-center gap-3 rounded-standard px-3 font-body text-body-md font-medium text-text-secondary transition-colors duration-[var(--duration-fast)]",
  "hover:bg-surface-sunken hover:text-text-primary",
  "aria-[current=page]:bg-accent-lime aria-[current=page]:font-semibold aria-[current=page]:text-ink",
  focusRingClasses,
);

/**
 * Vertical list of links. In the "sidebar" variant the labels collapse to
 * screen-reader-only text on tablet widths (icon-only) and show again from lg;
 * in the "drawer" variant they always show.
 */
export function AppShellNavList({
  items,
  linkComponent: LinkComponent,
  onNavigate,
  variant,
}: NavProps & { variant: "sidebar" | "drawer" }) {
  const isSidebar = variant === "sidebar";

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => (
        <li key={item.id}>
          <LinkComponent
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className={cn(
              linkClasses,
              isSidebar && "md:justify-center md:px-0 lg:justify-start lg:px-3",
            )}
            onClick={onNavigate}
          >
            <item.icon aria-hidden="true" size={20} className="shrink-0" />
            <span className={cn(isSidebar && "md:sr-only lg:not-sr-only")}>
              {item.label}
            </span>
          </LinkComponent>
        </li>
      ))}
    </ul>
  );
}

/** Icon-over-label links in a row, pinned to the bottom of the screen on mobile. */
export function AppShellBottomNav({
  items,
  linkComponent: LinkComponent,
}: NavProps) {
  return (
    <ul className="grid auto-cols-fr grid-flow-col">
      {items.map((item) => (
        <li key={item.id}>
          <LinkComponent
            href={item.href}
            aria-current={item.isActive ? "page" : undefined}
            className={cn(
              "relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 font-body text-caption font-medium text-text-secondary",
              "after:absolute after:inset-x-3 after:top-0 after:h-0.5 after:bg-transparent",
              "aria-[current=page]:font-semibold aria-[current=page]:text-text-primary aria-[current=page]:after:bg-action-primary",
              focusRingClasses,
            )}
          >
            <item.icon aria-hidden="true" size={20} className="shrink-0" />
            <span className="max-w-full truncate">{item.label}</span>
          </LinkComponent>
        </li>
      ))}
    </ul>
  );
}
