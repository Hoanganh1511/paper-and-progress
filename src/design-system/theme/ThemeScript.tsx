import { THEME_INIT_SCRIPT } from "./theme";

/**
 * Put this in the root layout's <head> (and `suppressHydrationWarning` on
 * <html>) so a saved theme is applied before the page is first painted.
 */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
