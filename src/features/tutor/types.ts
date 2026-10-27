export type TutorBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; code: string; filename?: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "details"; summary: string; content: TutorBlock[] }
  | { type: "check"; id: string; text: string };

/** What a box asks of the learner; drives its badge. */
export type TutorBoxTag = "you" | "do" | "done";

export interface TutorBox {
  title?: string;
  tag?: TutorBoxTag;
  /** The learner writes this part themselves; drawn with a dashed border. */
  isYours?: boolean;
  content: TutorBlock[];
}

export interface TutorStep {
  id: string;
  /** Short name shown in the step list. */
  title: string;
  /** Phase heading the step belongs to. */
  group: string;
  duration: string;
  heading: string;
  lead: string;
  boxes: TutorBox[];
}

export type TutorRating = "ok" | "concept" | "no";

export interface TutorProgress {
  done: Record<string, boolean>;
  checks: Record<string, boolean>;
  ratings: Record<string, TutorRating>;
  notes: Record<string, string>;
  last?: string;
}
