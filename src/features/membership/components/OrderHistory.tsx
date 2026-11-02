"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Alert,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  buttonVariants,
  cn,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { getMyMembershipOrders, type MembershipOrder } from "../membershipApi";

const dateTime = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
});
const money = new Intl.NumberFormat("vi-VN");

const PLAN_LABELS = { MONTH: "1 tháng", YEAR: "1 năm" } as const;

const STATUS: Record<
  MembershipOrder["status"],
  { label: string; variant: "yellow" | "success" | "default" }
> = {
  PENDING: { label: "Chờ xác nhận", variant: "yellow" },
  PAID: { label: "Đã thanh toán", variant: "success" },
  CANCELLED: { label: "Đã huỷ", variant: "default" },
};

/** The signed-in reader's own membership orders, newest first, with how each one ended. */
export function OrderHistory() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<MembershipOrder[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getMyMembershipOrders()
      .then((data) => isCurrent && setOrders(data))
      .catch(
        () =>
          isCurrent && setError("Không tải được lịch sử giao dịch của bạn."),
      );
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, isLoading]);

  if (isLoading || (isAuthenticated && !orders && !error)) {
    return (
      <div aria-busy="true">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Text>Đăng nhập để xem lịch sử giao dịch của bạn.</Text>
        <Link
          href={loginHref(pathname)}
          className={cn(buttonVariants({ variant: "primary" }))}
        >
          Đăng nhập
        </Link>
      </div>
    );
  }
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Text color="secondary">Bạn chưa có giao dịch nào.</Text>
        <Link
          href="/membership"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Xem quyền lợi hội viên
        </Link>
      </div>
    );
  }

  return (
    <Table compact>
      <caption className="sr-only">Lịch sử giao dịch hội viên</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Ngày tạo</TableHead>
          <TableHead>Gói</TableHead>
          <TableHead>Số tiền</TableHead>
          <TableHead>Nội dung chuyển khoản</TableHead>
          <TableHead>Trạng thái</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="whitespace-nowrap">
              {dateTime.format(new Date(order.createdAt))}
            </TableCell>
            <TableCell>{PLAN_LABELS[order.plan]}</TableCell>
            <TableCell className="whitespace-nowrap">
              {money.format(order.amount)} đ
            </TableCell>
            <TableCell className="font-mono">{order.code}</TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                <Badge variant={STATUS[order.status].variant} size="sm">
                  {STATUS[order.status].label}
                </Badge>
                {order.status === "PAID" && order.paidAt && (
                  <Text as="span" size="caption" color="secondary">
                    {dateTime.format(new Date(order.paidAt))}
                  </Text>
                )}
                {order.status === "PENDING" && (
                  <Link
                    href="/membership"
                    className="text-body-sm underline underline-offset-4"
                  >
                    Xem mã QR
                  </Link>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
