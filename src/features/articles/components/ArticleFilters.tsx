"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button, Input, Text, cn } from "@/design-system";
import type { SeriesWithCount, TagWithCount } from "../types";

export interface ArticleFiltersProps {
  tags: TagWithCount[];
  series: SeriesWithCount[];
  active: { tag?: string; series?: string; q?: string };
}

const chip =
  "inline-flex min-h-11 items-center rounded-pill border-2 border-border-strong px-3 text-body-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

function href(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `/articles?${text}` : "/articles";
}

/** Search box and tag / series chips. Everything is a plain link or a GET form, so the list stays cacheable and shareable. */
export function ArticleFilters({ tags, series, active }: ArticleFiltersProps) {
  const link = (
    label: string,
    key: "tag" | "series",
    value: string | undefined,
    isActive: boolean,
  ) => (
    <Link
      key={`${key}-${value ?? "all"}`}
      href={href({ ...active, [key]: value })}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        chip,
        isActive
          ? "bg-accent-lime text-ink"
          : "bg-surface-card hover:bg-surface-sunken",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        action="/articles"
        method="get"
        role="search"
        className="flex gap-2"
      >
        {active.tag && <input type="hidden" name="tag" value={active.tag} />}
        {active.series && (
          <input type="hidden" name="series" value={active.series} />
        )}
        <Input
          name="q"
          type="search"
          defaultValue={active.q}
          aria-label="Tìm bài viết"
          placeholder="Tìm bài viết..."
          className="min-w-0 flex-1"
        />
        <Button type="submit" leftIcon={Search}>
          Tìm
        </Button>
      </form>

      {tags.length > 0 && (
        <nav aria-label="Lọc theo chủ đề" className="flex flex-col gap-2">
          <Text size="body-sm" weight="semibold">
            Chủ đề
          </Text>
          <div className="flex flex-wrap gap-2">
            {link("Tất cả", "tag", undefined, !active.tag)}
            {tags.map((tag) =>
              link(
                `${tag.name} (${tag.articleCount})`,
                "tag",
                tag.slug,
                active.tag === tag.slug,
              ),
            )}
          </div>
        </nav>
      )}

      {series.length > 0 && (
        <nav aria-label="Lọc theo series" className="flex flex-col gap-2">
          <Text size="body-sm" weight="semibold">
            Series
          </Text>
          <div className="flex flex-wrap gap-2">
            {link("Tất cả", "series", undefined, !active.series)}
            {series.map((item) =>
              link(
                `${item.title} (${item.articleCount})`,
                "series",
                item.slug,
                active.series === item.slug,
              ),
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
