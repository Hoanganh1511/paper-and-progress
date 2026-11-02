import Link from "next/link";
import type { ReactNode } from "react";
import { Card, Text, cn, focusRingClasses } from "@/design-system";
import type { SearchGroup, SearchResults } from "../types";

const linkClasses = cn(
  "rounded-sharp underline-offset-2 hover:underline",
  focusRingClasses,
);

function Group<T>({
  title,
  group,
  render,
}: {
  title: string;
  group: SearchGroup<T>;
  render: (item: T) => ReactNode;
}) {
  if (group.total === 0) return null;
  return (
    <section
      aria-labelledby={`search-${title}`}
      className="flex flex-col gap-3"
    >
      <Text as="h2" id={`search-${title}`} size="heading-sm" weight="semibold">
        {title}{" "}
        <Text as="span" size="caption" color="muted">
          ({group.items.length < group.total ? `${group.items.length}/` : ""}
          {group.total})
        </Text>
      </Text>
      <ul className="flex flex-col gap-3">
        {group.items.map((item, index) => (
          <li key={index}>
            <Card padding="compact" className="flex flex-col gap-1">
              {render(item)}
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Results in four groups, never one mixed list. */
export function SearchResultsView({ results }: { results: SearchResults }) {
  const { topics, resources, articles, paths } = results;
  if (topics.total + resources.total + articles.total + paths.total === 0) {
    return (
      <Text color="secondary" role="status">
        Không có kết quả nào cho “{results.query}”. Thử từ khóa ngắn hơn hoặc
        khác đi.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      <Group
        title="Chủ đề"
        group={topics}
        render={(topic) => (
          <>
            <Link href={`/topics/${topic.slug}`} className={linkClasses}>
              {topic.name}
            </Link>
            <Text size="caption" color="muted">
              {topic.categoryName}
            </Text>
          </>
        )}
      />
      <Group
        title="Tài liệu"
        group={resources}
        render={(resource) => (
          <>
            <a href={resource.url} className={linkClasses}>
              {resource.title}
            </a>
            <Text size="caption" color="muted">
              Trong chủ đề{" "}
              <Link
                href={`/topics/${resource.topic.slug}`}
                className={linkClasses}
              >
                {resource.topic.name}
              </Link>
            </Text>
          </>
        )}
      />
      <Group
        title="Bài viết"
        group={articles}
        render={(article) => (
          <>
            <Link href={`/articles/${article.slug}`} className={linkClasses}>
              {article.title}
            </Link>
            {article.excerpt && (
              <Text size="body-sm" color="secondary">
                {article.excerpt}
              </Text>
            )}
            <Text size="caption" color="muted">
              {article.author}
            </Text>
          </>
        )}
      />
      <Group
        title="Lộ trình"
        group={paths}
        render={(path) => (
          <>
            <Link href={`/paths/${path.slug}`} className={linkClasses}>
              {path.title}
            </Link>
            <Text size="body-sm" color="secondary">
              {path.description}
            </Text>
          </>
        )}
      />
    </div>
  );
}
