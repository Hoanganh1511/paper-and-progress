import {
  ArrowLeftRight,
  Boxes,
  CaseSensitive,
  GitBranch,
  Link2,
  ListTree,
  MessagesSquare,
  Network,
  Puzzle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  CategoryItem,
  CategoryState,
  ContentCategory,
  VocabSection,
} from "./types";

export interface Option {
  value: string;
  label: string;
}

export const PART_OF_SPEECH_OPTIONS: readonly Option[] = [
  { value: "noun", label: "Danh từ" },
  { value: "verb", label: "Động từ" },
  { value: "adjective", label: "Tính từ" },
  { value: "adverb", label: "Trạng từ" },
  { value: "preposition", label: "Giới từ" },
  { value: "conjunction", label: "Liên từ" },
  { value: "pronoun", label: "Đại từ" },
  { value: "determiner", label: "Hạn định từ" },
  { value: "interjection", label: "Thán từ" },
];

export const SECTION_OPTIONS: readonly (Option & { value: VocabSection })[] = [
  { value: "TOPIC_CONTRAST", label: "Từ dễ nhầm" },
  { value: "PHRASAL_VERB", label: "Phrasal verbs" },
  { value: "PHRASE_COLLOCATION", label: "Cụm từ" },
  { value: "WORD_PATTERN", label: "Cấu trúc từ" },
  { value: "WORD_FORMATION", label: "Cấu tạo từ" },
];

const PATTERN_TYPES: readonly Option[] = [
  { value: "VERB_NOUN", label: "Động từ + Danh từ" },
  { value: "ADJECTIVE_NOUN", label: "Tính từ + Danh từ" },
  { value: "ADVERB_ADJECTIVE", label: "Trạng từ + Tính từ" },
  { value: "NOUN_PREPOSITION", label: "Danh từ + Giới từ" },
  { value: "NOUN_NOUN", label: "Danh từ + Danh từ" },
  { value: "VERB_PREPOSITION", label: "Động từ + Giới từ" },
  { value: "VERB_ADVERB", label: "Động từ + Trạng từ" },
  { value: "OTHER", label: "Khác" },
];

const CONTEXTS: readonly Option[] = [
  { value: "GENERAL", label: "Chung" },
  { value: "BUSINESS", label: "Kinh doanh" },
  { value: "SOFTWARE_ENGINEERING", label: "Kỹ thuật phần mềm" },
  { value: "TOEIC", label: "TOEIC" },
];

const SEPARABILITY: readonly Option[] = [
  { value: "SEPARABLE", label: "Tách được (separable)" },
  { value: "INSEPARABLE", label: "Không tách được (inseparable)" },
];

const TRANSITIVITY: readonly Option[] = [
  { value: "TRANSITIVE", label: "Ngoại động từ (transitive)" },
  { value: "INTRANSITIVE", label: "Nội động từ (intransitive)" },
];

const ORIGINS: readonly Option[] = [
  { value: "DERIVED", label: "Phái sinh trực tiếp từ từ này" },
  { value: "RELATED", label: "Biểu thức liên quan (không phái sinh)" },
];

export type FieldKind = "text" | "textarea" | "select";

export interface FieldConfig {
  key: string;
  label: string;
  kind: FieldKind;
  options?: readonly Option[];
  /** An item without it is "in progress". */
  required?: boolean;
  placeholder?: string;
  /** Spans both columns of the item's grid. */
  isWide?: boolean;
}

export interface CategoryConfig {
  key: ContentCategory;
  label: string;
  icon: LucideIcon;
  /** What the category is for: shown under its title. */
  purpose: string;
  /** What one item is called: "Thêm …", "Chưa có …". */
  itemName: string;
  emptyHint: string;
  fields: readonly FieldConfig[];
  /** The line a collapsed card shows. */
  titleOf: (item: CategoryItem) => string;
  subtitleOf?: (item: CategoryItem) => string;
}

const text = (
  key: string,
  label: string,
  extra: Partial<FieldConfig> = {},
): FieldConfig => ({ key, label, kind: "text", ...extra });
const area = (
  key: string,
  label: string,
  extra: Partial<FieldConfig> = {},
): FieldConfig => ({ key, label, kind: "textarea", isWide: true, ...extra });
const select = (
  key: string,
  label: string,
  options: readonly Option[],
  extra: Partial<FieldConfig> = {},
): FieldConfig => ({ key, label, kind: "select", options, ...extra });

const labelOf = (options: readonly Option[], value: string | undefined) =>
  options.find((option) => option.value === value)?.label ?? "";
const joined = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" · ");

export const CATEGORIES: readonly CategoryConfig[] = [
  {
    key: "wordFamily",
    label: "Họ từ",
    icon: GitBranch,
    purpose: "Các dạng khác nhau của từ gốc.",
    itemName: "dạng từ",
    emptyHint: "VD: artificially (trạng từ), artificiality (danh từ).",
    fields: [
      text("word", "Từ", { required: true, placeholder: "artificially" }),
      select("partOfSpeech", "Từ loại", PART_OF_SPEECH_OPTIONS, {
        required: true,
      }),
      text("meaningVi", "Nghĩa tiếng Việt", { isWide: true }),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) => item.word,
    subtitleOf: (item) =>
      joined(
        labelOf(PART_OF_SPEECH_OPTIONS, item.partOfSpeech),
        item.meaningVi,
      ),
  },
  {
    key: "collocations",
    label: "Cụm từ & Collocations",
    icon: Link2,
    purpose: "Những kết hợp từ tự nhiên.",
    itemName: "cụm từ",
    emptyHint: "VD: artificial intelligence, artificially generated.",
    fields: [
      text("phrase", "Cụm từ / Collocation", {
        required: true,
        isWide: true,
        placeholder: "artificial intelligence",
      }),
      select("patternType", "Kiểu kết hợp", PATTERN_TYPES),
      select("context", "Ngữ cảnh", CONTEXTS),
      text("meaningVi", "Nghĩa tiếng Việt", { isWide: true }),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) => item.phrase,
    subtitleOf: (item) =>
      joined(
        labelOf(PATTERN_TYPES, item.patternType),
        labelOf(CONTEXTS, item.context),
      ),
  },
  {
    key: "phrasalVerbs",
    label: "Phrasal verbs",
    icon: Zap,
    purpose:
      "Phrasal verb liên quan. Từ không nhất thiết có phrasal verb phái sinh trực tiếp, nên mỗi mục được gắn nhãn rõ.",
    itemName: "phrasal verb",
    emptyHint: "Không bắt buộc: nhiều từ không có phrasal verb.",
    fields: [
      text("phrasalVerb", "Phrasal verb", {
        required: true,
        placeholder: "carry out",
      }),
      select("origin", "Quan hệ với từ này", ORIGINS),
      text("meaning", "Nghĩa", { required: true, isWide: true }),
      select("separability", "Tách được không", SEPARABILITY),
      select("transitivity", "Ngoại / nội động từ", TRANSITIVITY),
      area("example", "Câu ví dụ"),
      text("relatedContext", "Ngữ cảnh liên quan", { isWide: true }),
    ],
    titleOf: (item) => item.phrasalVerb,
    subtitleOf: (item) => joined(labelOf(ORIGINS, item.origin), item.meaning),
  },
  {
    key: "wordPatterns",
    label: "Cấu trúc ngữ pháp",
    icon: ListTree,
    purpose: "Mẫu ngữ pháp đi cùng từ vựng.",
    itemName: "cấu trúc",
    emptyHint: "VD: be used for + V-ing, be created by + noun.",
    fields: [
      text("pattern", "Cấu trúc", {
        required: true,
        isWide: true,
        placeholder: "be used for + V-ing",
      }),
      area("explanation", "Giải thích ngữ pháp"),
      area("example", "Câu ví dụ"),
      area("translationVi", "Dịch tiếng Việt"),
    ],
    titleOf: (item) => item.pattern,
    subtitleOf: (item) => item.explanation,
  },
  {
    key: "wordFormation",
    label: "Cấu tạo từ",
    icon: Puzzle,
    purpose: "Tiền tố, hậu tố và các phép biến đổi.",
    itemName: "phép biến đổi",
    emptyHint: "VD: natural → unnatural, artificial → artificiality.",
    fields: [
      text("rootWord", "Từ gốc", { required: true, placeholder: "natural" }),
      text("derivedWord", "Từ phái sinh", {
        required: true,
        placeholder: "unnatural",
      }),
      text("prefix", "Tiền tố", { placeholder: "un-" }),
      text("suffix", "Hậu tố", { placeholder: "-ly" }),
      select("partOfSpeech", "Từ loại", PART_OF_SPEECH_OPTIONS),
      text("meaning", "Nghĩa"),
      area("rule", "Quy tắc tạo từ"),
    ],
    titleOf: (item) =>
      item.rootWord && item.derivedWord
        ? `${item.rootWord} → ${item.derivedWord}`
        : (item.rootWord ?? item.derivedWord ?? ""),
    subtitleOf: (item) =>
      joined(
        item.prefix && `tiền tố ${item.prefix}`,
        item.suffix && `hậu tố ${item.suffix}`,
      ),
  },
  {
    key: "dependentPrepositions",
    label: "Giới từ đi kèm",
    icon: ArrowLeftRight,
    purpose: "Giới từ đi cùng từ hoặc cụm từ.",
    itemName: "giới từ đi kèm",
    emptyHint: "VD: depend + on → depend on.",
    fields: [
      text("expression", "Từ / cụm từ", {
        required: true,
        placeholder: "depend",
      }),
      text("preposition", "Giới từ", { required: true, placeholder: "on" }),
      text("pattern", "Cấu trúc đầy đủ", {
        isWide: true,
        placeholder: "depend on + noun",
      }),
      text("meaning", "Nghĩa", { isWide: true }),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) =>
      item.expression && item.preposition
        ? `${item.expression} + ${item.preposition}`
        : (item.expression ?? ""),
    subtitleOf: (item) => joined(item.pattern, item.meaning),
  },
  {
    key: "synonyms",
    label: "Từ đồng nghĩa",
    icon: Network,
    purpose: "Từ cùng nghĩa, kèm sự khác biệt khi dùng.",
    itemName: "từ đồng nghĩa",
    emptyHint: "VD: fake, man-made.",
    fields: [
      text("word", "Từ đồng nghĩa", { required: true }),
      select("partOfSpeech", "Từ loại", PART_OF_SPEECH_OPTIONS),
      text("meaning", "Nghĩa", { isWide: true }),
      area("usageDifference", "Khác biệt khi dùng"),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) => item.word,
    subtitleOf: (item) =>
      joined(labelOf(PART_OF_SPEECH_OPTIONS, item.partOfSpeech), item.meaning),
  },
  {
    key: "antonyms",
    label: "Từ trái nghĩa",
    icon: CaseSensitive,
    purpose: "Từ trái nghĩa, kèm sự khác biệt khi dùng.",
    itemName: "từ trái nghĩa",
    emptyHint: "VD: natural, genuine.",
    fields: [
      text("word", "Từ trái nghĩa", { required: true }),
      select("partOfSpeech", "Từ loại", PART_OF_SPEECH_OPTIONS),
      text("meaning", "Nghĩa", { isWide: true }),
      area("usageDifference", "Khác biệt khi dùng"),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) => item.word,
    subtitleOf: (item) =>
      joined(labelOf(PART_OF_SPEECH_OPTIONS, item.partOfSpeech), item.meaning),
  },
  {
    key: "relatedVocabulary",
    label: "Từ vựng liên quan",
    icon: Boxes,
    purpose: "Từ liên quan về nghĩa, không nhất thiết cùng họ từ.",
    itemName: "từ liên quan",
    emptyHint: "VD: machine learning, algorithm.",
    fields: [
      text("word", "Từ liên quan", { required: true }),
      select("partOfSpeech", "Từ loại", PART_OF_SPEECH_OPTIONS),
      text("meaning", "Nghĩa", { isWide: true }),
      text("relationship", "Quan hệ / nhóm nghĩa", {
        isWide: true,
        placeholder: "Công nghệ AI",
      }),
      area("example", "Câu ví dụ"),
    ],
    titleOf: (item) => item.word,
    subtitleOf: (item) => joined(item.relationship, item.meaning),
  },
  {
    key: "conversations",
    label: "Hội thoại mẫu",
    icon: MessagesSquare,
    purpose:
      "Luyện từ trong giao tiếp thực tế: họp kỹ thuật, quản lý dự án, tình huống TOEIC.",
    itemName: "hội thoại",
    emptyHint: "VD: Manager – Developer trong buổi stand-up.",
    fields: [
      text("situation", "Tình huống / chủ đề", {
        required: true,
        isWide: true,
        placeholder: "Daily stand-up",
      }),
      text("speakerARole", "Vai người nói A", { placeholder: "Manager" }),
      text("speakerBRole", "Vai người nói B", { placeholder: "Developer" }),
      area("speakerA", "Câu của A", { required: true }),
      area("speakerB", "Câu của B", { required: true }),
      area("translationVi", "Dịch tiếng Việt"),
      text("highlight", "Từ vựng cần nhấn mạnh", {
        isWide: true,
        placeholder: "artificial",
      }),
    ],
    titleOf: (item) => item.situation,
    subtitleOf: (item) =>
      joined(item.speakerARole, item.speakerBRole && `– ${item.speakerBRole}`),
  },
];

export const CATEGORY_BY_KEY = Object.fromEntries(
  CATEGORIES.map((category) => [category.key, category]),
) as Record<ContentCategory, CategoryConfig>;

/** The required fields an item is still missing, by label. */
export function missingFields(
  category: CategoryConfig,
  item: CategoryItem,
): string[] {
  return category.fields
    .filter((field) => field.required && !(item[field.key] ?? "").trim())
    .map((field) => field.label);
}

/** Empty without items; completed when every item has its required fields; in progress otherwise. */
export function stateOf(
  category: CategoryConfig,
  items: readonly CategoryItem[],
): CategoryState {
  if (items.length === 0) return "EMPTY";
  return items.every((item) => missingFields(category, item).length === 0)
    ? "COMPLETED"
    : "IN_PROGRESS";
}

export const STATE_LABELS: Record<CategoryState, string> = {
  EMPTY: "Trống",
  IN_PROGRESS: "Đang soạn",
  COMPLETED: "Hoàn thành",
};

/** A new item with its fields empty. The id lets it be found again when reordered. */
export function newItem(category: CategoryConfig): CategoryItem {
  const item: CategoryItem = { id: newId() };
  for (const field of category.fields) item[field.key] = "";
  return item;
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `item-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

/** A copy right after the original, with an id of its own. */
export function duplicateOf(item: CategoryItem): CategoryItem {
  return { ...item, id: newId() };
}

/** Moves the item at `from` one place up (-1) or down (1). */
export function moveItem<T>(
  items: readonly T[],
  from: number,
  by: -1 | 1,
): T[] {
  const to = from + by;
  if (from < 0 || from >= items.length || to < 0 || to >= items.length) {
    return [...items];
  }
  const next = [...items];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
