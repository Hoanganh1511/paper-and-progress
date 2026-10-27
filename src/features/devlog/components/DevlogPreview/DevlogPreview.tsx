import type { ComponentProps } from "react";
import { ArrowRight, Rss } from "lucide-react";
import { LinkButton, Text, cn } from "@/design-system";
import type { DevlogEntry, ProjectStatus } from "../../types";
import { DevlogTimeline } from "../DevlogTimeline";
import { ProjectStatusPanel } from "../ProjectStatusPanel";

export interface DevlogPreviewProps extends Omit<
  ComponentProps<"section">,
  "ref" | "title"
> {
  /** Newest first; only the first `limit` are shown. */
  entries: DevlogEntry[];
  status: ProjectStatus;
  /** Number of latest entries to show. */
  limit?: number;
  devlogHref?: string;
  feedHref?: string;
}

/**
 * The home page's slice of the devlog: the latest few entries as a compact
 * timeline beside the project overview, with a link to the whole devlog and
 * to its RSS feed. A Server Component.
 */
export function DevlogPreview({
  entries,
  status,
  limit = 3,
  devlogHref = "/devlog",
  feedHref = "/devlog/feed.xml",
  className,
  ...props
}: DevlogPreviewProps) {
  return (
    <section
      aria-labelledby="devlog-preview-title"
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <Text
          as="h2"
          id="devlog-preview-title"
          size="heading-lg"
          weight="semibold"
        >
          Nhật ký phát triển
        </Text>
        <Text as="p" size="body-md" color="secondary">
          Những gì vừa hoàn thành và dự án đang đi đến đâu.
        </Text>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
        <DevlogTimeline
          entries={entries.slice(0, limit)}
          titleAs="h3"
          isCompact
        />
        <ProjectStatusPanel status={status} titleAs="h3" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LinkButton href={devlogHref} variant="accent" rightIcon={ArrowRight}>
          Xem toàn bộ devlog
        </LinkButton>
        <LinkButton href={feedHref} variant="outline" leftIcon={Rss}>
          RSS
        </LinkButton>
      </div>
    </section>
  );
}
