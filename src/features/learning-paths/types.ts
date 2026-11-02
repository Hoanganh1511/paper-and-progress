import type { TutorBlock } from "@/features/tutor";

export type PathLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type PathState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface PathProgressSummary {
  state: PathState;
  completedSteps: number;
  totalSteps: number;
}

export interface PathTopic {
  slug: string;
  name: string;
}

export interface PathSummary {
  slug: string;
  title: string;
  description: string;
  level: PathLevel;
  phaseCount: number;
  stepCount: number;
  /** Null unless every step states its duration. */
  totalMinutes: number | null;
  topics: PathTopic[];
  progress: PathProgressSummary | null;
}

export interface PathStepSummary {
  slug: string;
  title: string;
  order: number;
  durationMinutes: number | null;
  isDone: boolean;
}

export interface PathPhase {
  order: number;
  title: string;
  description: string | null;
  completedSteps: number;
  steps: PathStepSummary[];
}

export interface PathDetail extends Omit<PathSummary, "progress"> {
  objectives: string[];
  prerequisites: string[];
  outcomes: string[];
  phases: PathPhase[];
  progress:
    | (PathProgressSummary & {
        startedAt: string | null;
        nextStepSlug: string | null;
      })
    | null;
  articles: {
    slug: string;
    title: string;
    excerpt: string | null;
    readingMinutes: number | null;
  }[];
  resources: {
    id: string;
    title: string;
    url: string;
    isExternal: boolean;
  }[];
}

/** A box of a step: a titled group of blocks, as the tutor draws them. */
export interface StepBox {
  title?: string;
  tag?: "you" | "do" | "done";
  isYours?: boolean;
  content: TutorBlock[];
}

export interface StepMine {
  isDone: boolean;
  completedAt: string | null;
  checks: Record<string, boolean>;
  note: string | null;
}

export interface StepDetail {
  path: { slug: string; title: string };
  phase: { order: number; title: string };
  step: {
    slug: string;
    order: number;
    title: string;
    durationMinutes: number | null;
    heading: string;
    lead: string;
    content: StepBox[];
  };
  position: { index: number; total: number };
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  mine: StepMine | null;
}

export interface StepProgressInput {
  isDone?: boolean;
  checks?: Record<string, boolean>;
  note?: string | null;
}

export interface StepProgressResult {
  mine: StepMine | null;
  progress: PathDetail["progress"];
}
