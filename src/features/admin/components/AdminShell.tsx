"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container, Text, cn } from "@/design-system";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/login-history", label: "Login History", icon: Activity },
  {
    href: "/admin/security-events",
    label: "Security Events",
    icon: ShieldAlert,
  },
];

function isCurrent(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

/** Sidebar (a top row on narrow screens) and the page body beside it. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    // Same width and side padding as the header, so the two line up.
    <Container
      size="wide"
      className="flex flex-col gap-6 py-6 md:flex-row md:items-start"
    >
      <nav
        aria-label="Admin"
        className="md:sticky md:top-4 md:w-56 md:shrink-0"
      >
        <Text
          as="p"
          size="body-sm"
          weight="semibold"
          color="secondary"
          className="mb-2 hidden uppercase md:block"
        >
          Admin
        </Text>
        <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
            const current = isCurrent(pathname, href);
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-standard border-2 border-border-strong px-3 font-body text-body-md font-medium whitespace-nowrap text-text-primary",
                    "transition-[background-color] motion-reduce:transition-none",
                    current
                      ? "bg-accent-lime shadow-raised"
                      : "bg-surface-card hover:bg-surface-sunken",
                  )}
                >
                  <Icon aria-hidden="true" size={18} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-6">{children}</div>
    </Container>
  );
}
