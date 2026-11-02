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
import { Button, Text, cn } from "@/design-system";
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

const pill =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-pill border-2 border-border-strong px-3 text-body-sm font-medium transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus";

/** Reactions, bookmark and share. A reaction on, bookmark saved: shown as pressed (`aria-pressed`), not by colour alone. */
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
      className="flex flex-wrap items-center gap-2"
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
              pill,
              isOn
                ? "bg-accent-lime text-ink"
                : "bg-surface-card hover:bg-surface-sunken",
            )}
          >
            <Icon aria-hidden="true" size={18} />
            <span aria-hidden="true">{engagement.counts[type]}</span>
          </button>
        );
      })}
      <span aria-hidden="true" className="mx-1 h-6 w-px bg-border-subtle" />
      <button
        type="button"
        aria-pressed={engagement.isBookmarked}
        onClick={onToggleBookmark}
        className={cn(
          pill,
          engagement.isBookmarked
            ? "bg-accent-yellow text-ink"
            : "bg-surface-card hover:bg-surface-sunken",
        )}
      >
        {engagement.isBookmarked ? (
          <BookmarkCheck aria-hidden="true" size={18} />
        ) : (
          <Bookmark aria-hidden="true" size={18} />
        )}
        {engagement.isBookmarked ? "Đã lưu" : "Lưu bài"}
      </button>
      <Button
        variant="outline"
        leftIcon={copied ? Check : Share2}
        onClick={share}
      >
        {copied ? "Đã sao chép liên kết" : "Chia sẻ"}
      </Button>
      <Text as="span" size="body-sm" role="status" className="sr-only">
        {copied ? "Đã sao chép liên kết" : ""}
      </Text>
    </div>
  );
}
