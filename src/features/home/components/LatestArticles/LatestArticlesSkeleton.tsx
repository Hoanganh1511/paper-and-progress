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
      className={cn("gap-4 rounded-soft shadow-modal", className)}
      {...props}
    >
      <LatestArticlesHeader titleId="latest-articles-loading-title" />
      <span role="status" className="sr-only">
        Đang tải bài viết
      </span>
      <div className="flex min-h-[24rem] items-center justify-center gap-4 pt-6 pb-8 sm:min-h-[27rem]">
        {[0, 1, 2].map((index) => (
          <Skeleton
            key={index}
            className={cn(
              "h-[19rem] w-60 sm:h-[21rem] sm:w-64 xl:w-72",
              index > 0 && "max-md:hidden",
            )}
          />
        ))}
      </div>
    </Card>
  );
}
