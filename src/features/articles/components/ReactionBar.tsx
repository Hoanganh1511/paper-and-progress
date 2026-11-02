"use client";

import {
  Bookmark,
  BookmarkCheck,
  Check,
  Heart,
  Lightbulb,
  PartyPopper,
  Share2,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Text, cn } from "@/design-system";
import { PandaPeek } from "@/features/decor";
import { REACTION_LABELS, type Engagement, type ReactionType } from "../types";

const ICONS: Record<ReactionType, LucideIcon> = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  INSIGHTFUL: Lightbulb,
  CELEBRATE: PartyPopper,
};
const TYPES = Object.keys(ICONS) as ReactionType[];

/** Throws confetti for a celebration, unless the reader asked for less motion. */
async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { default: confetti } = await import("canvas-confetti");
  void confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
}

export interface ReactionBarProps {
  engagement: Engagement;
  title: string;
  onReact: (type: ReactionType) => void;
  onToggleBookmark: () => void;
}

const control =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 border-2 border-border-strong px-3.5 text-body-sm font-semibold shadow-[2px_2px_0_0_var(--color-border-strong)] transition-[background-color,translate,box-shadow] duration-150 hover:-translate-y-px motion-reduce:transition-none motion-reduce:hover:translate-y-0 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/**
 * Reactions, bookmark and share, in one bar: white, with a black border and a
 * lime edge along the left and the bottom, and a panda looking over a hill at
 * the right. The reaction that is on is pink and filled, the bookmark that is
 * saved is yellow; both are also `aria-pressed`, so it is not by colour alone.
 */
export function ReactionBar({
  engagement,
  title,
  onReact,
  onToggleBookmark,
}: ReactionBarProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelled: do nothing
        return;
      }
    }
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      role="group"
      aria-label="Phản hồi bài viết"
      className="relative flex flex-wrap items-center gap-x-3 gap-y-3 rounded-[1.25rem] border-2 border-border-strong bg-surface-card p-4 shadow-[-6px_7px_0_0_var(--color-accent-lime)] md:pr-64"
    >
      {TYPES.map((type) => {
        const Icon = ICONS[type];
        const isOn = engagement.mine.includes(type);
        return (
          <button
            key={type}
            type="button"
            aria-pressed={isOn}
            aria-label={`${REACTION_LABELS[type]}, ${engagement.counts[type]} lượt`}
            onClick={() => {
              onReact(type);
              if (type === "CELEBRATE" && !isOn) void celebrate();
            }}
            className={cn(
              control,
              "rounded-pill",
              isOn
                ? "bg-accent-pink text-ink"
                : "bg-surface-card text-text-primary hover:bg-surface-sunken",
            )}
          >
            <Icon aria-hidden="true" size={18} />
            <span aria-hidden="true">{engagement.counts[type]}</span>
          </button>
        );
      })}
      <span
        aria-hidden="true"
        data-divider=""
        className="mx-1 hidden h-9 w-0.5 bg-border-strong sm:block"
      />
      <button
        type="button"
        aria-pressed={engagement.isBookmarked}
        onClick={onToggleBookmark}
        className={cn(
          control,
          "rounded-standard",
          engagement.isBookmarked
            ? "bg-accent-yellow text-ink"
            : "bg-surface-card text-text-primary hover:bg-surface-sunken",
        )}
      >
        {engagement.isBookmarked ? (
          <BookmarkCheck aria-hidden="true" size={18} />
        ) : (
          <Bookmark aria-hidden="true" size={18} />
        )}
        {engagement.isBookmarked ? "Đã lưu" : "Lưu bài"}
      </button>
      <button
        type="button"
        onClick={share}
        className={cn(
          control,
          "rounded-standard bg-surface-card text-text-primary hover:bg-surface-sunken",
        )}
      >
        {copied ? (
          <Check aria-hidden="true" size={18} />
        ) : (
          <Share2 aria-hidden="true" size={18} />
        )}
        {copied ? "Đã sao chép liên kết" : "Chia sẻ"}
      </button>
      <PandaPeek className="pointer-events-none absolute right-4 -bottom-0.5 hidden h-24 w-auto md:block" />
      <Text as="span" size="body-sm" role="status" className="sr-only">
        {copied ? "Đã sao chép liên kết" : ""}
      </Text>
    </div>
  );
}
