import { type ComponentProps } from "react";
import {
  Briefcase,
  Ear,
  Languages,
  Leaf,
  MessageCircle,
  Mic,
  Presentation,
  PenLine,
  BookOpen,
  Plane,
  Sparkles,
  SpellCheck,
  Star,
  Trophy,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Text,
  cn,
  focusRingClasses,
  focusRingWithinClasses,
} from "@/design-system";
import type {
  EnglishTopic,
  TopicColor,
  TopicDecor,
  TopicIcon,
} from "../../types";
import { Mascot } from "../Mascot";

const TOPIC_ICONS: Record<TopicIcon, LucideIcon> = {
  listening: Ear,
  speaking: Mic,
  reading: BookOpen,
  writing: PenLine,
  exam: GraduationCap,
  travel: Plane,
  work: Briefcase,
  chat: MessageCircle,
  vocabulary: Languages,
  grammar: SpellCheck,
  trophy: Trophy,
  presentation: Presentation,
};

// Class names are written out in full so Tailwind can detect them statically.
// The card color and the darker badge color come from the --color-theme-*
// tokens, which are chosen so that white text passes 4.5:1 on both.
const THEMES: Record<TopicColor, { card: string; badge: string }> = {
  blue: { card: "bg-theme-blue", badge: "bg-theme-blue-strong" },
  green: { card: "bg-theme-green", badge: "bg-theme-green-strong" },
  orange: { card: "bg-theme-orange", badge: "bg-theme-orange-strong" },
  pink: { card: "bg-theme-pink", badge: "bg-theme-pink-strong" },
  purple: { card: "bg-theme-purple", badge: "bg-theme-purple-strong" },
};

/** A music note; lucide-react has no such icon any more. */
function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M9 3v11.3A3.5 3.5 0 1 0 11 17.5V8.2l7-1.6v5.7A3.5 3.5 0 1 0 20 15.5V3.6L9 6Z" />
    </svg>
  );
}

const DECOR_ICONS: Record<
  TopicDecor,
  (props: { className?: string }) => React.ReactElement
> = {
  note: NoteIcon,
  star: (props) => <Star aria-hidden="true" fill="currentColor" {...props} />,
  leaf: (props) => <Leaf aria-hidden="true" fill="currentColor" {...props} />,
  sparkle: (props) => <Sparkles aria-hidden="true" {...props} />,
};

// Where the ornaments sit, in the order they are listed on a card: around the
// text block and the top of the mascot, kept off the title.
const DECOR_SLOTS = [
  "top-[44%] left-4 size-5 -rotate-12",
  "top-[36%] right-5 size-6 rotate-12",
  "top-5 right-16 size-4",
];

export interface TopicCardProps extends Omit<
  ComponentProps<"article">,
  "children" | "title"
> {
  topic: EnglishTopic;
}

/**
 * A tall (3:4) illustrated card for one learning goal, on its own color: an
 * icon tile top-left, the title and a short description in the upper half, a
 * panda mascot standing on the bottom edge, scattered ornaments, and a pill
 * badge at the bottom. All text is white. With an `href`, the title is a link
 * stretched over the whole card, so the card is one clear target. It is 75vw
 * wide on a phone (so the next card peeks in) and 15rem from `sm`.
 */
export function TopicCard({ topic, className, ...props }: TopicCardProps) {
  const theme = THEMES[topic.color];
  const Icon = TOPIC_ICONS[topic.icon];

  return (
    <article
      data-color={topic.color}
      className={cn(
        "relative isolate flex aspect-[3/4] w-[75vw] flex-col overflow-hidden rounded-soft p-4 text-white sm:w-60",
        theme.card,
        topic.href &&
          cn(
            "transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            focusRingWithinClasses,
          ),
        className,
      )}
      {...props}
    >
      {topic.decor.slice(0, DECOR_SLOTS.length).map((decor, index) => {
        const Ornament = DECOR_ICONS[decor];
        return (
          <span
            key={`${decor}-${index}`}
            aria-hidden="true"
            data-decor={decor}
            className={cn(
              "pointer-events-none absolute -z-10 text-white opacity-30",
              DECOR_SLOTS[index],
            )}
          >
            <Ornament className="size-full" />
          </span>
        );
      })}

      <span className="flex size-10 shrink-0 items-center justify-center rounded-standard bg-white/20">
        <Icon aria-hidden="true" size={22} />
      </span>

      <Text as="h3" size="heading-sm" weight="bold" className="mt-3 text-white">
        {topic.href ? (
          <a
            href={topic.href}
            className={cn(
              "rounded-sharp after:absolute after:inset-0 after:z-20 after:content-['']",
              focusRingClasses,
            )}
          >
            {topic.title}
          </a>
        ) : (
          topic.title
        )}
      </Text>
      <Text size="body-sm" className="mt-1 line-clamp-3 text-white">
        {topic.description}
      </Text>

      <Mascot
        accessory={topic.mascot}
        className="pointer-events-none absolute right-0 -bottom-2 -z-10 w-3/5"
      />

      <Badge
        size="md"
        className={cn(
          "absolute bottom-4 left-4 border-transparent font-bold tracking-wide text-white",
          theme.badge,
        )}
      >
        {topic.badge}
      </Badge>
    </article>
  );
}
