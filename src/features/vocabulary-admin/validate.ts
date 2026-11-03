import type { WordBasics } from "./types";

export type BasicsErrors = Partial<Record<keyof WordBasics, string>>;

/** What a word needs before it can be saved; the learning categories need nothing. */
export function validateBasics(basics: WordBasics): BasicsErrors {
  const errors: BasicsErrors = {};
  if (basics.unitId === undefined) errors.unitId = "Chọn unit.";
  if (!basics.word.trim()) errors.word = "Nhập từ.";
  if (basics.partsOfSpeech.length === 0) {
    errors.partsOfSpeech = "Chọn ít nhất một từ loại.";
  }
  if (!basics.level) errors.level = "Chọn cấp độ.";
  if (!basics.meaning.trim()) errors.meaning = "Nhập định nghĩa ngắn.";
  if (!basics.meaningVi.trim()) errors.meaningVi = "Nhập nghĩa tiếng Việt.";
  return errors;
}

export const BASICS_FIELD_ORDER: (keyof WordBasics)[] = [
  "unitId",
  "section",
  "word",
  "partsOfSpeech",
  "level",
  "meaning",
  "meaningVi",
];
