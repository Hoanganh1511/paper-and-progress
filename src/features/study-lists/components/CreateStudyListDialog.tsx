"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  FormField,
  Input,
  Textarea,
} from "@/design-system";
import { createStudyList } from "../studyListsApi";

export interface CreateStudyListDialogProps {
  open: boolean;
  onClose: () => void;
}

/** The form that opens from "Tạo danh sách"; once saved, the new list opens so its parts can be written. */
export function CreateStudyListDialog({
  open,
  onClose,
}: CreateStudyListDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);

  function close() {
    if (isSaving) return;
    setTitle("");
    setDescription("");
    setTitleError(undefined);
    setError(undefined);
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError("Nhập tên danh sách.");
      return;
    }
    setTitleError(undefined);
    setError(undefined);
    setIsSaving(true);
    try {
      const created = await createStudyList({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      router.push(`/study-lists/${created.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không tạo được danh sách.",
      );
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} isDismissible={!isSaving}>
      <DialogHeader
        title="Tạo danh sách học"
        description="Đặt tên cho danh sách. Sau đó bạn thêm các phần và bước theo thứ tự muốn học."
        closeLabel="Đóng"
      />
      <form onSubmit={handleSubmit} noValidate>
        <DialogContent className="flex flex-col gap-4">
          <FormField label="Tên danh sách" required error={titleError}>
            <Input
              data-autofocus
              value={title}
              maxLength={200}
              placeholder="VD: Ôn thi AWS Solutions Architect"
              onChange={(event) => setTitle(event.target.value)}
            />
          </FormField>
          <FormField label="Mô tả (tùy chọn)">
            <Textarea
              rows={3}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          {error && <Alert variant="danger">{error}</Alert>}
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Hủy
          </Button>
          <Button type="submit" variant="accent" isLoading={isSaving}>
            Tạo danh sách
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
