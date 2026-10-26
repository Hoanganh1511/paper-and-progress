import { type ComponentProps } from "react";
import {
  BarChart3,
  Brain,
  Cloud,
  Code2,
  Database,
  type LucideIcon,
  Lock,
  Network,
  Package2,
  Server,
  Settings2,
  Shield,
  Smartphone,
  TestTube2,
  Terminal,
  Palette,
  Workflow,
} from "lucide-react";
import {
  Text,
  cn,
  focusRingClasses,
  focusRingWithinClasses,
} from "@/design-system";
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

export interface TechItemTileProps extends Omit<
  ComponentProps<"article">,
  "children" | "title"
> {
  item: TechItem;
}

/**
 * A square tile for one item in the knowledge grid: a dark icon badge over a
 * name, like a champion portrait. With an `href`, the title is a link
 * stretched over the whole tile; it lifts and gets the hard offset accent
 * shadow on hover, so picking an item feels like a game's champion select.
 * Without one, it is plain and inert.
 */
export function TechItemTile({ item, className, ...props }: TechItemTileProps) {
  const Icon = ITEM_ICONS[item.icon];

  return (
    <article
      className={cn(
        "relative isolate flex aspect-square flex-col items-center justify-center gap-2 rounded-standard border border-border-subtle bg-surface-card p-2 text-center",
        item.href &&
          cn(
            "transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] hover:-translate-y-1 hover:border-ink hover:shadow-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            focusRingWithinClasses,
          ),
        className,
      )}
      {...props}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-standard bg-ink text-paper">
        <Icon aria-hidden="true" size={20} />
      </span>
      <Text as="h3" size="body-sm" weight="semibold" className="line-clamp-2">
        {item.href ? (
          <a
            href={item.href}
            className={cn(
              "rounded-sharp after:absolute after:inset-0 after:content-['']",
              focusRingClasses,
            )}
          >
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </Text>
    </article>
  );
}
