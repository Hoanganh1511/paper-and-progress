"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Badge,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  cn,
} from "@/design-system";
import { listAdminUsers } from "../adminApi";
import { PAGE_SIZE, formatDateTime } from "../format";
import { TableMessage } from "./TableMessage";
import { TwoFactorStatus } from "./TwoFactorStatus";
import { useAdminQuery, useDebouncedValue } from "../useAdminQuery";
import { ProviderBadges } from "./ProviderBadges";
import { QueryError } from "./QueryError";
import { TablePager } from "./TablePager";

/** `/admin/users`: every account, searchable by email; a row opens the user's detail page. */
export function UsersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  const query = useAdminQuery(
    () => listAdminUsers({ page, limit: PAGE_SIZE, search: debouncedSearch }),
    JSON.stringify([page, debouncedSearch]),
  );
  const items = query.data?.items;

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Users
      </Text>
      <SearchInput
        aria-label="Tìm theo email"
        placeholder="Tìm theo email"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setPage(1);
        }}
        className="w-full sm:w-80"
      />
      <QueryError error={query.error} onRetry={query.reload} />
      <Table compact hoverable aria-busy={query.isLoading}>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Đăng nhập gần nhất</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={cn(query.isLoading && "opacity-60")}>
          {items?.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/users/detail?id=${user.id}`)}
            >
              <TableCell>
                <Link
                  href={`/admin/users/detail?id=${user.id}`}
                  onClick={(event) => event.stopPropagation()}
                  className="font-medium underline underline-offset-4"
                >
                  {user.email}
                </Link>
                {!user.isActive && (
                  <Badge variant="danger" size="sm" className="ml-2">
                    Bị khoá
                  </Badge>
                )}
              </TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <ProviderBadges providers={user.providers} />
              </TableCell>
              <TableCell>
                <TwoFactorStatus isEnabled={user.totpEnabled} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(user.createdAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—"}
              </TableCell>
            </TableRow>
          ))}
          {items?.length === 0 && (
            <TableMessage colSpan={6}>Không tìm thấy user nào.</TableMessage>
          )}
          {!items && <TableMessage colSpan={6}>Đang tải...</TableMessage>}
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
