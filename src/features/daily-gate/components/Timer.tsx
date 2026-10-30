"use client";

import { useEffect, useRef, useState } from "react";
import { Timer as TimerIcon } from "lucide-react";
import { cn } from "@/design-system";
import { formatClock } from "../display";

export interface TimerProps {
  /** Starting time in seconds. */
  seconds: number;
  /** Called once, when the time is up. */
  onExpire: () => void;
  /** Stops the clock, e.g. after the test was handed in. */
  isStopped?: boolean;
}

const WARNING_SECONDS = 30;

/** A countdown. It turns red in the last 30 seconds, and says so to screen readers once. */
export function Timer({ seconds, onExpire, isStopped = false }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (isStopped) return;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const left = seconds - Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        clearInterval(timer);
        onExpireRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [seconds, isStopped]);

  const isLow = remaining <= WARNING_SECONDS;

  return (
    <div
      role="timer"
      aria-label="Thời gian còn lại"
      className={cn(
        "inline-flex items-center gap-2 rounded-standard border-2 border-border-strong px-3 py-1.5 font-display text-body-lg font-bold tabular-nums",
        isLow
          ? "bg-danger-bg text-danger-text"
          : "bg-surface-card text-text-primary",
      )}
    >
      <TimerIcon aria-hidden="true" size={18} />
      {formatClock(remaining)}
      {remaining === WARNING_SECONDS && (
        <span className="sr-only" role="status">
          Còn 30 giây
        </span>
      )}
    </div>
  );
}
