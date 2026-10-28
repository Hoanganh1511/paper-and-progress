"use client";

import { useId, useState, type ComponentProps } from "react";
import { ArrowRight, Pause, Play, Rss } from "lucide-react";
import {
  AutoScroll,
  Card,
  IconButton,
  LinkButton,
  Text,
  cn,
} from "@/design-system";
import { DevlogActivityList } from "@/features/devlog/components/DevlogActivityList";
import { formatDevlogDate } from "@/features/devlog/status";
import type { DevlogEntry } from "@/features/devlog/types";

export interface TimelineCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** Newest first; only the entries of the newest day are shown. */
  entries: DevlogEntry[];
  devlogHref?: string;
  feedHref?: string;
}

/**
 * The newest day's activity as a vertical timeline that drifts upwards by
 * itself and loops, inside a card of fixed height. The two buttons stay
 * pinned to the bottom of the card. The drift stops on hover and focus, and
 * the pause button stops it for good.
 */
export function TimelineCard({
  entries,
  devlogHref = "/devlog",
  feedHref = "/devlog/feed.xml",
  className,
  ...props
}: TimelineCardProps) {
  const titleId = useId();
  const [isPaused, setIsPaused] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const day = entries[0]?.date;
  const dayEntries = entries.filter((entry) => entry.date === day);

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("h-[28rem] rounded-soft lg:h-[34rem]", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Text as="h2" id={titleId} size="heading-md" weight="semibold">
            Nhật ký trong ngày
          </Text>
          {day && (
            <Text as="p" size="body-sm" color="secondary">
              Hoạt động ngày <time dateTime={day}>{formatDevlogDate(day)}</time>
              {` · ${dayEntries.length} entry`}
            </Text>
          )}
        </div>
        {isMoving && (
          <IconButton
            icon={isPaused ? Play : Pause}
            variant="outline"
            size="compact"
            aria-label={isPaused ? "Tiếp tục cuộn" : "Tạm dừng cuộn"}
            aria-pressed={isPaused}
            onClick={() => setIsPaused((current) => !current)}
          />
        )}
      </div>

      <AutoScroll
        role="region"
        aria-label="Hoạt động trong ngày"
        isPaused={isPaused}
        onActiveChange={setIsMoving}
        className="min-h-0 flex-1"
      >
        {dayEntries.length === 0 ? (
          <Text as="p" size="body-md" color="secondary">
            Chưa có hoạt động nào được ghi lại.
          </Text>
        ) : (
          // The padding leaves room for the cards' shadows and the loop's gap.
          <div className="p-1 pb-6">
            <DevlogActivityList
              entries={dayEntries}
              showDates={false}
              hrefFor={(slug) =>
                `${devlogHref}?entry=${encodeURIComponent(slug)}`
              }
              aria-label="Hoạt động trong ngày"
            />
          </div>
        )}
      </AutoScroll>

      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={devlogHref} variant="accent" rightIcon={ArrowRight}>
          Xem toàn bộ nhật ký
        </LinkButton>
        <LinkButton href={feedHref} variant="outline" leftIcon={Rss}>
          RSS
        </LinkButton>
      </div>
    </Card>
  );
}
