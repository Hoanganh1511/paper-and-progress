import type { ArticleCardData } from "@/features/articles";

/** How many of the newest articles the Dashboard asks for. */
export const MAX_ARTICLES = 9;

export type CardTone = "lime" | "blue" | "yellow" | "pink" | "white";

/**
 * The colour of a card follows its category (the article's first tag), never
 * the article itself: the same topic always looks the same. Anything not
 * listed is plain white. The design tokens have no lavender, so "AI /
 * Technology" shares the blue of the other technical topics.
 */
const TONE_BY_TAG: Record<string, CardTone> = {
  react: "lime",
  "next-js": "lime",
  nextjs: "lime",
  javascript: "lime",
  typescript: "lime",
  frontend: "lime",
  backend: "blue",
  database: "blue",
  nestjs: "blue",
  prisma: "blue",
  postgresql: "blue",
  sql: "blue",
  ai: "blue",
  technology: "blue",
  english: "yellow",
  learning: "yellow",
  ielts: "yellow",
  speaking: "yellow",
  grammar: "yellow",
  vocabulary: "yellow",
  productivity: "pink",
  habits: "pink",
  notes: "pink",
};

export const categoryOf = (article: ArticleCardData) => article.tags[0] ?? null;

export const toneOf = (article: ArticleCardData): CardTone =>
  TONE_BY_TAG[categoryOf(article)?.slug.toLowerCase() ?? ""] ?? "white";

/** 956 -> "956", 2100 -> "2.1k", 12000 -> "12k"; nothing when there are no views. */
export function formatViews(count: number | null | undefined): string | null {
  if (!count || count < 0) return null;
  if (count < 1000) return String(count);
  const thousands = count / 1000;
  const text =
    thousands < 10
      ? thousands.toFixed(1).replace(/\.0$/, "")
      : String(Math.round(thousands));
  return `${text}k`;
}

/** Groups into slides of `size`; the last slide may be shorter, none is empty. */
export function chunk<T>(items: T[], size: number): T[][] {
  const slides: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    slides.push(items.slice(i, i + size));
  }
  return slides;
}

export type Slot = "left" | "center" | "right" | "solo";

export interface Pose {
  rotate: number;
  scale: number;
  y: number;
  zIndex: number;
}

/** Tilt, size and depth of each place a card can take; a smaller screen tilts less. */
export function poseOf(slot: Slot, isCompact: boolean): Pose {
  const tilt = isCompact ? 0.6 : 1;
  switch (slot) {
    case "left":
      return { rotate: -8 * tilt, scale: 0.9, y: 20, zIndex: 1 };
    case "right":
      return { rotate: 8 * tilt, scale: 0.9, y: 20, zIndex: 1 };
    case "center":
      return { rotate: 0, scale: 1, y: 0, zIndex: 3 };
    case "solo":
      return { rotate: 0, scale: 1, y: 0, zIndex: 1 };
  }
}

/**
 * The places of the cards in a slide. Three fill left, centre and right; two
 * sit as a balanced pair; one stands alone in the middle.
 */
export function slotsFor(count: number): Slot[] {
  if (count >= 3) return ["left", "center", "right"];
  if (count === 2) return ["left", "right"];
  return ["solo"];
}
