"use client";

import Link from "next/link";
import { ListChecks } from "lucide-react";
import { Alert } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getStudyList } from "@/features/study-lists";

export interface StudySectionTarget {
  listId: string;
  sectionId: string;
}

export interface StudySectionBannerProps {
  target: StudySectionTarget;
  /** True once the new article was put in the part as a step. */
  isAdded: boolean;
}

/**
 * Shown when the article is being written for a part of a study list: where it
 * will go (or went), and the way back to the list. The article is created by
 * the first save, and goes in then.
 */
export function StudySectionBanner({
  target,
  isAdded,
}: StudySectionBannerProps) {
  const list = useAdminQuery(
    () => getStudyList(target.listId),
    `study-target-${target.listId}`,
  );
  const section = list.data?.sections.find(
    (item) => item.id === target.sectionId,
  );
  const where = section
    ? `phần “${section.title}” của danh sách “${list.data?.title}”`
    : "danh sách học của bạn";

  return (
    <Alert variant={isAdded ? "success" : "info"}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <span className="flex items-center gap-2">
          <ListChecks aria-hidden="true" size={18} className="shrink-0" />
          {isAdded
            ? `Đã thêm bài này vào ${where}.`
            : `Bài này sẽ được thêm vào ${where} khi bạn lưu lần đầu.`}
        </span>
        <Link
          href={`/study-lists/${target.listId}`}
          className="font-semibold underline underline-offset-4"
        >
          Về danh sách học
        </Link>
      </div>
    </Alert>
  );
}
