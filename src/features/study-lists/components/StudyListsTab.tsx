"use client";

import { useState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { Alert, Button, EmptyState, Skeleton, Text } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { loadSeriesShowcases, toneOfIndex } from "../seriesShowcase";
import { SeriesCard } from "./SeriesCard";
import { CreateStudyListDialog } from "./CreateStudyListDialog";

/** The "Series học" tab of the library: the learner's own study lists as series cards, and a way to start one. */
export function StudyListsTab() {
  const query = useAdminQuery(
    () => loadSeriesShowcases({ includeEmpty: true }),
    "study-lists",
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  let body;
  if (query.error && !query.data) {
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
  } else if (!query.data) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  } else if (query.data.length === 0) {
    body = (
      <EmptyState
        icon={ListChecks}
        title="Chưa có danh sách học nào"
        description="Bấm “Tạo danh sách” để bắt đầu, rồi thêm các phần và bước theo thứ tự bạn muốn học."
      />
    );
  } else {
    body = (
      <ul className="grid gap-6 pb-3 sm:grid-cols-2 xl:grid-cols-3">
        {query.data.map((series, index) => (
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
    <section
      aria-labelledby="study-lists-title"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-blue text-ink"
          >
            <ListChecks size={22} />
          </span>
          <div className="min-w-0">
            <Text
              as="h2"
              id="study-lists-title"
              size="heading-lg"
              weight="bold"
              font="display"
            >
              Series học
            </Text>
            <Text size="body-sm" color="secondary">
              Lộ trình do bạn tự soạn: các phần theo thứ tự, mỗi phần có từng
              bước để tick khi học xong.
            </Text>
          </div>
        </div>
        <Button
          variant="accent"
          leftIcon={Plus}
          className="max-sm:w-full"
          onClick={() => setIsCreateOpen(true)}
        >
          Tạo danh sách
        </Button>
      </div>

      {body}
      <CreateStudyListDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={query.reload}
      />
    </section>
  );
}
