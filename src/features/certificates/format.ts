import {
  CalendarDays,
  CircleCheck,
  Clock,
  type LucideIcon,
} from "lucide-react";
import type { CertificateStatus, CertificateSummary } from "./types";

export const STATUS_ORDER: readonly CertificateStatus[] = [
  "ACHIEVED",
  "STUDYING",
  "PLANNED",
];

export const STATUS_INFO: Record<
  CertificateStatus,
  {
    /** The badge on a card. */
    badge: string;
    /** The tab and the count card. */
    tab: string;
    /** The choice in "Thêm chứng chỉ". */
    choice: string;
    hint: string;
    icon: LucideIcon;
    variant: "lime" | "yellow" | "blue";
  }
> = {
  ACHIEVED: {
    badge: "Đã đạt",
    tab: "Đã đạt",
    choice: "Đã đạt",
    hint: "Bạn đã hoàn thành và nhận chứng chỉ.",
    icon: CircleCheck,
    variant: "lime",
  },
  STUDYING: {
    badge: "Đang học",
    tab: "Đang học",
    choice: "Đang học",
    hint: "Bạn đang trong quá trình học và chuẩn bị thi.",
    icon: Clock,
    variant: "yellow",
  },
  PLANNED: {
    badge: "Kế hoạch",
    tab: "Kế hoạch",
    choice: "Kế hoạch",
    hint: "Bạn dự định học hoặc thi trong tương lai.",
    icon: CalendarDays,
    variant: "blue",
  },
};

/** `2026-09-15` -> `15/09/2026`. */
export function formatDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

export function countByStatus(items: readonly CertificateSummary[]) {
  const counts: Record<CertificateStatus, number> = {
    ACHIEVED: 0,
    STUDYING: 0,
    PLANNED: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** Name or issuer contains what was typed; case and spacing are ignored. */
export function matchesSearch(item: CertificateSummary, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${item.name} ${item.issuer}`.toLowerCase().includes(needle);
}

/** The line under a certificate's name that fits its status. */
export function datesOf(item: CertificateSummary): string[] {
  if (item.status === "ACHIEVED") {
    return [
      `Đạt: ${formatDate(item.issuedAt)}`,
      item.expiresAt
        ? `Hết hạn: ${formatDate(item.expiresAt)}`
        : item.score
          ? `Điểm: ${item.score}`
          : "",
    ].filter(Boolean);
  }
  if (item.status === "STUDYING") {
    return [
      `Bắt đầu: ${formatDate(item.startDate)}`,
      `Dự kiến: ${formatDate(item.targetDate)}`,
    ];
  }
  return [`Dự kiến bắt đầu: ${formatDate(item.startDate)}`];
}
