"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { PenLine, RotateCcw, X } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  FormField,
  IconButton,
  Input,
  Text,
  Textarea,
} from "@/design-system";
import { LearningLogError, createLearningLog } from "../../learningLogService";
import {
  DURATION_OPTIONS,
  LIMITS,
  SKILL_IDS,
  SKILL_LABELS,
  STATUS_IDS,
  STATUS_LABELS,
  addTag,
  createInitialValues,
  isDirty,
  toDraft,
  validateValues,
} from "../../learningLogs";
import type {
  LearningLog,
  LearningLogFormErrors,
  LearningLogFormValues,
  LearningLogStatus,
  LearningSkillId,
} from "../../types";
import { SelectField } from "./SelectField";
import { TagInput } from "./TagInput";

type Confirming = "discard" | "reset" | undefined;

export interface CreateLearningLogDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after the log was stored, just before the dialog closes. */
  onSaved?: (log: LearningLog) => void;
}

/**
 * "Viết thêm Log": a short composer for one study session. Only the title and
 * the main skill are required. Nothing is lost by accident: closing or
 * resetting a changed form asks first, and a failed save keeps every field.
 * Mount it only while it is open, so each opening starts from a fresh form.
 */
export function CreateLearningLogDialog({
  open,
  onClose,
  onSaved,
}: CreateLearningLogDialogProps) {
  const formId = useId();
  const descriptionId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  // Held in state so "reset" and "dirty" compare against what the form opened with.
  const [initial] = useState(() => createInitialValues());
  const [values, setValues] = useState<LearningLogFormValues>(initial);
  const [tagDraft, setTagDraft] = useState("");
  const [errors, setErrors] = useState<LearningLogFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [confirming, setConfirming] = useState<Confirming>();

  const dirty = isDirty(values, initial, tagDraft);

  function set<K extends keyof LearningLogFormValues>(
    key: K,
    value: LearningLogFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaveError(undefined);
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function bindText(key: "title" | "goal" | "notes" | "referenceUrl") {
    return {
      value: values[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        set(key, event.target.value),
    };
  }

  /** Closing a changed form asks first; a busy or untouched one closes at once. */
  function requestClose() {
    if (isSaving) return;
    if (dirty) setConfirming("discard");
    else onClose();
  }

  function handleReset() {
    setValues(initial);
    setTagDraft("");
    setErrors({});
    setSaveError(undefined);
    setConfirming(undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return; // a double click or a second Enter must not save twice

    // A tag still being typed counts: the user would not expect it to vanish.
    const pending = addTag(values.tags, tagDraft);
    const submitted = pending.ok ? { ...values, tags: pending.tags } : values;
    if (pending.ok) {
      setValues(submitted);
      setTagDraft("");
    }

    const found = validateValues(submitted);
    setErrors(found);
    setSaveError(undefined);
    if (Object.keys(found).length > 0) {
      // Wait for the errors to render, then move to the first invalid field.
      setTimeout(
        () =>
          formRef.current
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus(),
        0,
      );
      return;
    }

    setIsSaving(true);
    try {
      const log = await createLearningLog(toDraft(submitted));
      onSaved?.(log);
      onClose();
    } catch (error) {
      setSaveError(
        error instanceof LearningLogError
          ? error.message
          : "Không lưu được log. Dữ liệu bạn nhập vẫn còn, hãy thử lại.",
      );
      setIsSaving(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        size="lg"
        aria-label="Viết thêm Log"
        aria-describedby={descriptionId}
        // Taller than the dialog default: up to 94dvh on a phone, 88dvh from `sm`.
        className="max-h-[94dvh] sm:max-h-[88dvh]"
      >
        <div className="flex items-start gap-4 px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-yellow text-ink"
          >
            <PenLine size={22} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Text as="h2" size="heading-md" weight="bold">
              Viết thêm Log
            </Text>
            <Text as="p" id={descriptionId} size="body-md" color="secondary">
              Ghi lại những gì bạn đã học hôm nay.
            </Text>
          </div>
          <IconButton
            icon={X}
            variant="ghost"
            size="compact"
            aria-label="Đóng"
            className="-mt-1 -mr-2"
            onClick={requestClose}
          />
        </div>

        <DialogContent className="px-4 py-4 sm:px-6">
          <form
            ref={formRef}
            id={formId}
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
              <FormField label="Tiêu đề buổi học" required error={errors.title}>
                <Input
                  data-autofocus
                  autoComplete="off"
                  placeholder="Ví dụ: React cơ bản..."
                  maxLength={LIMITS.titleMax + 20}
                  {...bindText("title")}
                />
              </FormField>
              <SelectField
                label="Kỹ năng chính"
                required
                error={errors.skillId}
                value={values.skillId}
                onChange={(value) => set("skillId", value as LearningSkillId)}
              >
                <option value="">Chọn kỹ năng</option>
                {SKILL_IDS.map((id) => (
                  <option key={id} value={id}>
                    {SKILL_LABELS[id]}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Thời gian học"
                value={values.duration}
                onChange={(value) => set("duration", value)}
              >
                <option value="">Không ghi</option>
                {DURATION_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} phút
                  </option>
                ))}
              </SelectField>
              <FormField label="Ngày học" error={errors.learningDate}>
                <Input
                  type="date"
                  value={values.learningDate}
                  onChange={(event) => set("learningDate", event.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Mục tiêu" error={errors.goal}>
              <Input
                autoComplete="off"
                placeholder="Bạn muốn hiểu hoặc hoàn thành điều gì?"
                {...bindText("goal")}
              />
            </FormField>

            <FormField label="Nội dung đã học" error={errors.notes}>
              <Textarea
                rows={4}
                placeholder="Tóm tắt kiến thức, ghi chú, ví dụ hoặc điều đã áp dụng..."
                {...bindText("notes")}
              />
            </FormField>

            <FormField
              label="Từ khóa / Tag"
              description={`Tối đa ${LIMITS.tagMax} tag. Nhấn Enter hoặc dấu phẩy để thêm.`}
            >
              <TagInput
                tags={values.tags}
                onTagsChange={(tags) => set("tags", tags)}
                draft={tagDraft}
                onDraftChange={setTagDraft}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-[3fr_2fr]">
              <FormField label="Tài liệu tham khảo" error={errors.referenceUrl}>
                <Input
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://..."
                  {...bindText("referenceUrl")}
                />
              </FormField>
              <SelectField
                label="Trạng thái"
                value={values.status}
                onChange={(value) => set("status", value as LearningLogStatus)}
              >
                {STATUS_IDS.map((id) => (
                  <option key={id} value={id}>
                    {STATUS_LABELS[id]}
                  </option>
                ))}
              </SelectField>
            </div>
          </form>
        </DialogContent>

        {saveError && (
          <div className="px-4 pb-2 sm:px-6">
            <Alert variant="danger">{saveError}</Alert>
          </div>
        )}
        <DialogFooter className="px-4 pt-3 pb-4 sm:px-6 sm:pb-6">
          <Button
            variant="outline"
            leftIcon={RotateCcw}
            disabled={!dirty || isSaving}
            onClick={() => setConfirming("reset")}
          >
            Đặt lại
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="accent"
            isLoading={isSaving}
            className="w-full sm:w-auto"
          >
            Lưu log
          </Button>
        </DialogFooter>
      </Dialog>

      <AlertDialog
        open={confirming === "discard"}
        variant="destructive"
        title="Bỏ các thay đổi?"
        description="Những gì bạn đã nhập sẽ không được lưu."
        confirmLabel="Bỏ thay đổi"
        cancelLabel="Tiếp tục viết"
        onConfirm={() => {
          setConfirming(undefined);
          onClose();
        }}
        onCancel={() => setConfirming(undefined)}
      />
      <AlertDialog
        open={confirming === "reset"}
        variant="destructive"
        title="Xoá hết nội dung đã nhập?"
        description="Biểu mẫu sẽ trở về trạng thái ban đầu."
        confirmLabel="Đặt lại"
        cancelLabel="Giữ nguyên"
        onConfirm={handleReset}
        onCancel={() => setConfirming(undefined)}
      />
    </>
  );
}
