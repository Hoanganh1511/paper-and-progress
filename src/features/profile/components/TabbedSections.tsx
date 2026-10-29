"use client";

import type { ReactNode } from "react";
import { TabList, TabPanel, TabTrigger, Tabs } from "@/design-system";
import type { ProfileTab, ProfileTabId } from "../types";
import {
  PILL_TAB_LIST_CLASSES,
  PILL_TAB_TRIGGER_CLASSES,
  TAB_LIST_CLASSES,
  TAB_TRIGGER_CLASSES,
} from "./tabStyles";

export interface TabbedSectionsProps {
  /** Accessible name of the tab bar. */
  label: string;
  tabs: ProfileTab[];
  value: ProfileTabId;
  onValueChange: (value: ProfileTabId) => void;
  renderPanel: (tabId: ProfileTabId) => ReactNode;
  /** "folder": curved tabs on a baseline. "pill": separate rounded buttons. */
  variant?: "folder" | "pill";
}

/** The folder-tab bar and the body of the selected tab; shared by `/profile` and `/settings`. */
export function TabbedSections({
  label,
  tabs,
  value,
  onValueChange,
  renderPanel,
  variant = "folder",
}: TabbedSectionsProps) {
  const isPill = variant === "pill";

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as ProfileTabId)}
    >
      <TabList
        aria-label={label}
        className={isPill ? PILL_TAB_LIST_CLASSES : TAB_LIST_CLASSES}
      >
        {tabs.map((tab) => (
          <TabTrigger
            key={tab.id}
            value={tab.id}
            className={isPill ? PILL_TAB_TRIGGER_CLASSES : TAB_TRIGGER_CLASSES}
          >
            <tab.icon aria-hidden="true" size={16} className="shrink-0" />
            {tab.label}
          </TabTrigger>
        ))}
      </TabList>
      {tabs.map((tab) => (
        <TabPanel
          key={tab.id}
          value={tab.id}
          className={isPill ? "pt-4" : undefined}
        >
          {renderPanel(tab.id)}
        </TabPanel>
      ))}
    </Tabs>
  );
}
