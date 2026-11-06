"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  EmptyState,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  Text,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { listMine, listSeries } from "../articlesApi";
import { STATUS_LABELS } from "../types";

const ALL = "__all__";
const NO_SERIES = "__none__";

export interface OpenBesideDialogProps {
  /** The article being edited; it stays on the left. */
  currentId: string;
  open: boolean;
  onClose: () => void;
}

/** Pick a series, then one of its articles, to edit next to the current one. */
export function OpenBesideDialog({
  currentId,
  open,
  onClose,
}: OpenBesideDialogProps) {
  const router = useRouter();
  const series = useAdminQuery(listSeries, "editor-series");
  const mine = useAdminQuery(listMine, "my-articles");
  const [seriesId, setSeriesId] = useState(ALL);

  const slug = series.data?.find((item) => item.id === seriesId)?.slug;
  const articles = (mine.data ?? []).filter((article) => {
    if (article.id === currentId) return false;
    if (seriesId === ALL) return true;
    if (seriesId === NO_SERIES) return article.series === null;
    return article.series?.slug === slug;
  });

  return (
    <Dialog open={open} onClose={onClose} size="md">
      <DialogHeader
        title="Mở song song một bài khác"
        description="Chọn series, rồi chọn bài để sửa cạnh bài này."
        closeLabel="Đóng"
      />
      <DialogContent className="flex max-h-[60dvh] flex-col gap-4 px-6 py-4">
        <FormField label="Series">
          <Select value={seriesId} onValueChange={setSeriesId}>
            <SelectTrigger placeholder="Tất cả bài" />
            <SelectContent>
              <SelectItem value={ALL}>Tất cả bài</SelectItem>
              <SelectItem value={NO_SERIES}>Không thuộc series</SelectItem>
              {(series.data ?? []).map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        {mine.error && !mine.data ? (
          <Alert variant="danger">{mine.error.message}</Alert>
        ) : !mine.data ? (
          <Skeleton className="h-24 w-full" />
        ) : articles.length === 0 ? (
          <EmptyState title="Không có bài nào trong mục này" />
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {articles.map((article) => (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/write/${currentId}?with=${article.id}`)
                  }
                  className="flex min-h-11 w-full flex-col items-start gap-1 rounded-standard border-2 border-border-strong bg-surface-card p-3 text-left shadow-raised transition-transform hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus active:translate-x-0.5 active:translate-y-0.5 active:shadow-none motion-reduce:transition-none"
                >
                  <Text weight="bold" className="font-display break-words">
                    {article.seriesOrder
                      ? `${article.seriesOrder}. ${article.title}`
                      : article.title}
                  </Text>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge size="sm">{STATUS_LABELS[article.status]}</Badge>
                    {article.series && (
                      <Text size="body-sm" color="secondary">
                        {article.series.title}
                      </Text>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
