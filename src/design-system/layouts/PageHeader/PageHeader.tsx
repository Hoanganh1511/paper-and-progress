import { type ComponentProps, type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Inline } from "../../primitives/Inline";
import { Stack } from "../../primitives/Stack";
import { Text } from "../../primitives/Text";
import {
  Breadcrumbs,
  type BreadcrumbItem,
  type BreadcrumbsProps,
} from "../../components/navigation/Breadcrumbs";

export interface PageHeaderProps extends Omit<
  ComponentProps<"header">,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Buttons for the page, shown opposite the title. */
  actions?: ReactNode;
  /** Passed to the Breadcrumbs: its label and the link component (e.g. next/link). */
  breadcrumbsProps?: Pick<BreadcrumbsProps, "label" | "linkComponent">;
}

/** Breadcrumbs above a row with the page title (h1) and its description on one side and the actions on the other. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  breadcrumbsProps,
  className,
  ref,
  ...props
}: PageHeaderProps) {
  return (
    <header ref={ref} className={cn(className)} {...props}>
      <Stack gap={1}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} {...breadcrumbsProps} />
        )}
        <Inline justify="between" align="start" gap={4}>
          <Stack gap={1} className="min-w-0">
            <Text as="h1" size="heading-lg" weight="semibold">
              {title}
            </Text>
            {description && (
              <Text size="body-md" color="secondary">
                {description}
              </Text>
            )}
          </Stack>
          {actions && (
            <Inline gap={2} className="shrink-0">
              {actions}
            </Inline>
          )}
        </Inline>
      </Stack>
    </header>
  );
}
