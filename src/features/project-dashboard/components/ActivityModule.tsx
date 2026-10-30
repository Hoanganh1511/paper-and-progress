"use client";

import { useState } from "react";
import {
  Badge,
  Card,
  Drawer,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  Text,
  cn,
} from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { useDashboard } from "../DashboardContext";
import {
  ACTIVITY_TYPE_LABELS,
  activityDotClass,
  formatDateTime,
} from "../display";
import { getActivities, getRecentActivities } from "../projectDashboardApi";
import type { ActivityItem, ActivityType } from "../types";
import { CollapseToggle, useCollapse } from "./CollapseToggle";
import { ModuleError } from "./ModuleError";
import { PagerRow } from "./PagerRow";

const PAGE_SIZE = 20;
const ALL = "all";

export interface ActivityTimelineProps {
  items: ActivityItem[];
  onOpen: (criteriaId: string) => void;
}

/** A vertical timeline. An activity opens its criterion, unless that criterion has been deleted. */
export function ActivityTimeline({ items, onOpen }: ActivityTimelineProps) {
  return (
    <ol className="relative flex flex-col gap-4 before:absolute before:top-2 before:bottom-2 before:left-[6px] before:w-0.5 before:bg-[#d4d4d4]">
      {items.map((activity) => {
        const content = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 mt-1 size-[13px] shrink-0 rounded-pill border-2 border-border-strong",
                activityDotClass(activity),
              )}
            />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <time
                dateTime={activity.createdAt}
                className="text-[11px] text-text-secondary"
              >
                {formatDateTime(activity.createdAt)}
              </time>
              <span className="text-body-sm font-semibold break-words">
                {activity.title}
              </span>
              {activity.categoryName && (
                <Badge size="sm" className="self-start font-normal">
                  {activity.categoryName}
                </Badge>
              )}
            </span>
          </>
        );
        return (
          <li key={activity.id}>
            {activity.criteriaId ? (
              <button
                type="button"
                onClick={() => onOpen(activity.criteriaId as string)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-sharp text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
              >
                {content}
              </button>
            ) : (
              <div className="flex items-start gap-3">{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Module D: the five latest activities; "Xem tất cả" opens the whole history. */
export function ActivityModule() {
  const { version, openCriterion } = useDashboard();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const collapse = useCollapse();
  const query = useAdminQuery(
    () => getRecentActivities(5),
    `recent-activities-${version}`,
  );

  return (
    <Card
      as="section"
      aria-labelledby="activity-title"
      variant="elevated"
      padding="compact"
    >
      <div className="flex items-center justify-between gap-2">
        <Text as="h2" id="activity-title" size="heading-sm" weight="bold">
          Hoạt động gần đây
        </Text>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="rounded-sharp text-body-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus"
          >
            Xem tất cả →
          </button>
          <CollapseToggle collapse={collapse} title="Hoạt động gần đây" />
        </div>
      </div>

      <div
        id={collapse.bodyId}
        hidden={collapse.isCollapsed}
        className="flex flex-col gap-3"
      >
        {query.error && !query.data ? (
          <ModuleError error={query.error} onRetry={query.reload} />
        ) : !query.data ? (
          <div aria-busy="true" className="flex flex-col gap-3">
            <span role="status" className="sr-only">
              Đang tải
            </span>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : query.data.length === 0 ? (
          <Text size="body-sm" color="secondary" className="py-6 text-center">
            Chưa có hoạt động.
          </Text>
        ) : (
          <ActivityTimeline items={query.data} onOpen={openCriterion} />
        )}
      </div>

      {isHistoryOpen && (
        <ActivityHistoryDrawer onClose={() => setIsHistoryOpen(false)} />
      )}
    </Card>
  );
}

function ActivityHistoryDrawer({ onClose }: { onClose: () => void }) {
  const { version, openCriterion } = useDashboard();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<string>(ALL);
  const query = useAdminQuery(
    () =>
      getActivities({
        page,
        limit: PAGE_SIZE,
        type: type === ALL ? undefined : (type as ActivityType),
      }),
    `activities-${page}-${type}-${version}`,
  );
  const items = query.data?.items;

  return (
    <Drawer
      open
      onClose={onClose}
      side="right"
      title="Lịch sử hoạt động"
      closeLabel="Đóng"
      className="sm:w-[28rem]"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <FormField label="Loại hoạt động">
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value);
              setPage(1);
            }}
          >
            <SelectTrigger placeholder="Tất cả" />
            <SelectContent>
              <SelectItem value={ALL}>Tất cả</SelectItem>
              {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {ACTIVITY_TYPE_LABELS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>
        {query.error && !items ? (
          <ModuleError error={query.error} onRetry={query.reload} />
        ) : !items ? (
          <Text role="status" color="secondary">
            Đang tải...
          </Text>
        ) : items.length === 0 ? (
          <Text color="secondary" className="py-8 text-center">
            {type === ALL
              ? "Chưa có hoạt động."
              : "Không có kết quả phù hợp với bộ lọc."}
          </Text>
        ) : (
          <ActivityTimeline items={items} onOpen={openCriterion} />
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
