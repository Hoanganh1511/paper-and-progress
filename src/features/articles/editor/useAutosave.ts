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
  /** After a failed save, try again by itself up to this many times (default 0: never). */
  maxRetries?: number;
  /** Which failures are worth retrying; the default is all of them. */
  shouldRetry?: (error: unknown) => boolean;
  /** Milliseconds to wait before retry number `attempt` (1, 2, ...). Default 2s, 4s, 8s... */
  retryDelay?: (attempt: number) => number;
}

const defaultRetryDelay = (attempt: number) => 2000 * 2 ** (attempt - 1);

/**
 * Saves a value a moment after the user stops changing it. Never two saves at
 * once: a change made while one is running is saved right after it. `saveNow`
 * does it without waiting. Unsaved changes are also saved when the editor is
 * closed (a link inside the app) or the tab is hidden, a failed save is retried
 * by itself, and the browser warns before the tab is closed with unsaved changes.
 */
export function useAutosave<T>({
  value,
  save,
  delay = 3000,
  isEnabled = true,
  maxRetries = 0,
  shouldRetry,
  retryDelay = defaultRetryDelay,
}: UseAutosaveOptions<T>) {
  const serialized = JSON.stringify(value);
  const latest = useRef(value);
  const latestSerialized = useRef(serialized);
  const savedSerialized = useRef(serialized);
  const saveRef = useRef(save);
  const enabledRef = useRef(isEnabled);
  const retryRef = useRef({ maxRetries, shouldRetry, retryDelay });
  const inFlight = useRef<Promise<void> | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const attempts = useRef(0);
  const runAgain = useRef<() => void>(() => undefined);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date>();
  const [error, setError] = useState<string>();
  const [isDirty, setIsDirty] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    latest.current = value;
    latestSerialized.current = serialized;
    saveRef.current = save;
    enabledRef.current = isEnabled;
    retryRef.current = { maxRetries, shouldRetry, retryDelay };
  });

  const stopRetrying = useCallback(() => {
    clearTimeout(retryTimer.current);
    retryTimer.current = undefined;
    attempts.current = 0;
    setIsRetrying(false);
  }, []);

  const run = useCallback((): Promise<void> => {
    if (inFlight.current) return inFlight.current;
    // Nothing waiting: there is no save to run, and nothing to remember as running.
    if (latestSerialized.current === savedSerialized.current) {
      return Promise.resolve();
    }
    const job = (async () => {
      // Let `inFlight` be set below before anything can finish: a job that
      // ended first would clear it, and the finished job would then stay as
      // "running" for good, so no later save would ever reach the server.
      await Promise.resolve();
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
        stopRetrying();
      } catch (caught) {
        setStatus("error");
        setError(
          caught instanceof Error ? caught.message : "Không lưu được bài viết.",
        );
        const retry = retryRef.current;
        if (
          attempts.current < retry.maxRetries &&
          (retry.shouldRetry?.(caught) ?? true)
        ) {
          attempts.current += 1;
          setIsRetrying(true);
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(
            () => runAgain.current(),
            retry.retryDelay(attempts.current),
          );
        } else {
          setIsRetrying(false);
        }
        throw caught;
      } finally {
        inFlight.current = undefined;
      }
    })();
    inFlight.current = job;
    return job;
  }, [stopRetrying]);

  useEffect(() => {
    runAgain.current = () => {
      run().catch(() => undefined);
    };
  }, [run]);

  useEffect(() => {
    if (serialized === savedSerialized.current) return;
    // A new change starts over: the countdown below saves it, with fresh retries.
    stopRetrying();
    setIsDirty(true);
    if (!isEnabled) return;
    timer.current = setTimeout(() => {
      run().catch(() => undefined);
    }, delay);
    return () => clearTimeout(timer.current);
  }, [serialized, delay, isEnabled, run, stopRetrying]);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Leaving the tab (switching away, closing it on a phone) saves what is waiting.
  useEffect(() => {
    const flushWhenHidden = () => {
      if (
        document.visibilityState === "hidden" &&
        enabledRef.current &&
        latestSerialized.current !== savedSerialized.current
      ) {
        clearTimeout(timer.current);
        run().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushWhenHidden);
    };
  }, [run]);

  // Closing the editor (a link inside the app) must not drop what was typed in the last few seconds.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (
        enabledRef.current &&
        latestSerialized.current !== savedSerialized.current
      ) {
        runAgain.current();
      }
    },
    [],
  );

  const saveNow = useCallback(async () => {
    clearTimeout(timer.current);
    stopRetrying();
    await run();
  }, [run, stopRetrying]);

  return { status, savedAt, error, isDirty, isRetrying, saveNow };
}
