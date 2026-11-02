import { SearchInput, cn } from "@/design-system";

export interface LearningSearchProps {
  /** Fills the search box, so the results page shows what was searched. */
  query?: string;
  /**
   * `hero` is the tall box of the page hero (48px, 450px wide from `lg`, a hard
   * 3px shadow); `compact` is the box that sits beside the navigation.
   */
  variant?: "compact" | "hero";
  className?: string;
}

/**
 * The one search over the learning area (topics, articles, paths and resources).
 * A plain GET form to `/search?q=...`, so it works without scripts and the
 * results page can be linked to.
 */
export function LearningSearch({
  query = "",
  variant = "compact",
  className,
}: LearningSearchProps) {
  const isHero = variant === "hero";
  return (
    <form
      role="search"
      action="/search"
      method="get"
      className={cn(
        "w-full",
        isHero ? "xl:max-w-[28.125rem]" : "md:max-w-sm",
        className,
      )}
    >
      <SearchInput
        name="q"
        defaultValue={query}
        size={isHero ? "comfortable" : "default"}
        aria-label="Tìm trong khu vực học tập"
        placeholder="Tìm chủ đề, bài viết, lộ trình..."
        autoComplete="off"
        clearLabel="Xóa"
        className={
          isHero
            ? "rounded-[10px] shadow-[3px_3px_0_0_var(--color-border-strong)]"
            : undefined
        }
      />
    </form>
  );
}
