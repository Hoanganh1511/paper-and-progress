"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Editor, JSONContent } from "@tiptap/react";
import { Columns2, History, ImagePlus, Eye, X } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  FormField,
  Image,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Text,
  Textarea,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { addStep } from "@/features/study-lists";
import { RichTextEditor } from "@/features/rich-text";
import {
  createArticle,
  getEditable,
  isConflict,
  isTemporaryFailure,
  listSeries,
  listTags,
  publishArticle,
  updateArticle,
  uploadImage,
} from "../articlesApi";
import { htmlToText } from "../readingTime";
import { headingSlug } from "../toc";
import {
  STATUS_LABELS,
  VISIBILITY_LABELS,
  type ArticleInput,
  type ArticleStatus,
  type ArticleVisibility,
  type EditableArticle,
} from "../types";
import { articleExtensions, articleStarterKit } from "./extensions";
import { CollapsibleBox } from "./CollapsibleBox";
import { imageFilesOf, insertImages } from "./imageInsert";
import { OpenBesideDialog } from "./OpenBesideDialog";
import { RevisionPanel } from "./RevisionPanel";
import {
  StudySectionBanner,
  type StudySectionTarget,
} from "./StudySectionBanner";
import { TableTools } from "./TableTools";
import { TagPicker } from "./TagPicker";
import { AUTOSAVE_DELAY_MS } from "./autosaveDelay";
import { useAutosave } from "./useAutosave";

const NO_SERIES = "none";
const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

interface Draft {
  title: string;
  slug: string;
  isSlugEdited: boolean;
  excerpt: string;
  coverImageUrl: string;
  visibility: ArticleVisibility;
  tags: string[];
  seriesId: string;
  seriesOrder: string;
  contentJson: JSONContent;
  contentHtml: string;
}

function draftOf(article?: EditableArticle): Draft {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    isSlugEdited: Boolean(article),
    excerpt: article?.excerpt ?? "",
    coverImageUrl: article?.coverImageUrl ?? "",
    visibility: article?.visibility ?? "PUBLIC",
    tags: article?.tags.map((tag) => tag.name) ?? [],
    seriesId: article?.seriesId ?? NO_SERIES,
    seriesOrder: article?.seriesOrder ? String(article.seriesOrder) : "",
    contentJson: (article?.contentJson as JSONContent | undefined) ?? EMPTY_DOC,
    contentHtml: article?.contentHtml ?? "",
  };
}

const toInput = (draft: Draft, includeSlug: boolean): ArticleInput => ({
  title: draft.title.trim(),
  ...(includeSlug && draft.slug ? { slug: draft.slug } : {}),
  excerpt: draft.excerpt.trim() || null,
  coverImageUrl: draft.coverImageUrl || null,
  contentJson: draft.contentJson as Record<string, unknown>,
  contentHtml: draft.contentHtml,
  visibility: draft.visibility,
  tags: draft.tags,
  seriesId: draft.seriesId === NO_SERIES ? null : draft.seriesId,
  seriesOrder:
    draft.seriesId !== NO_SERIES && draft.seriesOrder
      ? Number(draft.seriesOrder)
      : null,
});

const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export interface ArticleEditorProps {
  /** The article to edit; omit to write a new one. */
  initial?: EditableArticle;
  /** Called after a version was restored, with the article to reload the editor from. */
  onRestored?: (article: EditableArticle) => void;
  /** The part of a study list this new article is written for; it joins that part when first saved. */
  addToSection?: StudySectionTarget;
}

/**
 * Write or edit an article: title, text with images, tags, series, who may
 * read it, and when it goes live. It saves by itself a moment after you stop
 * typing; the first save creates the article.
 */
export function ArticleEditor({
  initial,
  onRestored,
  addToSection,
}: ArticleEditorProps) {
  const [draft, setDraft] = useState(() => draftOf(initial));
  const [articleId, setArticleId] = useState(initial?.id);
  const [status, setStatus] = useState<ArticleStatus>(
    initial?.status ?? "DRAFT",
  );
  const [publishedSlug, setPublishedSlug] = useState(initial?.slug);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [imageError, setImageError] = useState<string>();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBesideOpen, setIsBesideOpen] = useState(false);
  const [isInSection, setIsInSection] = useState(false);
  const sectionRef = useRef(addToSection);

  const idRef = useRef(initial?.id);
  const lastSlug = useRef(initial?.slug);
  const isManualSave = useRef(false);
  // The text as last loaded or saved here; the server compares it before overwriting.
  const versionRef = useRef(initial?.version);
  const isForced = useRef(false);
  const [isConflicting, setIsConflicting] = useState(false);
  const editorRef = useRef<Editor | undefined>(undefined);
  const coverInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  const tags = useAdminQuery(listTags, "editor-tags");
  const series = useAdminQuery(listSeries, "editor-series");

  const patch = useCallback(
    (changes: Partial<Draft>) =>
      setDraft((current) => ({ ...current, ...changes })),
    [],
  );

  const save = useCallback(async (value: Draft) => {
    const input = toInput(
      value,
      value.isSlugEdited && value.slug !== lastSlug.current,
    );
    if (!idRef.current) {
      const created = await createArticle(input);
      idRef.current = created.id;
      versionRef.current = created.version;
      lastSlug.current = created.slug;
      setArticleId(created.id);
      setPublishedSlug(created.slug);
      // The address now names the article, without reloading the editor. Not
      // when the writer already left (this save finished the editor's last words).
      // A split view keeps its other pane (?with=) in the address.
      if (
        window.location.pathname.startsWith("/write") &&
        !window.location.search.includes("with=")
      ) {
        window.history.replaceState(null, "", `/write/${created.id}`);
      }
      // Written for a part of a study list: it goes in there, once, as that part's step.
      if (sectionRef.current) {
        try {
          await addStep(sectionRef.current.sectionId, {
            articleId: created.id,
          });
          setIsInSection(true);
        } catch {
          setError(
            "Đã lưu bài, nhưng chưa thêm được vào danh sách học. Bạn thêm lại từ trang danh sách (nút “Thêm bài viết”).",
          );
        }
        sectionRef.current = undefined;
      }
      return;
    }
    try {
      const updated = await updateArticle(idRef.current, {
        ...input,
        isAutosave: !isManualSave.current,
        baseVersion: versionRef.current,
        ...(isForced.current ? { force: true } : {}),
      });
      versionRef.current = updated.version;
      lastSlug.current = updated.slug;
      setPublishedSlug(updated.slug);
      setStatus(updated.status);
      setIsConflicting(false);
    } catch (caught) {
      // Saved from somewhere else meanwhile: stop saving and let the writer choose.
      if (isConflict(caught)) setIsConflicting(true);
      throw caught;
    }
  }, []);

  const hasContent = draft.contentHtml.trim().length > 0;
  const autosave = useAutosave({
    value: draft,
    save,
    delay: AUTOSAVE_DELAY_MS,
    // Nothing is created before there is a title and some text, and nothing
    // is saved over a newer version until the writer has chosen.
    isEnabled: draft.title.trim().length > 0 && hasContent && !isConflicting,
    // A dropped connection or a busy server passes; a refusal does not.
    maxRetries: 4,
    shouldRetry: isTemporaryFailure,
  });

  async function keepMyVersion() {
    isForced.current = true;
    setIsConflicting(false);
    try {
      await saveNow(true);
    } catch {
      // The alert below shows what went wrong.
    } finally {
      isForced.current = false;
    }
  }

  async function loadLatestVersion() {
    const id = idRef.current;
    if (!id) return;
    setError(undefined);
    try {
      onRestored?.(await getEditable(id));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được bản mới nhất.",
      );
    }
  }

  async function saveNow(isManual: boolean) {
    isManualSave.current = isManual;
    setError(undefined);
    try {
      await autosave.saveNow();
    } finally {
      isManualSave.current = false;
    }
  }

  async function handlePublish() {
    setIsPublishing(true);
    setError(undefined);
    setNotice(undefined);
    try {
      await saveNow(true);
      const id = idRef.current;
      if (!id) throw new Error("Hãy nhập tiêu đề và nội dung trước.");
      const when = scheduledAt ? new Date(scheduledAt) : undefined;
      const result = await publishArticle(id, when);
      setStatus(result.status);
      setNotice(
        result.status === "SCHEDULED"
          ? "Đã hẹn giờ đăng bài."
          : "Đã đăng bài viết.",
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không đăng được.");
    } finally {
      setIsPublishing(false);
    }
  }

  const uploadHandlers = {
    onStart: () => {
      setImageError(undefined);
      setUploads((count) => count + 1);
    },
    onDone: () => setUploads((count) => Math.max(0, count - 1)),
    onError: setImageError,
  };

  async function handleCover(file: File | undefined) {
    if (!file) return;
    setImageError(undefined);
    setUploads((count) => count + 1);
    try {
      patch({ coverImageUrl: await uploadImage(file) });
    } catch (caught) {
      setImageError(
        caught instanceof Error ? caught.message : "Không tải được ảnh bìa.",
      );
    } finally {
      setUploads((count) => Math.max(0, count - 1));
    }
  }

  // The editor object is created once, so its paste and drop handlers read the latest from a ref.
  const handlersRef = useRef(uploadHandlers);
  useEffect(() => {
    handlersRef.current = uploadHandlers;
  });

  const takeImages = (data: DataTransfer | null) => {
    const files = imageFilesOf(data);
    if (files.length === 0 || !editorRef.current) return false;
    void insertImages(editorRef.current, files, {
      onStart: () => handlersRef.current.onStart(),
      onDone: () => handlersRef.current.onDone(),
      onError: (message) => handlersRef.current.onError(message),
    });
    return true;
  };

  const statusText = isConflicting
    ? "Chưa lưu: bài đã đổi ở nơi khác"
    : autosave.status === "saving"
      ? "Đang lưu nháp..."
      : autosave.status === "error"
        ? autosave.isRetrying
          ? "Chưa lưu được, đang tự thử lại..."
          : "Lỗi, thử lại"
        : autosave.savedAt
          ? `${status === "DRAFT" ? "Đã lưu nháp" : "Đã lưu"} lúc ${clock(autosave.savedAt)}`
          : hasContent && draft.title.trim()
            ? "Chưa lưu"
            : "Nhập tiêu đề và nội dung để bắt đầu";

  const slugShown = draft.isSlugEdited ? draft.slug : headingSlug(draft.title);
  const isLive = status === "PUBLISHED";

  return (
    // A container query, not a viewport one: in a half-width pane (two articles
    // side by side) the sidebar drops below the editor instead of squeezing it.
    <div className="@container">
      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {addToSection && (
            <StudySectionBanner target={addToSection} isAdded={isInSection} />
          )}
          {isConflicting && (
            <Alert variant="danger" title="Bài viết đã được sửa ở nơi khác">
              <div className="flex flex-col gap-3">
                <span>
                  Có một bản mới hơn (từ tab hoặc máy khác). Bản của bạn chưa
                  được lưu để không ghi đè lên nó. Hãy chọn giữ bản nào.
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="compact"
                    variant="outline"
                    onClick={() => void loadLatestVersion()}
                  >
                    Tải bản mới nhất (bỏ thay đổi của tôi)
                  </Button>
                  <Button size="compact" onClick={() => void keepMyVersion()}>
                    Giữ bản của tôi (ghi đè)
                  </Button>
                </div>
              </div>
            </Alert>
          )}
          <FormField label="Tiêu đề" required>
            <Input
              value={draft.title}
              maxLength={200}
              placeholder="Tiêu đề bài viết"
              onChange={(event) => patch({ title: event.target.value })}
            />
          </FormField>

          <FormField
            label="Tóm tắt"
            description="Hiện trên thẻ bài viết và khi chia sẻ. Tối đa 400 ký tự."
          >
            <Textarea
              value={draft.excerpt}
              rows={2}
              maxLength={400}
              onChange={(event) => patch({ excerpt: event.target.value })}
            />
          </FormField>

          <div className="flex flex-col gap-2">
            <Text as="span" size="body-sm" weight="medium">
              Nội dung
            </Text>
            <RichTextEditor
              value=""
              label="Nội dung bài viết"
              placeholder="Bắt đầu viết... Dán hoặc kéo ảnh vào đây để tải lên."
              initialJson={initial?.contentJson as JSONContent | undefined}
              starterKitOptions={articleStarterKit}
              extensions={articleExtensions}
              onEditorReady={(editor) => {
                editorRef.current = editor;
              }}
              onChange={(html) => patch({ contentHtml: html })}
              onChangeJson={(json) => patch({ contentJson: json })}
              editorProps={{
                handlePaste: (_view, event) =>
                  takeImages(event.clipboardData) && true,
                handleDrop: (_view, event) =>
                  takeImages(event.dataTransfer) && true,
              }}
              renderToolbarExtras={(editor) => (
                <>
                  {/* Floats over the table the cursor is in; nothing here until it is. */}
                  <TableTools editor={editor} />
                  <button
                    type="button"
                    aria-label="Chèn ảnh"
                    title="Chèn ảnh"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => imageInput.current?.click()}
                    className="inline-flex size-10 cursor-pointer items-center justify-center rounded-sharp hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
                  >
                    <ImagePlus aria-hidden="true" size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Chèn bảng"
                    title="Chèn bảng"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                        .run()
                    }
                    className="inline-flex h-10 cursor-pointer items-center justify-center rounded-sharp px-2 text-body-sm font-semibold hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
                  >
                    Bảng
                  </button>
                </>
              )}
            />
            <input
              ref={imageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              hidden
              aria-label="Chọn ảnh để chèn"
              onChange={(event) => {
                if (editorRef.current) {
                  void insertImages(
                    editorRef.current,
                    Array.from(event.target.files ?? []),
                    uploadHandlers,
                  );
                }
                event.target.value = "";
              }}
            />
            {uploads > 0 && (
              <Text size="body-sm" role="status" color="secondary">
                Đang tải ảnh lên...
              </Text>
            )}
            {imageError && <Alert variant="danger">{imageError}</Alert>}
          </div>
        </div>

        {/* Follows the screen while the text scrolls; a long column scrolls on its own. The padding keeps the hard shadows from being cut. */}
        <aside className="flex flex-col gap-4 @3xl:sticky @3xl:top-[calc(var(--app-header-height,0px)+1.5rem)] @3xl:max-h-[calc(100dvh-var(--app-header-height,0px)-3rem)] @3xl:self-start @3xl:overflow-y-auto @3xl:pr-1 @3xl:pb-1">
          <CollapsibleBox
            title="Đăng bài"
            headerExtra={
              <Badge variant={isLive ? "lime" : "default"}>
                {STATUS_LABELS[status]}
              </Badge>
            }
          >
            <Text size="body-sm" role="status" color="secondary">
              {statusText}
            </Text>
            {autosave.status === "error" &&
              autosave.error &&
              !isConflicting && (
                <Alert variant="danger">
                  {autosave.error}{" "}
                  <button
                    type="button"
                    className="font-semibold underline"
                    onClick={() => void saveNow(false).catch(() => undefined)}
                  >
                    Thử lại
                  </button>
                </Alert>
              )}

            <FormField label="Ai được đọc">
              <Select
                value={draft.visibility}
                onValueChange={(value) =>
                  patch({ visibility: value as ArticleVisibility })
                }
              >
                <SelectTrigger />
                <SelectContent>
                  {(Object.keys(VISIBILITY_LABELS) as ArticleVisibility[]).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {VISIBILITY_LABELS[value]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Hẹn giờ đăng (tuỳ chọn)"
              description="Để trống để đăng ngay."
            >
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </FormField>

            {notice && (
              <Alert variant="success">
                {notice}{" "}
                {isLive && publishedSlug && (
                  <Link
                    href={`/articles/${publishedSlug}`}
                    className="font-semibold underline"
                  >
                    Xem bài
                  </Link>
                )}
              </Alert>
            )}
            {error && <Alert variant="danger">{error}</Alert>}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!draft.title.trim() || !hasContent}
                onClick={() =>
                  void saveNow(true).catch((e: Error) => setError(e.message))
                }
              >
                Lưu nháp
              </Button>
              {articleId && (
                <Button
                  variant="outline"
                  leftIcon={Eye}
                  onClick={() =>
                    window.open(
                      `/write/${articleId}/preview`,
                      "_blank",
                      "noopener",
                    )
                  }
                >
                  Xem trước
                </Button>
              )}
              <Button
                variant="accent"
                isLoading={isPublishing}
                disabled={!draft.title.trim() || !hasContent}
                onClick={handlePublish}
              >
                {scheduledAt ? "Lên lịch" : isLive ? "Cập nhật" : "Xuất bản"}
              </Button>
            </div>
            {articleId && (
              <Button
                variant="ghost"
                leftIcon={History}
                onClick={() => setIsHistoryOpen(true)}
              >
                Lịch sử phiên bản
              </Button>
            )}
            {articleId && (
              <Button
                variant="outline"
                leftIcon={Columns2}
                onClick={() => setIsBesideOpen(true)}
              >
                Mở song song
              </Button>
            )}
          </CollapsibleBox>

          <CollapsibleBox title="Chi tiết bài viết">
            <FormField
              label="Đường dẫn (slug)"
              description={
                isLive
                  ? "Đổi slug sẽ làm hỏng các liên kết cũ tới bài này."
                  : "Tự tạo từ tiêu đề cho đến khi bạn sửa tay."
              }
            >
              <Input
                value={slugShown}
                onChange={(event) =>
                  patch({
                    slug: headingSlug(event.target.value),
                    isSlugEdited: true,
                  })
                }
              />
            </FormField>

            <div className="flex flex-col gap-2">
              <Text as="span" size="body-sm" weight="medium">
                Ảnh bìa
              </Text>
              {draft.coverImageUrl ? (
                <div className="flex flex-col gap-2">
                  <Image
                    src={draft.coverImageUrl}
                    alt="Ảnh bìa bài viết"
                    aspectRatio="video"
                  />
                  <Button
                    size="compact"
                    variant="outline"
                    leftIcon={X}
                    onClick={() => patch({ coverImageUrl: "" })}
                  >
                    Bỏ ảnh bìa
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  leftIcon={ImagePlus}
                  onClick={() => coverInput.current?.click()}
                >
                  Chọn ảnh bìa
                </Button>
              )}
              <input
                ref={coverInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                aria-label="Chọn ảnh bìa"
                onChange={(event) => {
                  void handleCover(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Text as="span" size="body-sm" weight="medium">
                Chủ đề
              </Text>
              <TagPicker
                value={draft.tags}
                onChange={(next) => patch({ tags: next })}
                suggestions={tags.data?.map((tag) => tag.name) ?? []}
              />
            </div>

            <FormField label="Series">
              <Select
                value={draft.seriesId}
                onValueChange={(value) => patch({ seriesId: value })}
              >
                <SelectTrigger placeholder="Không thuộc series" />
                <SelectContent>
                  <SelectItem value={NO_SERIES}>Không thuộc series</SelectItem>
                  {(series.data ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            {draft.seriesId !== NO_SERIES && (
              <FormField label="Phần số">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={draft.seriesOrder}
                  onChange={(event) =>
                    patch({ seriesOrder: event.target.value })
                  }
                />
              </FormField>
            )}
          </CollapsibleBox>
        </aside>

        {articleId && isBesideOpen && (
          <OpenBesideDialog
            currentId={articleId}
            open
            onClose={() => setIsBesideOpen(false)}
          />
        )}

        {articleId && (
          <RevisionPanel
            articleId={articleId}
            open={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            currentText={htmlToText(draft.contentHtml)}
            onRestored={(article) => onRestored?.(article)}
          />
        )}
      </div>
    </div>
  );
}
