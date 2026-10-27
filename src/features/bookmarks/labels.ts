import type {
  BookmarkContentType,
  BookmarkDomain,
  BookmarkLevel,
  BookmarkStatus,
} from "./types";

export const DOMAIN_LABELS: Record<BookmarkDomain, string> = {
  it: "Công nghệ thông tin",
  english: "Tiếng Anh",
  "life-skills": "Kỹ năng sống",
};

export const CONTENT_TYPE_LABELS: Record<BookmarkContentType, string> = {
  video: "Video",
  text: "Bài viết",
  quiz: "Trắc nghiệm",
  "code-lab": "Code Lab",
};

export const LEVEL_LABELS: Record<BookmarkLevel, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

/** Levels in learning order, used when sorting by level. */
export const LEVEL_ORDER: Record<BookmarkLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

export const STATUS_LABELS: Record<BookmarkStatus, string> = {
  "not-started": "Chưa học",
  "in-progress": "Đang học",
  completed: "Đã hoàn thành",
};

export const SAVED_RANGE_LABELS = {
  today: "Hôm nay",
  week: "Tuần này",
  month: "Tháng này",
} as const;

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours} giờ ${rest} phút`;
}

/** "2 ngày trước", measured from `now`. */
export function formatSavedAgo(savedAt: string, now: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(now) - Date.parse(savedAt)) / 60_000),
  );
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  if (days < 365) return `${Math.floor(days / 30)} tháng trước`;
  return `${Math.floor(days / 365)} năm trước`;
}
