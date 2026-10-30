import type { ReactNode } from "react";
import { Card, Text } from "@/design-system";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  /** Small line under the number, e.g. "12 / 80 users". */
  hint?: ReactNode;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card padding="compact" className="gap-1">
      <Text size="body-sm" color="secondary">
        {label}
      </Text>
      <Text as="p" size="heading-lg" weight="bold" className="font-display">
        {value}
      </Text>
      {hint && (
        <Text size="body-sm" color="secondary">
          {hint}
        </Text>
      )}
    </Card>
  );
}
