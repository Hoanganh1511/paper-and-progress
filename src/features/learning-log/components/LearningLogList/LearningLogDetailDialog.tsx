"use client";

import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  Text,
} from "@/design-system";
import { LearningLogError, deleteLearningLog } from "../../learningLogService";
import {
  SKILL_LABELS,
  STATUS_LABELS,
  formatDuration,
  formatLogDate,
} from "../../learningLogs";
import type { LearningLog } from "../../types";

export interface LearningLogDetailDialogProps {
  log: LearningLog;
  onClose: () => void;
  /** Called after the log was deleted, just before the dialog closes. */
  onDeleted?: (log: LearningLog) => void;
}

/** Everything saved about one log, with a confirmed delete. Mount it while a log is selected. */
export function LearningLogDetailDialog({
  log,
  onClose,
  onDeleted,
}: LearningLogDetailDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const duration = formatDuration(log.durationMinutes);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteLearningLog(log.id);
      onDeleted?.(log);
      onClose();
    } catch (failure) {
      setError(
        failure instanceof LearningLogError
          ? failure.message
          : "Không xoá được log. Thử lại sau.",
      );
      setIsConfirming(false);
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Dialog open onClose={onClose} size="md">
        <DialogHeader
          title={log.title}
          description={[
            formatLogDate(log.learningDate),
            SKILL_LABELS[log.skillId],
            duration,
            STATUS_LABELS[log.status],
          ]
            .filter(Boolean)
            .join(" · ")}
          closeLabel="Đóng"
        />
        <DialogContent className="flex flex-col gap-4">
          <Section title="Mục tiêu">{log.goal}</Section>
          <Section title="Nội dung đã học">{log.notes}</Section>
          {log.tags.length > 0 && (
            <Section title="Tag">
              <ul className="flex flex-wrap gap-2">
                {log.tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="blue" size="sm">{`#${tag}`}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {log.referenceUrls.length > 0 && (
            <Section title="Tài liệu tham khảo">
              <ul className="flex flex-col gap-1">
                {log.referenceUrls.map((url) => (
                  <li key={url} className="break-all">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {url}
                      <span className="sr-only"> (mở trong tab mới)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {!log.goal && !log.notes && log.tags.length === 0 && (
            <Text color="secondary">
              Log này chưa có thêm nội dung nào ngoài tiêu đề.
            </Text>
          )}
          {error && <Alert variant="danger">{error}</Alert>}
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            leftIcon={Trash2}
            onClick={() => setIsConfirming(true)}
          >
            Xoá log
          </Button>
          <Button variant="accent" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
      <AlertDialog
        open={isConfirming}
        variant="destructive"
        title="Xoá log này?"
        description={`“${log.title}” sẽ bị xoá khỏi trình duyệt này.`}
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <section className="flex flex-col gap-1">
      <Text as="h3" size="body-sm" weight="semibold" color="secondary">
        {title}
      </Text>
      <div className="text-body-md break-words whitespace-pre-wrap">
        {children}
      </div>
    </section>
  );
}
