import type { LucideIcon } from "lucide-react";

export type ProfileTabId =
  | "overview"
  | "personal"
  | "security"
  | "preferences"
  | "connected"
  | "billing"
  | "professional"
  | "activity"
  | "content";

export interface ProfileTab {
  id: ProfileTabId;
  label: string;
  icon: LucideIcon;
}

export interface LinkedAccount {
  provider: "Google" | "GitHub" | "Facebook" | "LinkedIn";
  isLinked: boolean;
  handle?: string;
}

export type StreakDayStatus = "done" | "missed" | "today" | "upcoming";

export interface StreakDay {
  label: string;
  status: StreakDayStatus;
}

export interface Certificate {
  name: string;
  issuer: string;
  year: number;
}

export interface PlanFeature {
  label: string;
  isIncluded: boolean;
}

export interface ProfileBadge {
  id: string;
  name: string;
  emoji: string;
}

export interface WeeklyGoal {
  id: string;
  label: string;
  isDone: boolean;
}

export type ActivityKind = "lesson" | "diary" | "bookmark" | "devlog";

export interface RecentActivity {
  id: string;
  kind: ActivityKind;
  /** What happened, e.g. "Hoàn thành bài học". */
  action: string;
  title: string;
  /** Already formatted for display, e.g. "Hôm nay, 09:30". */
  time: string;
  /** Where the item lives; shows an arrow and makes the row a link. */
  href?: string;
}

export interface ProfileOverview {
  memberSince: string;
  headline: string;
  timezone: string;
  phone: string;
  location: string;
  bio: string;
  quickInfo: { label: string; value: string }[];
  interests: string[];
  linkedAccounts: LinkedAccount[];
  quote: { lines: string[] };
  skills: string[];
  certificates: Certificate[];
  plan: { name: string; description: string; features: PlanFeature[] };
  streak: { days: number; week: StreakDay[]; message: string };
  stats: { label: string; value: string }[];
  /** This week only, so it does not repeat the lifetime stats in the header card. */
  weekMetrics: { label: string; value: string }[];
  weeklyGoal: { percent: number; label: string };
  recentActivity: RecentActivity[];
  goals: WeeklyGoal[];
  badges: ProfileBadge[];
}

export interface TabSection {
  title: string;
  items: string[];
}
