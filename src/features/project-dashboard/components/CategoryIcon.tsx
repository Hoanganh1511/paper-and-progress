import type { ComponentProps } from "react";
import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from "../display";

export interface CategoryIconProps extends Omit<
  ComponentProps<"svg">,
  "ref" | "name"
> {
  /** The category's `icon` name; a folder is shown when it is unknown. */
  name: string | null;
  size?: number;
}

/** The icon of a category. Decorative: it is hidden from screen readers. */
export function CategoryIcon({ name, size = 20, ...props }: CategoryIconProps) {
  const Icon = (name && CATEGORY_ICONS[name]) || FALLBACK_CATEGORY_ICON;
  return <Icon aria-hidden="true" size={size} {...props} />;
}
