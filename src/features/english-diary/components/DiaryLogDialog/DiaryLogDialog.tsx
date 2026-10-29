"use client";

import { useId, useState, type FormEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Textarea,
} from "@/design-system";
import {
  SKILLS,
  SKILL_LABELS,
  STATUS_LABELS,
  splitLines,
  splitTags,
} from "../../logs";
import type { DiaryLogDraft, DiarySkill, DiaryStatus } from "../../types";

const MAX_DURATION = 1440;

export interface DiaryLogDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial: DiaryLogDraft;
  onSubmit: (draft: DiaryLogDraft) => void;
}

/** Create / edit form. Remount it (via `key`) to load different initial values. */
export function DiaryLogDialog({
  open,
  onClose,
  mode,
  initial,
  onSubmit,
}: DiaryLogDialogProps) {
  const formId = useId();
  const [title, setTitle] = useState(initial.title);
  const [skill, setSkill] = useState<DiarySkill>(initial.skill);
  const [date, setDate] = useState(initial.date);
  const [duration, setDuration] = useState(
    initial.durationMinutes ? String(initial.durationMinutes) : "",
  );
  const [goal, setGoal] = useState(initial.goal);
  const [content, setContent] = useState(initial.content);
  const [vocabulary, setVocabulary] = useState(initial.vocabulary.join("\n"));
  const [resources, setResources] = useState(initial.resources.join("\n"));
  const [tags, setTags] = useState(initial.tags.join(", "));
  const [notes, setNotes] = useState(initial.notes);
  const [status, setStatus] = useState<DiaryStatus>(initial.status);
  const [errors, setErrors] = useState<{
    title?: string;
    date?: string;
    duration?: string;
  }>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const minutes = duration.trim() ? Number(duration) : undefined;
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Nhập tiêu đề buổi học.";
    if (!date) next.date = "Chọn ngày học.";
    if (
      minutes !== undefined &&
      (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_DURATION)
    ) {
      next.duration = `Thời lượng là số phút từ 1 đến ${MAX_DURATION}.`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onSubmit({
      title: title.trim(),
      skill,
      date,
      durationMinutes: minutes,
      goal: goal.trim(),
      content: content.trim(),
      vocabulary: splitLines(vocabulary),
      resources: splitLines(resources),
      tags: splitTags(tags),
      notes: notes.trim(),
      status,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader
        title={mode === "create" ? "Tạo log mới" : "Chỉnh sửa log"}
        description="Chỉ cần tiêu đề, kỹ năng và ngày học; phần còn lại có thể bổ sung sau."
        closeLabel="Đóng"
      />
      <DialogContent>
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField label="Tiêu đề buổi học" required error={errors.title}>
            <Input
              value={title}
              autoComplete="off"
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Kỹ năng chính" required>
              <Select
                value={skill}
                onValueChange={(value) => setSkill(value as DiarySkill)}
              >
                <SelectTrigger />
                <SelectContent>
                  {SKILLS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {SKILL_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Trạng thái" required>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as DiaryStatus)}
              >
                <SelectTrigger />
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as DiaryStatus[]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {STATUS_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Ngày học" required error={errors.date}>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </FormField>
            <FormField label="Thời lượng (phút)" error={errors.duration}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_DURATION}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Mục tiêu">
            <Input
              value={goal}
              autoComplete="off"
              onChange={(event) => setGoal(event.target.value)}
            />
          </FormField>
          <FormField label="Nội dung đã học">
            <Textarea
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </FormField>
          <FormField label="Từ vựng" description="Mỗi từ hoặc cụm từ một dòng.">
            <Textarea
              rows={3}
              value={vocabulary}
              onChange={(event) => setVocabulary(event.target.value)}
            />
          </FormField>
          <FormField
            label="Tài liệu tham khảo / URL"
            description="Mỗi mục một dòng."
          >
            <Textarea
              rows={2}
              value={resources}
              onChange={(event) => setResources(event.target.value)}
            />
          </FormField>
          <FormField label="Tag" description="Cách nhau bằng dấu phẩy.">
            <Input
              value={tags}
              autoComplete="off"
              onChange={(event) => setTags(event.target.value)}
            />
          </FormField>
          <FormField label="Ghi chú">
            <Textarea
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </FormField>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Huỷ
        </Button>
        <Button type="submit" form={formId} variant="accent">
          Lưu log
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
