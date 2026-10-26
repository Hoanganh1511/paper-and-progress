import { type ReactNode } from "react";
import { Stack } from "../../primitives/Stack";
import { AppShell, type AppShellProps } from "../AppShell";
import { PageContainer, type PageContainerProps } from "../PageContainer";
import { PageHeader, type PageHeaderProps } from "../PageHeader";

export interface DashboardLayoutProps extends Omit<AppShellProps, "title"> {
  title: PageHeaderProps["title"];
  description?: PageHeaderProps["description"];
  breadcrumbs?: PageHeaderProps["breadcrumbs"];
  breadcrumbsProps?: PageHeaderProps["breadcrumbsProps"];
  /** Buttons for the page, shown opposite the title. */
  actions?: ReactNode;
  /** Max width of the content area. */
  containerSize?: PageContainerProps["size"];
}

/**
 * An AppShell whose main area holds a PageHeader (breadcrumbs, title,
 * actions) above the page content, inside a PageContainer. Everything else
 * is AppShell: `navbar`, `navItems`, `sidebarHeader`, `linkComponent`, ...
 */
export function DashboardLayout({
  title,
  description,
  breadcrumbs,
  breadcrumbsProps,
  actions,
  containerSize = "wide",
  children,
  ...shellProps
}: DashboardLayoutProps) {
  return (
    <AppShell {...shellProps}>
      <PageContainer size={containerSize}>
        <Stack gap={6}>
          <PageHeader
            title={title}
            description={description}
            breadcrumbs={breadcrumbs}
            breadcrumbsProps={breadcrumbsProps}
            actions={actions}
          />
          {children}
        </Stack>
      </PageContainer>
    </AppShell>
  );
}
