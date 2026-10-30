"use client";

import { useEffect, useRef, useState } from "react";
import { PageContainer, Text, cn } from "@/design-system";
import { DashboardProvider, useDashboard } from "../DashboardContext";
import { ActivityModule } from "./ActivityModule";
import { CriteriaModule } from "./CriteriaModule";
import { CriterionDetailPanel } from "./CriterionDetailPanel";
import { IssuesModule } from "./IssuesModule";
import { OverviewModule } from "./OverviewModule";

/** How long the middle column takes to close again (matches `duration-300` below). */
const CLOSE_MS = 300;

/** `/dashboard`: the project's criteria, issues and activity in four linked modules. */
export function DashboardScreen() {
  return (
    <DashboardProvider>
      <DashboardLayout />
    </DashboardProvider>
  );
}

/**
 * Two columns normally (main 70%, sidebar 30%). Opening a criterion makes the
 * page full width and opens a middle column for its detail: the main column
 * narrows to the left, the sidebar is pushed to the right, and the detail
 * fades in between them. On tablet and phone everything stays in one column,
 * with the detail between the main column and the sidebar.
 */
function DashboardLayout() {
  const { openedCriterionId } = useDashboard();
  const isOpen = Boolean(openedCriterionId);

  // Keep the detail on screen while the middle column closes, after its id is cleared.
  const [renderedId, setRenderedId] = useState(openedCriterionId);
  if (openedCriterionId && openedCriterionId !== renderedId) {
    setRenderedId(openedCriterionId);
  }
  useEffect(() => {
    if (isOpen) return;
    const timer = setTimeout(() => setRenderedId(undefined), CLOSE_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Bring the detail's top into view (just under the sticky header), smoothly,
  // so a criterion picked far down the list never opens out of sight.
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openedCriterionId) return;
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    detailRef.current?.scrollIntoView?.({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [openedCriterionId]);

  return (
    <PageContainer
      size={isOpen ? "full" : "wide"}
      spacing="spacious"
      className="flex flex-col gap-4 transition-[max-width] duration-300 ease-out motion-reduce:transition-none"
    >
      <Text as="h1" size="heading-lg" weight="bold" className="font-display">
        Project Dashboard
      </Text>
      <div
        className={cn(
          "grid items-start gap-y-4 lg:gap-x-0",
          // The middle track is 0 while closed and opens to a share of the width.
          "transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none",
          isOpen
            ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)_minmax(0,3fr)]"
            : "lg:grid-cols-[minmax(0,7fr)_minmax(0,0fr)_minmax(0,3fr)]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-4 lg:pr-[7px]">
          <OverviewModule />
          <CriteriaModule />
        </div>
        <div
          ref={detailRef}
          // Hidden while the column is closed, so it takes no space and cannot be reached.
          className={cn(
            "min-w-0 scroll-mt-[calc(var(--app-header-height,0px)+1rem)] lg:overflow-hidden",
            renderedId ? "max-lg:mt-0" : "max-lg:hidden",
          )}
          aria-hidden={isOpen ? undefined : true}
          inert={isOpen ? undefined : true}
        >
          {renderedId && (
            <div
              key={renderedId}
              className={cn(
                "transition-opacity duration-300 motion-reduce:transition-none lg:px-[7px]",
                // Fades in a moment after the column starts to open.
                isOpen ? "animate-fade-in opacity-100" : "opacity-0",
              )}
            >
              <CriterionDetailPanel id={renderedId} />
            </div>
          )}
        </div>
        <aside
          aria-label="Vấn đề và hoạt động"
          className="flex min-w-0 flex-col gap-4 lg:pl-[7px]"
        >
          <IssuesModule />
          <ActivityModule />
        </aside>
      </div>
    </PageContainer>
  );
}
