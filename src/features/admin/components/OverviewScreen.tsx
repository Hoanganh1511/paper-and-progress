"use client";

import Link from "next/link";
import {
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
} from "@/design-system";
import { getAdminStats, listAdminSecurityEvents } from "../adminApi";
import { formatDateTime } from "../format";
import { TableMessage } from "./TableMessage";
import { useAdminQuery } from "../useAdminQuery";
import { EventsByTypeChart, LoginsByDayChart } from "./AdminCharts";
import { QueryError } from "./QueryError";
import { SecurityEventBadge } from "./SecurityEventBadge";
import { StatCard } from "./StatCard";

const number = (n: number) => n.toLocaleString("vi-VN");

/** `/admin`: the headline numbers, two 7-day charts and the latest security events. */
export function OverviewScreen() {
  const stats = useAdminQuery(getAdminStats, "stats");
  const events = useAdminQuery(
    () => listAdminSecurityEvents({ page: 1, limit: 5 }),
    "recent-events",
  );
  const data = stats.data;
  const twoFactorPercent =
    data && data.users.total > 0
      ? Math.round((data.twoFactor.enabled / data.users.total) * 100)
      : 0;

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Overview
      </Text>

      <QueryError error={stats.error} onRetry={stats.reload} />
      <section
        aria-label="Số liệu chính"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {data ? (
          <>
            <StatCard label="Tổng users" value={number(data.users.total)} />
            <StatCard
              label="Users mới tuần này"
              value={number(data.users.newThisWeek)}
              hint={`${number(data.users.newToday)} hôm nay`}
            />
            <StatCard
              label="Logins hôm nay"
              value={number(data.logins.today)}
              hint={`${number(data.logins.thisWeek)} trong 7 ngày`}
            />
            <StatCard
              label="% users bật 2FA"
              value={`${twoFactorPercent}%`}
              hint={`${number(data.twoFactor.enabled)} / ${number(data.users.total)} users`}
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card as="section" aria-labelledby="chart-logins">
          <Text as="h2" id="chart-logins" size="heading-sm" weight="bold">
            Logins theo ngày (7 ngày)
          </Text>
          {data ? (
            <LoginsByDayChart data={data.loginsByDay} />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </Card>
        <Card as="section" aria-labelledby="chart-events">
          <Text as="h2" id="chart-events" size="heading-sm" weight="bold">
            Security events theo loại (7 ngày)
          </Text>
          {data ? (
            <EventsByTypeChart data={data.securityEventsLast7Days} />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </Card>
      </div>

      <Card as="section" aria-labelledby="recent-events" padding="compact">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text as="h2" id="recent-events" size="heading-sm" weight="bold">
            Security events gần đây
          </Text>
          <Link
            href="/admin/security-events"
            className="text-body-sm font-medium underline underline-offset-4"
          >
            Xem tất cả
          </Link>
        </div>
        <QueryError error={events.error} onRetry={events.reload} />
        <Table compact>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Thời gian</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.data?.items.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <SecurityEventBadge type={event.type} />
                </TableCell>
                <TableCell>{event.user?.email ?? "—"}</TableCell>
                <TableCell>{event.ip ?? "—"}</TableCell>
                <TableCell>{formatDateTime(event.createdAt)}</TableCell>
              </TableRow>
            ))}
            {events.data?.items.length === 0 && (
              <TableMessage colSpan={4}>Chưa có sự kiện nào.</TableMessage>
            )}
            {!events.data && !events.error && (
              <TableMessage colSpan={4}>Đang tải...</TableMessage>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
