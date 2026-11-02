import type { PathLevel } from "./types";

export const LEVEL_LABEL: Record<
  PathLevel,
  { label: string; variant: "lime" | "blue" | "pink" }
> = {
  BEGINNER: { label: "Cơ bản", variant: "lime" },
  INTERMEDIATE: { label: "Trung cấp", variant: "blue" },
  ADVANCED: { label: "Nâng cao", variant: "pink" },
};

/** "45 phút", "2 giờ", "2 giờ 15 phút". */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}
