import type { EntryKind } from "./types";

/** How each kind of entry is asked for and shown. */
export interface EntryCopy {
  title: string;
  /** What one entry is called: "Thêm …", "Xoá …". */
  label: string;
  description: string;
  placeholder: string;
  /** A sentence or collocation must contain the word; the rest are about other words. */
  needsWord: boolean;
}

export const ENTRY_COPY: Record<EntryKind, EntryCopy> = {
  SENTENCE: {
    title: "Đặt câu",
    label: "câu",
    description: "Đặt một câu của riêng bạn. Động từ được chia thoải mái.",
    placeholder: "",
    needsWord: true,
  },
  COLLOCATION: {
    title: "Cụm từ đi kèm (collocation)",
    label: "cụm từ",
    description:
      "Những từ hay đi cùng từ này, ví dụ “make a decision”, “a long voyage”. Học theo cụm sẽ nhớ lâu hơn học từ đơn.",
    placeholder: "VD: a long voyage",
    needsWord: true,
  },
  RELATED: {
    title: "Từ liên quan",
    label: "từ",
    description:
      "Từ cùng họ, đồng nghĩa hoặc trái nghĩa, ví dụ “journey, trip” hay “arrive → arrival”.",
    placeholder: "VD: journey, trip",
    needsWord: false,
  },
  WORD_FAMILY: {
    title: "Họ từ",
    label: "dạng từ",
    description:
      "Các dạng khác của từ gốc: danh từ, động từ, tính từ, trạng từ của nó.",
    placeholder: "VD: artificially (adv): một cách nhân tạo",
    needsWord: false,
  },
  PHRASAL_VERB: {
    title: "Phrasal verbs",
    label: "phrasal verb",
    description:
      "Phrasal verb liên quan. Từ không nhất thiết có phrasal verb phái sinh trực tiếp, nên chỉ ghi những cụm bạn thấy thật sự liên quan.",
    placeholder: "VD: carry out: thực hiện",
    needsWord: false,
  },
  WORD_PATTERN: {
    title: "Cấu trúc ngữ pháp",
    label: "cấu trúc",
    description: "Mẫu ngữ pháp đi cùng từ này.",
    placeholder: "VD: be used for + V-ing",
    needsWord: false,
  },
  WORD_FORMATION: {
    title: "Cấu tạo từ",
    label: "cách tạo từ",
    description: "Tiền tố, hậu tố và cách biến đổi từ.",
    placeholder: "VD: natural → unnatural (tiền tố un-)",
    needsWord: false,
  },
  DEPENDENT_PREPOSITION: {
    title: "Giới từ đi kèm",
    label: "giới từ đi kèm",
    description: "Giới từ đi cùng từ hoặc cụm từ này.",
    placeholder: "VD: depend on + noun",
    needsWord: false,
  },
  SYNONYM: {
    title: "Từ đồng nghĩa",
    label: "từ đồng nghĩa",
    description:
      "Từ cùng nghĩa. Có thể ghi thêm nghĩa hoặc khác biệt khi dùng sau dấu hai chấm.",
    placeholder: "VD: fake: giả, không thật",
    needsWord: false,
  },
  ANTONYM: {
    title: "Từ trái nghĩa",
    label: "từ trái nghĩa",
    description: "Từ trái nghĩa. Có thể ghi thêm nghĩa sau dấu hai chấm.",
    placeholder: "VD: natural: tự nhiên",
    needsWord: false,
  },
  CONVERSATION: {
    title: "Hội thoại mẫu",
    label: "hội thoại",
    description:
      "Một đoạn hội thoại ngắn trong tình huống thật, như họp stand-up. Ghi cả hai người trên một dòng.",
    placeholder: "VD: A: Is the data ready? / B: Yes, it is.",
    needsWord: false,
  },
};

/**
 * The lists that are only a help, in the order of their tabs. Sentences are
 * separate because they are the ones a word needs to count as learned.
 */
export const HELP_KINDS: readonly EntryKind[] = [
  "COLLOCATION",
  "RELATED",
  "WORD_FAMILY",
  "PHRASAL_VERB",
  "WORD_PATTERN",
  "WORD_FORMATION",
  "DEPENDENT_PREPOSITION",
  "SYNONYM",
  "ANTONYM",
  "CONVERSATION",
];
