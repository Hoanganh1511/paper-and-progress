import type { ComponentProps } from "react";
import { Card, Skeleton, cn } from "@/design-system";
import { LatestArticlesHeader } from "./LatestArticlesHeader";

export type LatestArticlesSkeletonProps = Omit<
  ComponentProps<"section">,
  "children" | "ref"
>;

/**
 * What stands in while the articles load: the real header and three card
 * shapes, in a box as tall as the finished module, so nothing jumps when the
 * cards arrive. The controls are not shown before there is anything to move
 * through.
 */
export function LatestArticlesSkeleton({
  className,
  ...props
}: LatestArticlesSkeletonProps) {
  return (
    <Card
      as="section"
      aria-labelledby="latest-articles-loading-title"
      aria-busy="true"
      lang="vi"
      className={cn(
        "gap-4 rounded-soft bg-surface-card shadow-modal",
        className,
      )}
      {...props}
    >
      <LatestArticlesHeader titleId="latest-articles-loading-title" />
      <span role="status" className="sr-only">
        Đang tải series
      </span>
      <div className="flex min-h-[28rem] items-center justify-center gap-4 pt-6 pb-8">
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-[24rem] w-72 sm:w-96 xl:w-[26rem]",
              index > 0 && "max-md:hidden",
            )}
          />
        ))}
      </div>
    </Card>
  );
}
