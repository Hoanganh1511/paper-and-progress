"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Text,
  cn,
  focusRingClasses,
} from "@/design-system";
import { loginHref, useAuth } from "@/features/auth";
import {
  KnowledgeApiError,
  followTopic,
  getTopicAsMember,
  unfollowTopic,
} from "../knowledgeApi";
import type { TopicDetail } from "../types";

/**
 * A topic with what is linked to it. The server sends what a guest sees; for a
 * signed-in reader the follow state is asked for again, and a press on Follow
 * shows at once and is put back if the server refuses.
 */
export function TopicView({ initial }: { initial: TopicDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { topic } = initial;
  const [isFollowing, setIsFollowing] = useState(initial.isFollowing);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let isCurrent = true;
    getTopicAsMember(topic.slug)
      .then((data) => isCurrent && setIsFollowing(data.isFollowing))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [topic.slug, isAuthenticated, isLoading]);

  async function toggleFollow() {
    if (!isAuthenticated) {
      router.push(loginHref(pathname));
      return;
    }
    const before = isFollowing;
    setIsFollowing(!before);
    setIsBusy(true);
    setError(undefined);
    try {
      if (before) await unfollowTopic(topic.slug);
      else await followTopic(topic.slug);
    } catch (caught) {
      setIsFollowing(before);
      setError(
        caught instanceof KnowledgeApiError
          ? caught.message
          : "Không lưu được. Thử lại sau.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        {topic.groupLabel && (
          <div>
            <Badge size="sm">{topic.groupLabel}</Badge>
          </div>
        )}
        <Text as="h1" size="heading-xl" font="display">
          {topic.name}
        </Text>
        {topic.description && (
          <Text size="body-lg" className="max-w-[65ch]">
            {topic.description}
          </Text>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isFollowing ? "outline" : "accent"}
            leftIcon={isFollowing ? BellOff : Bell}
            aria-pressed={isFollowing}
            disabled={isBusy}
            onClick={toggleFollow}
          >
            {isFollowing ? "Bỏ theo dõi" : "Theo dõi chủ đề"}
          </Button>
          <Text as="span" size="caption" color="muted">
            {initial.counts.articles} bài viết · {initial.counts.paths} lộ trình
            · {initial.counts.resources} tài liệu
          </Text>
        </div>
        {error && (
          <Text role="alert" color="danger">
            {error}
          </Text>
        )}
      </header>

      {initial.paths.length > 0 && (
        <section aria-labelledby="topic-paths" className="flex flex-col gap-3">
          <Text as="h2" id="topic-paths" size="heading-lg" font="display">
            Lộ trình
          </Text>
          <ul className="grid gap-4 sm:grid-cols-2">
            {initial.paths.map((path) => (
              <li key={path.slug}>
                <Card padding="compact" interactive className="relative h-full">
                  <Text as="h3" weight="semibold">
                    <Link
                      href={`/paths/${path.slug}`}
                      className={cn(
                        "rounded-sharp after:absolute after:inset-0 after:content-['']",
                        focusRingClasses,
                      )}
                    >
                      {path.title}
                    </Link>
                  </Text>
                  <Text size="body-sm" color="secondary">
                    {path.description}
                  </Text>
                  <Text size="caption" color="muted">
                    {path.phaseCount} giai đoạn · {path.stepCount} bước
                  </Text>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {initial.recentArticles.length > 0 && (
        <section
          aria-labelledby="topic-articles"
          className="flex flex-col gap-3"
        >
          <Text as="h2" id="topic-articles" size="heading-lg" font="display">
            Bài viết mới
          </Text>
          <ul className="grid gap-4 sm:grid-cols-2">
            {initial.recentArticles.map((article) => (
              <li key={article.slug}>
                <Card padding="compact" interactive className="relative h-full">
                  <Text as="h3" weight="semibold">
                    <Link
                      href={`/articles/${article.slug}`}
                      className={cn(
                        "rounded-sharp after:absolute after:inset-0 after:content-['']",
                        focusRingClasses,
                      )}
                    >
                      {article.title}
                    </Link>
                  </Text>
                  {article.excerpt && (
                    <Text size="body-sm" color="secondary">
                      {article.excerpt}
                    </Text>
                  )}
                  <Text size="caption" color="muted">
                    {article.author}
                    {article.readingMinutes !== null &&
                      ` · ${article.readingMinutes} phút đọc`}
                  </Text>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {initial.resources.length > 0 && (
        <section
          aria-labelledby="topic-resources"
          className="flex flex-col gap-3"
        >
          <Text as="h2" id="topic-resources" size="heading-lg" font="display">
            Tài liệu
          </Text>
          <Card padding="compact">
            <ul className="flex flex-col gap-2">
              {initial.resources.map((resource) => (
                <li key={resource.id} className="flex flex-col">
                  {resource.isExternal ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("w-fit underline", focusRingClasses)}
                    >
                      {resource.title}
                      <span className="sr-only"> (mở tab mới)</span>
                    </a>
                  ) : (
                    <Link
                      href={resource.url}
                      className={cn("w-fit underline", focusRingClasses)}
                    >
                      {resource.title}
                    </Link>
                  )}
                  {resource.description && (
                    <Text size="caption" color="secondary">
                      {resource.description}
                    </Text>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {initial.paths.length === 0 &&
        initial.recentArticles.length === 0 &&
        initial.resources.length === 0 && (
          <Text color="secondary" role="status">
            Chủ đề này chưa có nội dung. Theo dõi để nhận khi có bài mới.
          </Text>
        )}
    </div>
  );
}
