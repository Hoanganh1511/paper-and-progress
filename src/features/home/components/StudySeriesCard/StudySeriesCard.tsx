"use client";

import { useId, useState, type ComponentProps } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCheck,
  CircleDashed,
  LayoutGrid,
  Layers,
  ListChecks,
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
import { listStudyLists } from "@/features/study-lists";
import type { StudyListSummary } from "@/features/study-lists";

type Filter = "all" | "doing" | "done" | "todo";

const FILTERS: { id: Filter; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "Tất cả", icon: LayoutGrid },
  { id: "doing", label: "Đang học", icon: Loader },
  { id: "done", label: "Hoàn thành", icon: CheckCheck },
  { id: "todo", label: "Chưa bắt đầu", icon: CircleDashed },
];

/** Where a list is, from its ticked steps. A list with no steps has not started. */
function stateOf(list: StudyListSummary): Exclude<Filter, "all"> {
  if (list.stepCount > 0 && list.doneStepCount >= list.stepCount) return "done";
  if (list.doneStepCount > 0) return "doing";
  return "todo";
}

/** The colour under each card; the cards take turns so a row is never one colour. */
const STRIPES = [
  { stripe: "bg-accent-pink", icon: "bg-accent-pink" },
  { stripe: "bg-accent-lime", icon: "bg-accent-lime" },
  { stripe: "bg-accent-blue", icon: "bg-accent-blue" },
  { stripe: "bg-accent-yellow", icon: "bg-accent-yellow" },
] as const;

/** At most this many lists on the home page; the rest are on the library page. */
const MAX_LISTS = 6;

function SeriesItem({
  list,
  index,
}: {
  list: StudyListSummary;
  index: number;
}) {
  const colour = STRIPES[index % STRIPES.length];
  return (
    <li className="flex">
      <div
        className={cn(
          "relative flex w-full items-center gap-3 overflow-hidden rounded-standard border-2 border-border-strong bg-surface-card p-3 pb-4 shadow-raised",
          "transition-[translate,box-shadow] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none motion-reduce:transition-none",
          "focus-within:translate-x-0.5 focus-within:translate-y-0.5 focus-within:shadow-none",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong text-ink",
            colour.icon,
          )}
        >
          <ListChecks size={22} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Text
            as="h3"
            size="body-md"
            weight="bold"
            className="line-clamp-2 font-display"
          >
            <Link
              href={`/study-lists/${list.id}`}
              className={cn(
                "rounded-sharp after:absolute after:inset-0 after:content-['']",
                focusRingClasses,
              )}
            >
              {list.title}
            </Link>
          </Text>
          <Text
            as="p"
            size="caption"
            color="secondary"
            className="flex flex-wrap items-center gap-x-3 gap-y-0.5"
          >
            <span>{list.sectionCount} chương</span>
            <span className="inline-flex items-center gap-1">
              <Layers aria-hidden="true" size={12} />
              {list.stepCount} bài
            </span>
          </Text>
        </div>
        <ArrowRight
          aria-hidden="true"
          size={18}
          className="shrink-0 text-text-primary"
        />
        <span
          aria-hidden="true"
          className={cn("absolute inset-x-0 bottom-0 h-1.5", colour.stripe)}
        />
      </div>
    </li>
  );
}

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
    () => (isAuthenticated ? listStudyLists() : Promise.resolve([])),
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
      <Alert variant="danger" title="Không tải được danh sách học">
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
          <Skeleton key={index} className="h-24 w-full" />
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
      <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((list, index) => (
          <SeriesItem key={list.id} list={list} index={index} />
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
