"use client";

import { useEffect, useState } from "react";
import { AuthApiError } from "../authApi";

/**
 * Counts down the wait a 429 asks for. Feed it each caught error through
 * `handle`; it returns true when the error was a rate limit, so the screen
 * can skip its own error handling.
 */
export function useRateLimit() {
  const [endsAt, setEndsAt] = useState<number>();
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (endsAt === undefined) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setEndsAt(undefined);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  function handle(error: unknown): boolean {
    if (!(error instanceof AuthApiError) || error.code !== "rate_limited") {
      return false;
    }
    const seconds = error.retryAfter || 30;
    setSecondsLeft(seconds);
    setEndsAt(Date.now() + seconds * 1000);
    return true;
  }

  return { secondsLeft, isLimited: secondsLeft > 0, handle };
}
