/** One lesson of a study list, as a row of the showcase. */
export interface SeriesStepItem {
  id: string;
  title: string;
  /** The article's page, or the list's own page for a step that is not an article. */
  href: string;
  /** Reading time when the step is an article. */
  minutes: number | null;
  isDone: boolean;
}

/** A study list ("series") with its first lessons, as the Dashboard's showcase draws it. */
export interface SeriesShowcase {
  id: string;
  title: string;
  description: string | null;
  sectionCount: number;
  /** All the lessons of the list, not only the ones listed. */
  stepCount: number;
  steps: SeriesStepItem[];
}
