"use client";

import { useId, useState, type FormEvent } from "react";
import {
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
import { CATEGORY_ICON_NAMES } from "../display";
import { createCategory, updateCategory } from "../projectDashboardApi";
import type { Category } from "../types";
import { CategoryIcon } from "./CategoryIcon";

export interface CategoryFormDialogProps {
  /** The category to edit; leave out to create one. */
  category?: Category;
  onClose: () => void;
}

/** Create or edit a category: name, description and icon. Mount it only while open. */
export function CategoryFormDialog({
  category,
  onClose,
}: CategoryFormDialogProps) {
  const { refresh } = useDashboard();
  const formId = useId();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [nameError, setNameError] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(category);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError("Nhập tên danh mục.");
      return;
    }
    setNameError(undefined);
    setSaveError(undefined);
    setIsSaving(true);
    const body = {
      name: name.trim(),
      description: description.trim(),
      ...(icon && { icon }),
    };
    try {
      if (category) await updateCategory(category.id, body);
      else await createCategory(body);
      refresh();
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Có lỗi xảy ra.");
      setIsSaving(false);
    }
  }

  const title = isEditing ? "Sửa danh mục" : "Thêm danh mục";

  return (
    <Dialog open onClose={onClose} aria-label={title}>
      <div className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
        <Text as="h2" size="heading-md" weight="semibold">
          {title}
        </Text>
      </div>
      <DialogContent className="px-4 py-4 sm:px-6">
        <form
          id={formId}
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField label="Tên danh mục" required error={nameError}>
            <Input
              data-autofocus
              autoComplete="off"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label="Mô tả">
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </FormField>
          <FormField label="Icon">
            <Select value={icon || undefined} onValueChange={setIcon}>
              <SelectTrigger placeholder="Chọn icon" />
              <SelectContent>
                {CATEGORY_ICON_NAMES.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    <span className="flex items-center gap-2">
                      <CategoryIcon name={iconName} size={16} />
                      {iconName}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {saveError && <Alert variant="danger">{saveError}</Alert>}
        </form>
      </DialogContent>
      <DialogFooter className="px-4 pt-3 pb-4 sm:px-6 sm:pb-6">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Huỷ
        </Button>
        <Button type="submit" form={formId} isLoading={isSaving}>
          {isEditing ? "Lưu" : "Thêm danh mục"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
