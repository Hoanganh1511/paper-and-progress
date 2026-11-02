"use client";

import { useState, type ReactNode } from "react";
import { Flame, Pencil, Plus, Trash2, Volume2 } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  ProgressBar,
  Skeleton,
  Text,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import {
  createPhrase,
  deletePhrase,
  getPhraseSummary,
  listPhrases,
  updatePhrase,
} from "../dailyGateApi";
import {
  PHRASE_STAGE_LABELS,
  PHRASE_STEPS_DONE,
  formatShortDate,
  sortPhrases,
} from "../display";
import { canSpeak, speakEnglish } from "../speech";
import type { Phrase, PhraseSummary } from "../types";
import { PhraseForm, type PhraseFormValues } from "./PhraseForm";
import { PhrasePractice } from "./PhrasePractice";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra. Thử lại sau.";

const STEPS = 4;

const PRACTICE_LABELS: Record<Phrase["stage"], string> = {
  WRITE: "Đặt câu",
  RECALL: "Nhớ lại",
  SPEAK: "Luyện nói",
  MASTERED: "Ôn lại",
};

/**
 * The notebook: the user's own phrases, which ones to review today, which still
 * wait for a first sentence, and the notebook's own streak.
 */
export function PhraseNotebook() {
  const [version, setVersion] = useState(0);
  const summary = useAdminQuery(getPhraseSummary, `phrase-summary-${version}`);
  const all = useAdminQuery(() => listPhrases(), `phrases-${version}`);
  const due = useAdminQuery(
    () => listPhrases({ isDue: true }),
    `phrases-due-${version}`,
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [deleting, setDeleting] = useState<Phrase>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [practicing, setPracticing] = useState<Phrase>();

  const refresh = () => setVersion((current) => current + 1);

  async function handleAdd(values: PhraseFormValues) {
    try {
      await createPhrase({
        phrase: values.phrase,
        meaning: values.meaning,
        sampleSentence: values.sampleSentence || undefined,
      });
      setIsAdding(false);
      refresh();
      return undefined;
    } catch (error) {
      return messageOf(error);
    }
  }

  async function handleEdit(phrase: Phrase, values: PhraseFormValues) {
    try {
      await updatePhrase(phrase.id, values);
      setEditingId(undefined);
      refresh();
      return undefined;
    } catch (error) {
      return messageOf(error);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deletePhrase(deleting.id);
      setDeleting(undefined);
      setDeleteError(undefined);
      refresh();
    } catch (error) {
      setDeleteError(messageOf(error));
    } finally {
      setIsDeleting(false);
    }
  }

  if (all.error && !all.data) {
    return (
      <Alert variant="danger" title="Không tải được Sổ cụm từ">
        <div className="flex flex-wrap items-center gap-3">
          <span>{all.error.message}</span>
          <Button
            size="compact"
            variant="outline"
            onClick={() => {
              all.reload();
              due.reload();
              summary.reload();
            }}
          >
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  }
  if (!all.data) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (practicing) {
    return (
      <PhrasePractice
        phrase={practicing}
        onChanged={refresh}
        onBack={() => setPracticing(undefined)}
      />
    );
  }

  const phrases = sortPhrases(all.data);
  const dueIds = new Set((due.data ?? []).map((phrase) => phrase.id));
  const dueToday = phrases.filter((phrase) => dueIds.has(phrase.id));
  const unwritten = phrases.filter((phrase) => phrase.stage === "WRITE");
  const rest = phrases.filter(
    (phrase) => !dueIds.has(phrase.id) && phrase.stage !== "WRITE",
  );

  const renderItem = (phrase: Phrase) =>
    editingId === phrase.id ? (
      <li key={phrase.id}>
        <PhraseForm
          initial={{
            phrase: phrase.phrase,
            meaning: phrase.meaning,
            sampleSentence: phrase.sampleSentence ?? "",
          }}
          submitLabel="Lưu thay đổi"
          onSubmit={(values) => handleEdit(phrase, values)}
          onCancel={() => setEditingId(undefined)}
        />
      </li>
    ) : (
      <PhraseItem
        key={phrase.id}
        phrase={phrase}
        onPractice={() => setPracticing(phrase)}
        onEdit={() => setEditingId(phrase.id)}
        onDelete={() => {
          setDeleteError(undefined);
          setDeleting(phrase);
        }}
      />
    );

  return (
    <div className="flex flex-col gap-6">
      <Summary summary={summary.data} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Text as="h3" size="heading-md" weight="bold" className="font-display">
          Sổ cụm từ của bạn
        </Text>
        {!isAdding && (
          <Button
            variant="accent"
            leftIcon={Plus}
            onClick={() => setIsAdding(true)}
          >
            Thêm cụm từ
          </Button>
        )}
      </div>

      {isAdding && (
        <PhraseForm
          submitLabel="Thêm vào sổ"
          onSubmit={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {phrases.length === 0 && !isAdding && (
        <EmptyState
          title="Sổ cụm từ còn trống"
          description="Bấm “Lưu vào sổ” ở bước Học, hoặc tự thêm một cụm từ bạn muốn dùng."
        />
      )}

      <Group title="Hôm nay ôn" count={dueToday.length}>
        {dueToday.map(renderItem)}
      </Group>
      <Group title="Chưa đặt câu" count={unwritten.length}>
        {unwritten.map(renderItem)}
      </Group>
      <Group title="Các cụm khác" count={rest.length}>
        {rest.map(renderItem)}
      </Group>

      <AlertDialog
        open={deleting !== undefined}
        variant="destructive"
        title="Xoá cụm từ này?"
        description={
          deleting
            ? `“${deleting.phrase}” cùng các câu bạn đã viết sẽ bị xoá vĩnh viễn.`
            : undefined
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(undefined)}
      >
        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      </AlertDialog>
    </div>
  );
}

function Summary({ summary }: { summary: PhraseSummary | undefined }) {
  if (!summary) return <Skeleton className="h-20 w-full" />;
  const figures = [
    { label: "Tổng số cụm", value: summary.total },
    { label: "Đã thuộc", value: summary.mastered },
    { label: "Đến hạn ôn", value: summary.due },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {figures.map((figure) => (
        <Card key={figure.label} padding="compact" className="gap-1">
          <Text size="body-sm" color="secondary">
            {figure.label}
          </Text>
          <Text as="p" className="font-display text-heading-lg font-bold">
            {figure.value}
          </Text>
        </Card>
      ))}
      <Card padding="compact" className="gap-1">
        <Text size="body-sm" color="secondary">
          Chuỗi ngày ôn cụm từ
        </Text>
        <Text
          as="p"
          className="flex items-center gap-1.5 font-display text-heading-lg font-bold"
        >
          <Flame aria-hidden="true" size={22} />
          {summary.streak}
        </Text>
      </Card>
    </div>
  );
}

function Group({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <Text as="h4" size="body-lg" weight="semibold">
        {title} ({count})
      </Text>
      <ul className="flex flex-col gap-3">{children}</ul>
    </section>
  );
}

function PhraseItem({
  phrase,
  onPractice,
  onEdit,
  onDelete,
}: {
  phrase: Phrase;
  onPractice: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const done = PHRASE_STEPS_DONE[phrase.stage];
  return (
    <li className="flex flex-col gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <Text
            as="span"
            size="body-lg"
            weight="bold"
            lang="en"
            className="font-display break-words"
          >
            {phrase.phrase}
          </Text>
          <Text size="body-md" color="secondary" className="break-words">
            {phrase.meaning}
          </Text>
          {phrase.sampleSentence && (
            <Text
              size="body-sm"
              color="muted"
              lang="en"
              className="break-words italic"
            >
              “{phrase.sampleSentence}”
            </Text>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {canSpeak() && (
            <IconButton
              icon={Volume2}
              variant="ghost"
              size="compact"
              aria-label={`Nghe phát âm: ${phrase.phrase}`}
              onClick={() => speakEnglish(phrase.phrase)}
            />
          )}
          <IconButton
            icon={Pencil}
            variant="ghost"
            size="compact"
            aria-label={`Sửa cụm từ: ${phrase.phrase}`}
            onClick={onEdit}
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="compact"
            aria-label={`Xoá cụm từ: ${phrase.phrase}`}
            onClick={onDelete}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          size="sm"
          variant={phrase.stage === "MASTERED" ? "lime" : "default"}
        >
          {PHRASE_STAGE_LABELS[phrase.stage]}
        </Badge>
        {phrase.stage !== "WRITE" && (
          <Text size="body-sm" color="secondary">
            Ôn lại: {formatShortDate(phrase.nextReviewAt)}
          </Text>
        )}
        <Button
          size="compact"
          variant={phrase.stage === "MASTERED" ? "outline" : "accent"}
          className="ml-auto"
          onClick={onPractice}
          aria-label={`${PRACTICE_LABELS[phrase.stage]}: ${phrase.phrase}`}
        >
          {PRACTICE_LABELS[phrase.stage]}
        </Button>
      </div>
      <ProgressBar
        value={(done / STEPS) * 100}
        label={`Tiến độ 4 bước của “${phrase.phrase}”: ${done} trên ${STEPS} bước`}
      />
    </li>
  );
}
