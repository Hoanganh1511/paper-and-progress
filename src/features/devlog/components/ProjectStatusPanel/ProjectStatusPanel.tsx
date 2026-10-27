import { useId, type ComponentProps } from "react";
import { FileText, Flame, Rocket } from "lucide-react";
import { Card, ProgressBar, Text } from "@/design-system";
import { formatDevlogDate } from "../../status";
import type { ProjectStatus } from "../../types";

export interface ProjectStatusPanelProps extends Omit<
  ComponentProps<"section">,
  "ref" | "title"
> {
  status: ProjectStatus;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: "h2" | "h3";
}

/**
 * The project at a glance: progress of each module and overall, then the
 * streak, number of entries and start date. Each bar has its name and
 * percentage as text next to it.
 */
export function ProjectStatusPanel({
  status,
  titleAs = "h2",
  className,
  ...props
}: ProjectStatusPanelProps) {
  const titleId = useId();

  return (
    <Card
      as="section"
      padding="compact"
      aria-labelledby={titleId}
      className={className}
      {...props}
    >
      <Text as={titleAs} id={titleId} size="heading-sm" weight="semibold">
        Tổng quan dự án
      </Text>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {status.modules.map((module) => (
          <li key={module.id} className="flex flex-col gap-1">
            <Text as="span" size="body-sm" weight="medium">
              {module.label}
            </Text>
            <ProgressBar
              value={module.progress}
              label={module.label}
              showValue
            />
          </li>
        ))}
        <li className="flex flex-col gap-1 border-t border-border-subtle pt-3">
          <Text as="span" size="body-sm" weight="semibold">
            Tổng thể
          </Text>
          <ProgressBar value={status.overall} label="Tổng thể" showValue />
        </li>
      </ul>

      <dl className="m-0 flex flex-col gap-2 font-body text-body-sm text-text-secondary">
        <div className="flex items-center gap-2">
          <Flame aria-hidden="true" size={16} />
          <dt>Streak:</dt>
          <dd className="m-0 font-semibold text-text-primary">
            {status.streak} ngày
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <FileText aria-hidden="true" size={16} />
          <dt>Số entry:</dt>
          <dd className="m-0 font-semibold text-text-primary">
            {status.entryCount}
          </dd>
        </div>
        {status.startedAt && (
          <div className="flex items-center gap-2">
            <Rocket aria-hidden="true" size={16} />
            <dt>Bắt đầu:</dt>
            <dd className="m-0 font-semibold text-text-primary">
              {formatDevlogDate(status.startedAt)}
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
