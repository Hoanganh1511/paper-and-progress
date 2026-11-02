import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { Badge, Card, Image, Text } from "@/design-system";
import { authorName, formatDate } from "../format";
import type { ArticleCardData } from "../types";

export interface ArticleCardProps {
  article: ArticleCardData;
}

/** One article in a list. The whole card is clickable through the title's stretched link. */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card
      as="article"
      padding="none"
      interactive
      className="relative h-full overflow-hidden"
    >
      {article.coverImageUrl && (
        <Image
          src={article.coverImageUrl}
          alt=""
          aspectRatio="video"
          radius="none"
          frameClassName="border-b-2 border-border-strong"
        />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {article.series && (
            <Badge size="sm" variant="blue">
              {article.series.title}
              {article.seriesOrder ? ` · Phần ${article.seriesOrder}` : ""}
            </Badge>
          )}
          {article.visibility !== "PUBLIC" && (
            <Badge size="sm" variant="yellow" icon={Lock}>
              {article.visibility === "MEMBERS_ONLY"
                ? "Thành viên"
                : "Xem trước"}
            </Badge>
          )}
        </div>
        <Text as="h3" size="heading-sm" weight="bold" className="font-display">
          <Link
            href={`/articles/${article.slug}`}
            className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-border-focus"
          >
            {article.title}
          </Link>
        </Text>
        {article.excerpt && (
          <Text size="body-md" color="secondary" className="line-clamp-3">
            {article.excerpt}
          </Text>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          <Text size="body-sm" color="secondary">
            {authorName(article.author)}
            {article.publishedAt && ` · ${formatDate(article.publishedAt)}`}
          </Text>
          <Text
            size="body-sm"
            color="secondary"
            className="inline-flex items-center gap-1"
          >
            <Clock aria-hidden="true" size={14} />
            {article.readingMinutes} phút đọc
          </Text>
        </div>
        {article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Chủ đề">
            {article.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge size="sm">{tag.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
