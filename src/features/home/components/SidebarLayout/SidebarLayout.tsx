import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/design-system";

export interface SidebarLayoutProps extends Omit<
  ComponentProps<"main">,
  "children" | "ref"
> {
  /** The left column, e.g. `HomeSidebar`. */
  sidebar: ReactNode;
  /** The page itself, beside the sidebar (below it under `lg`). */
  children: ReactNode;
}

/**
 * The page shell shared by the home page and the knowledge library: the
 * sidebar on the left and the page's own content next to it; one column below
 * `lg`, with a wide gap between the two (40px, 48px from `xl`) so the sidebar's
 * hard shadow and the page do not crowd each other. It is the page's `<main>`. It lives in a route group's layout, so it
 * stays in place when the reader goes from one of these pages to another.
 */
export function SidebarLayout({
  sidebar,
  children,
  className,
  ...props
}: SidebarLayoutProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      lang="vi"
      className={cn("px-4 py-8 outline-none sm:px-6 md:py-10", className)}
      {...props}
    >
      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-x-10 xl:gap-x-12">
        {sidebar}
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
