"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveOptions<T> {
  /** What would be saved. A change (compared as JSON) starts the countdown. */
  value: T;
  /** Saves `value`. Only one call runs at a time. */
  save: (value: T) => Promise<void>;
  /** Milliseconds of quiet after a change before saving. */
  delay?: number;
  /** Turn off until the form can be saved (e.g. it has no title yet). */
  isEnabled?: boolean;
}

/**
 * Saves a value a moment after the user stops changing it. Never two saves at
 * once: a change made while one is running is saved right after it. `saveNow`
 * does it without waiting. Warns before the tab is closed with unsaved changes.
 */
export function useAutosave<T>({
  value,
  save,
  delay = 3000,
  isEnabled = true,
}: UseAutosaveOptions<T>) {
  const serialized = JSON.stringify(value);
  const latest = useRef(value);
  const latestSerialized = useRef(serialized);
  const savedSerialized = useRef(serialized);
  const saveRef = useRef(save);
  const inFlight = useRef<Promise<void> | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date>();
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    latest.current = value;
    latestSerialized.current = serialized;
    saveRef.current = save;
  });

  const run = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    const job = (async () => {
      try {
        while (latestSerialized.current !== savedSerialized.current) {
          const snapshot = latestSerialized.current;
          setStatus("saving");
          setError(undefined);
          await saveRef.current(latest.current);
          savedSerialized.current = snapshot;
          setSavedAt(new Date());
        }
        setStatus("saved");
        setIsDirty(false);
      } catch (caught) {
        setStatus("error");
        setError(
          caught instanceof Error ? caught.message : "Không lưu được bài viết.",
        );
        throw caught;
      } finally {
        inFlight.current = undefined;
      }
    })();
    inFlight.current = job;
    return job;
  }, []);

  useEffect(() => {
    if (serialized === savedSerialized.current) return;
    setIsDirty(true);
    if (!isEnabled) return;
    timer.current = setTimeout(() => {
      run().catch(() => undefined);
    }, delay);
    return () => clearTimeout(timer.current);
  }, [serialized, delay, isEnabled, run]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const saveNow = useCallback(async () => {
    clearTimeout(timer.current);
    await run();
  }, [run]);

  return { status, savedAt, error, isDirty, saveNow };
}
