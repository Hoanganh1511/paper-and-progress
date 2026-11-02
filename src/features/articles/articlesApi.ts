import axios from "axios";
import { authedApi } from "@/features/auth";
import type {
  ArticleCardData,
  ArticleList,
  ArticleInput,
  ArticleStatsRow,
  ArticleStatsSort,
  ArticleStatus,
  CommentNode,
  EditableArticle,
  Engagement,
  FullArticle,
  PresignedUpload,
  ReactionType,
  RevisionSummary,
  SeriesWithCount,
  TagWithCount,
} from "./types";

/** Calls made in the browser with the signed-in user's token. Public reads live in `articlesData.ts`. */
export class ArticlesApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ArticlesApiError";
    this.status = status;
  }
}

async function call<T>(request: Promise<{ data: T }>): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw new ArticlesApiError("Không kết nối được máy chủ. Thử lại sau.");
    }
    const { status, data } = error.response;
    const raw = (data as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw)
      ? raw.map(String).join(" ")
      : typeof raw === "string"
        ? raw
        : "Có lỗi xảy ra. Thử lại sau.";
    throw new ArticlesApiError(message, status);
  }
}

/* Reading */

const PUBLIC_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

/** A further page of the public list, for "load more" (the first page comes from the server). */
export async function fetchArticlePage(query: {
  tag?: string;
  series?: string;
  q?: string;
  cursor?: string;
}): Promise<ArticleList> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  let response: Response;
  try {
    response = await fetch(`${PUBLIC_BASE}/articles?${params.toString()}`);
  } catch {
    throw new ArticlesApiError("Không kết nối được máy chủ. Thử lại sau.");
  }
  if (!response.ok) {
    throw new ArticlesApiError("Không tải được danh sách.", response.status);
  }
  return (await response.json()) as ArticleList;
}

/** The full text for a signed-in reader (the cached page only holds what a guest may see). */
export const getFullArticle = (slug: string) =>
  call(authedApi.get<FullArticle>(`/articles/${encodeURIComponent(slug)}`));

export const getEngagement = (id: string) =>
  call(authedApi.get<Engagement>(`/articles/${id}/engagement`));

export const react = (id: string, type: ReactionType) =>
  call(authedApi.put<Engagement>(`/articles/${id}/reactions/${type}`));

export const unreact = (id: string, type: ReactionType) =>
  call(authedApi.delete<Engagement>(`/articles/${id}/reactions/${type}`));

export const bookmark = (id: string) =>
  call(authedApi.put<{ isBookmarked: true }>(`/articles/${id}/bookmark`));

export const unbookmark = (id: string) =>
  call(authedApi.delete<{ isBookmarked: false }>(`/articles/${id}/bookmark`));

export const listSaved = () =>
  call(
    authedApi.get<(ArticleCardData & { bookmarkedAt: string })[]>("/bookmarks"),
  );

/* Comments */

export const listComments = (articleId: string) =>
  call(authedApi.get<CommentNode[]>(`/articles/${articleId}/comments`));

export const addComment = (
  articleId: string,
  body: string,
  parentId?: string,
) =>
  call(
    authedApi.post<{ id: string }>(`/articles/${articleId}/comments`, {
      body,
      parentId,
    }),
  );

export const deleteComment = (id: string) =>
  call(authedApi.delete<{ deleted: true }>(`/comments/${id}`));

/* Tracking: no login needed, so the browser sends it itself and may close the page meanwhile. */

export function trackScroll(articleId: string, maxScrollPercent: number) {
  const base = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;
  void fetch(`${base}/articles/${articleId}/views`, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxScrollPercent }),
  }).catch(() => undefined);
}

/* Writing */

export const listMine = () =>
  call(authedApi.get<ArticleCardData[]>("/articles/mine"));

export const getEditable = (id: string) =>
  call(authedApi.get<EditableArticle>(`/articles/${id}/editable`));

export const createArticle = (input: ArticleInput) =>
  call(authedApi.post<{ id: string; slug: string }>("/articles", input));

export const updateArticle = (
  id: string,
  input: Partial<ArticleInput> & { isAutosave?: boolean },
) =>
  call(
    authedApi.patch<{ id: string; slug: string; status: ArticleStatus }>(
      `/articles/${id}`,
      input,
    ),
  );

export const publishArticle = (id: string, scheduledAt?: Date) =>
  call(
    authedApi.post<{ id: string; slug: string; status: ArticleStatus }>(
      `/articles/${id}/publish`,
      scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {},
    ),
  );

export const archiveArticle = (id: string) =>
  call(authedApi.post<{ status: ArticleStatus }>(`/articles/${id}/archive`));

export const deleteArticle = (id: string) =>
  call(authedApi.delete<{ deleted: true }>(`/articles/${id}`));

export const listTags = () => call(authedApi.get<TagWithCount[]>("/tags"));

export const listSeries = () =>
  call(authedApi.get<SeriesWithCount[]>("/series"));

export const createSeries = (title: string) =>
  call(authedApi.post<SeriesWithCount>("/series", { title }));

/* Revisions */

export const listRevisions = (id: string) =>
  call(authedApi.get<RevisionSummary[]>(`/articles/${id}/revisions`));

export const restoreRevision = (id: string, revisionId: string) =>
  call(
    authedApi.post<EditableArticle>(
      `/articles/${id}/revisions/${revisionId}/restore`,
    ),
  );

/* Images */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateImage(file: { type: string; size: number }) {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Chỉ nhận ảnh jpg, png, webp hoặc gif.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Ảnh quá lớn (tối đa 5MB).";
  return undefined;
}

/**
 * Uploads an image straight to storage (S3 or the dev server) and returns its
 * public URL. The same flow for both: ask for a link, then send the file there.
 */
export async function uploadImage(file: File): Promise<string> {
  const problem = validateImage(file);
  if (problem) throw new ArticlesApiError(problem);

  const presigned = await call(
    authedApi.post<PresignedUpload>("/uploads/presign", {
      filename: file.name,
      contentType: file.type,
    }),
  );
  const form = new FormData();
  for (const [key, value] of Object.entries(presigned.fields)) {
    form.append(key, value);
  }
  form.append("file", file); // S3 needs the file to be the last field
  let response: Response;
  try {
    response = await fetch(presigned.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new ArticlesApiError("Không tải được ảnh lên. Thử lại sau.");
  }
  if (!response.ok) {
    throw new ArticlesApiError(
      "Không tải được ảnh lên. Thử lại sau.",
      response.status,
    );
  }
  return presigned.publicUrl;
}

/* Admin */

export const getArticleStats = (query: {
  sort: ArticleStatsSort;
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
}) =>
  call(
    authedApi.get<{ items: ArticleStatsRow[]; total: number }>(
      "/admin/articles/stats",
      { params: query },
    ),
  );
