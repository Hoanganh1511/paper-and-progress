"use client";

import { useId, type ComponentProps } from "react";
import {
  Badge,
  Card,
  ProgressBar,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
  cn,
} from "@/design-system";
import { Mascot } from "@/features/english/components/Mascot";
import { formatDevlogDate } from "@/features/devlog/status";
import type { PeriodProgress } from "@/features/devlog/types";

export interface GoalsCardProps extends Omit<
  ComponentProps<"section">,
  "children" | "ref"
> {
  week: PeriodProgress;
  month: PeriodProgress;
}

function encouragement(period: PeriodProgress) {
  if (period.totalEntries === 0) {
    return "Chưa có hoạt động nào trong kỳ này. Một entry nhỏ cũng là một bước tiến!";
  }
  if (period.totalGained === 0) {
    return `Bạn đã ghi ${period.totalEntries} entry. Tiếp tục nhé!`;
  }
  return `Tuyệt vời! ${period.totalEntries} entry và tiến thêm ${period.totalGained} điểm.`;
}

function PeriodView({ period }: { period: PeriodProgress }) {
  return (
    <div className="flex flex-col gap-4">
      {period.endsAt && (
        <Text as="p" size="caption" color="muted">
          {period.days} ngày kết thúc{" "}
          <time dateTime={period.endsAt}>
            {formatDevlogDate(period.endsAt)}
          </time>
        </Text>
      )}
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {period.modules.map((module) => (
          <li key={module.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Text as="span" size="body-md" weight="medium">
                {module.label}
              </Text>
              {module.gained > 0 && (
                <Badge size="sm" variant="success">
                  +{module.gained} điểm
                </Badge>
              )}
            </div>
            <ProgressBar
              value={module.progress}
              label={`Tiến độ ${module.label}`}
              showValue
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3 rounded-standard border-2 border-border-strong bg-accent-yellow/30 p-3">
        <Mascot
          accessory="trophy"
          aria-hidden="true"
          className="size-14 shrink-0"
        />
        <Text as="p" size="body-sm" role="status">
          {encouragement(period)}
        </Text>
      </div>
    </div>
  );
}

/**
 * Goals and progress for the last week and month: where each module stands,
 * what it gained in the period, and a word of encouragement from the mascot.
 */
export function GoalsCard({
  week,
  month,
  className,
  ...props
}: GoalsCardProps) {
  const titleId = useId();

  return (
    <Card
      as="section"
      aria-labelledby={titleId}
      className={cn("rounded-soft", className)}
      {...props}
    >
      <Text as="h2" id={titleId} size="heading-md" weight="semibold">
        Mục tiêu &amp; tiến độ
      </Text>
      <Tabs defaultValue="week">
        <TabList aria-label="Khoảng thời gian">
          <TabTrigger value="week">Tuần</TabTrigger>
          <TabTrigger value="month">Tháng</TabTrigger>
        </TabList>
        <TabPanel value="week" className="pt-4">
          <PeriodView period={week} />
        </TabPanel>
        <TabPanel value="month" className="pt-4">
          <PeriodView period={month} />
        </TabPanel>
      </Tabs>
    </Card>
  );
}
