"use client";

import { Fragment, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reply, Trash2 } from "lucide-react";
import {
  Alert,
  Button,
  FormField,
  Skeleton,
  Text,
  Textarea,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { addComment, deleteComment, listComments } from "../articlesApi";
import { formatDate } from "../format";
import type { CommentNode } from "../types";

const MAX_LENGTH = 2000;
/** Replies nest this deep on screen; deeper ones stay at the same indent. */
const MAX_DEPTH = 3;
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

/** Plain text with web addresses turned into links. Nothing in a comment is ever read as HTML. */
export function linkify(text: string): ReactNode[] {
  return text.split(URL_PATTERN).map((part, index) =>
    index % 2 === 1 ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        className="underline underline-offset-2"
      >
        {part}
      </a>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function CommentForm({
  articleId,
  parentId,
  submitLabel,
  onDone,
  onCancel,
}: {
  articleId: string;
  parentId?: string;
  submitLabel: string;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await addComment(articleId, body.trim(), parentId);
      setBody("");
      onDone();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không gửi được bình luận.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <FormField
        label={parentId ? "Trả lời" : "Viết bình luận"}
        description={`${body.length}/${MAX_LENGTH} ký tự. Chỉ là văn bản thuần.`}
      >
        <Textarea
          value={body}
          rows={3}
          maxLength={MAX_LENGTH}
          onChange={(event) => setBody(event.target.value)}
        />
      </FormField>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Huỷ
          </Button>
        )}
        <Button
          type="submit"
          variant="accent"
          isLoading={isSaving}
          disabled={!body.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  depth,
  articleId,
  userId,
  isAdmin,
  isAuthenticated,
  onChanged,
}: {
  comment: CommentNode;
  depth: number;
  articleId: string;
  userId?: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  onChanged: () => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string>();
  const canDelete =
    !comment.isDeleted && (isAdmin || comment.author?.id === userId);

  async function handleDelete() {
    setError(undefined);
    try {
      await deleteComment(comment.id);
      onChanged();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Không xoá được bình luận.",
      );
    }
  }

  return (
    <li className="flex flex-col gap-2">
      <div className="rounded-standard border-2 border-border-strong bg-surface-card p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <Text size="body-sm" weight="semibold">
            {comment.author?.displayName ??
              (comment.isDeleted ? "" : "Ẩn danh")}
          </Text>
          <Text size="caption" color="secondary">
            {formatDate(comment.createdAt)}
          </Text>
        </div>
        <Text
          size="body-md"
          color={comment.isDeleted ? "muted" : "primary"}
          className="mt-1 break-words whitespace-pre-wrap"
        >
          {comment.isDeleted ? comment.body : linkify(comment.body)}
        </Text>
        {!comment.isDeleted && (
          <div className="mt-2 flex flex-wrap gap-2">
            {isAuthenticated && (
              <Button
                size="compact"
                variant="ghost"
                leftIcon={Reply}
                onClick={() => setIsReplying((current) => !current)}
              >
                Trả lời
              </Button>
            )}
            {canDelete && (
              <Button
                size="compact"
                variant="ghost"
                leftIcon={Trash2}
                onClick={handleDelete}
              >
                Xoá
              </Button>
            )}
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
      </div>

      {isReplying && (
        <div className="pl-4">
          <CommentForm
            articleId={articleId}
            parentId={comment.id}
            submitLabel="Gửi trả lời"
            onCancel={() => setIsReplying(false)}
            onDone={() => {
              setIsReplying(false);
              onChanged();
            }}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <ul
          className={`flex flex-col gap-2 ${depth < MAX_DEPTH ? "border-l-2 border-border-subtle pl-4" : ""}`}
        >
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              articleId={articleId}
              userId={userId}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export interface CommentThreadProps {
  articleId: string;
}

/** Comments as a tree: plain text, links made clickable, reply and soft delete. */
export function CommentThread({ articleId }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [version, setVersion] = useState(0);
  const comments = useAdminQuery(
    () => listComments(articleId),
    `comments-${articleId}-${version}-${isAuthenticated}`,
  );
  const refresh = () => setVersion((current) => current + 1);

  return (
    <section aria-labelledby="comments-title" className="flex flex-col gap-4">
      <Text
        as="h2"
        id="comments-title"
        size="heading-md"
        weight="bold"
        className="font-display"
      >
        Bình luận
      </Text>

      {isAuthenticated ? (
        <CommentForm
          articleId={articleId}
          submitLabel="Gửi bình luận"
          onDone={refresh}
        />
      ) : (
        <Text color="secondary">
          <Link href={loginHref(pathname)} className="font-semibold underline">
            Đăng nhập
          </Link>{" "}
          để bình luận.
        </Text>
      )}

      {comments.error && !comments.data ? (
        <Alert variant="danger">{comments.error.message}</Alert>
      ) : !comments.data ? (
        <Skeleton className="h-16 w-full" />
      ) : comments.data.length === 0 ? (
        <Text color="secondary">Chưa có bình luận nào.</Text>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={1}
              articleId={articleId}
              userId={user?.id}
              isAdmin={user?.role === "ADMIN"}
              isAuthenticated={isAuthenticated}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
