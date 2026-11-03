"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  FormField,
  Input,
  ProgressBar,
  Text,
} from "@/design-system";
import {
  addSection,
  deleteSection,
  deleteStep,
  reorderSections,
  reorderSteps,
  updateSection,
  updateStep,
} from "../studyListsApi";
import type { StudyListDetail, StudySection, StudyStep } from "../types";
import { AddStep } from "./AddStep";

export interface StudyPlanProps {
  list: StudyListDetail;
  /** Every change answers with the whole list; the page keeps that. */
  onChange: (list: StudyListDetail) => void;
}

/** Runs a change, hands the new list up, and keeps the error to show. */
function useChange(onChange: (list: StudyListDetail) => void) {
  const [error, setError] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);
  async function run(request: Promise<StudyListDetail>) {
    setIsBusy(true);
    setError(undefined);
    try {
      onChange(await request);
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không lưu được thay đổi.",
      );
      return false;
    } finally {
      setIsBusy(false);
    }
  }
  return { run, error, isBusy };
}

/** Moves one id a place up or down in a list of ids. */
function moved(ids: string[], id: string, by: -1 | 1) {
  const from = ids.indexOf(id);
  const to = from + by;
  if (from === -1 || to < 0 || to >= ids.length) return ids;
  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function MoveButtons({
  label,
  isFirst,
  isLast,
  disabled,
  onMove,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMove: (by: -1 | 1) => void;
}) {
  return (
    <>
      <Button
        size="compact"
        variant="ghost"
        leftIcon={ArrowUp}
        aria-label={`Chuyển ${label} lên`}
        disabled={disabled || isFirst}
        onClick={() => onMove(-1)}
      />
      <Button
        size="compact"
        variant="ghost"
        leftIcon={ArrowDown}
        aria-label={`Chuyển ${label} xuống`}
        disabled={disabled || isLast}
        onClick={() => onMove(1)}
      />
    </>
  );
}

/** The step's title as a link to the article's own page, where it is read. A draft goes to the editor. */
function ArticleLink({
  article,
}: {
  article: NonNullable<StudyStep["article"]>;
}) {
  const isPublished = article.status === "PUBLISHED";
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <Link
        href={
          isPublished ? `/articles/${article.slug}` : `/write/${article.id}`
        }
        className="font-semibold underline-offset-4 hover:underline"
      >
        {article.title}
      </Link>
      <span className="text-body-sm text-text-secondary">
        {article.readingMinutes} phút đọc
      </span>
      {!isPublished && (
        <Badge size="sm" variant="yellow">
          Bản nháp
        </Badge>
      )}
    </span>
  );
}

function StepRow({
  step,
  isFirst,
  isLast,
  isBusy,
  onToggle,
  onSave,
  onDelete,
  onMove,
}: {
  step: StudyStep;
  isFirst: boolean;
  isLast: boolean;
  isBusy: boolean;
  onToggle: (isDone: boolean) => void;
  onSave: (changes: { title: string; url: string }) => Promise<boolean>;
  onDelete: () => void;
  onMove: (by: -1 | 1) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(step.title);
  const [url, setUrl] = useState(step.url ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (await onSave({ title: title.trim(), url: url.trim() })) {
      setIsEditing(false);
    }
  }

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-sunken p-3"
      >
        <FormField label="Tên bước" required>
          <Input
            value={title}
            maxLength={300}
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
        <FormField label="Link tài liệu (tùy chọn)">
          <Input
            type="url"
            inputMode="url"
            value={url}
            placeholder="https://"
            onChange={(event) => setUrl(event.target.value)}
          />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="compact"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="compact"
            variant="accent"
            disabled={!title.trim() || isBusy}
          >
            Lưu
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {step.article ? (
          <>
            <Checkbox
              checked={step.isDone}
              disabled={isBusy}
              aria-label={`Đã học: ${step.title}`}
              onChange={(event) => onToggle(event.target.checked)}
            />
            <ArticleLink article={step.article} />
          </>
        ) : (
          <Checkbox
            checked={step.isDone}
            disabled={isBusy}
            label={step.title}
            onChange={(event) => onToggle(event.target.checked)}
          />
        )}
        {step.url && (
          <a
            href={step.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mở tài liệu: ${step.title}`}
            className="inline-flex size-8 shrink-0 items-center justify-center"
          >
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        )}
      </div>
      <div className="flex items-center">
        <MoveButtons
          label={`bước “${step.title}”`}
          isFirst={isFirst}
          isLast={isLast}
          disabled={isBusy}
          onMove={onMove}
        />
        {!step.article && (
          <Button
            size="compact"
            variant="ghost"
            leftIcon={Pencil}
            aria-label={`Sửa bước “${step.title}”`}
            onClick={() => setIsEditing(true)}
          />
        )}
        <Button
          size="compact"
          variant="ghost"
          leftIcon={Trash2}
          aria-label={`Xoá bước “${step.title}”`}
          disabled={isBusy}
          onClick={onDelete}
        />
      </div>
    </div>
  );
}

function SectionBlock({
  listId,
  index,
  section,
  isFirst,
  isLast,
  isBusy,
  run,
  onMoveSection,
}: {
  listId: string;
  index: number;
  section: StudySection;
  isFirst: boolean;
  isLast: boolean;
  isBusy: boolean;
  run: (request: Promise<StudyListDetail>) => Promise<boolean>;
  onMoveSection: (by: -1 | 1) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [title, setTitle] = useState(section.title);
  const done = section.steps.filter((step) => step.isDone).length;
  const stepIds = section.steps.map((step) => step.id);

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (await run(updateSection(section.id, { title: title.trim() }))) {
      setIsRenaming(false);
    }
  }

  return (
    <section
      aria-label={`Phần ${index + 1}: ${section.title}`}
      className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        {isRenaming ? (
          <form
            onSubmit={handleRename}
            noValidate
            className="flex flex-1 flex-wrap items-end gap-2"
          >
            <FormField label="Tên phần" className="min-w-48 flex-1">
              <Input
                value={title}
                maxLength={200}
                onChange={(event) => setTitle(event.target.value)}
              />
            </FormField>
            <Button
              type="button"
              size="compact"
              variant="outline"
              onClick={() => setIsRenaming(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="compact"
              variant="accent"
              disabled={!title.trim() || isBusy}
            >
              Lưu
            </Button>
          </form>
        ) : (
          <Text
            as="h4"
            size="heading-sm"
            weight="bold"
            className="font-display"
          >
            Phần {index + 1} · {section.title}
          </Text>
        )}
        {!isRenaming && (
          <div className="flex items-center">
            <MoveButtons
              label={`phần “${section.title}”`}
              isFirst={isFirst}
              isLast={isLast}
              disabled={isBusy}
              onMove={onMoveSection}
            />
            <Button
              size="compact"
              variant="ghost"
              leftIcon={Pencil}
              aria-label={`Đổi tên phần “${section.title}”`}
              onClick={() => setIsRenaming(true)}
            />
            <Button
              size="compact"
              variant="ghost"
              leftIcon={Trash2}
              aria-label={`Xoá phần “${section.title}”`}
              disabled={isBusy}
              onClick={() => run(deleteSection(section.id))}
            />
          </div>
        )}
      </div>

      {section.steps.length > 0 && (
        <ProgressBar
          value={(done / section.steps.length) * 100}
          label={`Phần ${index + 1}: ${done} trên ${section.steps.length} bước`}
        />
      )}

      <ul className="flex flex-col gap-2">
        {section.steps.map((step, stepIndex) => (
          <li key={step.id}>
            <StepRow
              step={step}
              isFirst={stepIndex === 0}
              isLast={stepIndex === section.steps.length - 1}
              isBusy={isBusy}
              onToggle={(isDone) => void run(updateStep(step.id, { isDone }))}
              onSave={({ title: nextTitle, url }) =>
                run(updateStep(step.id, { title: nextTitle, url }))
              }
              onDelete={() => void run(deleteStep(step.id))}
              onMove={(by) =>
                void run(reorderSteps(section.id, moved(stepIds, step.id, by)))
              }
            />
          </li>
        ))}
      </ul>

      <AddStep
        listId={listId}
        sectionId={section.id}
        sectionLabel={`phần ${index + 1}`}
        isBusy={isBusy}
        run={run}
      />
    </section>
  );
}

/**
 * A study list the learner writes: parts in order, and in each
 * part the steps to tick off. It is written and reordered by the learner as
 * they study; its progress follows the ticked steps.
 */
export function StudyPlan({ list, onChange }: StudyPlanProps) {
  const { run, error, isBusy } = useChange(onChange);
  const [title, setTitle] = useState("");
  const sectionIds = list.sections.map((section) => section.id);
  const total = list.stepCount;

  async function handleAddSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (await run(addSection(list.id, { title: title.trim() }))) {
      setTitle("");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {total > 0 && (
        <ProgressBar
          value={list.progress}
          label={`Tiến độ lộ trình: ${list.doneStepCount} trên ${total} bước`}
          showValue
        />
      )}
      {error && <Alert variant="danger">{error}</Alert>}

      {list.sections.length === 0 ? (
        <EmptyState
          title="Chưa có lộ trình học"
          description="Tạo các phần theo thứ tự bạn muốn học, rồi thêm từng bước vào mỗi phần."
        />
      ) : (
        <ol className="flex flex-col gap-4">
          {list.sections.map((section, index) => (
            <li key={section.id}>
              <SectionBlock
                listId={list.id}
                index={index}
                section={section}
                isFirst={index === 0}
                isLast={index === list.sections.length - 1}
                isBusy={isBusy}
                run={run}
                onMoveSection={(by) =>
                  void run(
                    reorderSections(list.id, moved(sectionIds, section.id, by)),
                  )
                }
              />
            </li>
          ))}
        </ol>
      )}

      <form
        onSubmit={handleAddSection}
        noValidate
        className="flex flex-wrap items-end gap-2"
      >
        <FormField label="Thêm phần mới" className="min-w-48 flex-1">
          <Input
            value={title}
            maxLength={200}
            placeholder="VD: Hoàn thành Fundamentals"
            onChange={(event) => setTitle(event.target.value)}
          />
        </FormField>
        <Button
          type="submit"
          variant="accent"
          leftIcon={Plus}
          disabled={!title.trim() || isBusy}
        >
          Thêm phần
        </Button>
      </form>
    </div>
  );
}
