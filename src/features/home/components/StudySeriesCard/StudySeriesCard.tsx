"use client";

import { useId, useState, type ComponentProps } from "react";
import {
  ArrowRight,
  CheckCheck,
  CircleDashed,
  LayoutGrid,
  Layers,
  Loader,
  type LucideIcon,
} from "lucide-react";
import {
  Alert,
  Button,
  Card,
  LinkButton,
  Skeleton,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useAuth } from "@/features/auth";
import {
  SeriesCard,
  loadSeriesShowcases,
  toneOfIndex,
} from "@/features/study-lists";
import type { SeriesShowcase } from "@/features/study-lists";

type Filter = "all" | "doing" | "done" | "todo";

const FILTERS: { id: Filter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "Tất cả", icon: LayoutGrid },
  { id: "doing", label: "Đang học", icon: Loader },
  { id: "done", label: "Hoàn thành", icon: CheckCheck },
  { id: "todo", label: "Chưa bắt đầu", icon: CircleDashed },
];

/** Where a list is, from its ticked steps. A list with no steps has not started. */
function stateOf(list: SeriesShowcase): Exclude<Filter, "all"> {
  if (list.stepCount > 0 && list.doneStepCount >= list.stepCount) return "done";
  if (list.doneStepCount > 0) return "doing";
  return "todo";
}

/** At most this many series on the home page; the rest are in the library. */
const MAX_LISTS = 3;

export interface StudySeriesCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** Where "Xem tất cả" goes. */
  href?: string;
}

/**
 * "Series học tập" on the home page: the learner's own study lists as a grid
 * of cards with their chapter and lesson counts, filtered by where each one is
 * (all, learning, done, not started). It takes the place of the goals and
 * resources cards.
 */
export function StudySeriesCard({
  href = "/learn?tab=lists",
  className,
  ...props
}: StudySeriesCardProps) {
  const titleId = useId();
  const { isAuthenticated, isLoading } = useAuth();
  const query = useAdminQuery(
    () =>
      isAuthenticated
        ? loadSeriesShowcases({ includeEmpty: true })
        : Promise.resolve([]),
    `home-study-lists-${isAuthenticated}`,
  );
  const [filter, setFilter] = useState<Filter>("all");

  const lists = query.data ?? [];
  const counts: Record<Filter, number> = {
    all: lists.length,
    doing: lists.filter((list) => stateOf(list) === "doing").length,
    done: lists.filter((list) => stateOf(list) === "done").length,
    todo: lists.filter((list) => stateOf(list) === "todo").length,
  };
  const shown = lists
    .filter((list) => filter === "all" || stateOf(list) === filter)
    .slice(0, MAX_LISTS);

  let body;
  if (!isLoading && !isAuthenticated) {
    body = (
      <div className="flex flex-col items-start gap-3 rounded-standard border-2 border-dashed border-border-strong p-4">
        <Text as="p" size="body-md" color="secondary">
          Đăng nhập để xem và theo dõi các danh sách học của bạn.
        </Text>
        <LinkButton href="/login" size="compact" variant="outline">
          Đăng nhập
        </LinkButton>
      </div>
    );
  } else if (query.error && !query.data) {
    body = (
      <Alert variant="danger" title="Không tải được các series">
        <div className="flex flex-wrap items-center gap-3">
          <span>{query.error.message}</span>
          <Button size="compact" variant="outline" onClick={query.reload}>
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  } else if (isLoading || !query.data) {
    body = (
      <div
        aria-busy="true"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <span role="status" className="sr-only">
          Đang tải
        </span>
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-80 w-full" />
        ))}
      </div>
    );
  } else if (lists.length === 0) {
    body = (
      <div className="flex flex-col items-start gap-3 rounded-standard border-2 border-dashed border-border-strong p-4">
        <Text as="p" size="body-md" color="secondary">
          Chưa có danh sách học nào. Tạo một danh sách để theo dõi tiến độ học
          theo từng phần.
        </Text>
        <LinkButton href={href} size="compact" variant="outline">
          Tạo danh sách học
        </LinkButton>
      </div>
    );
  } else if (shown.length === 0) {
    body = (
      <Text as="p" size="body-md" color="secondary">
        Không có danh sách nào ở nhóm này.
      </Text>
    );
  } else {
    body = (
      <ul className="m-0 grid list-none gap-6 p-0 pb-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((series, index) => (
          <li key={series.id} className="flex min-w-0">
            <SeriesCard
              series={series}
              tone={toneOfIndex(index)}
              className="h-full w-full"
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("gap-4 rounded-soft shadow-modal", className)}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-yellow text-ink"
        >
          <Layers size={22} />
        </span>
        <div className="min-w-0">
          <Text
            as="h2"
            id={titleId}
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Series học tập
          </Text>
          <Text size="body-sm" color="secondary">
            Các danh sách học có lộ trình rõ ràng, giúp bạn học sâu theo từng
            chủ đề.
          </Text>
        </div>
      </div>

      {isAuthenticated && lists.length > 0 && (
        <div
          role="group"
          aria-label="Lọc danh sách học"
          className="flex flex-wrap gap-2"
        >
          {FILTERS.map(({ id, label, icon: Icon }) => {
            const isSelected = filter === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setFilter(id)}
                className={cn(
                  "relative inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill border-2 border-border-strong px-3 text-body-sm font-semibold text-ink",
                  "transition-[background-color,box-shadow,translate] motion-reduce:transition-none",
                  "before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
                  isSelected
                    ? "translate-x-0.5 translate-y-0.5 bg-accent-lime shadow-none"
                    : "bg-surface-card shadow-raised hover:bg-surface-sunken active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
                  focusRingClasses,
                )}
              >
                <Icon aria-hidden="true" size={14} />
                {label} ({counts[id]})
              </button>
            );
          })}
        </div>
      )}

      {body}

      <div className="flex justify-center pt-1">
        <LinkButton href={href} variant="accent" rightIcon={ArrowRight}>
          Xem tất cả danh sách
        </LinkButton>
      </div>
    </Card>
  );
}
