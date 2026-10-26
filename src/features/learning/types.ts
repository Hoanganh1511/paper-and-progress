export type LearningLevel = "beginner" | "intermediate" | "advanced";

/** Key of the icon shown on a domain's tab; mapped to a component on the client. */
export type LearningDomainIcon =
  "technology" | "finance" | "health" | "language" | "soft-skills";

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  level: LearningLevel;
  /** Human readable, e.g. "6 giờ". */
  duration: string;
  lessons: number;
  /** When set, the whole card links here. */
  href?: string;
}

export interface LearningCategory {
  /** Unique within its domain. */
  id: string;
  title: string;
  description?: string;
  items: LearningItem[];
}

export interface LearningDomain {
  id: string;
  label: string;
  icon: LearningDomainIcon;
  categories: LearningCategory[];
}
