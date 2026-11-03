"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Layers, ListChecks, Newspaper } from "lucide-react";
import { TabList, TabPanel, TabTrigger, Tabs, cn } from "@/design-system";
import type { LearningDomain } from "../../types";
import { DomainPanel } from "../DomainPanel";

export type LibraryTab = "articles" | "techstack" | "lists";

export interface LearningHubProps extends Omit<
  ComponentProps<"div">,
  "ref" | "children"
> {
  domains: LearningDomain[];
  /**
   * The articles. When given, the library has two folder tabs: "Bài viết" (this)
   * and "Techstack" (the domains). Without it the domains are shown on their own.
   */
  articles?: ReactNode;
  /** The learner's own study lists: a third folder tab, "Danh sách học". */
  studyLists?: ReactNode;
  /** The tab shown first. */
  defaultTab?: LibraryTab;
}

/** Puts the open tab in the address (`?tab=techstack`) without adding a history entry or loading the page. */
function rememberTab(tab: LibraryTab) {
  const url = new URL(window.location.href);
  if (tab === "articles") url.searchParams.delete("tab");
  else url.searchParams.set("tab", tab);
  window.history.replaceState(window.history.state, "", url);
}

/**
 * The body of the knowledge library: the content panel and, when there are
 * articles, the two folder tabs on its top edge. The open tab is lime and runs
 * into the lime band along the top of the panel, so tabs and panel read as one
 * folder. Both tabs are on the page already, so changing tab loads nothing and
 * the tabs do not move; only the panel's content changes.
 */
export function LearningHub({
  domains,
  articles,
  studyLists,
  defaultTab = "articles",
  className,
  ...props
}: LearningHubProps) {
  const [tab, setTab] = useState<LibraryTab>(defaultTab);

  const sections = domains.map((domain) => (
    <DomainPanel key={domain.id} domain={domain} />
  ));

  if (!articles) {
    return (
      <div
        lang="vi"
        className={cn("flex flex-col gap-10", className)}
        {...props}
      >
        {sections}
      </div>
    );
  }

  return (
    <div lang="vi" className={className} {...props}>
      <Tabs
        variant="folder"
        value={tab}
        onValueChange={(next) => {
          setTab(next as LibraryTab);
          rememberTab(next as LibraryTab);
        }}
        className="gap-0"
      >
        <TabList aria-label="Nội dung của thư viện">
          <TabTrigger value="articles">
            <Newspaper aria-hidden="true" size={20} className="shrink-0" />
            Bài viết
          </TabTrigger>
          <TabTrigger value="techstack">
            <Layers aria-hidden="true" size={20} className="shrink-0" />
            Techstack
          </TabTrigger>
          {studyLists && (
            <TabTrigger value="lists">
              <ListChecks aria-hidden="true" size={20} className="shrink-0" />
              Danh sách học
            </TabTrigger>
          )}
        </TabList>
        {/* The square top-left corner is where the first tab begins. */}
        {/* overflow-hidden clips the lime band to the rounded border; the shadow is outside, so it stays. */}
        <div className="relative overflow-hidden rounded-tr-[1.5rem] rounded-b-[1.5rem] border-2 border-border-strong bg-surface-card shadow-[8px_8px_0_0_var(--color-border-strong)]">
          <div aria-hidden="true" className="h-2.5 bg-accent-lime" />
          <div className="p-5 sm:p-7 lg:p-8">
            <TabPanel value="articles">{articles}</TabPanel>
            <TabPanel value="techstack" className="flex flex-col gap-10">
              {sections}
            </TabPanel>
            {studyLists && <TabPanel value="lists">{studyLists}</TabPanel>}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
