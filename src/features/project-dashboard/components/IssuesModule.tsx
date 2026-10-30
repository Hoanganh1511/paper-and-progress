"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Ban, type LucideIcon } from "lucide-react";
import { Badge, Card, Drawer, Skeleton, Text, cn } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useDashboard } from "../DashboardContext";
import { ISSUE_BADGE_VARIANT, ISSUE_LABELS, STATUS_ICONS } from "../display";
import { getIssues } from "../projectDashboardApi";
import { toPlainText } from "../richText";
import type { IssueItem } from "../types";
import { CollapseToggle, useCollapse } from "./CollapseToggle";
import { ModuleError } from "./ModuleError";
import { PagerRow } from "./PagerRow";

const PAGE_SIZE = 20;

export interface IssueCardProps {
  issue: IssueItem;
  onOpen: (id: string) => void;
}

/** One issue: status icon, a badge for each way it is stuck, the title and a short description. */
export function IssueCard({ issue, onOpen }: IssueCardProps) {
  const { icon: StatusIcon, className } = STATUS_ICONS[issue.status];
  return (
    <button
      type="button"
      onClick={() => onOpen(issue.id)}
      className="flex w-full cursor-pointer items-start gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-3 text-left transition-colors hover:bg-surface-sunken motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
    >
      <StatusIcon
        aria-hidden="true"
        size={20}
        className={cn("mt-0.5 shrink-0", className)}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap gap-1">
          {issue.issueTypes.map((type) => (
            <Badge key={type} size="sm" variant={ISSUE_BADGE_VARIANT[type]}>
              {ISSUE_LABELS[type]}
            </Badge>
          ))}
        </span>
        <span className="text-body-md font-bold break-words">
          {issue.title}
        </span>
        {issue.description && (
          <span className="line-clamp-2 text-body-sm text-text-secondary">
            {toPlainText(issue.description)}
          </span>
        )}
        <span className="text-[11px] text-text-secondary">
          {issue.categoryName}
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        size={16}
        className="mt-1 shrink-0 text-text-secondary"
      />
    </button>
  );
}

interface SummaryRowProps {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  description: string;
  count: number;
}

function SummaryRow({
  icon: Icon,
  iconClassName,
  label,
  description,
  count,
}: SummaryRowProps) {
  return (
    <li className="flex min-h-[3rem] items-center gap-3 border-b border-[#e5e5e5] py-2 last:border-b-0">
      <Icon
        aria-hidden="true"
        size={20}
        className={cn("shrink-0", iconClassName)}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-sm font-semibold">{label}</span>
        <span className="text-[11px] text-text-secondary">{description}</span>
      </span>
      <span className="font-display text-heading-sm font-bold">{count}</span>
    </li>
  );
}

/** Module B: three counts and the top three issues; "Xem tất cả" opens the full list. */
export function IssuesModule() {
  const { stats, openCriterion } = useDashboard();
  const [isListOpen, setIsListOpen] = useState(false);
  const collapse = useCollapse();
  const data = stats.data;

  return (
    <Card
      as="section"
      aria-labelledby="issues-title"
      variant="elevated"
      padding="compact"
    >
      <div className="flex items-center justify-between gap-2">
        <Text as="h2" id="issues-title" size="heading-sm" weight="bold">
          Issues & Attention
        </Text>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsListOpen(true)}
            className="rounded-sharp text-body-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
          >
            Xem tất cả →
          </button>
          <CollapseToggle collapse={collapse} title="Issues & Attention" />
        </div>
      </div>

      <div
        id={collapse.bodyId}
        hidden={collapse.isCollapsed}
        className="flex flex-col gap-3"
      >
        {!data && stats.error ? (
          <ModuleError error={stats.error} onRetry={stats.reload} />
        ) : !data ? (
          <div aria-busy="true" className="flex flex-col gap-3">
            <span role="status" className="sr-only">
              Đang tải
            </span>
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <ul aria-label="Thống kê vấn đề">
              <SummaryRow
                icon={Ban}
                iconClassName="text-danger-text"
                label="Blocked"
                description="Tiêu chí đang bị chặn"
                count={data.statistics.blocked}
              />
              <SummaryRow
                icon={AlertTriangle}
                iconClassName="text-[#d97706]"
                label="Overdue"
                description="Quá hạn nhưng chưa hoàn thành"
                count={data.outstanding.overdue}
              />
            </ul>

            <section
              aria-labelledby="highlighted-title"
              className="flex flex-col gap-2"
            >
              <Text
                as="h3"
                id="highlighted-title"
                size="body-md"
                weight="semibold"
              >
                Các vấn đề nổi bật
              </Text>
              {data.issues.length === 0 ? (
                <Text
                  size="body-sm"
                  color="secondary"
                  className="py-4 text-center"
                >
                  Không có vấn đề cần xử lý.
                </Text>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.issues.map((issue) => (
                    <li key={issue.id}>
                      <IssueCard issue={issue} onOpen={openCriterion} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {isListOpen && <AllIssuesDrawer onClose={() => setIsListOpen(false)} />}
    </Card>
  );
}

function AllIssuesDrawer({ onClose }: { onClose: () => void }) {
  const { version, openCriterion } = useDashboard();
  const [page, setPage] = useState(1);
  const query = useAdminQuery(
    () => getIssues({ page, limit: PAGE_SIZE }),
    `issues-${page}-${version}`,
  );
  const items = query.data?.items;

  return (
    <Drawer
      open
      onClose={onClose}
      side="right"
      title="Tất cả vấn đề"
      closeLabel="Đóng"
      className="sm:w-[28rem]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {query.error && !items ? (
          <ModuleError error={query.error} onRetry={query.reload} />
        ) : !items ? (
          <Text role="status" color="secondary">
            Đang tải...
          </Text>
        ) : items.length === 0 ? (
          <Text color="secondary" className="py-8 text-center">
            Không có vấn đề cần xử lý.
          </Text>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((issue) => (
              <li key={issue.id}>
                <IssueCard issue={issue} onOpen={openCriterion} />
              </li>
            ))}
          </ul>
        )}
        <PagerRow
          page={page}
          total={query.data?.total ?? 0}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </Drawer>
  );
}
