import { type ComponentProps, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Container } from "../../primitives/Container";
import { MAIN_CONTENT_ID, SkipLink } from "../SkipLink";

export interface MarketingLayoutProps extends Omit<
  ComponentProps<"div">,
  "title"
> {
  /** Content of the top bar: logo, links, call to action. */
  navbar: ReactNode;
  /** Content of the footer: link columns, legal text. */
  footer: ReactNode;
  /** Keeps the navbar at the top while scrolling. */
  isNavbarSticky?: boolean;
  skipToContentLabel?: string;
}

/**
 * Page frame for public pages: a navbar, full-width content and a footer.
 * Children are not wrapped in a container, so sections can run edge to edge
 * (use PageContainer or Container inside them). The footer sticks to the
 * bottom on short pages.
 */
export function MarketingLayout({
  navbar,
  footer,
  isNavbarSticky = false,
  skipToContentLabel,
  className,
  children,
  ref,
  ...props
}: MarketingLayoutProps) {
  return (
    <div
      ref={ref}
      className={cn("flex min-h-dvh flex-col bg-surface-page", className)}
      {...props}
    >
      <SkipLink>{skipToContentLabel}</SkipLink>
      <header
        className={cn(
          "border-b border-border-default bg-surface-page",
          // Only a sticky navbar needs a z-index, and it must outrank sticky
          // content below so its menus are not covered.
          isNavbarSticky && "sticky top-0 z-[var(--z-dropdown)]",
        )}
      >
        <Container size="wide" className="flex h-16 items-center gap-4">
          {navbar}
        </Container>
      </header>
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="border-t border-border-default bg-surface-sunken">
        <Container size="wide" className="py-12">
          {footer}
        </Container>
      </footer>
    </div>
  );
}
