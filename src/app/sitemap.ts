import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;
const PAGE_SIZE = 50;
/** A guard against a runaway loop; 20 pages is 1000 articles. */
const MAX_PAGES = 20;

interface SitemapArticle {
  slug: string;
  visibility: string;
  publishedAt: string | null;
}

/** /sitemap.xml: the article list plus every public or preview article. Members-only ones are left out. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE}/articles`, changeFrequency: "daily", priority: 0.8 },
  ];
  let cursor: string | null = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    if (cursor) params.set("cursor", cursor);
    let data: { items: SitemapArticle[]; nextCursor: string | null };
    try {
      const response = await fetch(`${API}/articles?${params.toString()}`);
      if (!response.ok) break;
      data = (await response.json()) as typeof data;
    } catch {
      break;
    }
    for (const article of data.items) {
      if (article.visibility === "MEMBERS_ONLY") continue;
      entries.push({
        url: `${SITE}/articles/${article.slug}`,
        lastModified: article.publishedAt ?? undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    cursor = data.nextCursor;
    if (!cursor) break;
  }
  return entries;
}
