"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Button, Skeleton } from "@/design-system";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getEditable } from "../articlesApi";
import type { EditableArticle } from "../types";
import type { StudySectionTarget } from "./StudySectionBanner";

// TipTap and lowlight are heavy and only this page needs them.
const ArticleEditor = dynamic(
  () => import("./ArticleEditor").then((module) => module.ArticleEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-96 w-full" />,
  },
);

function Loaded({
  article,
  addToSection,
}: {
  article?: EditableArticle;
  addToSection?: StudySectionTarget;
}) {
  const [current, setCurrent] = useState(article);
  // A new key starts the editor over from the restored version.
  const [round, setRound] = useState(0);
  return (
    <ArticleEditor
      key={round}
      initial={current}
      addToSection={addToSection}
      onRestored={(restored) => {
        setCurrent(restored);
        setRound((value) => value + 1);
      }}
    />
  );
}

export interface ArticleEditorPageProps {
  /** Omit to write a new article. */
  id?: string;
  /** A new article written for a part of a study list. */
  addToSection?: StudySectionTarget;
}

/** Loads the article to edit (if any), then shows the editor. */
export function ArticleEditorPage({
  id,
  addToSection,
}: ArticleEditorPageProps) {
  const article = useAdminQuery(
    () => (id ? getEditable(id) : Promise.resolve(undefined)),
    `editable-${id ?? "new"}`,
  );

  if (article.error && !article.data) {
    return (
      <Alert variant="danger" title="Không mở được bài viết">
        <div className="flex flex-wrap items-center gap-3">
          <span>{article.error.message}</span>
          <Button size="compact" variant="outline" onClick={article.reload}>
            Thử lại
          </Button>
        </div>
      </Alert>
    );
  }
  if (id && !article.data) {
    return (
      <div aria-busy="true">
        <span role="status" className="sr-only">
          Đang tải
        </span>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  return <Loaded article={article.data} addToSection={addToSection} />;
}
