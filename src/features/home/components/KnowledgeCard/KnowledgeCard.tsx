import { useId, type ComponentProps } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card, LinkButton, Text, cn } from "@/design-system";
import { formatDevlogDate } from "@/features/devlog";
import type { Bookmark } from "@/features/bookmarks";

export interface KnowledgeCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** The saved lessons; the newest `limit` are shown. */
  bookmarks: Bookmark[];
  limit?: number;
  href?: string;
}

/** The lessons saved most recently, each with its tags and the day it was saved. */
export function KnowledgeCard({
  bookmarks,
  limit = 4,
  href = "/bookmarks",
  className,
  ...props
}: KnowledgeCardProps) {
  const titleId = useId();
  const latest = [...bookmarks]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, limit);

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("rounded-soft", className)}
      {...props}
    >
      <Text as="h2" id={titleId} size="heading-md" weight="semibold">
        Kiến thức
      </Text>
      {latest.length === 0 ? (
        <Text as="p" size="body-md" color="secondary">
          Chưa có bài học nào được lưu.
        </Text>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-4 p-0">
          {latest.map((bookmark) => (
            <li key={bookmark.id} className="flex flex-col gap-1.5">
              <Link
                href={bookmark.href}
                className="font-body text-body-md font-medium text-text-primary underline-offset-2 hover:underline"
              >
                {bookmark.title}
              </Link>
              <div className="flex flex-wrap items-center gap-1.5">
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} size="sm">
                    #{tag}
                  </Badge>
                ))}
                <Text as="span" size="caption" color="muted">
                  <time dateTime={bookmark.savedAt}>
                    {formatDevlogDate(bookmark.savedAt.slice(0, 10))}
                  </time>
                </Text>
              </div>
            </li>
          ))}
        </ul>
      )}
      <LinkButton
        href={href}
        variant="outline"
        rightIcon={ArrowRight}
        className="self-start"
      >
        Xem tất cả
      </LinkButton>
    </Card>
  );
}
