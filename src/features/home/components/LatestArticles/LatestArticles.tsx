"use client";

import { useId, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Alert, Button, Card, Text, cn } from "@/design-system";
import type { ArticleCardData } from "@/features/articles";
import { Mascot } from "@/features/english";
import { ArticleCarousel } from "./ArticleCarousel";
import { LatestArticlesHeader } from "./LatestArticlesHeader";

export interface LatestArticlesProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** The newest published articles; `null` when they could not be loaded. */
  articles: ArticleCardData[] | null;
}

/**
 * The Dashboard's showcase of the newest articles: a header, three tilted cards
 * with the middle one in front, and the controls to move through them. It
 * stands in for the Projects and Knowledge cards. When the articles cannot be
 * loaded it says so inside its own box and offers a retry, and the rest of the
 * page is not touched.
 */
export function LatestArticles({
  articles,
  className,
  ...props
}: LatestArticlesProps) {
  const titleId = useId();
  const router = useRouter();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      lang="vi"
      className={cn(
        "relative gap-4 overflow-hidden rounded-soft shadow-modal",
        className,
      )}
      {...props}
    >
      {/* Flat patches of colour, so the cards seem to float over a surface. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 rounded-t-[3rem] bg-accent-lime/40"
      />
      <Sparkles
        aria-hidden="true"
        size={28}
        className="pointer-events-none absolute top-24 right-[18%] text-accent-yellow"
      />
      <div className="relative flex flex-col gap-4">
        <LatestArticlesHeader titleId={titleId} />
        {articles === null ? (
          <div className="flex min-h-[24rem] flex-col items-start justify-center gap-3">
            <Alert variant="danger">
              Không tải được các bài viết mới nhất.
            </Alert>
            <Button variant="outline" onClick={() => router.refresh()}>
              Thử lại
            </Button>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center">
            <Mascot accessory="book" aria-hidden="true" className="size-24" />
            <Text>Chưa có bài viết mới. Hãy quay lại sau nhé!</Text>
          </div>
        ) : (
          <ArticleCarousel articles={articles} />
        )}
      </div>
    </Card>
  );
}
