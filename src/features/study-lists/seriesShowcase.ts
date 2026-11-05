import { getStudyList, listStudyLists } from "./studyListsApi";
import type {
  LinkedCertificate,
  StudyListDetail,
  StudyListSummary,
} from "./types";

/** How many lessons a series card lists. */
export const STEPS_PER_SERIES = 3;

/** One lesson of a study list, as a row of a series card. */
export interface SeriesStepItem {
  id: string;
  title: string;
  /** The article's page, or the list's own page for a step that is not an article. */
  href: string;
  /** Reading time when the step is an article. */
  minutes: number | null;
  /** ISO date the article was published, when the step is a published article. */
  publishedAt: string | null;
  isDone: boolean;
}

/** A study list ("series") with its first lessons, as a series card draws it. */
export interface SeriesShowcase {
  id: string;
  title: string;
  description: string | null;
  sectionCount: number;
  /** All the lessons of the list, not only the ones listed. */
  stepCount: number;
  doneStepCount: number;
  steps: SeriesStepItem[];
  certificates: LinkedCertificate[];
}

export type SeriesTone = "pink" | "lime" | "blue" | "yellow";

const TONES: SeriesTone[] = ["pink", "lime", "blue", "yellow"];

/** The colour of a card follows its place in the list, so neighbours differ. */
export const toneOfIndex = (index: number): SeriesTone =>
  TONES[index % TONES.length];

/** The first lessons of a list, in the order the learner set them (across its sections). */
export function toShowcase(list: StudyListDetail): SeriesShowcase {
  const steps = list.sections
    .flatMap((section) => section.steps)
    // A draft or archived article is not for readers; a step with no article (a link) stays.
    .filter((step) => !step.article || step.article.status === "PUBLISHED")
    .slice(0, STEPS_PER_SERIES)
    .map((step) => ({
      id: step.id,
      title: step.article?.title ?? step.title,
      href: step.article
        ? `/articles/${step.article.slug}`
        : `/study-lists/${list.id}`,
      minutes: step.article?.readingMinutes ?? null,
      publishedAt: step.article?.publishedAt ?? null,
      isDone: step.isDone,
    }));
  return {
    id: list.id,
    title: list.title,
    description: list.description,
    sectionCount: list.sectionCount,
    stepCount: list.stepCount,
    doneStepCount: list.doneStepCount,
    steps,
    certificates: list.certificates,
  };
}

const withoutSteps = (list: StudyListSummary): SeriesShowcase => ({
  id: list.id,
  title: list.title,
  description: list.description,
  sectionCount: list.sectionCount,
  stepCount: list.stepCount,
  doneStepCount: list.doneStepCount,
  steps: [],
  certificates: list.certificates,
});

export interface LoadSeriesOptions {
  /** At most this many series. */
  limit?: number;
  /** Keep the lists that have no lesson yet (they show their name and nothing under it). */
  includeEmpty?: boolean;
}

/**
 * Reads the learner's study lists and the first lessons of each one. A list
 * whose lessons cannot be read is left out, so the others still show.
 */
export async function loadSeriesShowcases({
  limit,
  includeEmpty = false,
}: LoadSeriesOptions = {}): Promise<SeriesShowcase[]> {
  const kept = (await listStudyLists()).filter(
    (list) => includeEmpty || list.stepCount > 0,
  );
  const lists = limit === undefined ? kept : kept.slice(0, limit);
  const showcases = await Promise.all(
    lists.map(async (list) => {
      if (list.stepCount === 0) return withoutSteps(list);
      try {
        return toShowcase(await getStudyList(list.id));
      } catch {
        return null;
      }
    }),
  );
  return showcases.filter((item) => item !== null);
}
