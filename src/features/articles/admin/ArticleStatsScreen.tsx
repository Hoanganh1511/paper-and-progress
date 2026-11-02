"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  cn,
} from "@/design-system";
import { QueryError } from "@/features/admin/components/QueryError";
import { TableMessage } from "@/features/admin/components/TableMessage";
import { TablePager } from "@/features/admin/components/TablePager";
import { PAGE_SIZE } from "@/features/admin/format";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getArticleStats } from "../articlesApi";
import { formatDate } from "../format";
import type { ArticleStatsRow, ArticleStatsSort } from "../types";

const INK = "var(--color-border-strong)";
const MUTED = "var(--color-text-secondary)";
const FILLS = [
  "var(--color-accent-blue)",
  "var(--color-accent-lime)",
  "var(--color-accent-yellow)",
  "var(--color-accent-pink)",
];

/** How many readers got to each point of the articles on this page: opened, then a quarter, half, ... all. */
export function readingFunnel(rows: ArticleStatsRow[]) {
  const sum = (pick: (row: ArticleStatsRow) => number) =>
    rows.reduce((total, row) => total + pick(row), 0);
  return [
    { step: "Mở bài", readers: sum((row) => row.opened) },
    { step: "25%", readers: sum((row) => row.reached25) },
    { step: "50%", readers: sum((row) => row.reached50) },
    { step: "75%", readers: sum((row) => row.reached75) },
    { step: "Đọc hết", readers: sum((row) => row.reached100) },
  ];
}

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

const COLUMNS: { sort: ArticleStatsSort; label: string }[] = [
  { sort: "views", label: "Lượt xem" },
  { sort: "reactions", label: "Reaction" },
  { sort: "bookmarks", label: "Bookmark" },
  { sort: "completion", label: "Đọc hết" },
];

/** Admin table of how each published article is doing, sortable, with the reading funnel above it. */
export function ArticleStatsScreen() {
  const [sort, setSort] = useState<ArticleStatsSort>("views");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const query = useAdminQuery(
    () => getArticleStats({ sort, direction, page, pageSize: PAGE_SIZE }),
    JSON.stringify([sort, direction, page]),
  );
  const items = query.data?.items;

  function changeSort(next: ArticleStatsSort) {
    if (next === sort) setDirection(direction === "desc" ? "asc" : "desc");
    else {
      setSort(next);
      setDirection("desc");
    }
    setPage(1);
  }

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Thống kê bài viết
      </Text>
      <QueryError error={query.error} onRetry={query.reload} />

      {items && items.length > 0 && (
        <figure className="flex flex-col gap-2">
          <figcaption>
            <Text as="h2" size="body-lg" weight="semibold">
              Độc giả đọc đến đâu (các bài trong trang này)
            </Text>
          </figcaption>
          <div
            role="img"
            aria-label={`Số độc giả theo mốc cuộn: ${readingFunnel(items)
              .map((point) => `${point.step} ${point.readers}`)
              .join(", ")}`}
            className="h-56 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={readingFunnel(items)}
                margin={{ top: 8, right: 12, bottom: 0, left: -16 }}
              >
                <CartesianGrid
                  stroke={INK}
                  strokeOpacity={0.15}
                  vertical={false}
                />
                <XAxis
                  dataKey="step"
                  stroke={MUTED}
                  tick={{ fill: MUTED, fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  stroke={MUTED}
                  tick={{ fill: MUTED, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [value, "Độc giả"]}
                  contentStyle={{
                    border: `2px solid ${INK}`,
                    borderRadius: 8,
                    background: "var(--color-surface-card)",
                  }}
                />
                <Bar
                  dataKey="readers"
                  stroke={INK}
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {FILLS.concat(FILLS[1]).map((fill, index) => (
                    <Cell key={index} fill={fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      )}

      <Table compact aria-busy={query.isLoading}>
        <TableHeader>
          <TableRow>
            <TableHead>Bài viết</TableHead>
            <TableHead>Đăng</TableHead>
            {COLUMNS.map((column) => (
              <TableHead
                key={column.sort}
                sortable
                sortDirection={
                  sort === column.sort
                    ? direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                onSort={() => changeSort(column.sort)}
              >
                {column.label}
              </TableHead>
            ))}
            <TableHead>Bình luận</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isLoading && "opacity-60")}>
          {items?.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="max-w-xs">
                <a
                  href={`/articles/${row.slug}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {row.title}
                </a>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDate(row.publishedAt)}
              </TableCell>
              <TableCell>{row.views.toLocaleString("vi-VN")}</TableCell>
              <TableCell>{row.reactions}</TableCell>
              <TableCell>{row.bookmarks}</TableCell>
              <TableCell>
                {row.opened > 0 ? percent(row.completionRate) : "—"}
              </TableCell>
              <TableCell>{row.comments}</TableCell>
            </TableRow>
          ))}
          {items?.length === 0 && (
            <TableMessage colSpan={7}>Chưa có bài nào được đăng.</TableMessage>
          )}
          {!items && <TableMessage colSpan={7}>Đang tải...</TableMessage>}
        </TableBody>
      </Table>
      <TablePager
        page={page}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
      />
    </>
  );
}
