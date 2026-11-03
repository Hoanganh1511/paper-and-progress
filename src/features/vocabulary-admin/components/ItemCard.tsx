"use client";

import { useId } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  Copy,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  Badge,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  Textarea,
  cn,
} from "@/design-system";
import {
  missingFields,
  type CategoryConfig,
  type FieldConfig,
} from "../categories";
import type { CategoryItem } from "../types";

/** The Select's value for "nothing chosen". */
const NONE = "none";

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField
      label={field.label}
      required={field.required}
      className={cn(field.isWide && "sm:col-span-2")}
    >
      {field.kind === "select" ? (
        <Select
          value={value || NONE}
          onValueChange={(next) => onChange(next === NONE ? "" : next)}
        >
          <SelectTrigger placeholder="Chưa chọn" />
          <SelectContent>
            <SelectItem value={NONE}>Chưa chọn</SelectItem>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.kind === "textarea" ? (
        <Textarea
          rows={2}
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          value={value}
          placeholder={field.placeholder}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}

export interface ItemCardProps {
  category: CategoryConfig;
  item: CategoryItem;
  /** 0-based place in the list. */
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (item: CategoryItem) => void;
  onMove: (by: -1 | 1) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

/**
 * One item of a category as a compact card: a header that shows its title and
 * what is still missing, and the actions (move, duplicate, delete); the fields
 * open and close under it.
 */
export function ItemCard({
  category,
  item,
  index,
  total,
  isExpanded,
  onToggle,
  onChange,
  onMove,
  onDuplicate,
  onDelete,
}: ItemCardProps) {
  const bodyId = useId();
  const title = category.titleOf(item)?.trim();
  const subtitle = category.subtitleOf?.(item)?.trim();
  const missing = missingFields(category, item);
  const name = title || `${category.itemName} chưa đặt tên`;

  return (
    <li
      className={cn(
        "rounded-standard border-2 border-border-strong bg-surface-card shadow-raised",
      )}
    >
      <div className="flex items-stretch gap-1 p-1">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={bodyId}
          onClick={onToggle}
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-sharp px-3 py-2 text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-border-focus"
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-pill border-2 border-border-strong bg-surface-sunken text-body-sm font-semibold"
          >
            {index + 1}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span
              className={cn(
                "truncate font-semibold",
                !title && "text-text-muted italic",
              )}
            >
              {name}
            </span>
            {subtitle && !isExpanded && (
              <span className="truncate text-body-sm text-text-secondary">
                {subtitle}
              </span>
            )}
          </span>
          {missing.length > 0 && (
            <Badge variant="yellow" size="sm" icon={TriangleAlert}>
              Thiếu {missing.join(", ")}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp aria-hidden="true" size={18} className="shrink-0" />
          ) : (
            <ChevronDown aria-hidden="true" size={18} className="shrink-0" />
          )}
        </button>
        <div className="flex shrink-0 items-center">
          <Button
            size="compact"
            variant="ghost"
            leftIcon={ArrowUp}
            aria-label={`Chuyển ${name} lên`}
            disabled={index === 0}
            onClick={() => onMove(-1)}
          />
          <Button
            size="compact"
            variant="ghost"
            leftIcon={ArrowDown}
            aria-label={`Chuyển ${name} xuống`}
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          />
          <Button
            size="compact"
            variant="ghost"
            leftIcon={Copy}
            aria-label={`Nhân đôi ${name}`}
            onClick={onDuplicate}
          />
          <Button
            size="compact"
            variant="ghost"
            leftIcon={Trash2}
            aria-label={`Xoá ${name}`}
            onClick={onDelete}
          />
        </div>
      </div>

      <div
        id={bodyId}
        hidden={!isExpanded}
        className="grid gap-4 border-t-2 border-border-subtle p-4 sm:grid-cols-2"
      >
        {category.fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={item[field.key] ?? ""}
            onChange={(value) => onChange({ ...item, [field.key]: value })}
          />
        ))}
        <Text size="body-sm" color="muted" className="sm:col-span-2">
          Các trường có dấu * cần điền để mục được tính là hoàn thành.
        </Text>
      </div>
    </li>
  );
}
