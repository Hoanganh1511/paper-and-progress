"use client";

import { useState, type ComponentProps } from "react";
import {
  Cloud,
  Code2,
  Database,
  type LucideIcon,
  Server,
  Settings2,
  Shield,
  Smartphone,
  TestTube2,
} from "lucide-react";
import { Tabs, TabList, TabPanel, TabTrigger } from "@/design-system";
import type { TechGroup, TechGroupIcon } from "../../types";
import { TechItemTile } from "../TechItemTile";

const GROUP_ICONS: Record<TechGroupIcon, LucideIcon> = {
  frontend: Code2,
  backend: Server,
  devops: Settings2,
  mobile: Smartphone,
  data: Database,
  security: Shield,
  cloud: Cloud,
  qa: TestTube2,
};

export interface TechHubProps extends Omit<
  ComponentProps<"div">,
  "children" | "ref"
> {
  groups: TechGroup[];
  /** Group shown first; defaults to the first one. */
  defaultGroupId?: string;
  /** Accessible name of the group tab list. */
  groupsLabel?: string;
}

/**
 * One group's content: a tab row for its sub-categories (clicking one swaps
 * the grid below) and the 10-column grid of item tiles. A fresh instance
 * mounts whenever the active group changes, so its sub-category always
 * starts back at the first one.
 */
function TechGroupPanel({ group }: { group: TechGroup }) {
  const [subId, setSubId] = useState(group.subcategories[0]?.id ?? "");

  return (
    <Tabs value={subId} onValueChange={setSubId} variant="underline">
      <TabList aria-label={`Phân loại trong ${group.label}`}>
        {group.subcategories.map((sub) => (
          <TabTrigger key={sub.id} value={sub.id}>
            {sub.label}
          </TabTrigger>
        ))}
      </TabList>

      {group.subcategories.map((sub) => (
        <TabPanel key={sub.id} value={sub.id} className="mt-4" tabIndex={-1}>
          {sub.id === subId && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
              {sub.items.map((item) => (
                <TechItemTile key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabPanel>
      ))}
    </Tabs>
  );
}

/**
 * The IT knowledge browser: a row of group tabs (Frontend, Backend, DevOps,
 * ...), each holding its own sub-category tabs and a dense grid of item
 * tiles, styled after a game's champion-select screen. Only the active
 * group's panel is mounted, so switching groups always resets which
 * sub-category shows.
 */
export function TechHub({
  groups,
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
          className="max-w-full overflow-x-auto"
        >
          {groups.map((group) => {
            const Icon = GROUP_ICONS[group.icon];
            return (
              <TabTrigger key={group.id} value={group.id} className="gap-2">
                <Icon aria-hidden="true" size={16} />
                {group.label}
              </TabTrigger>
            );
          })}
        </TabList>

        {groups.map((group) => (
          <TabPanel
            key={group.id}
            value={group.id}
            className="mt-6"
            tabIndex={-1}
          >
            {group.id === groupId && <TechGroupPanel group={group} />}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
