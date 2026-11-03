"use client";

import { useState, type FormEvent } from "react";
import { FilePlus2, Newspaper, PenLine, Plus } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Input,
  LinkButton,
  SearchInput,
  Skeleton,
  Text,
} from "@/design-system";
import {
  useAdminQuery,
  useDebouncedValue,
} from "@/features/admin/useAdminQuery";
import { useAuth } from "@/features/auth";
import { addStep, searchStudyArticles } from "../studyListsApi";
import type { StudyListDetail } from "../types";

type Mode = "article" | "text";

export interface AddStepProps {
  /** The list the part belongs to, so a new article can come back to it. */
  listId: string;
  sectionId: string;
  /** For the names of the controls: "phần 2". */
  sectionLabel: string;
  isBusy: boolean;
  run: (request: Promise<StudyListDetail>) => Promise<boolean>;
}

/** The articles to choose from: published ones and the learner's own drafts. */
function ArticlePicker({ sectionId, sectionLabel, isBusy, run }: AddStepProps) {
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim());
  const articles = useAdminQuery(() => searchStudyArticles(q), `articles-${q}`);

  return (
    <div className="flex flex-col gap-2">
      <SearchInput
        aria-label={`Tìm bài viết để thêm vào ${sectionLabel}`}
        placeholder="Tìm bài viết theo tên…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onClear={() => setSearch("")}
      />
      {articles.error && !articles.data ? (
        <Alert variant="danger">
          <div className="flex flex-wrap items-center gap-3">
            <span>{articles.error.message}</span>
            <Button size="compact" variant="outline" onClick={articles.reload}>
              Thử lại
            </Button>
          </div>
        </Alert>
      ) : !articles.data ? (
        <div aria-busy="true">
          <span role="status" className="sr-only">
            Đang tìm
          </span>
          <Skeleton className="h-16 w-full" />
        </div>
      ) : articles.data.length === 0 ? (
        <Text size="body-sm" color="secondary" role="status">
          Không có bài viết nào khớp.
        </Text>
      ) : (
        <ul
          aria-label="Bài viết có thể thêm"
          className="flex max-h-64 flex-col gap-2 overflow-y-auto"
        >
          {articles.data.map((article) => (
            <li
              key={article.id}
              className="flex items-center justify-between gap-3 rounded-standard border-2 border-border-strong bg-surface-card p-2 pl-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{article.title}</span>
                <span className="flex items-center gap-2 text-body-sm text-text-secondary">
                  {article.readingMinutes} phút đọc
                  {article.status !== "PUBLISHED" && (
                    <Badge size="sm" variant="yellow">
                      Bản nháp
                    </Badge>
                  )}
                </span>
              </span>
              <Button
                size="compact"
                variant="outline"
                leftIcon={Plus}
                aria-label={`Thêm “${article.title}” vào ${sectionLabel}`}
                disabled={isBusy}
                onClick={() =>
                  void run(addStep(sectionId, { articleId: article.id }))
                }
              >
                Thêm
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Adds a step to a part. A step is usually an article of the site, found by
 * name, which the learner reads and then ticks; it can also be a note written
 * by hand for something that is not an article.
 */
export function AddStep(props: AddStepProps) {
  const { listId, sectionId, sectionLabel, isBusy, run } = props;
  // Only authors and admins can write; for the rest the button would lead to a refusal.
  const { user } = useAuth();
  const canWrite = user?.role === "CREATOR" || user?.role === "ADMIN";
  const [mode, setMode] = useState<Mode | undefined>();
  const [title, setTitle] = useState("");

  async function handleAddText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    if (await run(addStep(sectionId, { title: title.trim() }))) setTitle("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={`Thêm bước vào ${sectionLabel}`}
        className="flex flex-wrap gap-2"
      >
        <Button
          size="compact"
          variant={mode === "article" ? "accent" : "outline"}
          aria-pressed={mode === "article"}
          leftIcon={Newspaper}
          onClick={() => setMode(mode === "article" ? undefined : "article")}
        >
          Thêm bài viết
        </Button>
        <Button
          size="compact"
          variant={mode === "text" ? "accent" : "outline"}
          aria-pressed={mode === "text"}
          leftIcon={PenLine}
          onClick={() => setMode(mode === "text" ? undefined : "text")}
        >
          Tự ghi bước
        </Button>
        {canWrite && (
          <LinkButton
            size="compact"
            variant="outline"
            leftIcon={FilePlus2}
            href={`/write/new?list=${listId}&section=${sectionId}`}
          >
            Tạo bài viết mới
          </LinkButton>
        )}
      </div>
      {mode === "article" && <ArticlePicker {...props} />}
      {mode === "text" && (
        <form onSubmit={handleAddText} noValidate className="flex gap-2">
          <Input
            aria-label={`Tên bước mới trong ${sectionLabel}`}
            value={title}
            maxLength={300}
            placeholder="VD: Làm bài thi thử"
            onChange={(event) => setTitle(event.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            leftIcon={Plus}
            disabled={!title.trim() || isBusy}
          >
            Thêm
          </Button>
        </form>
      )}
    </div>
  );
}
