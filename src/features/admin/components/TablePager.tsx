import { Pagination, Text } from "@/design-system";
import { PAGE_SIZE, pageCountOf } from "../format";

export interface TablePagerProps {
  page: number;
  total: number;
  onPageChange: (page: number) => void;
  limit?: number;
}

/** "Tổng N" on the left, page buttons on the right. */
export function TablePager({
  page,
  total,
  onPageChange,
  limit = PAGE_SIZE,
}: TablePagerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Text size="body-sm" color="secondary">
        Tổng {total.toLocaleString("vi-VN")} bản ghi
      </Text>
      <Pagination
        page={page}
        pageCount={pageCountOf(total, limit)}
        onPageChange={onPageChange}
        labels={{
          navigation: "Phân trang",
          previous: "Trang trước",
          next: "Trang sau",
          page: "Trang {page}",
        }}
      />
    </div>
  );
}
