"use client";

import Link from "next/link";
import { CalendarDays, Eye, ImageOff, Lock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge, Image, Text, cn } from "@/design-system";
import type { ArticleCardData } from "@/features/articles";
import {
  categoryOf,
  formatViews,
  toneOf,
  type CardTone,
  type Pose,
} from "./carouselLayout";

const TONE_CLASSES: Record<CardTone, string> = {
  lime: "bg-accent-lime",
  blue: "bg-accent-blue",
  yellow: "bg-accent-yellow",
  pink: "bg-accent-pink",
  white: "bg-surface-card",
};

/** The 2px border and hard offset shadow of the design system, with a deeper shadow on hover and focus. */
const CARD_CLASSES =
  "group relative flex h-[19rem] w-60 shrink-0 flex-col gap-2 rounded-standard border-2 border-border-strong p-3 text-ink shadow-modal transition-shadow duration-[var(--duration-fast)] hover:shadow-[9px_9px_0_0_var(--color-border-strong)] focus-within:shadow-[9px_9px_0_0_var(--color-border-strong)] motion-reduce:transition-none sm:h-[21rem] sm:w-64 xl:w-72";

/** "2026-10-27T08:00:00Z" -> "27/10/2026", cut from the text so server and browser agree. */
const date = (iso: string) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

/** The default picture for an article without a thumbnail, or whose thumbnail failed to load. */
function ThumbnailPlaceholder() {
  return (
    <span className="flex size-full items-center justify-center bg-surface-sunken text-text-secondary">
      <ImageOff aria-hidden="true" size={28} />
    </span>
  );
}

export interface LatestArticleCardProps {
  article: ArticleCardData;
  pose: Pose;
  className?: string;
}

/**
 * One article of the showcase. The whole card is a link (through the title),
 * so it works from the keyboard too. Its box never changes with the text:
 * titles are cut at two lines and the thumbnail has a fixed 16:9 frame.
 * Hovering lifts the card and straightens it a little; with reduced motion
 * it only deepens the shadow.
 */
export function LatestArticleCard({
  article,
  pose,
  className,
}: LatestArticleCardProps) {
  const isReduced = useReducedMotion();
  const category = categoryOf(article);
  const views = formatViews(article.viewCount);
  const extraTags = article.tags.slice(1, 3);
  const isLimited = article.visibility !== "PUBLIC";

  return (
    <motion.article
      style={{ zIndex: pose.zIndex }}
      initial={false}
      animate={{ scale: pose.scale, y: pose.y, rotate: pose.rotate }}
      whileHover={
        isReduced
          ? undefined
          : {
              y: pose.y - 10,
              rotate: pose.rotate * 0.5,
              transition: { duration: 0.2 },
            }
      }
      transition={{ duration: isReduced ? 0 : 0.5, ease: "easeInOut" }}
      className={cn(CARD_CLASSES, TONE_CLASSES[toneOf(article)], className)}
    >
      <div className="relative">
        {article.coverImageUrl ? (
          <Image
            src={article.coverImageUrl}
            alt=""
            aspectRatio="video"
            fallback={<ThumbnailPlaceholder />}
            frameClassName="overflow-hidden border-2 border-border-strong bg-surface-card"
            className="transition-transform duration-[var(--duration-fast)] group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <div className="aspect-video overflow-hidden border-2 border-border-strong">
            <ThumbnailPlaceholder />
          </div>
        )}
        {category && (
          <Badge
            size="sm"
            className="absolute top-2 left-2 border-2 border-border-strong bg-surface-card text-ink"
          >
            #{category.name}
          </Badge>
        )}
        {isLimited && (
          <Badge
            size="sm"
            variant="yellow"
            icon={Lock}
            className="absolute top-2 right-2 border-2 border-border-strong"
          >
            {article.visibility === "MEMBERS_ONLY" ? "Hội viên" : "Xem trước"}
          </Badge>
        )}
      </div>
      <Text
        as="h3"
        size="body-lg"
        weight="bold"
        className="line-clamp-2 min-h-[3.25rem] font-display"
      >
        <Link
          href={`/articles/${article.slug}`}
          className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-standard focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-border-focus"
        >
          {article.title}
        </Link>
      </Text>
      {extraTags.length > 0 && (
        <ul className="flex h-6 gap-1.5 overflow-hidden" aria-label="Chủ đề">
          {extraTags.map((tag) => (
            <li key={tag.slug} className="shrink-0">
              <Badge size="sm" className="bg-surface-card text-ink">
                {tag.name}
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 text-body-sm">
        {article.publishedAt && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" size={16} />
            <time dateTime={article.publishedAt}>
              {date(article.publishedAt)}
            </time>
          </span>
        )}
        {views && (
          <span className="inline-flex items-center gap-1.5">
            <Eye aria-hidden="true" size={16} />
            <span aria-label={`${views} lượt xem`}>{views}</span>
          </span>
        )}
      </div>
    </motion.article>
  );
}
