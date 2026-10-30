"use client";

import { useState } from "react";
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  cn,
} from "@/design-system";
import {
  SECURITY_EVENT_TYPES,
  listAdminSecurityEvents,
  type SecurityEventType,
} from "../adminApi";
import {
  EVENT_LABELS,
  PAGE_SIZE,
  endOfDayIso,
  formatDateTime,
  startOfDayIso,
} from "../format";
import { useAdminQuery } from "../useAdminQuery";
import { DateRangeFilter } from "./DateRangeFilter";
import { QueryError } from "./QueryError";
import { TableMessage } from "./TableMessage";
import { SecurityEventBadge } from "./SecurityEventBadge";
import { TablePager } from "./TablePager";

const ALL = "all";

function formatMetadata(metadata: unknown) {
  if (metadata == null) return "—";
  return typeof metadata === "string" ? metadata : JSON.stringify(metadata);
}

/** `/admin/security-events`: failed 2FA, rejected reCAPTCHA and the other security signals. */
export function SecurityEventsScreen() {
  const [type, setType] = useState<string>(ALL);
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);

  const query = useAdminQuery(
    () =>
      listAdminSecurityEvents({
        page,
        limit: PAGE_SIZE,
        type: type === ALL ? undefined : (type as SecurityEventType),
        from: startOfDayIso(range.from),
        to: endOfDayIso(range.to),
      }),
    JSON.stringify([page, type, range]),
  );
  const items = query.data?.items;

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Security Events
      </Text>
      <div className="flex flex-wrap items-end gap-4">
        <FormField label="Loại sự kiện">
          <Select
            value={type}
            onValueChange={(value) => {
              setType(value);
              setPage(1);
            }}
            className="w-56"
          >
            <SelectTrigger placeholder="Tất cả" />
            <SelectContent>
              <SelectItem value={ALL}>Tất cả</SelectItem>
              {SECURITY_EVENT_TYPES.map((eventType) => (
                <SelectItem key={eventType} value={eventType}>
                  {eventType} - {EVENT_LABELS[eventType]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <DateRangeFilter
          from={range.from}
          to={range.to}
          onChange={(next) => {
            setRange(next);
            setPage(1);
          }}
        />
      </div>
      <QueryError error={query.error} onRetry={query.reload} />
      <Table compact aria-busy={query.isLoading}>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>User</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Metadata</TableHead>
            <TableHead>Thời gian</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isLoading && "opacity-60")}>
          {items?.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <SecurityEventBadge type={event.type} />
              </TableCell>
              <TableCell>{event.user?.email ?? "—"}</TableCell>
              <TableCell className="font-mono">{event.ip ?? "—"}</TableCell>
              <TableCell
                className="max-w-xs truncate font-mono text-body-sm"
                title={formatMetadata(event.metadata)}
              >
                {formatMetadata(event.metadata)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(event.createdAt)}
              </TableCell>
            </TableRow>
          ))}
          {items?.length === 0 && (
            <TableMessage colSpan={5}>Không có sự kiện nào.</TableMessage>
          )}
          {!items && <TableMessage colSpan={5}>Đang tải...</TableMessage>}
        </TableBody>
      </Table>
      <TablePager
        page={page}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
      />
    </>
  );
}
