import type { ArticleResult } from "../types";

export interface ArticleJsonLdInput {
  url: string;
  result: Extract<ArticleResult, { kind: "full" | "preview" | "locked" }>;
}

/** Escapes `<` so a title cannot close the script tag. */
const serialize = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

/** schema.org `Article` data. Members-only text is described as not free, the way Google asks paywalls to be marked. */
export function articleJsonLd({ url, result }: ArticleJsonLdInput) {
  if (result.kind === "locked") {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: result.article.title,
      description: result.article.excerpt ?? undefined,
      mainEntityOfPage: url,
      isAccessibleForFree: false,
    };
  }
  const { article } = result;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    image: article.coverImageUrl ?? undefined,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author.displayName ?? "Tác giả",
    },
    mainEntityOfPage: url,
    keywords: article.tags.map((tag) => tag.name).join(", ") || undefined,
    ...(article.visibility === "PUBLIC"
      ? { isAccessibleForFree: true }
      : {
          isAccessibleForFree: false,
          hasPart: {
            "@type": "WebPageElement",
            isAccessibleForFree: false,
            cssSelector: ".article-gated",
          },
        }),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
