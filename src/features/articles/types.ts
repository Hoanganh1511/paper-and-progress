export type ArticleStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
export type ArticleVisibility = "PUBLIC" | "PREVIEW" | "MEMBERS_ONLY";
export type ReactionType = "LIKE" | "LOVE" | "INSIGHTFUL" | "CELEBRATE";

export interface ArticleTag {
  name: string;
  slug: string;
}

export interface ArticleCardData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  readingMinutes: number;
  visibility: ArticleVisibility;
  status: ArticleStatus;
  /** ISO date; null for a draft. */
  publishedAt: string | null;
  viewCount: number;
  seriesOrder: number | null;
  author: { id: string; displayName: string | null };
  tags: ArticleTag[];
  series: { title: string; slug: string } | null;
}

export interface ArticleList {
  items: ArticleCardData[];
  nextCursor: string | null;
}

export interface SeriesNavigation {
  title: string;
  slug: string;
  articles: { slug: string; title: string; seriesOrder: number | null }[];
}

interface ArticleMeta extends Omit<ArticleCardData, "series"> {
  authorId: string;
  scheduledAt: string | null;
  updatedAt: string;
  series: SeriesNavigation | null;
  related: ArticleCardData[];
}

/** The whole article, for someone who may read all of it. */
export interface FullArticle extends ArticleMeta {
  gated: false;
  contentHtml: string;
}

/** Who is turned away, and so which prompt they get: sign in, or become a member. */
export type GateReason = "LOGIN" | "MEMBERSHIP";

/** The start of an article, for anyone who is not a member on a `PREVIEW` article. */
export interface PreviewArticle extends ArticleMeta {
  gated: true;
  fullAvailable: true;
  reason: GateReason;
  previewHtml: string;
}

/** What a non-member gets for a members-only article: enough for a card, nothing of the text. */
export interface LockedArticle {
  title: string;
  excerpt: string | null;
}

export type ArticleResult =
  | { kind: "full"; article: FullArticle }
  | { kind: "preview"; article: PreviewArticle }
  | { kind: "locked"; article: LockedArticle }
  | { kind: "not-found" };

export interface TagWithCount extends ArticleTag {
  id: string;
  articleCount: number;
}

export interface SeriesWithCount {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  articleCount: number;
}

export interface Engagement {
  counts: Record<ReactionType, number>;
  mine: ReactionType[];
  isBookmarked: boolean;
}

export interface CommentNode {
  id: string;
  parentId: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  author: { id: string; displayName: string | null } | null;
  replies: CommentNode[];
}

export interface EditableArticle extends ArticleCardData {
  contentJson: Record<string, unknown>;
  contentHtml: string;
  scheduledAt: string | null;
  seriesId: string | null;
  updatedAt: string;
  authorId: string;
}

export interface ArticleInput {
  title: string;
  slug?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  visibility?: ArticleVisibility;
  tags?: string[];
  seriesId?: string | null;
  seriesOrder?: number | null;
}

export interface RevisionSummary {
  id: string;
  title: string;
  contentText: string;
  createdAt: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  /** Form fields to send before `file` (S3); empty for local uploads. */
  fields: Record<string, string>;
  publicUrl: string;
}

export interface ArticleStatsRow {
  id: string;
  slug: string;
  title: string;
  publishedAt: string | null;
  readingMinutes: number;
  views: number;
  reactions: number;
  bookmarks: number;
  comments: number;
  opened: number;
  reached25: number;
  reached50: number;
  reached75: number;
  reached100: number;
  completionRate: number;
}

export type ArticleStatsSort =
  "views" | "reactions" | "bookmarks" | "completion";

export const VISIBILITY_LABELS: Record<ArticleVisibility, string> = {
  PUBLIC: "Công khai",
  PREVIEW: "Xem trước 30%",
  MEMBERS_ONLY: "Chỉ hội viên",
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: "Nháp",
  SCHEDULED: "Hẹn giờ",
  PUBLISHED: "Đã đăng",
  ARCHIVED: "Lưu trữ",
};

export const REACTION_LABELS: Record<ReactionType, string> = {
  LIKE: "Thích",
  LOVE: "Yêu thích",
  INSIGHTFUL: "Sâu sắc",
  CELEBRATE: "Chúc mừng",
};
