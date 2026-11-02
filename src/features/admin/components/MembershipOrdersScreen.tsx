"use client";

import { useState } from "react";
import {
  Alert,
  Button,
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
  cancelAdminMembershipOrder,
  confirmAdminMembershipOrder,
  listAdminMembershipOrders,
  type MembershipOrderStatus,
} from "../adminApi";
import { formatDateTime } from "../format";
import { useAdminQuery } from "../useAdminQuery";
import { QueryError } from "./QueryError";
import { TableMessage } from "./TableMessage";

const money = new Intl.NumberFormat("vi-VN");

const STATUS_LABELS: Record<MembershipOrderStatus, string> = {
  PENDING: "Chờ tiền",
  PAID: "Đã nhận tiền",
  CANCELLED: "Đã huỷ",
};

const PLAN_LABELS = { MONTH: "1 tháng", YEAR: "1 năm" } as const;

/**
 * `/admin/membership-orders`: the orders readers opened. Match an order's
 * amount and note with the bank app; "Đã nhận tiền" is what grants the
 * membership, so only press it once the money is in.
 */
export function MembershipOrdersScreen() {
  const [status, setStatus] = useState<MembershipOrderStatus>("PENDING");
  const [busyId, setBusyId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const query = useAdminQuery(() => listAdminMembershipOrders(status), status);
  const items = query.data;

  async function act(id: string, action: (id: string) => Promise<unknown>) {
    setBusyId(id);
    setActionError(undefined);
    try {
      await action(id);
      query.reload();
    } catch (caught) {
      setActionError(
        caught instanceof Error ? caught.message : "Thao tác không thành công.",
      );
    } finally {
      setBusyId(undefined);
    }
  }

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Đơn hội viên
      </Text>
      <div className="flex flex-wrap items-end gap-4">
        <FormField label="Trạng thái">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as MembershipOrderStatus)}
            className="w-56"
          >
            <SelectTrigger placeholder="Chờ tiền" />
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as MembershipOrderStatus[]).map(
                (value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      {actionError && <Alert variant="danger">{actionError}</Alert>}
      <QueryError error={query.error} onRetry={query.reload} />
      <Table compact aria-busy={query.isLoading}>
        <TableHeader>
          <TableRow>
            <TableHead>Người mua</TableHead>
            <TableHead>Gói</TableHead>
            <TableHead>Số tiền</TableHead>
            <TableHead>Nội dung CK</TableHead>
            <TableHead>Tạo lúc</TableHead>
            <TableHead>
              <span className="sr-only">Thao tác</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isLoading && "opacity-60")}>
          {items?.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                {order.user.displayName ?? order.user.email}
              </TableCell>
              <TableCell>{PLAN_LABELS[order.plan]}</TableCell>
              <TableCell className="whitespace-nowrap">
                {money.format(order.amount)} đ
              </TableCell>
              <TableCell className="font-mono">{order.code}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(order.createdAt)}
              </TableCell>
              <TableCell>
                {order.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button
                      size="compact"
                      variant="primary"
                      disabled={busyId === order.id}
                      onClick={() => act(order.id, confirmAdminMembershipOrder)}
                      aria-label={`Đã nhận tiền, đơn ${order.code}`}
                    >
                      Đã nhận tiền
                    </Button>
                    <Button
                      size="compact"
                      variant="outline"
                      disabled={busyId === order.id}
                      onClick={() => act(order.id, cancelAdminMembershipOrder)}
                      aria-label={`Huỷ đơn ${order.code}`}
                    >
                      Huỷ
                    </Button>
                  </div>
                ) : (
                  <Text as="span" size="body-sm" color="secondary">
                    {order.paidAt
                      ? `Nhận ${formatDateTime(order.paidAt)}${order.receivedAmount === null ? "" : ` · ${money.format(order.receivedAmount)} đ (tự động)`}`
                      : STATUS_LABELS[order.status]}
                  </Text>
                )}
              </TableCell>
            </TableRow>
          ))}
          {items?.length === 0 && (
            <TableMessage colSpan={6}>Không có đơn nào.</TableMessage>
          )}
          {!items && <TableMessage colSpan={6}>Đang tải...</TableMessage>}
        </TableBody>
      </Table>
    </>
  );
}
