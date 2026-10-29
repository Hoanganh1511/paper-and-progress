import { Pencil } from "lucide-react";
import { Badge, Button, Text } from "@/design-system";
import {
  SKILL_LABELS,
  STATUS_LABELS,
  formatDiaryDate,
  formatDuration,
  toSafeUrl,
} from "../../logs";
import type { DiaryLog } from "../../types";
import { SKILL_BADGE_VARIANT } from "./DiaryTimeline";

export interface DiaryDetailProps {
  log: DiaryLog;
  onEdit: (log: DiaryLog) => void;
}

/** One scrolling panel of simple sections; empty sections are left out. */
export function DiaryDetail({ log, onEdit }: DiaryDetailProps) {
  const duration = formatDuration(log.durationMinutes);

  return (
    <article
      className="flex flex-col gap-5"
      aria-labelledby="diary-detail-title"
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={SKILL_BADGE_VARIANT[log.skill]}>
            {SKILL_LABELS[log.skill]}
          </Badge>
          {duration && <Text size="body-sm">{duration}</Text>}
          <Text size="body-sm" color="secondary">
            {formatDiaryDate(log.date)}
          </Text>
          <Badge
            variant={log.status === "completed" ? "success" : "warning"}
            dot
          >
            {STATUS_LABELS[log.status]}
          </Badge>
          {log.isArchived && <Badge>Đã lưu trữ</Badge>}
        </div>
        <Text
          as="h2"
          id="diary-detail-title"
          size="heading-md"
          weight="semibold"
        >
          {log.title}
        </Text>
      </header>

      <Section title="Mục tiêu">{log.goal}</Section>
      <Section title="Nội dung đã học">{log.content}</Section>
      {log.vocabulary.length > 0 && (
        <Section title="Từ vựng">
          <ul className="flex flex-wrap gap-2">
            {log.vocabulary.map((word) => (
              <li key={word}>
                <Badge>{word}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {log.resources.length > 0 && (
        <Section title="Tài liệu tham khảo">
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {log.resources.map((resource) => {
              const href = toSafeUrl(resource);
              return (
                <li key={resource} className="break-words">
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      {resource}
                    </a>
                  ) : (
                    resource
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      )}
      <Section title="Ghi chú">{log.notes}</Section>
      {log.tags.length > 0 && (
        <Section title="Tag">
          <ul className="flex flex-wrap gap-2">
            {log.tags.map((tag) => (
              <li key={tag}>
                <Badge size="sm">{`#${tag}`}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div>
        <Button variant="outline" leftIcon={Pencil} onClick={() => onEdit(log)}>
          Chỉnh sửa log
        </Button>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  if (!children) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <Text as="h3" size="body-sm" weight="semibold" color="secondary">
        {title}
      </Text>
      <div className="text-body-md whitespace-pre-wrap">{children}</div>
    </section>
  );
}
