"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  Alert,
  AlertDialog,
  Badge,
  Button,
  FormField,
  Input,
  Skeleton,
  Text,
  Textarea,
  useToast,
} from "@/design-system";
import {
  deleteStudyList,
  getStudyList,
  updateStudyList,
} from "../studyListsApi";
import type { StudyListDetail } from "../types";
import { StudyPlan } from "./StudyPlan";

/** The tab the lists live in, so "back" and "after delete" land there. */
export const STUDY_LISTS_HREF = "/learn?tab=lists";

/** One study list: its name, the certificates that use it, and the plan the learner writes. */
export function StudyListScreen({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [list, setList] = useState<StudyListDetail>();
  const [error, setError] = useState<Error>();
  const [attempt, setAttempt] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  useEffect(() => {
    let isCurrent = true;
    getStudyList(id)
      .then((result) => {
        if (isCurrent) {
          setList(result);
          setError(undefined);
        }
      })
      .catch((caught: unknown) => {
        if (isCurrent) {
          setError(
            caught instanceof Error ? caught : new Error(String(caught)),
          );
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [id, attempt]);

  if (error && !list) {
    return (
      <Alert variant="danger" title="Không tải được danh sách học">
        <div className="flex flex-wrap items-center gap-3">
          <span>{error.message}</span>
          <Button
            size="compact"
            variant="outline"
            onClick={() => setAttempt((count) => count + 1)}
          >
            Thử lại
          </Button>
          <Button
            size="compact"
            variant="ghost"
            onClick={() => router.push(STUDY_LISTS_HREF)}
          >
            Về danh sách
          </Button>
        </div>
      </Alert>
    );
  }
  if (!list) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const current = list;

  function startEditing() {
    setTitle(current.title);
    setDescription(current.description ?? "");
    setFormError(undefined);
    setIsEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setFormError("Nhập tên danh sách.");
      return;
    }
    setIsSaving(true);
    setFormError(undefined);
    try {
      setList(
        await updateStudyList(id, {
          title: title.trim(),
          description: description.trim(),
        }),
      );
      setIsEditing(false);
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Không lưu được.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteStudyList(id);
      toast({ title: "Đã xoá danh sách học", variant: "success" });
      router.push(STUDY_LISTS_HREF);
    } catch (caught) {
      setDeleteError(
        caught instanceof Error ? caught.message : "Không xoá được.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isEditing ? (
        <form
          onSubmit={handleSave}
          noValidate
          className="flex max-w-2xl flex-col gap-4"
        >
          <FormField label="Tên danh sách" required>
            <Input
              value={title}
              maxLength={200}
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
          {formError && <Alert variant="danger">{formError}</Alert>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Hủy
            </Button>
            <Button type="submit" variant="accent" isLoading={isSaving}>
              Lưu
            </Button>
          </div>
        </form>
      ) : (
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Text
              as="h2"
              size="heading-lg"
              weight="bold"
              className="font-display"
            >
              {list.title}
            </Text>
            {list.description && (
              <Text color="secondary">{list.description}</Text>
            )}
            {list.certificates.length > 0 && (
              <ul
                aria-label="Chứng chỉ liên kết"
                className="mt-2 flex flex-wrap gap-2"
              >
                {list.certificates.map((certificate) => (
                  <li key={certificate.id}>
                    <Link href={`/certificates/${certificate.id}`}>
                      <Badge variant="lime">{certificate.name}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={Pencil} onClick={startEditing}>
              Đổi tên
            </Button>
            <Button
              variant="outline"
              leftIcon={Trash2}
              onClick={() => setIsDeleteOpen(true)}
            >
              Xoá
            </Button>
          </div>
        </header>
      )}

      <StudyPlan list={list} onChange={setList} />

      <AlertDialog
        open={isDeleteOpen}
        variant="destructive"
        title="Xoá danh sách học?"
        description={`Bạn có chắc muốn xoá “${list.title}” không? Các phần và bước trong đó cũng bị xoá${
          list.certificates.length > 0
            ? ", và chứng chỉ đang liên kết sẽ không còn link tới danh sách này"
            : ""
        }. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá"
        cancelLabel="Hủy"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      >
        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
      </AlertDialog>
    </div>
  );
}
