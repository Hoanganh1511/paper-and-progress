"use client";

import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Stack,
  Text,
  cn,
  focusRingClasses,
  usePrefersReducedMotion,
} from "@/design-system";
import { LAUNCHER_MODULES } from "../../data";
import type { LauncherModule } from "../../types";
import { ModuleGridItem } from "../ModuleGridItem";

/** Time the other items take to fade out before the chosen one grows (ms). */
const LEAVE_MS = 200;

/**
 * - `idle`: every module is shown
 * - `leaving`: a module was chosen and the others are fading out
 * - `open`: the others are gone, the chosen one is enlarged and its page is shown beside it
 */
type Phase = "idle" | "leaving" | "open";

export interface ModuleGridProps extends Omit<
  ComponentProps<"section">,
  "title"
> {
  /**
   * Defaults to the app's modules. Leave it out when rendering from a Server
   * Component: the items hold icon components, which cannot cross into this
   * Client Component as props.
   */
  modules?: LauncherModule[];
  title: ReactNode;
  description?: ReactNode;
  /** Accessible name of the list of links; defaults to the title when it is text. */
  navLabel?: string;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: "h1" | "h2" | "h3";
  /** What to show beside a chosen module, by module id. */
  panels?: Record<string, ReactNode>;
  /** Name of the button that closes the panel and brings the other modules back. */
  closeLabel?: string;
  /** Title of the panel of a module without one; `{label}` is replaced by its name. */
  emptyPanelTitle?: string;
  emptyPanelDescription?: string;
  /** Shown beside the heading, e.g. an illustration. */
  aside?: ReactNode;
  /** Always put the panel below the items, even on wide screens (for narrow containers). */
  isPanelBelow?: boolean;
}

/**
 * A launcher: every item as a round picture with its name below, laid out
 * with flex-wrap. Items have a fixed width and the list is capped to the width
 * of 5 of them on desktop and 3 on tablet and phone, so 15 modules wrap into
 * 3 rows or 5 (and into fewer per row on a very narrow screen). Each picture
 * and name is centered in its item; the list's negative left margin is half
 * the space around the picture (item width minus picture width), so the first
 * picture still lines up with the heading. The links form a
 * navigation landmark.
 *
 * Choosing a module (a plain click) fades the others out, then enlarges the
 * chosen one to 120% and shows its panel to the right (below on small
 * screens). Escape or the close button brings everything back. Every item
 * stays a real link, so without JavaScript, or with a modified click (new
 * tab), it simply goes to the module's page. With reduced motion the others
 * disappear at once.
 */
export function ModuleGrid({
  modules = LAUNCHER_MODULES,
  title,
  description,
  navLabel,
  titleAs = "h2",
  panels = {},
  closeLabel = "Đóng",
  emptyPanelTitle = "{label} sắp ra mắt",
  emptyPanelDescription = "Mô-đun này đang được xây dựng.",
  aside,
  isPanelBelow = false,
  className,
  onKeyDown,
  ...props
}: ModuleGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const navRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const active = modules.find((item) => item.id === activeId);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("open"), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // Move keyboard and screen reader users to what just appeared.
  useEffect(() => {
    if (phase === "open") panelRef.current?.focus();
  }, [phase]);

  function select(item: LauncherModule, event: MouseEvent<HTMLAnchorElement>) {
    const isPlainClick =
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey;
    if (!isPlainClick) return;
    event.preventDefault();
    if (item.id === activeId) return;
    setActiveId(item.id);
    setPhase(prefersReducedMotion ? "open" : "leaving");
  }

  function close() {
    const id = activeId;
    setActiveId(null);
    setPhase("idle");
    // Put focus back on the module the user came from.
    requestAnimationFrame(() =>
      navRef.current
        ?.querySelector<HTMLElement>(`[data-module-id="${id}"]`)
        ?.focus(),
    );
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.key === "Escape" && phase === "open") {
      event.preventDefault();
      close();
    }
  }

  return (
    <section
      className={cn("flex flex-col gap-6", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <Stack gap={1}>
          <Text as={titleAs} size="heading-lg" weight="semibold">
            {title}
          </Text>
          {description && (
            <Text size="body-md" color="secondary">
              {description}
            </Text>
          )}
        </Stack>
        {aside}
      </div>
      <div
        className={cn(
          "flex flex-col gap-8",
          !isPanelBelow &&
            "lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start",
        )}
      >
        <nav
          ref={navRef}
          aria-label={
            navLabel ?? (typeof title === "string" ? title : undefined)
          }
        >
          <ul className="-ml-6 flex max-w-[19rem] flex-wrap gap-x-2 gap-y-1 sm:max-w-[19.5rem] sm:gap-x-3 sm:gap-y-2 lg:-ml-5 lg:max-w-[35.5rem]">
            {modules.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "w-24 transition-[opacity,scale] duration-[var(--duration-normal)] ease-[var(--ease-default)] motion-reduce:transition-none lg:w-26",
                    !isActive &&
                      phase === "leaving" &&
                      "pointer-events-none scale-75 opacity-0",
                    !isActive && phase === "open" && "hidden",
                    isActive && phase === "open" && "origin-left scale-120",
                  )}
                >
                  <ModuleGridItem
                    item={item}
                    className="w-full"
                    data-module-id={item.id}
                    aria-current={isActive ? "true" : undefined}
                    tabIndex={!isActive && phase !== "idle" ? -1 : undefined}
                    onClick={(event) => select(item, event)}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        {phase === "open" && active && (
          <div
            ref={panelRef}
            role="region"
            aria-label={active.label}
            tabIndex={-1}
            className={cn(
              "min-w-0 rounded-standard transition-[opacity,translate] duration-[var(--duration-slow)] ease-[var(--ease-default)] outline-none starting:translate-x-4 starting:opacity-0 motion-reduce:transition-none",
              focusRingClasses,
            )}
          >
            <Card padding="default" className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <Text as="h3" size="heading-md" weight="semibold">
                  {active.label}
                </Text>
                <Button
                  variant="outline"
                  size="compact"
                  leftIcon={X}
                  onClick={close}
                >
                  {closeLabel}
                </Button>
              </div>
              {panels[active.id] ?? (
                <EmptyState
                  icon={active.icon}
                  title={emptyPanelTitle.replace("{label}", active.label)}
                  description={emptyPanelDescription}
                />
              )}
            </Card>
          </div>
        )}
      </div>
    </section>
  );
}
