"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
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

type TopicTab = "overview" | "articles" | "paths" | "resources";

const cardLink = cn(
  "rounded-sharp after:absolute after:inset-0 after:content-['']",
  focusRingClasses,
);

function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <Text as="h2" id={id} size="heading-lg" font="display">
      {children}
    </Text>
  );
}

function PathsSection({ paths }: { paths: TopicDetail["paths"] }) {
  return (
    <section aria-labelledby="topic-paths" className="flex flex-col gap-3">
      <SectionTitle id="topic-paths">Lộ trình</SectionTitle>
      <ul className="grid gap-4 sm:grid-cols-2">
        {paths.map((path) => (
          <li key={path.slug}>
            <Card padding="compact" interactive className="relative h-full">
              <Text as="h3" weight="semibold">
                <Link href={`/paths/${path.slug}`} className={cardLink}>
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
  );
}

function ArticlesSection({
  articles,
  total,
}: {
  articles: TopicDetail["recentArticles"];
  total: number;
}) {
  return (
    <section aria-labelledby="topic-articles" className="flex flex-col gap-3">
      <SectionTitle id="topic-articles">Bài viết mới</SectionTitle>
      <ul className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <li key={article.slug}>
            <Card padding="compact" interactive className="relative h-full">
              <Text as="h3" weight="semibold">
                <Link href={`/articles/${article.slug}`} className={cardLink}>
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
      {total > articles.length && (
        <Text size="caption" color="muted">
          Đang hiển thị {articles.length}/{total} bài mới nhất.
        </Text>
      )}
    </section>
  );
}

function ResourcesSection({
  resources,
}: {
  resources: TopicDetail["resources"];
}) {
  return (
    <section aria-labelledby="topic-resources" className="flex flex-col gap-3">
      <SectionTitle id="topic-resources">Tài liệu</SectionTitle>
      <Card padding="compact">
        <ul className="flex flex-col gap-2">
          {resources.map((resource) => (
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
  );
}

function EmptyTab({ children }: { children: string }) {
  return (
    <Text color="secondary" role="status">
      {children}
    </Text>
  );
}

/**
 * A topic with what is linked to it, in tabs: an overview, then articles,
 * paths and resources each on their own with their own empty state. The server
 * sends what a guest sees; for a signed-in reader the follow state is asked for
 * again, and a press on Follow shows at once and is put back if the server
 * refuses.
 */
export function TopicView({ initial }: { initial: TopicDetail }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { topic, counts, paths, recentArticles, resources } = initial;
  const [isFollowing, setIsFollowing] = useState(initial.isFollowing);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<TopicTab>("overview");
  const isEmpty =
    paths.length === 0 && recentArticles.length === 0 && resources.length === 0;

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
        </div>
        {error && (
          <Text role="alert" color="danger">
            {error}
          </Text>
        )}
      </header>

      <Tabs value={tab} onValueChange={(next) => setTab(next as TopicTab)}>
        <TabList
          aria-label="Nội dung của chủ đề"
          className="overflow-x-auto px-1 pt-1 pb-1"
        >
          <TabTrigger value="overview">Tổng quan</TabTrigger>
          <TabTrigger value="articles">Bài viết ({counts.articles})</TabTrigger>
          <TabTrigger value="paths">Lộ trình ({counts.paths})</TabTrigger>
          <TabTrigger value="resources">
            Tài liệu ({counts.resources})
          </TabTrigger>
        </TabList>

        <TabPanel value="overview" className="flex flex-col gap-6">
          {paths.length > 0 && <PathsSection paths={paths} />}
          {recentArticles.length > 0 && (
            <ArticlesSection
              articles={recentArticles}
              total={counts.articles}
            />
          )}
          {resources.length > 0 && <ResourcesSection resources={resources} />}
          {isEmpty && (
            <EmptyTab>
              Chủ đề này chưa có nội dung. Theo dõi để nhận khi có bài mới.
            </EmptyTab>
          )}
        </TabPanel>
        <TabPanel value="articles">
          {recentArticles.length > 0 ? (
            <ArticlesSection
              articles={recentArticles}
              total={counts.articles}
            />
          ) : (
            <EmptyTab>Chủ đề này chưa có bài viết nào.</EmptyTab>
          )}
        </TabPanel>
        <TabPanel value="paths">
          {paths.length > 0 ? (
            <PathsSection paths={paths} />
          ) : (
            <EmptyTab>Chưa có lộ trình nào gắn với chủ đề này.</EmptyTab>
          )}
        </TabPanel>
        <TabPanel value="resources">
          {resources.length > 0 ? (
            <ResourcesSection resources={resources} />
          ) : (
            <EmptyTab>Chủ đề này chưa có tài liệu.</EmptyTab>
          )}
        </TabPanel>
      </Tabs>
    </div>
  );
}
