"use client";

import { useState } from "react";
import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { listStudyLists } from "../studyListsApi";
import type { StudyListSummary } from "../types";
import { CreateStudyListDialog } from "./CreateStudyListDialog";

function StudyListCard({ list }: { list: StudyListSummary }) {
  return (
    <Card as="article" interactive className="relative gap-3">
      <div className="flex flex-col gap-1">
        <Text as="h3" size="heading-sm" weight="bold" className="font-display">
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
        {list.description && (
          <Text size="body-sm" color="secondary" className="line-clamp-2">
            {list.description}
          </Text>
        )}
      </div>
      <Text size="body-sm" color="secondary">
        {list.sectionCount} chương · {list.stepCount} bài
      </Text>
      {list.certificates.length > 0 && (
        <ul
          aria-label="Chứng chỉ liên kết"
          className="relative z-10 flex flex-wrap gap-2"
        >
          {list.certificates.map((certificate) => (
            <li key={certificate.id}>
              <Link href={`/certificates/${certificate.id}`}>
                <Badge variant="lime" size="sm">
                  {certificate.name}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** The "Danh sách học" tab of the library: the learner's own study lists, and a way to start one. */
export function StudyListsTab() {
  const query = useAdminQuery(listStudyLists, "study-lists");
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
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {query.data.map((list) => (
          <li key={list.id} className="flex">
            <div className="w-full">
              <StudyListCard list={list} />
            </div>
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
              Danh sách học
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
