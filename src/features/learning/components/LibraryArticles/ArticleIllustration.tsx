import type { ComponentProps } from "react";
import type { ArticleCardData } from "@/features/articles";

export type IllustrationKind = "shield" | "layers" | "ghost";

const INK = "#171717";
const SPARK = "#ffd42a";

/** The kinds in the order of the cards, which is what a card falls back to when no tag says otherwise. */
const ORDER: IllustrationKind[] = ["shield", "layers", "ghost"];

const KIND_BY_TAG: Record<string, IllustrationKind> = {
  security: "shield",
  "bao-mat": "shield",
  "an-ninh": "shield",
  cybersecurity: "shield",
  auth: "shield",
  engineering: "layers",
  architecture: "layers",
  backend: "layers",
  frontend: "layers",
  database: "layers",
  devops: "layers",
  react: "layers",
  nextjs: "layers",
  "next-js": "layers",
  nestjs: "layers",
  experimental: "ghost",
  creative: "ghost",
  fun: "ghost",
  ghost: "ghost",
};

/**
 * The picture of a card comes from the article's topic: the first of its tags
 * that has one. It is a mark of recognition, not the article's own image, so a
 * card without a match takes the next one in turn (shield, layers, ghost).
 */
export function illustrationOf(
  article: Pick<ArticleCardData, "tags">,
  position: number,
): IllustrationKind {
  for (const tag of article.tags) {
    const kind = KIND_BY_TAG[tag.slug.toLowerCase()];
    if (kind) return kind;
  }
  return ORDER[position % ORDER.length];
}

const strokeProps = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinejoin: "round",
  strokeLinecap: "round",
} as const;

export interface ArticleIllustrationProps extends Omit<
  ComponentProps<"svg">,
  "children"
> {
  kind: IllustrationKind;
  /** The colour of the card, used for the body of the drawing. */
  accent: string;
}

/**
 * A small cartoon in the same hand for every card: a black outline, few
 * details, the card's accent colour, and a few yellow flicks. It decorates
 * and is hidden from assistive technology.
 */
export function ArticleIllustration({
  kind,
  accent,
  ...props
}: ArticleIllustrationProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-illustration={kind}
      {...props}
    >
      <g stroke={SPARK} strokeWidth="3.5" strokeLinecap="round">
        <path d="M63 9l4 5M70 8l2 6M57 8l-1 6" />
      </g>
      {kind === "shield" && (
        <>
          <path
            d="M45 12l26 9v21c0 15-11 27-26 33-15-6-26-18-26-33V21z"
            fill={INK}
          />
          <path
            d="M40 8l26 9v21c0 16-11 28-26 34-15-6-26-18-26-34V17z"
            fill={accent}
            {...strokeProps}
          />
          <path
            d="M33 30l-9 9 9 9M47 30l9 9-9 9M43 27l-6 24"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {kind === "layers" && (
        <>
          <path d="M40 34l32 16-32 16L8 50z" fill={accent} {...strokeProps} />
          <path d="M40 21l32 16-32 16L8 37z" fill={accent} {...strokeProps} />
          <path d="M40 8l32 16-32 16L8 24z" fill="#fff" {...strokeProps} />
        </>
      )}
      {kind === "ghost" && (
        <>
          <path
            d="M24 65V35c0-14 10-22 20-22s20 8 20 22v30l-7-6-6 6-7-6-6 6-7-6z"
            fill={accent}
            {...strokeProps}
          />
          <path
            d="M20 62V32c0-14 10-22 20-22s20 8 20 22v30l-7-6-6 6-7-6-6 6-7-6z"
            fill="#fff"
            {...strokeProps}
          />
          <circle cx="33" cy="33" r="3" fill={INK} />
          <circle cx="47" cy="33" r="3" fill={INK} />
          <path
            d="M36 42q4 4 8 0"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
