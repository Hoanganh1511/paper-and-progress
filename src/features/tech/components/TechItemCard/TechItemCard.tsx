import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Cloud,
  Code2,
  Database,
  FileText,
  Layers,
  Lock,
  Network,
  Package2,
  Palette,
  Server,
  Settings2,
  Shield,
  Smartphone,
  Terminal,
  TestTube2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/design-system";
import type { TechItem, TechItemIcon } from "../../types";

const ITEM_ICONS: Record<TechItemIcon, LucideIcon> = {
  code: Code2,
  terminal: Terminal,
  database: Database,
  server: Server,
  cloud: Cloud,
  container: Package2,
  workflow: Workflow,
  shield: Shield,
  lock: Lock,
  network: Network,
  mobile: Smartphone,
  brain: Brain,
  chart: BarChart3,
  design: Palette,
  settings: Settings2,
  test: TestTube2,
};

/** The colour of each card's offset shadow, in turn: pink, lime, violet, blue. */
export const TECH_ACCENTS = [
  "#ff4f9a",
  "#c7f500",
  "#b66bff",
  "#78b8ff",
] as const;

export interface TechCounts {
  articles: number;
  paths: number;
  resources: number;
}

export interface TechItemCardProps {
  item: TechItem;
  /** The place in the grid; it picks the accent colour. */
  index: number;
  /** What the library holds on it; zeros when it holds nothing or is not known. */
  counts?: TechCounts;
  /** Where the card leads, when it leads anywhere. */
  href?: string;
}

/**
 * One technology as a card: a tile with its icon, its name, a line on what it
 * is, and what the library holds on it (articles, paths, resources). The name
 * is the link, stretched over the whole card, with an arrow button at the
 * corner to say so. White, black border, an offset shadow in the card's own
 * colour with a thin black edge behind it. It lifts on hover and keyboard focus,
 * sinks when pressed, and keeps still with reduced motion.
 */
export function TechItemCard({
  item,
  index,
  counts = { articles: 0, paths: 0, resources: 0 },
  href,
}: TechItemCardProps) {
  const accent = TECH_ACCENTS[index % TECH_ACCENTS.length];
  const Icon = ITEM_ICONS[item.icon];
  const name = (
    <span className="font-display text-xl leading-tight font-extrabold text-[#111]">
      {item.title}
    </span>
  );
  const rows: [LucideIcon, number, string][] = [
    [FileText, counts.articles, "bài viết"],
    [BookOpen, counts.paths, "lộ trình"],
    [Layers, counts.resources, "tài liệu"],
  ];

  return (
    <article
      style={{ "--accent": accent } as CSSProperties}
      className={cn(
        "relative flex h-full min-h-[17rem] flex-col gap-3 rounded-soft border-2 border-[#171717] bg-white p-4 text-[#171717]",
        "shadow-[5px_6px_0_0_var(--accent),7px_8px_0_0_#171717] sm:shadow-[7px_8px_0_0_var(--accent),9px_10px_0_0_#171717]",
        "transition-[transform,box-shadow] duration-200 ease-out",
        href &&
          "hover:-translate-x-0.5 hover:-translate-y-[3px] hover:shadow-[9px_10px_0_0_var(--accent),11px_12px_0_0_#171717] focus-within:-translate-x-0.5 focus-within:-translate-y-[3px] focus-within:shadow-[9px_10px_0_0_var(--accent),11px_12px_0_0_#171717] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[2px_2px_0_0_var(--accent)]",
        "motion-reduce:transition-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-x-0 motion-reduce:focus-within:translate-y-0",
      )}
    >
      <span
        aria-hidden="true"
        data-tile=""
        className="flex size-14 shrink-0 items-center justify-center rounded-standard border-2 border-[#171717] bg-[color-mix(in_srgb,var(--accent)_30%,white)]"
      >
        <Icon size={28} />
      </span>
      <h3 className="min-w-0">
        {href ? (
          <Link
            href={href}
            className="rounded-sharp outline-none after:absolute after:inset-0 after:rounded-soft focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-solid focus-visible:after:outline-border-focus"
          >
            {name}
          </Link>
        ) : (
          name
        )}
      </h3>
      <p className="line-clamp-3 min-h-[3.75rem] text-sm leading-[1.35] text-[#343434]">
        {item.description}
      </p>
      <ul className="mt-auto flex flex-col gap-1.5 pr-12 text-sm font-medium">
        {rows.map(([RowIcon, count, label]) => (
          <li key={label} className="flex items-center gap-2">
            <RowIcon aria-hidden="true" size={16} className="shrink-0" />
            <span>
              {count} {label}
            </span>
          </li>
        ))}
      </ul>
      {href && (
        <span
          aria-hidden="true"
          data-arrow=""
          className="absolute right-4 bottom-4 flex size-10 items-center justify-center rounded-standard border-2 border-[#171717] bg-white shadow-[2px_2px_0_0_#171717]"
        >
          <ArrowRight size={18} />
        </span>
      )}
    </article>
  );
}
