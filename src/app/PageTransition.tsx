import { ViewTransition, type ReactNode } from "react";

/**
 * What a page's content is wrapped in, by the `template.tsx` of its route
 * group, so a change of page animates: the old content fades out, and the new
 * content fades in, rising a little (see the `page-out` and `page-in` rules at
 * the end of `globals.css`). A template starts afresh on every navigation, which
 * is what lets React see one page leave and another arrive; a layout stays put,
 * so a sidebar kept in a layout does not move. Without browser support, or with
 * reduced motion, the pages simply swap.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
