"use client";

import { useState, type ComponentProps } from "react";
import {
  ChevronRight,
  Code,
  HeartPulse,
  Languages,
  MessagesSquare,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Text, cn, focusRingClasses } from "@/design-system";
import type { LearningDomain, LearningDomainIcon } from "../../types";
import { BrowserCode, Star, Ticks } from "@/features/decor";
import { categoryIconOf } from "./categoryIcon";
import { TechTopicCard } from "./TechTopicCard";

// Icons are looked up by key because components cannot be passed from a
// Server Component (the page) as props.
const DOMAIN_ICONS: Record<LearningDomainIcon, LucideIcon> = {
  technology: Code,
  finance: Wallet,
  health: HeartPulse,
  language: Languages,
  "soft-skills": MessagesSquare,
};

const DOMAIN_DESCRIPTIONS: Record<LearningDomainIcon, string> = {
  technology:
    "Khám phá các công nghệ, framework và công cụ mình đang học, sử dụng và chia sẻ.",
  finance: "Khám phá các chủ đề về tài chính cá nhân và đầu tư.",
  health: "Khám phá các chủ đề về sức khỏe và thói quen sống.",
  language: "Khám phá các chủ đề về ngôn ngữ và cách học.",
  "soft-skills":
    "Khám phá các chủ đề về kỹ năng mềm và làm việc cùng người khác.",
};

export interface DomainPanelProps extends Omit<
  ComponentProps<"section">,
  "ref" | "children"
> {
  domain: LearningDomain;
}

/**
 * One domain of the library, inside the content panel. The head has the
 * domain's icon, its name and what it is about, and, for technology, a small
 * picture. Below it, the categories as a list on the left (a row that scrolls
 * sideways on a small screen) and, for the chosen one, its title with a lime
 * stroke under it and its topics as cards. Choosing a category swaps the
 * topics in place; nothing scrolls.
 */
export function DomainPanel({ domain, className, ...props }: DomainPanelProps) {
  const [chosenId, setChosenId] = useState(domain.categories[0]?.id);
  const chosen =
    domain.categories.find((category) => category.id === chosenId) ??
    domain.categories[0];
  const DomainIcon = DOMAIN_ICONS[domain.icon];
  const titleId = `domain-${domain.id}-title`;
  const categoryTitleId = `domain-${domain.id}-category`;

  return (
    <section
      aria-labelledby={titleId}
      className={cn("flex flex-col gap-5", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 border-b border-text-primary/70 pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-standard border-2 border-border-strong bg-accent-lime text-ink">
            <DomainIcon aria-hidden="true" size={28} />
          </span>
          <div className="relative flex min-w-0 flex-col gap-1">
            <Text
              as="h2"
              id={titleId}
              font="display"
              weight="bold"
              className="text-[1.5rem] leading-tight text-text-primary sm:text-[2rem]"
            >
              <span className="relative inline-block">
                {domain.label}
                <Ticks
                  corner="top-right"
                  className="absolute bottom-full left-full -mb-2 -ml-1 hidden h-10 w-12 sm:block"
                />
              </span>
            </Text>
            <Text size="body-sm" color="secondary">
              {DOMAIN_DESCRIPTIONS[domain.icon]}
            </Text>
          </div>
        </div>
        {domain.icon === "technology" && (
          <div
            aria-hidden="true"
            className="relative hidden shrink-0 items-center justify-center md:flex"
          >
            <span className="absolute inset-x-[-1rem] top-1/3 bottom-0 rounded-[45%] bg-accent-lime/45" />
            <BrowserCode className="relative h-20 w-auto lg:h-20" />
            <Star className="absolute -top-1 left-0 size-6" />
            <Star className="absolute -right-3 bottom-4 size-5" />
          </div>
        )}
      </div>

      {chosen === undefined ? (
        <Text color="secondary">Chưa có chủ đề nào trong lĩnh vực này.</Text>
      ) : (
        <div className="grid gap-6 md:grid-cols-[13.5rem_minmax(0,1fr)] md:gap-8">
          <nav
            aria-label={`Phân loại trong lĩnh vực ${domain.label}`}
            className="min-w-0 md:self-start md:rounded-soft md:bg-accent-lime/15 md:p-3"
          >
            <ul className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
              {domain.categories.map((category) => {
                const Icon = categoryIconOf(category);
                const isChosen = category.id === chosen.id;
                return (
                  <li key={category.id} className="shrink-0 md:w-full">
                    <button
                      type="button"
                      aria-current={isChosen ? "true" : undefined}
                      onClick={() => setChosenId(category.id)}
                      className={cn(
                        "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-standard px-3 text-left font-body text-body-md font-bold whitespace-nowrap text-text-primary transition-colors duration-[var(--duration-fast)] motion-reduce:transition-none",
                        "max-md:border-2 max-md:border-border-strong max-md:bg-surface-card",
                        isChosen
                          ? "bg-accent-lime text-ink max-md:shadow-none"
                          : "hover:bg-white/70 max-md:hover:bg-surface-sunken",
                        focusRingClasses,
                      )}
                    >
                      <Icon aria-hidden="true" size={22} className="shrink-0" />
                      <span className="flex-1 md:whitespace-normal">
                        {category.title}
                      </span>
                      {isChosen && (
                        <ChevronRight
                          aria-hidden="true"
                          size={18}
                          className="shrink-0 max-md:hidden"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div
            role="region"
            aria-labelledby={categoryTitleId}
            className="flex min-w-0 flex-col gap-5"
          >
            <div className="flex flex-col gap-1.5">
              <Text
                as="h3"
                id={categoryTitleId}
                font="display"
                weight="bold"
                className="relative w-fit text-[1.75rem] leading-tight text-text-primary sm:text-[2.5rem]"
              >
                {chosen.title}
                <span
                  aria-hidden="true"
                  data-stroke=""
                  className="absolute inset-x-0 -bottom-2.5 h-2 -rotate-1 rounded-full bg-accent-lime"
                />
              </Text>
              {chosen.description && (
                <Text size="body-sm" color="secondary" className="mt-2">
                  {chosen.description}
                </Text>
              )}
            </div>
            <ul className="grid gap-x-6 gap-y-6 pr-1.5 sm:grid-cols-2 2xl:grid-cols-3">
              {chosen.items.map((item, index) => (
                <li key={item.id} className="flex">
                  <TechTopicCard item={item} index={index} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
