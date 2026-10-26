export type TopicColor = "blue" | "green" | "orange" | "pink" | "purple";

/** Key of the icon in the card's top-left tile; mapped to a component on the client. */
export type TopicIcon =
  | "listening"
  | "speaking"
  | "reading"
  | "writing"
  | "exam"
  | "travel"
  | "work"
  | "chat"
  | "vocabulary"
  | "grammar"
  | "trophy"
  | "presentation";

/** What the panda mascot holds. */
export type TopicMascot =
  "headphones" | "microphone" | "book" | "pencil" | "trophy" | "speech";

/** Small ornaments scattered over the card. */
export type TopicDecor = "note" | "star" | "leaf" | "sparkle";

export interface EnglishTopic {
  id: string;
  title: string;
  description: string;
  icon: TopicIcon;
  color: TopicColor;
  mascot: TopicMascot;
  /** Short text in the pill at the bottom, e.g. "100+ ĐỀ". */
  badge: string;
  decor: TopicDecor[];
  /** When set, the whole card links here. */
  href?: string;
}

/** A titled row of cards: one carousel. */
export interface EnglishSection {
  id: string;
  title: string;
  description?: string;
  topics: EnglishTopic[];
}

export interface EnglishTab {
  id: string;
  label: string;
  sections: EnglishSection[];
}
