import { Pagination, Text } from "@/design-system";

export interface PagerRowProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

/** "Tổng N" and page buttons; renders nothing when everything fits on one page. */
export function PagerRow({ page, total, limit, onPageChange }: PagerRowProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Text size="body-sm" color="secondary">
        Tổng {total}
      </Text>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={onPageChange}
        siblingCount={0}
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
