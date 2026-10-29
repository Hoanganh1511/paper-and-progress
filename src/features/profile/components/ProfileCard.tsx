import { type ComponentProps, type ReactNode } from "react";
import { Card, Inline, Text, cn } from "@/design-system";

export interface ProfileCardProps extends Omit<
  ComponentProps<"section">,
  "title"
> {
  /** Leave out for a card that needs no visible heading; then pass `aria-label`. */
  title?: ReactNode;
  /** A button or link shown opposite the title, e.g. "Chỉnh sửa". */
  action?: ReactNode;
}

/** A titled card of the profile grid; the title (h2) names the section. */
export function ProfileCard({
  title,
  action,
  className,
  children,
  ...props
}: ProfileCardProps) {
  return (
    <Card
      as="section"
      padding="compact"
      className={cn("min-w-0", className)}
      {...props}
    >
      {(title || action) && (
        <Inline justify="between" align="center" gap={2}>
          <Text as="h2" size="heading-sm" weight="semibold" font="display">
            {title}
          </Text>
          {action}
        </Inline>
      )}
      {children}
    </Card>
  );
}
