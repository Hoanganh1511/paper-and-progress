"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Button,
  Skeleton,
  Text,
  useToast,
} from "@/design-system";
import { CATEGORY_BY_KEY } from "../categories";
import {
  emptyForm,
  fromDetail,
  isDirty,
  toPayload,
  type WordForm,
} from "../form";
import type { VocabMeta, WordBasics } from "../types";
import { validateBasics, type BasicsErrors } from "../validate";
import {
  createVocabularyWord,
  deleteVocabularyWord,
  getVocabularyMeta,
  getVocabularyWord,
  updateVocabularyWord,
} from "../vocabularyApi";
import { BasicInfoForm } from "./BasicInfoForm";
import { CategoryEditor } from "./CategoryEditor";
import { CategoryNav, type SectionKey } from "./CategoryNav";
import { OverviewPanel } from "./OverviewPanel";

export const VOCABULARY_HREF = "/admin/vocabulary";

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra. Thử lại sau.";

/**
 * Write or edit a word: its own fields, then ten learning categories, each its
 * own list. The sections are a vertical list on the left, the overview and the
 * state of each section on the right, and one save bar that stays at the bottom.
 */
export function VocabularyEditor({ id }: { id?: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [meta, setMeta] = useState<VocabMeta>();
  const [form, setForm] = useState<WordForm>(emptyForm);
  // What was loaded or last saved, to tell whether there is anything to save.
  const [saved, setSaved] = useState<WordForm>(emptyForm);
  const [loadError, setLoadError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(id !== undefined);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<SectionKey>("basic");
  const [errors, setErrors] = useState<BasicsErrors>({});
  const [serverError, setServerError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      getVocabularyMeta(),
      id === undefined ? Promise.resolve(undefined) : getVocabularyWord(id),
    ])
      .then(([loadedMeta, detail]) => {
        if (!isCurrent) return;
        setMeta(loadedMeta);
        if (detail) {
          const loaded = fromDetail(detail);
          setForm(loaded);
          setSaved(loaded);
        }
        setIsLoading(false);
      })
      .catch((caught: unknown) => {
        if (!isCurrent) return;
        setLoadError(
          caught instanceof Error ? caught : new Error(String(caught)),
        );
        setIsLoading(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [id, attempt]);

  const dirty = isDirty(form, saved);
  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const isBasicsDone = Object.keys(validateBasics(form.basics)).length === 0;

  const patchBasics = (changes: Partial<WordBasics>) => {
    setForm((current) => ({
      ...current,
      basics: { ...current.basics, ...changes },
    }));
    // A fixed field stops complaining once it is touched.
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(changes)) {
        delete next[key as keyof WordBasics];
      }
      return next;
    });
  };

  async function save() {
    const found = validateBasics(form.basics);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // The missing fields are in the first section, so show it.
      setActive("basic");
      setServerError(undefined);
      return;
    }
    setIsSaving(true);
    setServerError(undefined);
    try {
      const payload = toPayload(form);
      if (id === undefined) {
        const created = await createVocabularyWord(payload);
        toast({ title: "Đã thêm từ", variant: "success" });
        setSaved(form);
        router.replace(`${VOCABULARY_HREF}/${created.id}`);
      } else {
        const updated = await updateVocabularyWord(id, payload);
        const loaded = fromDetail(updated);
        setForm(loaded);
        setSaved(loaded);
        toast({ title: "Đã lưu từ", variant: "success" });
      }
    } catch (caught) {
      setServerError(messageOf(caught));
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (id === undefined) return;
    setIsDeleting(true);
    try {
      await deleteVocabularyWord(id);
      toast({ title: "Đã xoá từ", variant: "success" });
      setSaved(form);
      router.push(VOCABULARY_HREF);
    } catch (caught) {
      setServerError(messageOf(caught));
      setIsDeleteOpen(false);
      setIsDeleting(false);
    }
  }

  if (loadError) {
    return (
      <Alert variant="danger" title="Không tải được từ vựng">
        <div className="flex flex-wrap items-center gap-3">
          <span>{loadError.message}</span>
          <Button
            size="compact"
            variant="outline"
            onClick={() => {
              setLoadError(undefined);
              setIsLoading(true);
              setAttempt((count) => count + 1);
            }}
          >
            Thử lại
          </Button>
          <Button
            size="compact"
            variant="ghost"
            onClick={() => router.push(VOCABULARY_HREF)}
          >
            Về danh sách
          </Button>
        </div>
      </Alert>
    );
  }
  if (isLoading || !meta) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const category = active === "basic" ? undefined : CATEGORY_BY_KEY[active];
  const title = form.basics.word.trim();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            href={VOCABULARY_HREF}
            className="inline-flex min-h-11 items-center gap-1.5 text-body-sm font-semibold underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Danh sách từ vựng
          </Link>
          <Text
            as="h1"
            ref={headingRef}
            size="heading-lg"
            weight="bold"
            className="font-display break-words"
          >
            {id === undefined ? "Thêm từ mới" : title || "Chỉnh sửa từ"}
          </Text>
        </div>
        {id !== undefined && (
          <Button
            variant="outline"
            leftIcon={Trash2}
            onClick={() => setIsDeleteOpen(true)}
          >
            Xoá từ
          </Button>
        )}
      </header>

      {serverError && <Alert variant="danger">{serverError}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_17rem]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <CategoryNav
            form={form}
            active={active}
            isBasicsDone={isBasicsDone}
            onSelect={setActive}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="rounded-standard border-2 border-border-strong bg-surface-card p-4 shadow-raised sm:p-6">
            {category ? (
              <CategoryEditor
                key={category.key}
                category={category}
                items={form.content[category.key]}
                onChange={(items) =>
                  setForm((current) => ({
                    ...current,
                    content: { ...current.content, [category.key]: items },
                  }))
                }
              />
            ) : (
              <BasicInfoForm
                value={form.basics}
                errors={errors}
                units={meta.units}
                onChange={patchBasics}
              />
            )}
          </div>
        </div>

        <div className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
          <OverviewPanel
            form={form}
            units={meta.units}
            isBasicsDone={isBasicsDone}
            active={active}
            onSelect={setActive}
          />
        </div>
      </div>

      {/* Stays at the bottom of the screen, so saving is always one tap away. */}
      <div
        role="region"
        aria-label="Lưu"
        className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-standard border-2 border-border-strong bg-surface-card px-4 py-3 shadow-floating"
      >
        <Text size="body-sm" color="secondary" role="status">
          {Object.keys(errors).length > 0
            ? "Còn trường bắt buộc chưa điền trong “Thông tin từ”."
            : dirty
              ? "Có thay đổi chưa lưu."
              : "Mọi thay đổi đã được lưu."}
        </Text>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(VOCABULARY_HREF)}
          >
            {dirty ? "Hủy" : "Đóng"}
          </Button>
          <Button
            variant="accent"
            leftIcon={Save}
            isLoading={isSaving}
            onClick={save}
          >
            {id === undefined ? "Thêm từ" : "Lưu thay đổi"}
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isDeleteOpen}
        variant="destructive"
        title="Xoá từ này?"
        description={`“${title}” và mọi nội dung học của nó sẽ bị xoá, kể cả những gì học viên đã viết và đánh dấu cho từ này. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Hủy"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
