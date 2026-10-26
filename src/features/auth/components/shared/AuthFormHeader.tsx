import { type ComponentProps, type ReactNode } from "react";
import { Stack, Text } from "@/design-system";

export interface AuthFormHeaderProps extends Omit<
  ComponentProps<"div">,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  /** Id of the heading, so the form can reference it with aria-labelledby. */
  titleId?: string;
}

export function AuthFormHeader({
  title,
  description,
  titleId,
  ...props
}: AuthFormHeaderProps) {
  return (
    <Stack gap={2} {...props}>
      <Text as="h1" id={titleId} size="heading-lg" weight="semibold">
        {title}
      </Text>
      {description && (
        <Text size="body-md" color="secondary">
          {description}
        </Text>
      )}
    </Stack>
  );
}
