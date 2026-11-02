import { cacheLife, cacheTag } from "next/cache";
import type {
  LearningCategory,
  LearningDomain,
  LearningDomainIcon,
} from "@/features/learning/types";
import type { CategoryDetail, DomainSummary, TopicDetail } from "./types";

/**
 * Reads of the knowledge base for the public pages, on the server. What is the
 * learner's own (whether they follow a topic) is fetched in the browser.
 */
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;

export const KNOWLEDGE_TAG = "knowledge";

async function getJson<T>(path: string): Promise<{ status: number; body: T }> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { accept: "application/json" },
  });
  const body = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body };
}

export async function fetchDomains(): Promise<DomainSummary[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(KNOWLEDGE_TAG);
  const { status, body } = await getJson<DomainSummary[]>("/knowledge/domains");
  if (status !== 200) throw new Error(`Không tải được lĩnh vực (${status}).`);
  return body;
}

export async function fetchCategory(
  slug: string,
): Promise<CategoryDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(KNOWLEDGE_TAG);
  const { status, body } = await getJson<CategoryDetail>(
    `/knowledge/categories/${encodeURIComponent(slug)}`,
  );
  if (status === 404) return null;
  if (status !== 200) throw new Error(`Không tải được danh mục (${status}).`);
  return body;
}

export async function fetchTopic(slug: string): Promise<TopicDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(KNOWLEDGE_TAG);
  // Called without a token, so `isFollowing` is always false here; the page
  // asks again in the browser for a signed-in reader.
  const { status, body } = await getJson<TopicDetail>(
    `/knowledge/topics/${encodeURIComponent(slug)}`,
  );
  if (status === 404) return null;
  if (status !== 200) throw new Error(`Không tải được chủ đề (${status}).`);
  return body;
}

/** The icon keys the hub knows; the backend's own keys are mapped onto them. */
const DOMAIN_ICON: Record<string, LearningDomainIcon> = {
  code: "technology",
  technology: "technology",
  finance: "finance",
  health: "health",
  language: "language",
  "soft-skills": "soft-skills",
};

const countLine = (topic: {
  articleCount: number;
  pathCount: number;
  resourceCount: number;
}) =>
  `${topic.articleCount} bài viết · ${topic.pathCount} lộ trình · ${topic.resourceCount} tài liệu`;

/**
 * The hub's catalogue built from the knowledge base: a domain's categories
 * become its sections and each category's topics become the cards, linking to
 * the topic page. A domain with no categories of its own lists its topics in
 * one section.
 */
export async function fetchLearningDomains(): Promise<LearningDomain[]> {
  const domains = await fetchDomains();
  return Promise.all(
    domains.map(async (domain): Promise<LearningDomain> => {
      const detail = await fetchCategory(domain.slug);
      const subcategories = detail?.subcategories ?? [];
      const sections = await Promise.all(
        subcategories.map(async (sub): Promise<LearningCategory> => {
          const category = await fetchCategory(sub.slug);
          return {
            id: sub.slug,
            title: sub.name,
            description: sub.description ?? undefined,
            items: (category?.topics ?? []).map((topic) => ({
              id: topic.slug,
              title: topic.name,
              description: topic.description ?? "",
              meta: countLine(topic),
              counts: {
                articles: topic.articleCount,
                paths: topic.pathCount,
                resources: topic.resourceCount,
              },
              href: `/topics/${topic.slug}`,
            })),
          };
        }),
      );
      return {
        id: domain.slug,
        label: domain.name,
        icon: DOMAIN_ICON[domain.icon ?? ""] ?? "technology",
        categories: sections.filter((section) => section.items.length > 0),
      };
    }),
  );
}

/** What a topic holds, by topic slug. */
export type TopicCounts = {
  articles: number;
  paths: number;
  resources: number;
};

/**
 * The counts of every topic in the knowledge base, by slug, for pages that list
 * technologies of their own and want to show what the library has on each. An
 * unreachable knowledge base gives an empty map, so such a page shows zeros
 * instead of failing.
 */
export async function fetchTopicCounts(): Promise<Record<string, TopicCounts>> {
  try {
    const domains = await fetchLearningDomains();
    const counts: Record<string, TopicCounts> = {};
    for (const domain of domains) {
      for (const category of domain.categories) {
        for (const entry of category.items) {
          if (entry.counts) counts[entry.id] = entry.counts;
        }
      }
    }
    return counts;
  } catch {
    return {};
  }
}
