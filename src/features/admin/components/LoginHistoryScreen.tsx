"use client";

import { useState } from "react";
import { SearchInput, Text } from "@/design-system";
import { listAdminLoginHistory } from "../adminApi";
import { PAGE_SIZE, endOfDayIso, startOfDayIso } from "../format";
import { useAdminQuery, useDebouncedValue } from "../useAdminQuery";
import { DateRangeFilter } from "./DateRangeFilter";
import { LoginHistoryTable } from "./LoginHistoryTable";
import { QueryError } from "./QueryError";
import { TablePager } from "./TablePager";

/** `/admin/login-history`: every sign-in, filterable by date and by email or IP. */
export function LoginHistoryScreen() {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search.trim());

  const query = useAdminQuery(
    () =>
      listAdminLoginHistory({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        from: startOfDayIso(range.from),
        to: endOfDayIso(range.to),
      }),
    JSON.stringify([page, debouncedSearch, range]),
  );

  return (
    <>
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Login History
      </Text>
      <div className="flex flex-wrap items-end gap-4">
        <SearchInput
          aria-label="Tìm theo email hoặc IP"
          placeholder="Tìm theo email hoặc IP"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          onClear={() => {
            setSearch("");
            setPage(1);
          }}
          className="w-full sm:w-72"
        />
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
      <LoginHistoryTable
        items={query.data?.items}
        isLoading={query.isLoading}
      />
      <TablePager
        page={page}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
      />
    </>
  );
}
