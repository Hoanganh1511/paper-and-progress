"use client";

import { useState, type ComponentProps } from "react";
import {
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Shield,
  Smartphone,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabList, TabPanel, TabTrigger } from "@/design-system";
import type { TechGroup, TechGroupIcon } from "../../types";
import { TechItemCard, type TechCounts } from "../TechItemCard";
import { subcategoryIconOf } from "./subcategoryIcon";

const GROUP_ICONS: Record<TechGroupIcon, LucideIcon> = {
  frontend: Code2,
  backend: Database,
  devops: Workflow,
  mobile: Smartphone,
  data: Cpu,
  security: Shield,
  cloud: Cloud,
  qa: FlaskConical,
};

export interface TechHubProps extends Omit<
  ComponentProps<"div">,
  "children" | "ref"
> {
  groups: TechGroup[];
  /**
   * What the knowledge base holds on each technology, by item id. A technology
   * with an entry here links to its topic page; one without shows zeros and no link.
   */
  counts?: Record<string, TechCounts>;
  /** Group shown first; defaults to the first one. */
  defaultGroupId?: string;
  /** Accessible name of the group tab list. */
  groupsLabel?: string;
}

/**
 * One group's content, in a white panel with a hard shadow: a row of tabs for
 * its sub-categories, over a thick lime line, and the cards of the chosen one.
 * A fresh instance mounts whenever the group changes, so the sub-category
 * starts back at the first.
 */
function TechGroupPanel({
  group,
  counts,
}: {
  group: TechGroup;
  counts: Record<string, TechCounts>;
}) {
  const [subId, setSubId] = useState(group.subcategories[0]?.id ?? "");

  return (
    <div className="rounded-[1.5rem] border-2 border-border-strong bg-surface-card p-5 shadow-[8px_8px_0_0_var(--color-border-strong)] sm:p-7">
      <Tabs
        value={subId}
        onValueChange={setSubId}
        variant="underline"
        className="gap-6"
      >
        <TabList
          aria-label={`Phân loại trong ${group.label}`}
          className="gap-1 overflow-x-auto border-b-[5px] border-accent-lime"
        >
          {group.subcategories.map((sub) => {
            const Icon = subcategoryIconOf(sub.label);
            return (
              <TabTrigger
                key={sub.id}
                value={sub.id}
                className="gap-2 rounded-t-standard px-4 font-bold text-text-primary aria-selected:bg-accent-lime aria-selected:text-ink aria-selected:after:bg-transparent"
              >
                <Icon aria-hidden="true" size={18} className="shrink-0" />
                {sub.label}
              </TabTrigger>
            );
          })}
        </TabList>

        {group.subcategories.map((sub) => (
          <TabPanel key={sub.id} value={sub.id} tabIndex={-1}>
            {sub.id === subId && (
              <ul className="grid gap-x-6 gap-y-8 pr-2 pb-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {sub.items.map((entry, index) => (
                  <li key={entry.id} className="flex">
                    <TechItemCard
                      item={entry}
                      index={index}
                      counts={counts[entry.id]}
                      href={
                        entry.href ??
                        (counts[entry.id] ? `/topics/${entry.id}` : undefined)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

/**
 * The IT knowledge browser: a bar of groups (Frontend, Backend, DevOps, ...)
 * as pills with an icon each, the chosen one lime with a black edge, and under
 * it the chosen group's panel. Only the chosen group's panel is mounted, so
 * switching groups always starts again at its first sub-category.
 */
export function TechHub({
  groups,
  counts = {},
  defaultGroupId,
  groupsLabel = "Nhóm kiến thức",
  className,
  ...props
}: TechHubProps) {
  const [groupId, setGroupId] = useState(defaultGroupId ?? groups[0]?.id ?? "");

  return (
    <div className={className} {...props}>
      <Tabs value={groupId} onValueChange={setGroupId} variant="pill">
        <TabList
          aria-label={groupsLabel}
          className="w-full max-w-full justify-between gap-1 overflow-x-auto border-2 border-border-strong p-1.5 shadow-[3px_3px_0_0_var(--color-border-strong)]"
        >
          {groups.map((group) => {
            const Icon = GROUP_ICONS[group.icon];
            return (
              <TabTrigger
                key={group.id}
                value={group.id}
                className="h-12 gap-2 px-5 text-base font-bold text-text-primary aria-selected:border-2 aria-selected:border-border-strong aria-selected:text-ink aria-selected:shadow-[3px_3px_0_0_var(--color-border-strong)]"
              >
                <Icon aria-hidden="true" size={18} className="shrink-0" />
                {group.label}
              </TabTrigger>
            );
          })}
        </TabList>

        {groups.map((group) => (
          <TabPanel key={group.id} value={group.id} tabIndex={-1}>
            {group.id === groupId && (
              <TechGroupPanel group={group} counts={counts} />
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
