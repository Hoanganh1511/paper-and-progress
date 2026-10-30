"use client";

import { useId, useState, type FormEvent } from "react";
import {
  DatePicker,
  datePickerLabelsVi,
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  Textarea,
} from "@/design-system";
import { useDashboard } from "../DashboardContext";
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER } from "../display";
import { createCriterion } from "../projectDashboardApi";
import type {
  Category,
  CriteriaPriority,
  CriteriaStatus,
  NewCriterion,
} from "../types";

const URL_PATTERN = /^https?:\/\/\S+$/i;

interface Values {
  title: string;
  categoryId: string;
  priority: CriteriaPriority;
  status: CriteriaStatus;
  deadline: string;
  description: string;
  notes: string;
  evidenceUrl: string;
}

type Errors = Partial<Record<"title" | "categoryId" | "evidenceUrl", string>>;

export interface CriteriaFormDialogProps {
  categories: Category[];
  /** Pre-selects the category when the dialog is opened from one. */
  categoryId?: string;
  onClose: () => void;
}

/** "+ Thêm tiêu chí": mount it only while it is open, so each opening starts empty. */
export function CriteriaFormDialog({
  categories,
  categoryId,
  onClose,
}: CriteriaFormDialogProps) {
  const { refresh, openCriterion } = useDashboard();
  const formId = useId();
  const [values, setValues] = useState<Values>({
    title: "",
    categoryId: categoryId ?? "",
    priority: "MEDIUM",
    status: "NOT_STARTED",
    deadline: "",
    description: "",
    notes: "",
    evidenceUrl: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!values.title.trim()) next.title = "Nhập tiêu đề.";
    if (!values.categoryId) next.categoryId = "Chọn danh mục.";
    const url = values.evidenceUrl.trim();
    if (url && !URL_PATTERN.test(url)) {
      next.evidenceUrl = "Nhập đường dẫn bắt đầu bằng http:// hoặc https://.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const body: NewCriterion = {
      categoryId: values.categoryId,
      title: values.title.trim(),
      priority: values.priority,
      status: values.status,
      ...(values.deadline && {
        deadline: new Date(`${values.deadline}T00:00:00`).toISOString(),
      }),
      ...(values.description.trim() && {
        description: values.description.trim(),
      }),
      ...(values.notes.trim() && { notes: values.notes.trim() }),
      ...(url && { evidenceUrl: url }),
    };
    setIsSaving(true);
    setSaveError(undefined);
    try {
      const created = await createCriterion(body);
      refresh();
      onClose();
      // Show the new criterion in the right column.
      openCriterion(created.id);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Có lỗi xảy ra.");
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} size="lg" aria-label="Thêm tiêu chí">
      <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <Text as="h2" size="heading-md" weight="semibold">
          Thêm tiêu chí
        </Text>
      </div>
      <DialogContent className="px-4 py-4 sm:px-6">
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField label="Tiêu đề" required error={errors.title}>
            <Input
              data-autofocus
              autoComplete="off"
              maxLength={200}
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Danh mục" required error={errors.categoryId}>
              <Select
                value={values.categoryId || undefined}
                onValueChange={(value) => set("categoryId", value)}
              >
                <SelectTrigger placeholder="Chọn danh mục" />
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select
                value={values.priority}
                onValueChange={(value) =>
                  set("priority", value as CriteriaPriority)
                }
              >
                <SelectTrigger />
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as CriteriaPriority[]).map(
                    (priority) => (
                      <SelectItem key={priority} value={priority}>
                        {PRIORITY_LABELS[priority]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select
                value={values.status}
                onValueChange={(value) =>
                  set("status", value as CriteriaStatus)
                }
              >
                <SelectTrigger />
                <SelectContent>
                  {STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Deadline">
            <DatePicker
              value={values.deadline}
              onValueChange={(next) => set("deadline", next)}
              labels={datePickerLabelsVi}
            />
          </FormField>
          <FormField label="Mô tả">
            <Textarea
              rows={3}
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </FormField>
          <FormField label="Notes">
            <Textarea
              rows={3}
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </FormField>
          <FormField label="Evidence URL" error={errors.evidenceUrl}>
            <Input
              type="url"
              placeholder="https://github.com/..."
              value={values.evidenceUrl}
              onChange={(event) => set("evidenceUrl", event.target.value)}
            />
          </FormField>
          {saveError && <Alert variant="danger">{saveError}</Alert>}
        </form>
      </DialogContent>
      <DialogFooter className="px-4 pt-3 pb-4 sm:px-6 sm:pb-6">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Huỷ
        </Button>
        <Button type="submit" form={formId} isLoading={isSaving}>
          Thêm tiêu chí
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
