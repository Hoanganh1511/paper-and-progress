import { cva, type VariantProps } from "class-variance-authority";
import { focusRingClasses } from "../../../primitives/FocusRing";

// Kept out of Button.tsx, which is a Client Component: LinkButton calls
// these functions, and a Server Component can only call functions that live
// in a module without "use client".
// Class names are written out in full so Tailwind can detect them statically.
// compact/default are shorter than 44px, so a ::before pseudo-element extends
// the hit area to the minimum touch target without changing the visual size.
// Neo-brutalist press: a hard offset shadow that collapses while the button
// is pressed, the way a sticker is pushed flat. Ghost buttons stay flat.
const PRESSABLE =
  "border-2 border-border-strong shadow-accent transition-[background-color,box-shadow,translate] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:shadow-none motion-reduce:transition-none";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 border-2 border-transparent",
    "rounded-standard font-body font-medium whitespace-nowrap no-underline",
    "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)]",
    "cursor-pointer disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:cursor-progress",
    focusRingClasses,
  ],
  {
    variants: {
      variant: {
        primary: `${PRESSABLE} bg-action-primary text-text-inverse hover:bg-action-primary-hover active:bg-action-primary-active`,
        secondary: `${PRESSABLE} bg-surface-card text-text-primary hover:bg-surface-sunken active:bg-surface-sunken`,
        outline: `${PRESSABLE} bg-surface-page text-text-primary hover:bg-surface-sunken active:bg-surface-sunken`,
        ghost:
          "bg-transparent text-text-primary hover:bg-surface-sunken active:bg-surface-sunken",
        destructive: `${PRESSABLE} bg-danger-text text-surface hover:brightness-110`,
        accent: `${PRESSABLE} bg-accent-lime text-ink hover:brightness-95`,
      },
      size: {
        compact:
          "relative h-[var(--height-compact)] px-3 text-body-sm before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
        default:
          "relative h-[var(--height-default)] px-4 text-body-md before:absolute before:top-1/2 before:left-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2",
        comfortable: "h-[var(--height-comfortable)] px-6 text-body-lg",
      },
      isFullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      isFullWidth: false,
    },
  },
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export function getButtonIconSize(size: ButtonVariantProps["size"]) {
  return size === "comfortable" ? 20 : 16;
}
