"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

/** Points the URL at `#hash` (adding a history entry) and tells subscribers. */
export function setLocationHash(hash: string) {
  window.history.pushState(null, "", `#${hash}`);
  listeners.forEach((listener) => listener());
}

/** The current `location.hash` without the "#"; empty on the server. */
export function useLocationHash(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.hash.slice(1),
    () => "",
  );
}
