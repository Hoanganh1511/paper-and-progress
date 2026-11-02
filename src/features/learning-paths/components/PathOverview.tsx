"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  LinkButton,
  ProgressBar,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import { LEVEL_LABEL, formatMinutes } from "../format";
import { PathsApiError, getPath, startPath } from "../pathsApi";
import type { PathDetail } from "../types";

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Card padding="compact">
      <Text as="h2" size="body-md" weight="semibold">
        {title}
      </Text>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {items.map((item) => (
          <li key={item}>
            <Text as="span">{item}</Text>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * A path with its phases and steps. The server sends what a guest sees; for a
 * signed-in learner the same path is fetched again with their progress.
 */
export function PathOverview({ initial }: { initial: PathDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [path, setPath] = useState(initial);
  const [error, setError] = useState<string>();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getPath(initial.slug)
      .then((data) => isCurrent && setPath(data))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [initial.slug, isAuthenticated, isLoading]);

  const level = path.level ? LEVEL_LABEL[path.level] : null;
  const progress = path.progress;
  const firstStep = path.phases[0]?.steps[0];
  const nextSlug = progress?.nextStepSlug ?? firstStep?.slug;

  async function start() {
    if (!isAuthenticated) {
      router.push(loginHref(pathname));
      return;
    }
    setIsStarting(true);
    setError(undefined);
    try {
      await startPath(path.slug);
      if (firstStep) router.push(`/paths/${path.slug}/${firstStep.slug}`);
    } catch (caught) {
      setError(
        caught instanceof PathsApiError ? caught.message : "Có lỗi xảy ra.",
      );
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {level && (
            <Badge variant={level.variant} size="sm">
              {level.label}
            </Badge>
          )}
          {path.totalMinutes !== null && (
            <Text as="span" size="caption" color="muted">
              {formatMinutes(path.totalMinutes)}
            </Text>
          )}
          <Text as="span" size="caption" color="muted">
            {path.phaseCount} giai đoạn · {path.stepCount} bước
          </Text>
        </div>
        <Text as="h1" size="heading-xl" font="display">
          {path.title}
        </Text>
        <Text size="body-lg" className="max-w-[65ch]">
          {path.description}
        </Text>
        {path.topics.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Chủ đề">
            {path.topics.map((topic) => (
              <li key={topic.slug}>
                <Badge size="sm">{topic.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </header>

      <Card padding="compact" className="flex flex-col gap-3">
        {progress && progress.state !== "NOT_STARTED" ? (
          <>
            <ProgressBar
              value={(progress.completedSteps / progress.totalSteps) * 100}
              label="Tiến độ lộ trình"
            />
            <Text size="caption" color="secondary">
              {progress.completedSteps} / {progress.totalSteps} bước đã xong
            </Text>
            {nextSlug && progress.state !== "COMPLETED" ? (
              <LinkButton
                variant="accent"
                href={`/paths/${path.slug}/${nextSlug}`}
              >
                Tiếp tục học
              </LinkButton>
            ) : (
              <Text weight="semibold">Bạn đã hoàn thành lộ trình này.</Text>
            )}
          </>
        ) : (
          <Button variant="accent" onClick={start} disabled={isStarting}>
            {isAuthenticated ? "Bắt đầu lộ trình" : "Đăng nhập để bắt đầu"}
          </Button>
        )}
        {error && (
          <Text role="alert" color="danger">
            {error}
          </Text>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Bullets title="Mục tiêu" items={path.objectives} />
        <Bullets title="Cần có trước" items={path.prerequisites} />
        <Bullets title="Bạn sẽ làm được" items={path.outcomes} />
      </div>

      <section aria-labelledby="path-phases" className="flex flex-col gap-4">
        <Text as="h2" id="path-phases" size="heading-lg" font="display">
          Nội dung
        </Text>
        {path.phases.map((phase) => (
          <Card key={phase.order} padding="compact">
            <Text as="h3" size="body-lg" weight="semibold">
              {phase.title}
            </Text>
            {phase.description && (
              <Text size="body-sm" color="secondary">
                {phase.description}
              </Text>
            )}
            <ol className="flex flex-col gap-1">
              {phase.steps.map((step) => (
                <li key={step.slug}>
                  <Link
                    href={`/paths/${path.slug}/${step.slug}`}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-standard border-2 border-transparent px-2 py-1.5 text-text-primary hover:border-border-strong",
                      focusRingClasses,
                    )}
                  >
                    <span className="min-w-5 font-mono text-caption">
                      {step.order}
                    </span>
                    <span>{step.title}</span>
                    {step.durationMinutes !== null && (
                      <span className="ml-auto text-caption text-text-muted">
                        {formatMinutes(step.durationMinutes)}
                      </span>
                    )}
                    {step.isDone && (
                      <>
                        <Check aria-hidden="true" size={16} />
                        <span className="sr-only">Đã xong</span>
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </section>

      {(path.articles.length > 0 || path.resources.length > 0) && (
        <section
          aria-labelledby="path-related"
          className="grid gap-4 md:grid-cols-2"
        >
          <Text
            as="h2"
            id="path-related"
            size="heading-lg"
            font="display"
            className="md:col-span-2"
          >
            Đọc thêm
          </Text>
          {path.articles.length > 0 && (
            <Card padding="compact">
              <Text as="h3" weight="semibold">
                Bài viết
              </Text>
              <ul className="flex flex-col gap-1">
                {path.articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/articles/${article.slug}`}
                      className={cn("underline", focusRingClasses)}
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {path.resources.length > 0 && (
            <Card padding="compact">
              <Text as="h3" weight="semibold">
                Tài liệu
              </Text>
              <ul className="flex flex-col gap-1">
                {path.resources.map((resource) => (
                  <li key={resource.id}>
                    {resource.isExternal ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("underline", focusRingClasses)}
                      >
                        {resource.title}
                        <span className="sr-only"> (mở tab mới)</span>
                      </a>
                    ) : (
                      <Link
                        href={resource.url}
                        className={cn("underline", focusRingClasses)}
                      >
                        {resource.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
