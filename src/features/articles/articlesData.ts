import { cacheLife, cacheTag } from "next/cache";
import type {
  ArticleList,
  ArticleResult,
  FullArticle,
  PreviewArticle,
  SeriesWithCount,
  TagWithCount,
} from "./types";

/**
 * Reads for the public pages, on the server. Each is cached and tagged, and the
 * backend asks the web app to drop the tags when an article changes (see
 * `app/api/revalidate`). Only what a guest may see goes in here: a signed-in
 * reader's full text is fetched in the browser, never through these caches.
 */
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

/** Lists, tags and series. An article has its own tag, so editing one does not drop every page. */
export const LIST_TAG = "articles:list";
export const articleTag = (slug: string) => `article:${slug}`;

async function getJson<T>(path: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body };
}

export async function fetchArticleList(query: {
  tag?: string;
  series?: string;
  q?: string;
  cursor?: string;
}): Promise<ArticleList> {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIST_TAG);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const { status, body } = await getJson<ArticleList>(
    `/articles?${params.toString()}`,
  );
  if (status !== 200) throw new Error(`Không tải được danh sách (${status}).`);
  return body;
}

export async function fetchArticle(slug: string): Promise<ArticleResult> {
  "use cache";
  cacheLife("hours");
  cacheTag(articleTag(slug));
  const { status, body } = await getJson<
    FullArticle | PreviewArticle | { title: string; excerpt: string | null }
  >(`/articles/${encodeURIComponent(slug)}`);
  if (status === 404) return { kind: "not-found" };
  if (status === 401) {
    const locked = body as { title: string; excerpt: string | null };
    return {
      kind: "locked",
      article: { title: locked.title, excerpt: locked.excerpt },
    };
  }
  if (status !== 200) throw new Error(`Không tải được bài viết (${status}).`);
  const article = body as FullArticle | PreviewArticle;
  return article.gated
    ? { kind: "preview", article }
    : { kind: "full", article };
}

export async function fetchTags(): Promise<TagWithCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIST_TAG);
  const { status, body } = await getJson<TagWithCount[]>("/tags");
  return status === 200 ? body : [];
}

export async function fetchSeries(): Promise<SeriesWithCount[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(LIST_TAG);
  const { status, body } = await getJson<SeriesWithCount[]>("/series");
  return status === 200 ? body : [];
}
