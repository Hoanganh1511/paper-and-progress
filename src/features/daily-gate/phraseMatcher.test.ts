import cases from "./phraseMatcher.cases.json";
import { containsPhrase, isSamePhrase } from "./phraseMatcher";

describe("phraseMatcher: the cases shared with the server", () => {
  it.each(cases)("$phrase | $sentence", ({ phrase, sentence, matched }) => {
    expect(containsPhrase(phrase, sentence)).toBe(matched);
  });
});

describe("isSamePhrase", () => {
  it("ignores case, spacing and a leading to", () => {
    expect(isSamePhrase("to meet a deadline", " Meet  a deadline ")).toBe(true);
    expect(isSamePhrase("meet a deadline", "meet a dead line")).toBe(false);
  });
});
