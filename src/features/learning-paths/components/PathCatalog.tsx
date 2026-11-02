import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { Badge, Card, Text, cn, focusRingClasses } from "@/design-system";
import { LEVEL_LABEL, formatMinutes } from "../format";
import type { PathSummary } from "../types";

/** The published paths as cards; each card is one link, named by the path title. */
export function PathCatalog({ paths }: { paths: PathSummary[] }) {
  if (paths.length === 0) {
    return (
      <Text color="secondary" role="status">
        Chưa có lộ trình nào phù hợp.
      </Text>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {paths.map((path) => {
        const level = LEVEL_LABEL[path.level];
        return (
          <li key={path.slug}>
            <Card padding="compact" interactive className="relative h-full">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={level.variant} size="sm">
                  {level.label}
                </Badge>
                {path.totalMinutes !== null && (
                  <span className="flex items-center gap-1 text-text-muted">
                    <Clock aria-hidden="true" size={14} />
                    <Text as="span" size="caption" color="muted">
                      {formatMinutes(path.totalMinutes)}
                    </Text>
                  </span>
                )}
              </div>
              <Text as="h2" size="heading-sm" weight="semibold">
                <Link
                  href={`/paths/${path.slug}`}
                  className={cn(
                    "rounded-sharp after:absolute after:inset-0 after:content-['']",
                    focusRingClasses,
                  )}
                >
                  {path.title}
                </Link>
              </Text>
              <Text size="body-sm" color="secondary">
                {path.description}
              </Text>
              <span className="flex items-center gap-1 text-text-muted">
                <BookOpen aria-hidden="true" size={14} />
                <Text as="span" size="caption" color="muted">
                  {path.phaseCount} giai đoạn · {path.stepCount} bước
                </Text>
              </span>
              {path.progress && path.progress.state !== "NOT_STARTED" && (
                <Text size="caption" color="secondary">
                  {path.progress.state === "COMPLETED"
                    ? "Đã hoàn thành"
                    : `Đã xong ${path.progress.completedSteps}/${path.progress.totalSteps} bước`}
                </Text>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
