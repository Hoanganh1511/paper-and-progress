import { ArrowRight, Newspaper } from "lucide-react";
import { LinkButton, Text } from "@/design-system";

export interface LatestArticlesHeaderProps {
  titleId: string;
  /** Where "Xem tất cả bài viết" leads. */
  href?: string;
}

/** The icon, the title and subtitle, and the link to every article. */
export function LatestArticlesHeader({
  titleId,
  href = "/articles",
}: LatestArticlesHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink">
          <Newspaper aria-hidden="true" size={22} />
        </span>
        <div className="min-w-0">
          <Text
            as="h2"
            id={titleId}
            size="heading-md"
            weight="bold"
            className="font-display"
          >
            Bài viết mới nhất
          </Text>
          <Text size="body-sm" color="secondary">
            Khám phá những bài viết vừa được đăng trên Baolingo.
          </Text>
        </div>
      </div>
      <LinkButton href={href} variant="outline" rightIcon={ArrowRight}>
        Xem tất cả bài viết
      </LinkButton>
    </div>
  );
}
