"use client";

import { useState } from "react";
import { diffLines } from "diff";
import { Minus, Plus } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Button,
  Drawer,
  Skeleton,
  Text,
  cn,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { listRevisions, restoreRevision } from "../articlesApi";
import type { EditableArticle, RevisionSummary } from "../types";

/** "2026-11-01T09:44:05.000Z" -> "01/11 09:44" (UTC, cut from the text so it never depends on the time zone). */
const formatStamp = (iso: string) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)} ${iso.slice(11, 16)}`;

export interface RevisionDiffProps {
  /** The text of the chosen old version. */
  before: string;
  /** The text being written now. */
  after: string;
}

/** Line by line changes from the old version to the current text. `+` and `-` signs, not only colour. */
export function RevisionDiff({ before, after }: RevisionDiffProps) {
  const parts = diffLines(before, after);
  if (parts.every((part) => !part.added && !part.removed)) {
    return <Text color="secondary">Giống hệt bản đang viết.</Text>;
  }
  return (
    <ul
      aria-label="Thay đổi"
      className="flex flex-col gap-1 font-mono text-body-sm"
    >
      {parts.map((part, index) => {
        if (!part.added && !part.removed) {
          return (
            <li key={index} className="px-2 text-text-secondary">
              {part.value.trim().length > 90
                ? `${part.value.trim().slice(0, 90)}…`
                : part.value.trim()}
            </li>
          );
        }
        const Icon = part.added ? Plus : Minus;
        return (
          <li
            key={index}
            className={cn(
              "flex items-start gap-1 rounded-sharp px-2 py-1 break-words whitespace-pre-wrap",
              part.added
                ? "bg-success-bg text-success-text"
                : "bg-danger-bg text-danger-text line-through",
            )}
          >
            <Icon aria-hidden="true" size={14} className="mt-1 shrink-0" />
            <span className="sr-only">{part.added ? "Thêm: " : "Bỏ: "}</span>
            {part.value.trim()}
          </li>
        );
      })}
    </ul>
  );
}

export interface RevisionPanelProps {
  articleId: string;
  open: boolean;
  onClose: () => void;
  /** Text of the article as it is being written. */
  currentText: string;
  /** Called with the article after a version was put back; the editor reloads from it. */
  onRestored: (article: EditableArticle) => void;
}

/** History of saves: pick one to see what changed since, and put it back if wanted (the history itself is kept). */
export function RevisionPanel({
  articleId,
  open,
  onClose,
  currentText,
  onRestored,
}: RevisionPanelProps) {
  const revisions = useAdminQuery(
    () => (open ? listRevisions(articleId) : Promise.resolve([])),
    `revisions-${articleId}-${open}`,
  );
  const [selected, setSelected] = useState<RevisionSummary>();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string>();

  async function handleRestore() {
    if (!selected) return;
    setIsRestoring(true);
    setError(undefined);
    try {
      const article = await restoreRevision(articleId, selected.id);
      setIsConfirming(false);
      setSelected(undefined);
      onRestored(article);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không khôi phục được.",
      );
      setIsConfirming(false);
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title="Lịch sử phiên bản"
        closeLabel="Đóng"
        side="right"
        className="w-full max-w-lg"
      >
        <div className="flex flex-col gap-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {revisions.error && !revisions.data ? (
            <Alert variant="danger">{revisions.error.message}</Alert>
          ) : !revisions.data ? (
            <Skeleton className="h-24 w-full" />
          ) : revisions.data.length === 0 ? (
            <Text color="secondary">Chưa có phiên bản nào.</Text>
          ) : (
            <ul className="flex flex-col gap-1" aria-label="Các phiên bản">
              {revisions.data.map((revision) => (
                <li key={revision.id}>
                  <button
                    type="button"
                    aria-pressed={selected?.id === revision.id}
                    onClick={() => setSelected(revision)}
                    className={cn(
                      "flex min-h-11 w-full flex-col items-start rounded-standard border-2 border-border-strong px-3 py-2 text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
                      selected?.id === revision.id &&
                        "bg-accent-lime text-ink hover:bg-accent-lime",
                    )}
                  >
                    <span className="text-body-sm font-semibold">
                      {formatStamp(revision.createdAt)}
                    </span>
                    <span className="text-body-sm break-words">
                      {revision.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <section aria-label="So sánh" className="flex flex-col gap-3">
              <Text as="h3" size="body-md" weight="bold">
                Từ bản {formatStamp(selected.createdAt)} đến bản đang viết
              </Text>
              <RevisionDiff before={selected.contentText} after={currentText} />
              <Button variant="accent" onClick={() => setIsConfirming(true)}>
                Khôi phục bản này
              </Button>
            </section>
          )}
        </div>
      </Drawer>

      <AlertDialog
        open={isConfirming}
        title="Khôi phục bản này?"
        description="Nội dung hiện tại sẽ được thay bằng bản đã chọn. Bản hiện tại vẫn nằm trong lịch sử, bạn có thể quay lại."
        confirmLabel="Khôi phục"
        cancelLabel="Huỷ"
        isLoading={isRestoring}
        onConfirm={handleRestore}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
