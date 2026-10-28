import type { ComponentProps } from "react";
import { ArrowRight, NotebookPen, Rss } from "lucide-react";
import { EmptyState, LinkButton, Text, cn } from "@/design-system";
import { formatDevlogDate } from "../../status";
import type { DevlogEntry } from "../../types";
import { DevlogActivityList } from "../DevlogActivityList";

export interface DevlogPreviewProps extends Omit<
  ComponentProps<"section">,
  "ref" | "title"
> {
  /** Newest first; only the entries of the newest day are shown. */
  entries: DevlogEntry[];
  devlogHref?: string;
  feedHref?: string;
}

/**
 * The home page's daily log: the entries of the newest day as a vertical
 * timeline, each linking to the full entry in the devlog. Entries carry a
 * date but no time of day, so they run newest first within the day. A Server
 * Component, so it reads no clock: "the day" is the day of the latest entry.
 */
export function DevlogPreview({
  entries,
  devlogHref = "/devlog",
  feedHref = "/devlog/feed.xml",
  className,
  ...props
}: DevlogPreviewProps) {
  const day = entries[0]?.date;
  const dayEntries = entries.filter((entry) => entry.date === day);

  return (
    <section
      aria-labelledby="devlog-preview-title"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <Text
          as="h2"
          id="devlog-preview-title"
          size="heading-lg"
          weight="semibold"
        >
          Nhật ký trong ngày
        </Text>
        {day && (
          <Text as="p" size="body-md" color="secondary">
            Hoạt động ngày <time dateTime={day}>{formatDevlogDate(day)}</time>
            {` · ${dayEntries.length} entry`}
          </Text>
        )}
      </div>

      {dayEntries.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Hành trình của bạn bắt đầu từ đây"
          description="Chưa có hoạt động nào được ghi lại."
        />
      ) : (
        <DevlogActivityList
          entries={dayEntries}
          showDates={false}
          hrefFor={(slug) => `${devlogHref}?entry=${encodeURIComponent(slug)}`}
          aria-label="Hoạt động trong ngày"
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={devlogHref} variant="accent" rightIcon={ArrowRight}>
          Xem toàn bộ nhật ký
        </LinkButton>
        <LinkButton href={feedHref} variant="outline" leftIcon={Rss}>
          RSS
        </LinkButton>
      </div>
    </section>
  );
}
