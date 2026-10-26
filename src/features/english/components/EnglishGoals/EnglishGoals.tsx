"use client";

import { useState, type ComponentProps } from "react";
import {
  Carousel,
  Stack,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
  Text,
} from "@/design-system";
import type { EnglishTab } from "../../types";
import { TopicCard } from "../TopicCard";

export interface EnglishGoalsProps extends Omit<
  ComponentProps<"div">,
  "children" | "ref"
> {
  tabs: EnglishTab[];
  /** Tab shown first; defaults to the first one. */
  defaultTabId?: string;
  /** Accessible name of the tab list. */
  tabsLabel?: string;
}

/**
 * Tabs for the groups of English goals. Each tab holds one or more titled
 * rows: a horizontal carousel of illustrated cards that scrolls and snaps
 * (swipe on a phone, arrow buttons from md). Only the chosen tab's rows are
 * rendered.
 */
export function EnglishGoals({
  tabs,
  defaultTabId,
  tabsLabel = "Nhóm mục tiêu tiếng Anh",
  className,
  ...props
}: EnglishGoalsProps) {
  const [tabId, setTabId] = useState(defaultTabId ?? tabs[0]?.id ?? "");

  return (
    <div className={className} {...props}>
      <Tabs value={tabId} onValueChange={setTabId} variant="pill">
        <TabList aria-label={tabsLabel} className="max-w-full">
          {tabs.map((tab) => (
            <TabTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabTrigger>
          ))}
        </TabList>

        {tabs.map((tab) => (
          <TabPanel
            key={tab.id}
            value={tab.id}
            // The panel holds focusable content, so it need not be a tab stop.
            tabIndex={-1}
          >
            {tab.id === tabId && (
              <Stack gap={8}>
                {tab.sections.map((section) => (
                  <div key={section.id}>
                    <Stack gap={4}>
                      <Stack gap={1}>
                        <Text as="h2" size="heading-md" weight="semibold">
                          {section.title}
                        </Text>
                        {section.description && (
                          <Text size="body-md" color="secondary">
                            {section.description}
                          </Text>
                        )}
                      </Stack>
                      <Carousel
                        aria-label={section.title}
                        labels={{
                          previous: "Thẻ trước",
                          next: "Thẻ sau",
                          slide: "{current} trên {total}",
                        }}
                      >
                        {section.topics.map((topic) => (
                          <TopicCard key={topic.id} topic={topic} />
                        ))}
                      </Carousel>
                    </Stack>
                  </div>
                ))}
              </Stack>
            )}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
