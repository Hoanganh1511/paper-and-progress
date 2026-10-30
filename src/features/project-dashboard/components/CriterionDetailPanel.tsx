"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  DatePicker,
  datePickerLabelsVi,
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  Text,
  Textarea,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useDashboard } from "../DashboardContext";
import {
  PRIORITY_BADGE_VARIANT,
  PRIORITY_LABELS,
  STATUS_BADGE_VARIANT,
  STATUS_LABELS,
  isOverdue,
  toDateInput,
} from "../display";
import {
  DashboardApiError,
  deleteCriterion,
  getCriterion,
  updateCriterion,
} from "../projectDashboardApi";
import type { CriterionDetail, CriterionPatch } from "../types";
import { ActivityTimeline } from "./ActivityModule";
import { ModuleError } from "./ModuleError";
import { RichTextEditor } from "./RichTextEditor";
import { StatusPicker } from "./StatusPicker";

const URL_PATTERN = /^https?:\/\/\S+$/i;

/** The panel for one criterion: edit it in place, change its status, read its history, delete it. */
export function CriterionDetailPanel({ id }: { id: string }) {
  const { version, closeCriterion } = useDashboard();
  const query = useAdminQuery(
    () => getCriterion(id),
    `criterion-${id}-${version}`,
  );
  const criterion = query.data;
  const isMissing =
    query.error instanceof DashboardApiError && query.error.status === 404;

  return (
    <Card
      as="section"
      aria-labelledby="criterion-panel-title"
      variant="elevated"
      padding="compact"
    >
      <Text as="h2" id="criterion-panel-title" size="heading-sm" weight="bold">
        Chi tiết tiêu chí
      </Text>
      {isMissing ? (
        <Text role="alert" color="secondary">
          Tiêu chí này không còn tồn tại.
        </Text>
      ) : query.error && !criterion ? (
        <ModuleError error={query.error} onRetry={query.reload} />
      ) : !criterion ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span role="status" className="sr-only">
            Đang tải
          </span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <CriterionEditor key={criterion.id} criterion={criterion} />
      )}
      {!criterion && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={closeCriterion}>
            Đóng
          </Button>
        </div>
      )}
    </Card>
  );
}

function CriterionEditor({ criterion }: { criterion: CriterionDetail }) {
  const { refresh, closeCriterion } = useDashboard();
  const [title, setTitle] = useState(criterion.title);
  const [notes, setNotes] = useState(criterion.notes ?? "");
  const [evidenceUrl, setEvidenceUrl] = useState(criterion.evidenceUrl ?? "");
  const [fieldErrors, setFieldErrors] = useState<{
    title?: string;
    evidenceUrl?: string;
  }>({});
  const [saveError, setSaveError] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const overdue = isOverdue(criterion.deadline, criterion.status);

  /** Saves one change, then refreshes every module so the whole dashboard follows. */
  async function save(patch: CriterionPatch) {
    setSaveError(undefined);
    try {
      await updateCriterion(criterion.id, patch);
      refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Có lỗi xảy ra.");
    }
  }

  function saveTitle() {
    const next = title.trim();
    if (!next) {
      setFieldErrors((previous) => ({ ...previous, title: "Nhập tiêu đề." }));
      return;
    }
    setFieldErrors((previous) => ({ ...previous, title: undefined }));
    if (next !== criterion.title) void save({ title: next });
  }

  function saveEvidenceUrl() {
    const next = evidenceUrl.trim();
    if (next && !URL_PATTERN.test(next)) {
      setFieldErrors((previous) => ({
        ...previous,
        evidenceUrl: "Nhập đường dẫn bắt đầu bằng http:// hoặc https://.",
      }));
      return;
    }
    setFieldErrors((previous) => ({ ...previous, evidenceUrl: undefined }));
    // The API has no way to clear a URL, so an empty field is simply not sent.
    if (next && next !== (criterion.evidenceUrl ?? "")) {
      void save({ evidenceUrl: next });
    }
  }

  async function handleDelete() {
    setIsRemoving(true);
    try {
      await deleteCriterion(criterion.id);
      refresh();
      closeCriterion();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Có lỗi xảy ra.");
      setIsRemoving(false);
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Tiêu đề" error={fieldErrors.title}>
        <Input
          value={title}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-2">
        <Badge>{criterion.category.name}</Badge>
        <Badge variant={PRIORITY_BADGE_VARIANT[criterion.priority]}>
          Priority: {PRIORITY_LABELS[criterion.priority]}
        </Badge>
        <Badge variant={STATUS_BADGE_VARIANT[criterion.status]}>
          {STATUS_LABELS[criterion.status]}
        </Badge>
        {overdue && <Badge variant="danger">Quá hạn</Badge>}
      </div>

      {saveError && <Alert variant="danger">{saveError}</Alert>}

      <div className="flex flex-col gap-1">
        <Text as="h3" size="body-sm" weight="medium">
          Trạng thái
        </Text>
        <StatusPicker
          value={criterion.status}
          onValueChange={(status) => {
            if (status !== criterion.status) void save({ status });
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Độ ưu tiên">
          <Select
            value={criterion.priority}
            onValueChange={(value) =>
              void save({ priority: value as CriterionDetail["priority"] })
            }
          >
            <SelectTrigger />
            <SelectContent>
              {(
                Object.keys(PRIORITY_LABELS) as CriterionDetail["priority"][]
              ).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Deadline">
          <DatePicker
            value={toDateInput(criterion.deadline)}
            onValueChange={(next) =>
              void save({
                deadline: next
                  ? new Date(`${next}T00:00:00`).toISOString()
                  : null,
              })
            }
            labels={datePickerLabelsVi}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-1">
        <Text as="h3" size="body-sm" weight="medium">
          Mô tả
        </Text>
        <RichTextEditor
          value={criterion.description ?? ""}
          label="Mô tả"
          onCommit={(html) => void save({ description: html })}
        />
      </div>

      <FormField label="Development Notes">
        <Textarea
          value={notes}
          rows={4}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => {
            const next = notes.trim();
            if (next !== (criterion.notes ?? "")) void save({ notes: next });
          }}
        />
      </FormField>

      <FormField label="Evidence URL" error={fieldErrors.evidenceUrl}>
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={evidenceUrl}
            placeholder="https://github.com/..."
            onChange={(event) => setEvidenceUrl(event.target.value)}
            onBlur={saveEvidenceUrl}
            className="flex-1"
          />
          {criterion.evidenceUrl && (
            <a
              href={criterion.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Mở đường dẫn minh chứng trong tab mới"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong hover:bg-surface-sunken"
            >
              <ExternalLink aria-hidden="true" size={16} />
            </a>
          )}
        </div>
      </FormField>

      <section
        aria-labelledby="linked-activities"
        className="flex flex-col gap-3"
      >
        <Text as="h3" id="linked-activities" size="body-md" weight="semibold">
          Linked Activities
        </Text>
        {criterion.activities.length === 0 ? (
          <Text size="body-sm" color="secondary">
            Chưa có hoạt động.
          </Text>
        ) : (
          <ActivityTimeline
            items={criterion.activities.map((activity) => ({
              ...activity,
              categoryName: null,
            }))}
            onOpen={() => undefined}
          />
        )}
      </section>

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="compact"
          onClick={() => setIsDeleting(true)}
          className="text-danger-text underline underline-offset-4 hover:bg-transparent hover:text-danger-text"
        >
          Xóa tiêu chí
        </Button>
        <Button variant="outline" onClick={closeCriterion}>
          Đóng
        </Button>
      </div>

      <AlertDialog
        open={isDeleting}
        variant="destructive"
        title="Xóa tiêu chí này?"
        description={`“${criterion.title}” sẽ bị xóa. Lịch sử hoạt động vẫn được giữ lại.`}
        confirmLabel="Xóa"
        cancelLabel="Huỷ"
        isLoading={isRemoving}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}
