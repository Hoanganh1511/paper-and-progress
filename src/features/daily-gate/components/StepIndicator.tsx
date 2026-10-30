import { Check, Lock } from "lucide-react";
import { Text, cn } from "@/design-system";
import { STEPS, type Step } from "../display";
import type { GateProgress } from "../types";

export interface StepIndicatorProps {
  progress: GateProgress;
  /** The step being worked on; highlighted. */
  current?: Step;
}

const isDone = (step: Step, progress: GateProgress) =>
  step === "learn"
    ? progress.learnCompleted
    : step === "practice"
      ? progress.practiceCompleted
      : progress.gateUnlocked;

/** Learn → Practice → Test, each marked done, current or still locked. */
export function StepIndicator({ progress, current }: StepIndicatorProps) {
  return (
    <ol
      aria-label="Các bước của bài học hôm nay"
      className="flex items-center gap-2"
    >
      {STEPS.map((step, index) => {
        const done = isDone(step.id, progress);
        const isCurrent = current === step.id;
        const previous = STEPS[index - 1];
        const isLocked =
          !done && previous !== undefined && !isDone(previous.id, progress);
        const state = done
          ? "đã xong"
          : isCurrent
            ? "đang làm"
            : isLocked
              ? "chưa mở"
              : "tiếp theo";
        return (
          <li key={step.id} className="flex flex-1 items-center gap-2">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex min-h-11 flex-1 items-center gap-2 rounded-standard border-2 border-border-strong px-3",
                done && "bg-success-bg text-success-text",
                isCurrent && "bg-accent-lime text-ink shadow-raised",
                !done && !isCurrent && "bg-surface-card text-text-secondary",
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-pill border-2 border-current text-caption font-bold"
              >
                {done ? (
                  <Check size={14} strokeWidth={3} />
                ) : isLocked ? (
                  <Lock size={12} />
                ) : (
                  index + 1
                )}
              </span>
              <Text
                as="span"
                size="body-sm"
                weight="semibold"
                className="text-inherit"
              >
                {step.label}
                <span className="sr-only"> ({state})</span>
              </Text>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
