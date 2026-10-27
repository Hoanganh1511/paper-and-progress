"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  type LucideIcon,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Text,
  Textarea,
  cn,
  focusRingClasses,
} from "@/design-system";
import {
  setLocationHash,
  useLocationHash,
  useTutorProgress,
} from "../../hooks";
import type { TutorBoxTag, TutorRating, TutorStep } from "../../types";
import { RichText } from "../RichText";
import { TutorBlocks } from "../TutorBlocks";

const TAGS: Record<
  TutorBoxTag,
  { label: string; variant: "yellow" | "blue" | "lime" }
> = {
  you: { label: "Bạn tự viết", variant: "yellow" },
  do: { label: "Thực hành", variant: "blue" },
  done: { label: "Xong khi", variant: "lime" },
};

const RATINGS: { value: TutorRating; label: string; icon: LucideIcon }[] = [
  { value: "ok", label: "Rõ rồi", icon: CheckCircle2 },
  { value: "concept", label: "Mới hiểu khái niệm", icon: AlertTriangle },
  { value: "no", label: "Chưa hiểu", icon: XCircle },
];

export interface StepTutorProps extends Omit<
  ComponentProps<"div">,
  "children"
> {
  steps: TutorStep[];
}

/**
 * A guided, one-step-at-a-time walkthrough: a step list on the side, the
 * current step with its checklists, a self-rating and notes, and
 * previous/next controls. The current step lives in the URL hash so a step
 * can be linked and survives a reload; progress is kept in localStorage.
 */
export function StepTutor({ steps, className, ...props }: StepTutorProps) {
  const hash = useLocationHash();
  const { progress, update } = useTutorProgress();
  const [isListOpen, setIsListOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shownId = useRef<string>(undefined);

  const hashIndex = steps.findIndex((step) => step.id === hash);
  const lastIndex = steps.findIndex((step) => step.id === progress.last);
  const index = hashIndex >= 0 ? hashIndex : Math.max(lastIndex, 0);
  const step = steps[index];

  // Move focus to the new step's heading, but not on the first render.
  useEffect(() => {
    if (shownId.current !== undefined && shownId.current !== step.id) {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
    }
    shownId.current = step.id;
  }, [step.id]);

  if (!step) return null;

  const doneCount = steps.filter((s) => progress.done[s.id]).length;
  const isDone = progress.done[step.id] ?? false;
  const rating = progress.ratings[step.id];

  function goTo(target: number) {
    const next = steps[target];
    if (!next) return;
    update((current) => ({ ...current, last: next.id }));
    setIsListOpen(false);
    setLocationHash(next.id);
  }

  function toggleDone() {
    update((current) => ({
      ...current,
      done: { ...current.done, [step.id]: !isDone },
    }));
    if (!isDone) goTo(index + 1);
  }

  const groups = steps.reduce<{ label: string; steps: TutorStep[] }[]>(
    (acc, s) => {
      const group = acc.at(-1);
      if (group?.label === s.group) group.steps.push(s);
      else acc.push({ label: s.group, steps: [s] });
      return acc;
    },
    [],
  );

  return (
    <div
      className={cn(
        "grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start",
        className,
      )}
      {...props}
    >
      <Card padding="compact" className="lg:sticky lg:top-4">
        <ProgressBar
          value={(doneCount / steps.length) * 100}
          label="Tiến độ các bước"
        />
        <Text size="caption" color="secondary">
          {doneCount} / {steps.length} bước đã xong
        </Text>
        <Button
          variant="outline"
          size="compact"
          className="lg:hidden"
          aria-expanded={isListOpen}
          aria-controls="tutor-steps"
          onClick={() => setIsListOpen((open) => !open)}
        >
          {isListOpen ? "Ẩn danh sách bước" : "Hiện danh sách bước"}
        </Button>
        <nav
          id="tutor-steps"
          aria-label="Các bước"
          className={cn(
            "max-h-[60vh] overflow-y-auto lg:block lg:max-h-[calc(100vh-14rem)]",
            !isListOpen && "hidden",
          )}
        >
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1 pb-3">
              <Text as="p" size="overline" color="muted" className="pt-2">
                {group.label}
              </Text>
              <ul className="flex flex-col gap-1">
                {group.steps.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-current={s.id === step.id ? "step" : undefined}
                      onClick={() => goTo(steps.indexOf(s))}
                      className={cn(
                        "flex min-h-11 w-full cursor-pointer items-baseline gap-2 rounded-standard border-2 border-transparent px-2 py-1.5 text-left font-body text-body-md text-text-primary",
                        "hover:border-border-strong aria-[current=step]:border-border-strong aria-[current=step]:bg-accent-yellow aria-[current=step]:text-ink",
                        focusRingClasses,
                      )}
                    >
                      <span className="min-w-5 font-mono text-caption">
                        {steps.indexOf(s) + 1}
                      </span>
                      <span lang="en">{s.title}</span>
                      {progress.done[s.id] && (
                        <>
                          <Check
                            aria-hidden="true"
                            size={16}
                            className="ml-auto shrink-0 self-center"
                          />
                          <span className="sr-only">Đã xong</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Card>

      <article className="flex min-w-0 flex-col gap-5" lang="en">
        <header className="flex flex-col gap-2">
          <Text size="overline" color="muted" lang="vi">
            Bước {index + 1} / {steps.length} · {step.duration}
          </Text>
          <Text
            as="h2"
            size="heading-xl"
            font="display"
            tabIndex={-1}
            ref={headingRef}
            className="outline-none"
          >
            <RichText text={step.heading} />
          </Text>
          <Text size="body-lg" className="max-w-[65ch]">
            <RichText text={step.lead} />
          </Text>
        </header>

        {step.boxes.map((box, boxIndex) => (
          <Card
            key={boxIndex}
            padding="compact"
            className={cn(box.isYours && "border-dashed")}
          >
            {(box.title || box.tag) && (
              <Text
                as="h3"
                size="body-md"
                weight="semibold"
                className="flex flex-wrap items-center gap-2"
              >
                {box.tag && (
                  <Badge variant={TAGS[box.tag].variant} size="sm" lang="vi">
                    {TAGS[box.tag].label}
                  </Badge>
                )}
                {box.title && <RichText text={box.title} />}
              </Text>
            )}
            <TutorBlocks
              blocks={box.content}
              checks={progress.checks}
              onToggleCheck={(id, isChecked) =>
                update((current) => ({
                  ...current,
                  checks: { ...current.checks, [id]: isChecked },
                }))
              }
            />
          </Card>
        ))}

        <Card padding="compact" lang="vi">
          <Text as="h3" size="body-md" weight="semibold">
            Bạn hiểu bước này đến đâu?
          </Text>
          <div
            role="group"
            aria-label="Mức độ hiểu"
            className="flex flex-wrap gap-2"
          >
            {RATINGS.map((option) => (
              <Button
                key={option.value}
                variant="secondary"
                leftIcon={option.icon}
                aria-pressed={rating === option.value}
                className="aria-pressed:translate-x-0.5 aria-pressed:translate-y-0.5 aria-pressed:bg-accent-lime aria-pressed:text-ink aria-pressed:shadow-none"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    ratings: { ...current.ratings, [step.id]: option.value },
                  }))
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Textarea
            aria-label="Ghi chú cho bước này"
            placeholder="Mình đã biết gì, đã đổi gì so với mẫu, còn mơ hồ chỗ nào."
            rows={4}
            value={progress.notes[step.id] ?? ""}
            onChange={(event) =>
              update((current) => ({
                ...current,
                notes: { ...current.notes, [step.id]: event.target.value },
              }))
            }
          />
        </Card>

        <div className="flex flex-wrap justify-between gap-3" lang="vi">
          <Button
            variant="outline"
            leftIcon={ArrowLeft}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            Bước trước
          </Button>
          <Button
            variant="accent"
            leftIcon={isDone ? undefined : Check}
            onClick={toggleDone}
          >
            {isDone ? "Đã xong (bỏ đánh dấu)" : "Đánh dấu đã xong"}
          </Button>
          <Button
            variant="outline"
            rightIcon={ArrowRight}
            disabled={index === steps.length - 1}
            onClick={() => goTo(index + 1)}
          >
            Bước sau
          </Button>
        </div>
      </article>
    </div>
  );
}
