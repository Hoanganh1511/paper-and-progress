"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyTheme,
  applyThemePreference,
  readStoredTheme,
  readThemePreference,
  resolveTheme,
  type Theme,
  type ThemePreference,
} from "./theme";

function subscribe(onChange: () => void) {
  const mediaQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  mediaQuery?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    mediaQuery?.removeEventListener("change", onChange);
  };
}

/**
 * The current theme and ways to change it. A choice is saved in localStorage
 * and kept in step across tabs; until the user chooses, the system setting
 * applies. The server (and the first client render) report "light".
 */
export function useTheme() {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    resolveTheme,
    () => "light",
  );

  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    readThemePreference,
    () => "system",
  );

  // Re-apply a saved choice in case ThemeScript did not run (it is optional).
  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) applyTheme(stored);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this page only.
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  /** Like `setTheme`, plus "system": forget the saved choice and follow the OS. */
  const setPreference = useCallback((next: ThemePreference) => {
    try {
      if (next === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
      else window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the choice then lasts for this page only.
    }
    applyThemePreference(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(resolveTheme() === "dark" ? "light" : "dark"),
    [setTheme],
  );

  return { theme, preference, setTheme, setPreference, toggleTheme };
}
