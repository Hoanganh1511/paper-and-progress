import { ChevronRight } from "lucide-react";
import { Badge, Text } from "@/design-system";

export interface SecurityLinkItem {
  label: string;
  /** In-page anchor to jump to. Leave out for a row that has no page yet. */
  href?: string;
  /** Marks a feature that is announced but not built, e.g. "Dự kiến ra mắt". */
  badge?: string;
}

export interface SecurityLinkListProps {
  items: SecurityLinkItem[];
  /** Names the list for screen readers. */
  label: string;
}

const rowClasses =
  "flex min-h-11 items-center justify-between gap-3 py-2 text-left";

/** Rows of a security card: a label, then a ">" for rows that lead somewhere or a badge for those coming later. */
export function SecurityLinkList({ items, label }: SecurityLinkListProps) {
  return (
    <ul aria-label={label} className="flex flex-col">
      {items.map((item) => {
        const content = (
          <>
            <Text size="body-md">{item.label}</Text>
            {item.badge ? (
              <Badge size="sm" variant="yellow">
                {item.badge}
              </Badge>
            ) : (
              <ChevronRight
                aria-hidden="true"
                size={16}
                className="shrink-0 text-text-secondary"
              />
            )}
          </>
        );
        return (
          <li
            key={item.label}
            className="border-b border-border-subtle last:border-b-0"
          >
            {item.href ? (
              <a
                href={item.href}
                className={`${rowClasses} rounded-sharp hover:underline`}
              >
                {content}
              </a>
            ) : (
              <div className={rowClasses}>{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
