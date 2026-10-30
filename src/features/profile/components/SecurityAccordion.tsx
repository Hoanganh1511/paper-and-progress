import { type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Text } from "@/design-system";

export interface SecurityAccordionProps {
  title: string;
  /** Start expanded. */
  isOpenByDefault?: boolean;
  children: ReactNode;
}

/** One collapsible group, built on `<details>` so the keyboard and screen readers work without extra code. */
export function SecurityAccordion({
  title,
  isOpenByDefault = false,
  children,
}: SecurityAccordionProps) {
  return (
    <details
      open={isOpenByDefault}
      className="group border-b-2 border-border-strong last:border-b-0"
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sharp py-3 [&::-webkit-details-marker]:hidden">
        <Text as="h3" size="heading-sm" weight="bold">
          {title}
        </Text>
        <ChevronDown
          aria-hidden="true"
          size={20}
          className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  );
}
