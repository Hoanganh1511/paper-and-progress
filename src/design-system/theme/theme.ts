export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_CHANGE_EVENT = "theme-change";

/** The theme the user picked, or null if they never did (then the system decides). */
export function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** The theme in effect: the user's choice, else the system's. */
export function resolveTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

/**
 * Puts a theme on <html>. globals.css reads both hooks: the `.dark` class
 * turns the dark tokens on, and `data-theme="light"` stops the
 * prefers-color-scheme rule from doing so when the user chose light.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

/** Runs before first paint (see ThemeScript) so a saved choice does not flash the other theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="dark"||t==="light"){var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.dataset.theme=t}}catch(e){}})()`;
