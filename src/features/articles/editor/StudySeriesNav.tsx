"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/design-system";
import {
  getStudyList,
  listStudyLists,
  type StudyListDetail,
} from "@/features/study-lists";
import { SeriesColumn } from "./SeriesColumn";

const hasArticle = (list: StudyListDetail, articleId: string) =>
  list.sections.some((section) =>
    section.steps.some((step) => step.article?.id === articleId),
  );

/** Every study list of the reader, with its parts and lessons. */
async function loadLists(): Promise<StudyListDetail[]> {
  const summaries = await listStudyLists();
  return Promise.all(summaries.map((item) => getStudyList(item.id)));
}

/**
 * What was last shown. Another article is another page, so the column is built
 * again; starting from this keeps it on screen while it is refreshed, and keeps
 * the list the reader picked.
 */
let lastLists: StudyListDetail[] = [];
let lastPickedId: string | undefined;

/**
 * Puts a study list in a column on the left of the editor, so another lesson is
 * one click away: the list that has the article as a lesson, or the one the
 * reader picked in the column. With no study list at all there is no column.
 * The editor stays mounted while the lists load.
 */
export function StudySeriesNav({
  articleId,
  children,
}: {
  articleId: string;
  children: ReactNode;
}) {
  const [lists, setLists] = useState(lastLists);
  const [pickedId, setPickedId] = useState(lastPickedId);

  useEffect(() => {
    let isCurrent = true;
    // Always asked again, so titles and states are fresh; the column stays meanwhile.
    loadLists()
      .then((loaded) => {
        if (!isCurrent) return;
        lastLists = loaded;
        setLists(loaded);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [articleId]);

  // The list of the article comes first; the reader may look at another one,
  // unless the article they opened belongs to a different list.
  const own = lists.find((item) => hasArticle(item, articleId));
  const picked = lists.find((item) => item.id === pickedId);
  const shown =
    picked && (!own || hasArticle(picked, articleId))
      ? picked
      : (own ?? lists[0]);

  function handleSelect(id: string) {
    lastPickedId = id;
    setPickedId(id);
  }

  return (
    <div
      className={cn(
        "grid items-start gap-6",
        shown && "lg:grid-cols-[21rem_minmax(0,1fr)]",
      )}
    >
      {shown && (
        <SeriesColumn
          list={shown}
          lists={lists}
          onSelectList={handleSelect}
          articleId={articleId}
        />
      )}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
