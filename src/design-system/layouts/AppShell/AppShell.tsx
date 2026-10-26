"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "../../utils/cn";
import { IconButton } from "../../components/actions/Button/IconButton";
import { Drawer } from "../../components/overlay/Drawer";
import { MAIN_CONTENT_ID, SkipLink } from "../SkipLink";
import {
  AppShellBottomNav,
  AppShellNavList,
  type AppShellLinkComponent,
  type AppShellNavItem,
} from "./AppShellNav";

export interface AppShellLabels {
  skipToContent: string;
  mainNavigation: string;
  quickNavigation: string;
  openMenu: string;
  closeMenu: string;
  menuTitle: string;
}

export const defaultAppShellLabels: AppShellLabels = {
  skipToContent: "Skip to main content",
  mainNavigation: "Main navigation",
  quickNavigation: "Quick navigation",
  openMenu: "Open menu",
  closeMenu: "Close menu",
  menuTitle: "Menu",
};

export interface AppShellProps extends Omit<ComponentProps<"div">, "title"> {
  /** Content of the top bar: logo, search, user menu, ... */
  navbar: ReactNode;
  navItems: AppShellNavItem[];
  /** Above the nav links in the sidebar and in the mobile drawer, e.g. a logo or workspace switcher. */
  sidebarHeader?: ReactNode;
  /** Below the nav links, e.g. a user card. */
  sidebarFooter?: ReactNode;
  /** Component used for the links, e.g. next/link. Defaults to "a". */
  linkComponent?: AppShellLinkComponent;
  /** How many of the nav items fit in the mobile bottom bar. */
  bottomNavLimit?: number;
  /** Replace any of the texts (translations). */
  labels?: Partial<AppShellLabels>;
}

/**
 * The frame of an application: a top bar over a sidebar and the main area.
 *
 * - Desktop (lg+): full sidebar with labels.
 * - Tablet (md): icon-only sidebar.
 * - Mobile: no sidebar; a menu button in the top bar opens the nav in a
 *   Drawer, and the first few items also sit in a bottom bar.
 *
 * The page content is `children`, rendered in `<main id="main-content">`.
 * `className` and `ref` apply to the outer grid.
 */
export function AppShell({
  navbar,
  navItems,
  sidebarHeader,
  sidebarFooter,
  linkComponent = "a",
  bottomNavLimit = 5,
  labels: labelOverrides,
  className,
  children,
  ref,
  ...props
}: AppShellProps) {
  const labels = { ...defaultAppShellLabels, ...labelOverrides };
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] bg-surface-page md:grid-cols-[4rem_1fr] lg:grid-cols-[16rem_1fr]",
        className,
      )}
      {...props}
    >
      <SkipLink>{labels.skipToContent}</SkipLink>

      <header className="sticky top-0 z-[var(--z-dropdown)] border-b border-border-default bg-surface-page md:col-span-2">
        <div className="flex h-16 items-center gap-2 px-4">
          <IconButton
            icon={Menu}
            aria-label={labels.openMenu}
            aria-haspopup="dialog"
            variant="ghost"
            className="md:hidden"
            onClick={() => setIsMenuOpen(true)}
          />
          {navbar}
        </div>
      </header>

      <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] flex-col gap-4 overflow-y-auto border-r border-border-default p-2 md:flex lg:p-4">
        {sidebarHeader}
        <nav aria-label={labels.mainNavigation} className="flex-1">
          <AppShellNavList
            variant="sidebar"
            items={navItems}
            linkComponent={linkComponent}
          />
        </nav>
        {sidebarFooter}
      </aside>

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="min-w-0 pb-16 outline-none md:pb-0"
      >
        {children}
      </main>

      <nav
        aria-label={labels.quickNavigation}
        className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] border-t border-border-default bg-surface-card md:hidden"
      >
        <AppShellBottomNav
          items={navItems.slice(0, bottomNavLimit)}
          linkComponent={linkComponent}
        />
      </nav>

      <Drawer
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        title={labels.menuTitle}
        closeLabel={labels.closeMenu}
      >
        <div className="flex flex-col gap-4 p-4">
          {sidebarHeader}
          <nav aria-label={labels.menuTitle}>
            <AppShellNavList
              variant="drawer"
              items={navItems}
              linkComponent={linkComponent}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </nav>
          {sidebarFooter}
        </div>
      </Drawer>
    </div>
  );
}
