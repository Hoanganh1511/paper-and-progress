import type { ReactNode } from "react";
import { TableCell, TableRow } from "@/design-system";

export interface TableMessageProps {
  /** Number of columns of the table, so the message spans the full width. */
  colSpan: number;
  children: ReactNode;
}

/** A table row holding one centred message, e.g. "Không có sự kiện nào." or "Đang tải...". */
export function TableMessage({ colSpan, children }: TableMessageProps) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="px-4 py-8 text-center text-text-secondary"
      >
        {children}
      </TableCell>
    </TableRow>
  );
}
