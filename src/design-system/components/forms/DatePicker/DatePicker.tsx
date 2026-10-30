"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../../utils/cn";
import { focusRingClasses } from "../../../primitives/FocusRing";
import { Button } from "../../actions/Button/Button";
import { IconButton } from "../../actions/Button/IconButton";
import { useFieldControlProps } from "../FormField/FormFieldContext";
import { selectControlVariants } from "../Select/SelectTrigger";

export interface DatePickerLabels {
  /** Shown while no date is chosen. */
  placeholder: string;
  /** Accessible name of the calendar. */
  calendar: string;
  previousMonth: string;
  nextMonth: string;
  today: string;
  clear: string;
  /** Monday first, short: "T2" ... "CN". */
  weekdays: [string, string, string, string, string, string, string];
  /** `{month}` and `{year}` are replaced. */
  monthTitle: string;
}

export const defaultDatePickerLabels: DatePickerLabels = {
  placeholder: "Select a date",
  calendar: "Calendar",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  today: "Today",
  clear: "Clear",
  weekdays: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  monthTitle: "{month}/{year}",
};

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or an empty string for no date. */
  value: string;
  onValueChange: (value: string) => void;
  /** Earliest and latest date that can be chosen, `YYYY-MM-DD`. */
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Adds a "Clear" button to the calendar. */
  isClearable?: boolean;
  size?: "compact" | "default" | "comfortable";
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  className?: string;
  /** Replace any of the texts (translations). */
  labels?: Partial<DatePickerLabels>;
}

/* -------------------------------------------------------------------------- */
/* Dates are handled as local calendar days, never through UTC.               */
/* -------------------------------------------------------------------------- */

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` of a local date. */
export const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** The local date of `YYYY-MM-DD`; undefined when the text is not a real day. */
export function parseDateValue(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : undefined;
}

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const addMonths = (date: Date, months: number) => {
  // Clamp the day, so 31 Jan + 1 month is 28/29 Feb, not March.
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay),
  );
};

/** "30/10/2026" */
const formatDisplay = (date: Date) =>
  `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

/** The 6 weeks (Monday first) that cover the month of `month`. */
function monthWeeks(month: Date): Date[][] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

/**
 * A date field with a calendar. It looks like the other form controls (hard
 * outline, lime for the chosen day) and works without a pointer: Enter, Space
 * or ArrowDown opens it; arrows move by day and week, PageUp / PageDown by
 * month, Home / End to the ends of the week, Enter picks, Escape closes.
 * Inside a FormField the field label names it.
 */
export function DatePicker({
  value,
  onValueChange,
  min,
  max,
  disabled = false,
  isClearable = true,
  size,
  id,
  name,
  className,
  labels: labelOverrides,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}: DatePickerProps) {
  const labels = { ...defaultDatePickerLabels, ...labelOverrides };
  const control = useFieldControlProps({
    id,
    describedBy: ariaDescribedBy,
    invalid: ariaInvalid,
    required: ariaRequired,
  });
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const selected = parseDateValue(value);
  const minDate = min ? parseDateValue(min) : undefined;
  const maxDate = max ? parseDateValue(max) : undefined;
  const today = useMemo(() => new Date(), []);

  const [isOpen, setIsOpen] = useState(false);
  // The day the keyboard is on; the month shown follows it.
  const [focused, setFocused] = useState<Date>(selected ?? today);
  const [shouldFocusGrid, setShouldFocusGrid] = useState(false);

  const isDisabledDay = (date: Date) =>
    Boolean((minDate && date < minDate) || (maxDate && date > maxDate));

  function open() {
    if (disabled) return;
    setFocused(selected ?? today);
    setIsOpen(true);
    setShouldFocusGrid(true);
  }

  function close(returnFocus = true) {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(date: Date) {
    if (isDisabledDay(date)) return;
    onValueChange(toDateValue(date));
    close();
  }

  // Move focus to the day the keyboard is on, after the calendar has rendered.
  useEffect(() => {
    if (!isOpen || !shouldFocusGrid) return;
    gridRef.current
      ?.querySelector<HTMLButtonElement>('button[tabindex="0"]')
      ?.focus();
  }, [isOpen, shouldFocusGrid, focused]);

  // A click or tap outside closes it.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, (date: Date) => Date> = {
      ArrowLeft: (date) => addDays(date, -1),
      ArrowRight: (date) => addDays(date, 1),
      ArrowUp: (date) => addDays(date, -7),
      ArrowDown: (date) => addDays(date, 7),
      Home: (date) => addDays(date, -((date.getDay() + 6) % 7)),
      End: (date) => addDays(date, 6 - ((date.getDay() + 6) % 7)),
      PageUp: (date) => addMonths(date, event.shiftKey ? -12 : -1),
      PageDown: (date) => addMonths(date, event.shiftKey ? 12 : 1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setFocused(move(focused));
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  const weeks = monthWeeks(focused);
  const title = labels.monthTitle
    .replace("{month}", String(focused.getMonth() + 1))
    .replace("{year}", String(focused.getFullYear()));

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        id={control.id}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-describedby={control["aria-describedby"]}
        disabled={disabled}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !isOpen) {
            event.preventDefault();
            open();
          }
        }}
        className={cn(
          selectControlVariants({ size, hasError: control.hasError }),
          "cursor-pointer",
          focusRingClasses,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-text-muted",
          )}
        >
          {selected ? formatDisplay(selected) : labels.placeholder}
        </span>
        <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
      </button>
      {name && <input type="hidden" name={name} value={value} />}

      {isOpen && (
        <div
          id={panelId}
          role="dialog"
          aria-label={labels.calendar}
          className="absolute top-full left-0 z-[var(--z-dropdown)] mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-standard border-2 border-border-strong bg-surface-overlay p-3 text-text-primary shadow-floating"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <IconButton
              icon={ChevronLeft}
              variant="outline"
              size="compact"
              aria-label={labels.previousMonth}
              onClick={() => {
                setShouldFocusGrid(false);
                setFocused(addMonths(focused, -1));
              }}
            />
            <span
              aria-live="polite"
              className="font-display text-body-md font-bold"
            >
              {title}
            </span>
            <IconButton
              icon={ChevronRight}
              variant="outline"
              size="compact"
              aria-label={labels.nextMonth}
              onClick={() => {
                setShouldFocusGrid(false);
                setFocused(addMonths(focused, 1));
              }}
            />
          </div>

          <div
            ref={gridRef}
            role="grid"
            aria-label={title}
            onKeyDown={handleGridKeyDown}
          >
            <div role="row" className="grid grid-cols-7">
              {labels.weekdays.map((weekday) => (
                <span
                  key={weekday}
                  role="columnheader"
                  className="py-1 text-center text-caption font-semibold text-text-secondary"
                >
                  {weekday}
                </span>
              ))}
            </div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} role="row" className="grid grid-cols-7">
                {week.map((day) => {
                  const value = toDateValue(day);
                  const isCurrentMonth = day.getMonth() === focused.getMonth();
                  const isSelected = selected
                    ? toDateValue(selected) === value
                    : false;
                  const isToday = toDateValue(today) === value;
                  const isFocused = toDateValue(focused) === value;
                  const isOff = isDisabledDay(day);
                  return (
                    <div key={value} role="gridcell" aria-selected={isSelected}>
                      <button
                        type="button"
                        tabIndex={isFocused ? 0 : -1}
                        disabled={isOff}
                        aria-current={isToday ? "date" : undefined}
                        aria-label={formatDisplay(day)}
                        onClick={() => pick(day)}
                        className={cn(
                          "mx-auto my-0.5 flex size-9 cursor-pointer items-center justify-center rounded-standard border-2 border-transparent text-body-sm transition-colors motion-reduce:transition-none",
                          "hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
                          focusRingClasses,
                          !isCurrentMonth && "text-text-muted",
                          isToday && !isSelected && "border-border-strong",
                          isSelected &&
                            "border-border-strong bg-accent-lime font-bold text-ink hover:bg-accent-lime",
                        )}
                      >
                        {day.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t-2 border-border-strong pt-2">
            <Button
              variant="ghost"
              size="compact"
              disabled={isDisabledDay(today)}
              onClick={() => pick(today)}
            >
              {labels.today}
            </Button>
            {isClearable && (
              <Button
                variant="ghost"
                size="compact"
                disabled={!selected}
                onClick={() => {
                  onValueChange("");
                  close();
                }}
              >
                {labels.clear}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
