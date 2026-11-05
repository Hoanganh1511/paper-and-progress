"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Alert, Button, Card, Text, cn } from "@/design-system";
import { Mascot } from "@/features/english";
import { LatestArticlesHeader } from "./LatestArticlesHeader";
import { SeriesCarousel } from "./SeriesCarousel";
import type { SeriesShowcase } from "./types";

export interface LatestArticlesProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  /** The study lists with their first lessons; `null` when they could not be loaded. */
  series: SeriesShowcase[] | null;
  /** Shown instead of the cards when there is no series (e.g. a sign-in prompt). */
  emptyContent?: ReactNode;
}

/**
 * The Dashboard's showcase of the newest articles, grouped by series: a header
 * on a dark surface, tilted series cards (each listing the first lessons of
 * one study list) with the middle one in front, and the controls to move through
 * them. When the series cannot be loaded it says so inside its own box and
 * offers a retry, and the rest of the page is not touched.
 */
export function LatestArticles({
  series,
  emptyContent,
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
        "relative gap-4 overflow-hidden rounded-soft bg-[linear-gradient(135deg,#5a3d2e,#35241c)] text-white shadow-modal",
        className,
      )}
      {...props}
    >
      <Sparkles
        aria-hidden="true"
        size={28}
        className="pointer-events-none absolute top-8 right-[18%] text-accent-yellow"
      />
      <div className="relative flex flex-col gap-4">
        <LatestArticlesHeader titleId={titleId} />
        {series === null ? (
          <div className="flex min-h-[24rem] flex-col items-start justify-center gap-3">
            <Alert variant="danger">Không tải được các series.</Alert>
            <Button variant="outline" onClick={() => router.refresh()}>
              Thử lại
            </Button>
          </div>
        ) : series.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center">
            <Mascot accessory="book" aria-hidden="true" className="size-24" />
            {emptyContent ?? (
              <Text className="text-white">
                Chưa có series nào. Hãy quay lại sau nhé!
              </Text>
            )}
          </div>
        ) : (
          <SeriesCarousel series={series} />
        )}
      </div>
    </Card>
  );
}
