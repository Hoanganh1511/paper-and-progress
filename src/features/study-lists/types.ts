export interface LinkedCertificate {
  id: string;
  name: string;
}

/** A study list as the "Danh sách học" tab shows it. */
export interface StudyListSummary {
  id: string;
  title: string;
  description: string | null;
  sectionCount: number;
  stepCount: number;
  doneStepCount: number;
  /** From the ticked steps; 0 while the list has none. */
  progress: number;
  certificates: LinkedCertificate[];
}

/** The article of the site a step points to. */
export interface StepArticle {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  readingMinutes: number;
}

export interface StudyStep {
  id: string;
  title: string;
  note: string | null;
  url: string | null;
  isDone: boolean;
  doneAt: string | null;
  /** Set when the step is an article, which the learner reads on its own page. */
  article: StepArticle | null;
}

export interface StudySection {
  id: string;
  title: string;
  description: string | null;
  steps: StudyStep[];
}

export interface StudyListDetail extends StudyListSummary {
  createdAt: string;
  sections: StudySection[];
}

export interface StepInput {
  title?: string;
  note?: string;
  url?: string;
  isDone?: boolean;
}
