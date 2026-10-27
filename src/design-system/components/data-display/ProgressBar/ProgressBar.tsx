import { type ComponentProps } from "react";
import { cn } from "../../../utils/cn";

export interface ProgressBarProps extends Omit<
  ComponentProps<"div">,
  "children" | "role"
> {
  /** Progress from 0 to 100; values outside are clamped. */
  value: number;
  /** Accessible name, e.g. "Tiến độ khóa React". */
  label: string;
  /** Shows the percentage as text beside the bar. */
  showValue?: boolean;
}

/**
 * A horizontal progress bar. The percentage is exposed to assistive tech
 * through role="progressbar" and can be printed beside the bar, so progress
 * never relies on the fill colour alone.
 */
export function ProgressBar({
  value,
  label,
  showValue = false,
  className,
  ref,
  ...props
}: ProgressBarProps) {
  const percent = Math.round(Math.min(Math.max(value, 0), 100));

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill border border-border-strong bg-surface-sunken"
      >
        <div
          aria-hidden="true"
          className="h-full bg-accent-blue transition-[width] duration-[var(--duration-normal)] motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showValue && (
        <span
          aria-hidden="true"
          className="w-10 shrink-0 text-right font-body text-caption font-medium text-text-secondary"
        >
          {percent}%
        </span>
      )}
    </div>
  );
}
