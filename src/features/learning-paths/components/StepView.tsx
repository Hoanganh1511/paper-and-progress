"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  LinkButton,
  ProgressBar,
  Text,
  Textarea,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { RichText, TutorBlocks } from "@/features/tutor";
import { formatMinutes } from "../format";
import { PathsApiError, getStep, saveStepProgress } from "../pathsApi";
import type { StepDetail, StepMine } from "../types";

const TAGS = {
  you: { label: "Bạn tự viết", variant: "yellow" },
  do: { label: "Thực hành", variant: "blue" },
  done: { label: "Xong khi", variant: "lime" },
} as const;

const EMPTY: StepMine = {
  isDone: false,
  completedAt: null,
  checks: {},
  note: null,
};

const NOTE_SAVE_DELAY_MS = 800;

/**
 * One step of a path. The server sends the text a guest sees; for a signed-in
 * learner the step is fetched again with their ticks, note and done mark, and
 * every change is saved. A press shows at once and is put back if the server
 * refuses.
 */
export function StepView({
  initial,
  pathSlug,
}: {
  initial: StepDetail;
  pathSlug: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { step, previous, next, position } = initial;
  const [mine, setMine] = useState<StepMine>(EMPTY);
  const [error, setError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getStep(pathSlug, step.slug)
      .then((data) => isCurrent && data.mine && setMine(data.mine))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [pathSlug, step.slug, isAuthenticated, isLoading]);

  useEffect(() => () => clearTimeout(noteTimer.current), []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step.slug]);

  /** Changes `mine` at once and saves it; on failure the old value comes back. */
  async function change(
    patch: Partial<StepMine>,
    input: Parameters<typeof saveStepProgress>[2],
  ) {
    if (!isAuthenticated) {
      router.push(loginHref(pathname));
      return false;
    }
    const before = mine;
    setMine({ ...mine, ...patch });
    setError(undefined);
    setIsSaving(true);
    try {
      const result = await saveStepProgress(pathSlug, step.slug, input);
      if (result.mine) setMine((current) => ({ ...current, ...result.mine }));
      return true;
    } catch (caught) {
      setMine(before);
      setError(
        caught instanceof PathsApiError
          ? caught.message
          : "Không lưu được. Thử lại sau.",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function toggleCheck(id: string, isChecked: boolean) {
    void change(
      { checks: { ...mine.checks, [id]: isChecked } },
      { checks: { [id]: isChecked } },
    );
  }

  function editNote(note: string) {
    if (!isAuthenticated) return;
    setMine((current) => ({ ...current, note }));
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      saveStepProgress(pathSlug, step.slug, { note })
        .then(() => setError(undefined))
        .catch(() => setError("Không lưu được ghi chú. Thử lại sau."));
    }, NOTE_SAVE_DELAY_MS);
  }

  async function toggleDone() {
    const isDone = !mine.isDone;
    const saved = await change({ isDone }, { isDone });
    if (saved && isDone && next) {
      router.push(`/paths/${pathSlug}/${next.slug}`);
    }
  }

  return (
    <article className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Text size="overline" color="muted">
          {initial.phase.title} · Bước {position.index} / {position.total}
          {step.durationMinutes !== null &&
            ` · ${formatMinutes(step.durationMinutes)}`}
        </Text>
        <ProgressBar
          value={(position.index / position.total) * 100}
          label="Vị trí trong lộ trình"
        />
        <Text
          as="h1"
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

      {!isLoading && !isAuthenticated && (
        <Text role="note" color="secondary">
          Đăng nhập để lưu tick, ghi chú và đánh dấu bước đã xong.
        </Text>
      )}

      {step.content.map((box, boxIndex) => (
        <Card
          key={boxIndex}
          padding="compact"
          className={box.isYours ? "border-dashed" : undefined}
        >
          {(box.title || box.tag) && (
            <Text
              as="h2"
              size="body-md"
              weight="semibold"
              className="flex flex-wrap items-center gap-2"
            >
              {box.tag && (
                <Badge variant={TAGS[box.tag].variant} size="sm">
                  {TAGS[box.tag].label}
                </Badge>
              )}
              {box.title && <RichText text={box.title} />}
            </Text>
          )}
          <TutorBlocks
            blocks={box.content}
            checks={mine.checks}
            onToggleCheck={toggleCheck}
          />
        </Card>
      ))}

      {isAuthenticated && (
        <Card padding="compact">
          <Text as="h2" size="body-md" weight="semibold">
            Ghi chú của bạn
          </Text>
          <Textarea
            aria-label="Ghi chú cho bước này"
            placeholder="Mình đã biết gì, đã đổi gì so với mẫu, còn mơ hồ chỗ nào."
            rows={4}
            maxLength={5000}
            value={mine.note ?? ""}
            onChange={(event) => editNote(event.target.value)}
          />
        </Card>
      )}

      {error && (
        <Text role="alert" color="danger">
          {error}
        </Text>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        {previous ? (
          <LinkButton
            variant="outline"
            leftIcon={ArrowLeft}
            href={`/paths/${pathSlug}/${previous.slug}`}
          >
            Bước trước
          </LinkButton>
        ) : (
          <LinkButton
            variant="outline"
            leftIcon={ArrowLeft}
            href={`/paths/${pathSlug}`}
          >
            Về lộ trình
          </LinkButton>
        )}
        <Button
          variant="accent"
          leftIcon={mine.isDone ? undefined : Check}
          disabled={isSaving}
          onClick={toggleDone}
        >
          {mine.isDone ? "Đã xong (bỏ đánh dấu)" : "Đánh dấu đã xong"}
        </Button>
        {next ? (
          <LinkButton
            variant="outline"
            rightIcon={ArrowRight}
            href={`/paths/${pathSlug}/${next.slug}`}
          >
            Bước sau
          </LinkButton>
        ) : (
          <LinkButton variant="outline" href={`/paths/${pathSlug}`}>
            Về lộ trình
          </LinkButton>
        )}
      </div>
    </article>
  );
}
