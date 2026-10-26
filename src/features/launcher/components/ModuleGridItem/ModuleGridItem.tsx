import { type ComponentProps } from "react";
import { Image, cn, focusRingClasses } from "@/design-system";
import type { LauncherGroup, LauncherModule } from "../../types";

// Class names are written out in full so Tailwind can detect them statically.
// The tint only groups the modules visually; every item is named by its label.
const GROUP_TINT: Record<LauncherGroup, string> = {
  core: "bg-accent-lime",
  practice: "bg-accent-blue",
  explore: "bg-accent-yellow",
  community: "bg-accent-pink",
  personal: "bg-accent-pink",
  // Not a tint: a plain card-colored disc with an outline and theme-colored
  // icon, so it reads in dark mode too (the tinted ones keep the ink icon).
  system: "border border-border-default bg-surface-card text-text-primary",
};

export interface ModuleGridItemProps extends Omit<
  ComponentProps<"a">,
  "href" | "children"
> {
  item: LauncherModule;
}

/**
 * One launcher entry: a round picture with its name centered beneath it. The whole thing
 * is a single link named by the label (the picture is decorative). The circle
 * grows from a small phone size to a large desktop one.
 */
export function ModuleGridItem({
  item,
  className,
  ...props
}: ModuleGridItemProps) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      data-group={item.group}
      className={cn(
        "group flex min-h-11 flex-col items-center gap-1.5 rounded-standard p-1.5 text-center",
        focusRingClasses,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-pill text-ink sm:size-12 lg:size-16",
          "transition-transform duration-[var(--duration-normal)] ease-[var(--ease-default)] group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          GROUP_TINT[item.group],
        )}
      >
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            aspectRatio="square"
            radius="none"
            frameClassName="size-full"
          />
        ) : (
          <Icon aria-hidden="true" className="size-1/2" strokeWidth={1.75} />
        )}
      </span>
      <span className="font-body text-caption font-medium text-text-primary sm:text-body-sm">
        {item.label}
      </span>
    </a>
  );
}
