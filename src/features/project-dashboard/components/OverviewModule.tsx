"use client";

import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Badge, Card, Skeleton, Text, cn } from "@/design-system";
import { useDashboard } from "../DashboardContext";
import {
  HEALTH_BADGE_VARIANT,
  HEALTH_LABELS,
  STAT_ICON_FOR_STATUS,
  formatDate,
} from "../display";
import type { CriteriaStatus, DashboardFilter } from "../types";
import { CollapseToggle, useCollapse } from "./CollapseToggle";
import { ModuleError } from "./ModuleError";

interface StatCardSpec {
  key: "total" | "completed" | "inProgress" | "notStarted" | "blocked";
  label: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  status?: CriteriaStatus;
}

const STAT_CARDS: StatCardSpec[] = [
  {
    key: "total",
    label: "Tổng tiêu chí",
    description: "Tất cả tiêu chí của dự án",
    icon: STAT_ICON_FOR_STATUS.COMPLETED,
    iconClassName: "text-text-primary",
  },
  {
    key: "completed",
    label: "Đã hoàn thành",
    description: "Đã đạt yêu cầu",
    icon: STAT_ICON_FOR_STATUS.COMPLETED,
    iconClassName: "text-success-text",
    status: "COMPLETED",
  },
  {
    key: "inProgress",
    label: "Đang thực hiện",
    description: "Đang được phát triển",
    icon: STAT_ICON_FOR_STATUS.IN_PROGRESS,
    iconClassName: "text-info-text",
    status: "IN_PROGRESS",
  },
  {
    key: "notStarted",
    label: "Chưa bắt đầu",
    description: "Chưa có hoạt động nào",
    icon: STAT_ICON_FOR_STATUS.NOT_STARTED,
    iconClassName: "text-text-muted",
    status: "NOT_STARTED",
  },
  {
    key: "blocked",
    label: "Đang bị chặn",
    description: "Cần gỡ vướng mắc",
    icon: STAT_ICON_FOR_STATUS.BLOCKED,
    iconClassName: "text-danger-text",
    status: "BLOCKED",
  },
];

interface OutstandingSpec {
  key: "overdue";
  label: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  filter: DashboardFilter;
}

const OUTSTANDING: OutstandingSpec[] = [
  {
    key: "overdue",
    label: "Quá hạn",
    description: "Chưa hoàn thành và đã quá deadline",
    icon: AlertTriangle,
    iconClassName: "text-[#d97706]",
    filter: { kind: "issue", issue: "OVERDUE" },
  },
];

function isSameFilter(a: DashboardFilter, b: DashboardFilter) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "status" && b.kind === "status") return a.status === b.status;
  if (a.kind === "issue" && b.kind === "issue") return a.issue === b.issue;
  return true;
}

const pressedClasses =
  "w-full cursor-pointer rounded-standard border text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/** Module A: the project's name and health, the five criteria counts and the outstanding issues. Each count narrows the criteria list. */
export function OverviewModule() {
  const { stats, filter, setFilter } = useDashboard();
  const collapse = useCollapse();
  const data = stats.data;

  return (
    <Card
      as="section"
      aria-labelledby="overview-title"
      variant="elevated"
      className="@container gap-5"
    >
      {!data && stats.error ? (
        <ModuleError error={stats.error} onRetry={stats.reload} />
      ) : !data ? (
        <OverviewSkeleton />
      ) : (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Text
                as="h2"
                id="overview-title"
                weight="bold"
                className="text-[22px] leading-tight"
              >
                Website Project Overview
              </Text>
              <Text size="body-md" color="secondary">
                {data.project.name}
                {data.project.description
                  ? ` · ${data.project.description}`
                  : ""}
              </Text>
              <Text size="body-sm" color="secondary">
                Cập nhật {formatDate(data.project.updatedAt)}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={HEALTH_BADGE_VARIANT[data.project.health]}>
                <span aria-hidden="true">● </span>
                {HEALTH_LABELS[data.project.health]}
              </Badge>
              <CollapseToggle
                collapse={collapse}
                title="Website Project Overview"
              />
            </div>
          </header>

          <div
            id={collapse.bodyId}
            hidden={collapse.isCollapsed}
            className="flex flex-col gap-5"
          >
            <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-5">
              {STAT_CARDS.map((card) => {
                const target: DashboardFilter = card.status
                  ? { kind: "status", status: card.status }
                  : { kind: "all" };
                const isActive = isSameFilter(filter, target);
                const Icon = card.icon;
                return (
                  <li key={card.key}>
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setFilter(target)}
                      className={cn(
                        pressedClasses,
                        "flex flex-col items-start gap-1 p-3",
                        isActive
                          ? "border-border-strong bg-accent-yellow/30"
                          : "border-[#e5e5e5] bg-surface-card hover:bg-surface-sunken",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        size={22}
                        className={card.iconClassName}
                      />
                      <span className="font-display text-[30px] leading-none font-bold">
                        {data.statistics[card.key]}
                      </span>
                      <span className="text-[12px] font-semibold">
                        {card.label}
                      </span>
                      <span className="text-[11px] text-text-secondary">
                        {card.description}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <hr className="border-t border-[#e5e5e5]" />

            <section
              aria-labelledby="outstanding-title"
              className="flex flex-col gap-3"
            >
              <Text
                as="h3"
                id="outstanding-title"
                size="body-lg"
                weight="semibold"
              >
                Tình trạng tồn đọng & vấn đề
              </Text>
              <ul className="grid gap-3 @xl:grid-cols-3">
                {OUTSTANDING.map((item) => {
                  const isActive = isSameFilter(filter, item.filter);
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setFilter(item.filter)}
                        className={cn(
                          pressedClasses,
                          "flex items-start gap-3 p-3",
                          isActive
                            ? "border-border-strong bg-accent-yellow/30"
                            : "border-[#e5e5e5] bg-surface-card hover:bg-surface-sunken",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          size={22}
                          className={cn("mt-0.5 shrink-0", item.iconClassName)}
                        />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-[12px] font-semibold">
                            {item.label}
                          </span>
                          <span className="font-display text-[28px] leading-none font-bold">
                            {data.outstanding[item.key]}
                          </span>
                          <span className="text-[11px] text-text-secondary">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span role="status" className="sr-only">
        Đang tải
      </span>
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 gap-3 @xl:grid-cols-3 @3xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
