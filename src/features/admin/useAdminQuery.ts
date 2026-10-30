"use client";

import { useEffect, useRef, useState } from "react";

export interface AdminQuery<T> {
  /** The last result; stays in place while the next one loads. */
  data?: T;
  error?: Error;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Runs `fetcher` whenever `key` changes (put every filter and the page in it)
 * and when `reload` is called. A slower, older request never overwrites a
 * newer one.
 */
export function useAdminQuery<T>(
  fetcher: () => Promise<T>,
  key: string,
): AdminQuery<T> {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${key}#${reloadCount}`;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: Error;
  }>();
  const latestFetcher = useRef(fetcher);
  useEffect(() => {
    latestFetcher.current = fetcher;
  });

  useEffect(() => {
    let isCurrent = true;
    latestFetcher
      .current()
      .then((data) => {
        if (isCurrent) setResult({ key: requestKey, data });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setResult((previous) => ({
          key: requestKey,
          data: previous?.data,
          error: error instanceof Error ? error : new Error(String(error)),
        }));
      });
    return () => {
      isCurrent = false;
    };
  }, [requestKey]);

  return {
    data: result?.data,
    error: result?.key === requestKey ? result.error : undefined,
    isLoading: result?.key !== requestKey,
    reload: () => setReloadCount((count) => count + 1),
  };
}

/** `value`, but only after it has stopped changing for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
