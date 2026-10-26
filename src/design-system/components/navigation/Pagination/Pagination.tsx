"use client";

import { type ComponentProps } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import { Button } from "../../actions/Button/Button";
import { IconButton } from "../../actions/Button/IconButton";

export interface PaginationLabels {
  /** Accessible name of the navigation landmark. */
  navigation: string;
  previous: string;
  next: string;
  /** `{page}` is replaced with the page number. */
  page: string;
}

export const defaultPaginationLabels: PaginationLabels = {
  navigation: "Pagination",
  previous: "Previous page",
  next: "Next page",
  page: "Page {page}",
};

type PageItem = number | "start-ellipsis" | "end-ellipsis";

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

/**
 * Page numbers to show: always the first and last page, the current page with
 * `siblingCount` neighbours on each side, and an ellipsis for each gap. The
 * number of slots stays constant so the control does not jump while paging.
 */
export function getPageItems(
  page: number,
  pageCount: number,
  siblingCount = 1,
): PageItem[] {
  const totalSlots = siblingCount * 2 + 5;
  if (pageCount <= totalSlots) return range(1, pageCount);

  const left = Math.max(page - siblingCount, 1);
  const right = Math.min(page + siblingCount, pageCount);
  const showStartEllipsis = left > 3;
  const showEndEllipsis = right < pageCount - 2;
  const edgeCount = 3 + siblingCount * 2;

  if (!showStartEllipsis && showEndEllipsis) {
    return [...range(1, edgeCount), "end-ellipsis", pageCount];
  }
  if (showStartEllipsis && !showEndEllipsis) {
    return [
      1,
      "start-ellipsis",
      ...range(pageCount - edgeCount + 1, pageCount),
    ];
  }
  return [
    1,
    "start-ellipsis",
    ...range(left, right),
    "end-ellipsis",
    pageCount,
  ];
}

export interface PaginationProps extends Omit<
  ComponentProps<"nav">,
  "onChange"
> {
  /** Current page, starting at 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Page numbers shown on each side of the current one. */
  siblingCount?: number;
  /** Replace any of the texts (translations). */
  labels?: Partial<PaginationLabels>;
}

/** Previous / next buttons around numbered pages. The current page has aria-current="page". */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  labels: labelOverrides,
  className,
  ref,
  ...props
}: PaginationProps) {
  const labels = { ...defaultPaginationLabels, ...labelOverrides };
  const currentPage = Math.min(Math.max(page, 1), Math.max(pageCount, 1));

  return (
    <nav
      ref={ref}
      aria-label={labels.navigation}
      className={cn(className)}
      {...props}
    >
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <IconButton
            icon={ChevronLeft}
            aria-label={labels.previous}
            variant="ghost"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
        </li>
        {getPageItems(currentPage, pageCount, siblingCount).map((item) => (
          <li key={item}>
            {typeof item === "number" ? (
              <Button
                variant={item === currentPage ? "primary" : "ghost"}
                aria-label={labels.page.replace("{page}", String(item))}
                aria-current={item === currentPage ? "page" : undefined}
                className="min-w-10 px-2"
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ) : (
              <span
                aria-hidden="true"
                className="inline-flex h-10 min-w-8 items-end justify-center pb-2 font-body text-text-muted"
              >
                …
              </span>
            )}
          </li>
        ))}
        <li>
          <IconButton
            icon={ChevronRight}
            aria-label={labels.next}
            variant="ghost"
            disabled={currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </li>
      </ul>
    </nav>
  );
}
