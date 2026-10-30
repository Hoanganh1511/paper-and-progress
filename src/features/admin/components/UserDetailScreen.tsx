"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, Card, Skeleton, Text } from "@/design-system";
import {
  AdminApiError,
  getAdminUser,
  listAdminLoginHistory,
} from "../adminApi";
import { PAGE_SIZE, formatDateTime } from "../format";
import { useAdminQuery } from "../useAdminQuery";
import { LoginHistoryTable } from "./LoginHistoryTable";
import { ProviderBadges } from "./ProviderBadges";
import { QueryError } from "./QueryError";
import { TablePager } from "./TablePager";
import { TwoFactorStatus } from "./TwoFactorStatus";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-body-sm text-text-secondary">{label}</dt>
      <dd className="text-body-md">{children}</dd>
    </div>
  );
}

/** `/admin/users/[id]`: the account's details and its own login history. */
export function UserDetailScreen({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const user = useAdminQuery(() => getAdminUser(userId), `user-${userId}`);
  const logins = useAdminQuery(
    () => listAdminLoginHistory({ userId, page, limit: PAGE_SIZE }),
    `logins-${userId}-${page}`,
  );
  const detail = user.data;
  const isMissing =
    user.error instanceof AdminApiError && user.error.status === 404;

  return (
    <>
      <Link
        href="/admin/users"
        className="inline-flex min-h-11 items-center gap-1 self-start text-body-md font-medium underline underline-offset-4"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Danh sách users
      </Link>

      {isMissing ? (
        <Text role="alert">User không tồn tại.</Text>
      ) : (
        <QueryError error={user.error} onRetry={user.reload} />
      )}

      <Card as="section" aria-labelledby="user-title">
        <Text
          as="h1"
          id="user-title"
          size="heading-lg"
          weight="bold"
          className="font-display"
        >
          {detail?.email ?? "User"}
        </Text>
        {detail ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Tên hiển thị">{detail.displayName ?? "—"}</Field>
            <Field label="Role">{detail.role}</Field>
            <Field label="Trạng thái">
              <Badge variant={detail.isActive ? "success" : "danger"} size="sm">
                {detail.isActive ? "Hoạt động" : "Bị khoá"}
              </Badge>
            </Field>
            <Field label="Provider">
              <ProviderBadges providers={detail.providers} />
            </Field>
            <Field label="2FA">
              <TwoFactorStatus isEnabled={detail.totpEnabled} />
              {detail.totpEnabledAt && (
                <span className="ml-2 text-body-sm text-text-secondary">
                  từ {formatDateTime(detail.totpEnabledAt)}
                </span>
              )}
            </Field>
            <Field label="Ngày tạo">{formatDateTime(detail.createdAt)}</Field>
          </dl>
        ) : (
          !user.error && <Skeleton className="h-24 w-full" />
        )}
      </Card>

      <Card as="section" aria-labelledby="user-logins" padding="compact">
        <Text as="h2" id="user-logins" size="heading-sm" weight="bold">
          Lịch sử đăng nhập
        </Text>
        <QueryError error={logins.error} onRetry={logins.reload} />
        <LoginHistoryTable
          items={logins.data?.items}
          showUser={false}
          isLoading={logins.isLoading}
        />
        <TablePager
          page={page}
          total={logins.data?.total ?? 0}
          onPageChange={setPage}
        />
      </Card>
    </>
  );
}
