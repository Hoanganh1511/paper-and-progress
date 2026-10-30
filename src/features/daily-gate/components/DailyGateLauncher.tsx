"use client";

import { useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, cn } from "@/design-system";
import { useAuth } from "@/features/auth";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getToday } from "../dailyGateApi";
import { DailyGatePanel } from "./DailyGatePanel";

export interface DailyGateLauncherProps {
  /**
   * The dev todo button sits in the same corner. When it is there, this button
   * stacks on top of it; when it is not (production), it takes its place.
   */
  hasDevTodo?: boolean;
}

/**
 * The corner button that opens the day's English lesson in a modal. The lesson
 * is optional: nothing is blocked, and the modal closes whenever the user likes.
 * The button shows whether today's lesson is done yet.
 */
export function DailyGateLauncher(props: DailyGateLauncherProps) {
  const { isAuthenticated } = useAuth();
  // The hooks below only run for a signed-in user: the lesson has no meaning before that.
  return isAuthenticated ? <Launcher {...props} /> : null;
}

function Launcher({ hasDevTodo = false }: DailyGateLauncherProps) {
  const [version, setVersion] = useState(0);
  const today = useAdminQuery(getToday, `gate-today-${version}`);
  const [isOpen, setIsOpen] = useState(false);

  const data = today.data;
  const isDone = data?.active === true && data.progress.gateUnlocked;
  const isPending =
    data?.active === true && data.isReady && !data.progress.gateUnlocked;

  const label = isPending
    ? "Daily English: chưa làm bài hôm nay"
    : isDone
      ? "Daily English: đã hoàn thành bài hôm nay"
      : "Daily English";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed right-4 z-[9998] flex size-12 cursor-pointer items-center justify-center rounded-pill border-2 border-border-strong text-ink shadow-accent",
          // 12px above the dev todo button (which is 48px tall, 6rem from the bottom)
          hasDevTodo ? "bottom-[9.75rem]" : "bottom-24",
          isPending
            ? "bg-accent-pink"
            : isDone
              ? "bg-accent-lime"
              : "bg-surface-card",
          "transition-[translate,box-shadow] duration-[var(--duration-fast)] motion-reduce:transition-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-border-focus",
          "active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
        )}
      >
        <BookOpenCheck aria-hidden="true" size={22} />
        {isPending && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-4 rounded-pill border-2 border-border-strong bg-danger-text"
          />
        )}
      </button>

      {isOpen && (
        <Dialog
          open
          onClose={() => setIsOpen(false)}
          size="lg"
          className="max-h-[94dvh] sm:max-h-[90dvh]"
        >
          <DialogHeader title="Daily English" closeLabel="Đóng" />
          <DialogContent className="px-6 py-4">
            <DailyGatePanel
              today={today}
              onRefresh={() => setVersion((current) => current + 1)}
              onClose={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
