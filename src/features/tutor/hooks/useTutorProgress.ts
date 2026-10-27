"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { TutorProgress } from "../types";

const STORAGE_KEY = "pp-backend-tutor";
const EMPTY: TutorProgress = { done: {}, checks: {}, ratings: {}, notes: {} };

const listeners = new Set<() => void>();
// Used when localStorage is unavailable (private window, blocked site data).
let memory = "";

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readRaw(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return memory;
  }
}

function parse(raw: string): TutorProgress {
  if (!raw) return EMPTY;
  try {
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<TutorProgress>) };
  } catch {
    return EMPTY;
  }
}

/**
 * The learner's progress through the tutor, kept in localStorage. Reading goes
 * through useSyncExternalStore so it is empty on the server and first paint,
 * then fills in without a hydration mismatch.
 */
export function useTutorProgress() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "");
  const progress = useMemo(() => parse(raw), [raw]);

  const update = useCallback(
    (change: (current: TutorProgress) => TutorProgress) => {
      memory = JSON.stringify(change(parse(readRaw())));
      try {
        window.localStorage.setItem(STORAGE_KEY, memory);
      } catch {
        // Progress still works for this visit through `memory`.
      }
      listeners.forEach((listener) => listener());
    },
    [],
  );

  return { progress, update };
}
