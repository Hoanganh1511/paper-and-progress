"use client";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button, Input, Text, cn } from "@/design-system";
import { LEVEL_LABEL } from "../format";
import type { PathLevel } from "../types";

export interface PathFiltersProps {
  active: { q?: string; level?: string; topic?: string };
}

const chip =
  "inline-flex min-h-11 items-center rounded-pill border-2 border-border-strong px-3 text-body-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

function href(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `/paths?${text}` : "/paths";
}

const LEVELS = Object.keys(LEVEL_LABEL) as PathLevel[];

/** Search box and level chips; plain links and a GET form, so the list stays cacheable and shareable. */
export function PathFilters({ active }: PathFiltersProps) {
  const hasFilter = Boolean(active.q || active.level || active.topic);
  const link = (label: string, level: string | undefined) => {
    const isActive = active.level === level;
    return (
      <Link
        key={level ?? "all"}
        href={href({ ...active, level })}
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
  };

  return (
    <div className="flex flex-col gap-4">
      <form action="/paths" method="get" role="search" className="flex gap-2">
        {active.level && (
          <input type="hidden" name="level" value={active.level} />
        )}
        {active.topic && (
          <input type="hidden" name="topic" value={active.topic} />
        )}
        <Input
          name="q"
          type="search"
          defaultValue={active.q}
          aria-label="Tìm lộ trình"
          placeholder="Tìm lộ trình..."
          className="min-w-0 flex-1"
        />
        <Button type="submit" leftIcon={Search}>
          Tìm
        </Button>
      </form>
      <nav
        aria-label="Lọc theo cấp độ"
        className="flex flex-wrap items-center gap-2"
      >
        <Text as="span" size="body-sm" color="secondary">
          Cấp độ:
        </Text>
        {link("Tất cả", undefined)}
        {LEVELS.map((level) => link(LEVEL_LABEL[level].label, level))}
        {hasFilter && (
          <Link href="/paths" className="text-body-sm underline">
            Xóa bộ lọc
          </Link>
        )}
      </nav>
    </div>
  );
}
