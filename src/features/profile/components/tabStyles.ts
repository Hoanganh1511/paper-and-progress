// Folder tabs: every tab stands on the baseline with a squarish shape (only the
// two top corners are lightly rounded). The baseline is an inset shadow of the
// list, not a border. An unselected tab's own bottom border lies exactly on it,
// so the line runs unbroken; the selected tab is taller, lime, and has no bottom
// border, so it covers the line and looks joined to the content below.
// The hard shadow falls to the right only: a tab's bottom edge is the baseline,
// and the scrolling list would clip a shadow hanging below it. It uses the
// border colour variable, so it flips with the theme like the real shadow tokens.
// Classes are written out in full so Tailwind sees them.
export const TAB_LIST_CLASSES = [
  // Still scrolls sideways on narrow screens, just without a visible bar.
  "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  // items-end: all tabs sit on the baseline, whatever their height.
  "items-end gap-2 border-b-0 px-2 shadow-[inset_0_-2px_0_0_var(--color-border-strong)]",
].join(" ");

export const TAB_TRIGGER_CLASSES = [
  // Unselected: 40px, bottom corners square. Its ::before extends the click
  // area to the 44px minimum (the selected tab is already 44px).
  "h-10 rounded-t-[6px] rounded-b-none border-2 border-border-strong bg-surface-card px-4 text-text-secondary shadow-[3px_0_0_var(--color-border-strong)] hover:bg-surface-sunken",
  "[&:not([aria-selected=true])]:before:absolute [&:not([aria-selected=true])]:before:top-1/2 [&:not([aria-selected=true])]:before:left-0 [&:not([aria-selected=true])]:before:h-11 [&:not([aria-selected=true])]:before:w-full [&:not([aria-selected=true])]:before:-translate-y-1/2",
  // `after:hidden` drops the underline the default tab draws.
  "after:hidden",
  // Selected: 44px, open at the bottom.
  "aria-selected:h-11 aria-selected:border-b-0 aria-selected:bg-accent-lime aria-selected:font-bold aria-selected:text-ink aria-selected:shadow-[4px_0_0_var(--color-border-strong)] aria-selected:hover:bg-accent-lime aria-selected:hover:text-ink",
].join(" ");

// Pill tabs (used by /profile): no baseline, so nothing runs through the tabs.
// The selected one is a lime block with a hard border and an offset shadow; the
// shape, not just the colour, says which is active. 44px tall for the touch target.
export const PILL_TAB_LIST_CLASSES = [
  // Still scrolls sideways on narrow screens, just without a visible bar.
  "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  // The shadow needs room inside the scroll box, or it is clipped.
  "gap-2 border-b-0 pr-1 pb-1",
].join(" ");

export const PILL_TAB_TRIGGER_CLASSES = [
  "h-11 rounded-standard border-2 border-border-strong bg-surface-card px-4",
  "text-text-secondary hover:bg-surface-muted",
  // Drops the underline the default tab draws.
  "after:hidden",
  "aria-selected:bg-accent-lime aria-selected:font-bold aria-selected:text-ink aria-selected:shadow-accent aria-selected:hover:bg-accent-lime",
  "motion-reduce:transition-none",
].join(" ");
