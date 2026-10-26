import { type ComponentProps, type ReactNode } from "react";
import { Stack, Text, cn } from "@/design-system";
import type { LauncherModule } from "../../types";
import { ModuleGridItem } from "../ModuleGridItem";

export interface ModuleGridProps extends Omit<
  ComponentProps<"section">,
  "title"
> {
  modules: LauncherModule[];
  title: ReactNode;
  description?: ReactNode;
  /** Accessible name of the list of links; defaults to the title when it is text. */
  navLabel?: string;
  /** Heading element of the title; pick the level that fits the page outline. */
  titleAs?: "h1" | "h2" | "h3";
}

/**
 * A launcher: every item as a round picture with its name below, laid out
 * with flex-wrap. Items have a fixed width and the list is capped to the width
 * of 5 of them on desktop and 3 on tablet and phone, so 15 modules wrap into
 * 3 rows or 5 (and into fewer per row on a very narrow screen). Each picture
 * and name is centered in its item; the list's negative left margin is half
 * the space around the picture (item width minus picture width), so the first
 * picture still lines up with the heading. The links form a
 * navigation landmark; the section has a heading and works without
 * JavaScript, so it can be a Server Component.
 */
export function ModuleGrid({
  modules,
  title,
  description,
  navLabel,
  titleAs = "h2",
  className,
  ...props
}: ModuleGridProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)} {...props}>
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
      <nav
        aria-label={navLabel ?? (typeof title === "string" ? title : undefined)}
      >
        <ul className="-ml-6 flex max-w-[19rem] flex-wrap gap-x-2 gap-y-1 sm:max-w-[19.5rem] sm:gap-x-3 sm:gap-y-2 lg:-ml-5 lg:max-w-[35.5rem]">
          {modules.map((item) => (
            <li key={item.id} className="w-24 lg:w-26">
              <ModuleGridItem item={item} className="w-full" />
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
