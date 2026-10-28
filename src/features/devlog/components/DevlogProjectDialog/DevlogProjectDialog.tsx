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
  Textarea,
} from "@/design-system";
import { toCustomProjectId } from "../../status";
import type { DevlogProject } from "../../types";

const MAX_NAME_LENGTH = 40;

export interface DevlogProjectDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called with the new project once the form is valid. */
  onCreate: (project: DevlogProject) => void;
  /** Names already taken (compared ignoring case). */
  existingLabels: string[];
}

/** The "Dự án mới" form: a name (required, unique) and an optional description. */
export function DevlogProjectDialog({
  open,
  onClose,
  onCreate,
  existingLabels,
}: DevlogProjectDialogProps) {
  const formId = useId();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string>();

  function reset() {
    setName("");
    setDescription("");
    setError(undefined);
  }

  function close() {
    reset();
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = name.trim();
    if (!label) return setError("Nhập tên dự án.");
    if (label.length > MAX_NAME_LENGTH) {
      return setError(`Tên dự án tối đa ${MAX_NAME_LENGTH} ký tự.`);
    }
    if (
      existingLabels.some(
        (taken) => taken.toLowerCase() === label.toLowerCase(),
      )
    ) {
      return setError("Đã có dự án trùng tên.");
    }
    onCreate({
      id: toCustomProjectId(label),
      label,
      description: description.trim() || undefined,
    });
    reset();
  }

  return (
    <Dialog open={open} onClose={close} size="sm">
      <DialogHeader
        title="Dự án mới"
        description="Dự án mới bắt đầu trống, được lưu trong trình duyệt này."
        closeLabel="Đóng"
      />
      <DialogContent>
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField label="Tên dự án" required error={error}>
            <Input
              value={name}
              maxLength={MAX_NAME_LENGTH + 10}
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                setError(undefined);
              }}
            />
          </FormField>
          <FormField label="Mô tả">
            <Textarea
              value={description}
              rows={3}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
        </form>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={close}>
          Huỷ
        </Button>
        <Button type="submit" form={formId}>
          Tạo dự án
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
