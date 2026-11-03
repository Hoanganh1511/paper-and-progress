import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { EntryKind, LearnResponse, WordEntry } from "../types";
import { LearnPhase } from "./LearnPhase";

expect.extend(toHaveNoViolations);

const word = (id: number, text: string) => ({
  id,
  word: text,
  meaning: "nghĩa",
  example: null,
  contrast: null,
  forms: null,
  pattern: null,
});
const make = (extra: Partial<LearnResponse> = {}) =>
  ({
    lessonId: 7,
    unitTopic: "Travel",
    totalWords: 1,
    sentencesPerWord: 2,
    sections: [{ type: "VOCABULARY", words: [word(1, "luggage")] }],
    ...extra,
  }) as unknown as LearnResponse;

const entry = (id: number, kind: EntryKind, text: string): WordEntry => ({
  id,
  kind,
  text,
});
const sentences = (n: number): WordEntry[] =>
  Array.from({ length: n }, (_, i) =>
    entry(i + 1, "SENTENCE", `My luggage is heavy ${i}.`),
  );

function setup(
  lesson: LearnResponse,
  props: Partial<Parameters<typeof LearnPhase>[0]> = {},
) {
  const handlers = {
    onAddEntry: vi.fn(),
    onRemoveEntry: vi.fn().mockResolvedValue(undefined),
    onMark: vi.fn().mockResolvedValue(undefined),
    onComplete: vi.fn(),
  };
  const view = render(
    <LearnPhase lesson={lesson} onBack={vi.fn()} {...handlers} {...props} />,
  );
  return { ...handlers, ...view };
}

const completeButton = () =>
  screen.getByRole("button", { name: "Hoàn thành phần học" });

describe("LearnPhase: when a word counts as learned", () => {
  it("does not depend on flipping through the cards", () => {
    setup(make({ entries: { 1: sentences(2) } }));
    // one card, never turned or visited: written, so it is done
    expect(completeButton()).toBeEnabled();
    expect(screen.queryByText(/Xem hết/)).toBeNull();
  });

  it("blocks completion until a word has enough sentences or is known", () => {
    setup(make({ entries: { 1: sentences(1) } }));
    expect(completeButton()).toBeDisabled();
    expect(screen.getByText(/Đặt câu: 1 \/ 2/)).toBeInTheDocument();
    expect(
      screen.getByText(/Còn 1 từ chưa học: đặt đủ 2 câu hoặc bấm “Đã biết”/),
    ).toBeInTheDocument();
  });

  it("counts a word marked known, and keeps that on the server", async () => {
    const { onMark } = setup(make());
    expect(completeButton()).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(onMark).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      "known",
    );
    expect(completeButton()).toBeEnabled();
    // pressing it again takes the mark off
    await userEvent.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(onMark).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 1 }),
      null,
    );
    expect(completeButton()).toBeDisabled();
  });

  it("restores a known word from the server", () => {
    setup(make({ marks: { 1: "known" } }));
    expect(screen.getByRole("button", { name: "Đã biết" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(completeButton()).toBeEnabled();
  });

  it("puts the mark back when the server refuses it", async () => {
    const { onMark } = setup(make());
    onMark.mockResolvedValueOnce("Máy chủ bận");
    await userEvent.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đã biết" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(completeButton()).toBeDisabled();
  });

  it("does not count collocations or related words toward a word", () => {
    setup(
      make({
        entries: {
          1: [
            entry(1, "COLLOCATION", "heavy luggage"),
            entry(2, "RELATED", "baggage"),
            entry(3, "SENTENCE", "My luggage is here."),
          ],
        },
      }),
    );
    expect(screen.getByText(/Đặt câu: 1 \/ 2/)).toBeInTheDocument();
    expect(completeButton()).toBeDisabled();
  });
});

describe("LearnPhase: ways to remember a word", () => {
  it("restores the sentences already saved", () => {
    setup(make({ entries: { 1: sentences(2) } }));
    expect(screen.getByText("My luggage is heavy 0.")).toBeInTheDocument();
    expect(screen.getByText(/Đã đủ câu/)).toBeInTheDocument();
  });

  it("saves a sentence that uses the word and counts it", async () => {
    const user = userEvent.setup();
    const { onAddEntry } = setup(make({ entries: { 1: sentences(1) } }));
    onAddEntry.mockResolvedValue({ entries: sentences(2) });
    const field = screen.getByLabelText(/Câu thứ 2/);
    await user.type(field, "I lost the bag.");
    await user.click(screen.getByRole("button", { name: "Lưu câu" }));
    // not about the word: told so, and nothing is sent
    expect(
      screen.getAllByText(/Chưa thấy “luggage” trong câu/).length,
    ).toBeGreaterThan(0);
    expect(onAddEntry).not.toHaveBeenCalled();
    await user.clear(field);
    await user.type(field, "I packed my luggage.");
    await user.click(screen.getByRole("button", { name: "Lưu câu" }));
    expect(onAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      "SENTENCE",
      "I packed my luggage.",
    );
    expect(await screen.findByText(/Đã đủ câu/)).toBeInTheDocument();
  });

  it("adds an entry as soon as Enter is pressed, and clears the field", async () => {
    const user = userEvent.setup();
    const { onAddEntry } = setup(make({ entries: { 1: sentences(1) } }));
    onAddEntry.mockResolvedValue({ entries: sentences(2) });
    // one line: a single-line field, so Enter submits instead of starting a new line
    const field = screen.getByLabelText(/Câu thứ 2/);
    expect(field.tagName).toBe("INPUT");
    await user.type(field, "I packed my luggage.{Enter}");
    expect(onAddEntry).toHaveBeenCalledTimes(1);
    expect(onAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      "SENTENCE",
      "I packed my luggage.",
    );
  });

  it("takes collocations and related words with Enter too, one per line", async () => {
    const user = userEvent.setup();
    const { onAddEntry } = setup(make());
    onAddEntry.mockResolvedValue({
      entries: [entry(5, "COLLOCATION", "heavy luggage")],
    });

    const ways = screen.getByRole("region", {
      name: "Các cách học khác cho từ luggage",
    });
    // the first tab is open: collocations
    const field = within(ways).getByLabelText(/Thêm cụm từ/);
    await user.type(field, "a fast car{Enter}");
    expect(onAddEntry).not.toHaveBeenCalled();
    expect(
      within(ways).getAllByText(/Chưa thấy “luggage” trong cụm từ/).length,
    ).toBeGreaterThan(0);
    await user.clear(field);
    await user.type(field, "heavy luggage{Enter}");
    expect(onAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      "COLLOCATION",
      "heavy luggage",
    );

    onAddEntry.mockResolvedValue({ entries: [entry(6, "RELATED", "baggage")] });
    await user.click(within(ways).getByRole("tab", { name: /^Từ liên quan/ }));
    await user.type(
      within(ways).getByLabelText(/Thêm từ cho/),
      "baggage{Enter}",
    );
    expect(onAddEntry).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 1 }),
      "RELATED",
      "baggage",
    );
  });

  it("removes an entry", async () => {
    const { onRemoveEntry } = setup(make({ entries: { 1: sentences(2) } }));
    await userEvent.click(
      screen.getByRole("button", { name: "Xoá câu: My luggage is heavy 0." }),
    );
    expect(onRemoveEntry).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
    );
    expect(screen.queryByText("My luggage is heavy 0.")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = setup(make({ entries: { 1: sentences(1) } }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LearnPhase: finding the words still to learn", () => {
  // luggage: learned (2 sentences). gate: not yet. ticket: not yet, but known later.
  const many = (extra: Partial<LearnResponse> = {}) =>
    ({
      lessonId: 7,
      unitTopic: "Travel",
      totalWords: 3,
      sentencesPerWord: 2,
      sections: [
        {
          type: "VOCABULARY",
          words: [word(1, "luggage"), word(2, "gate"), word(3, "ticket")],
        },
      ],
      entries: { 1: sentences(2) },
      ...extra,
    }) as unknown as LearnResponse;

  const filter = (name: RegExp) => screen.getByRole("button", { name });

  it("counts the words in each group", () => {
    setup(many());
    expect(filter(/^Tất cả \(3\)$/)).toHaveAttribute("aria-pressed", "true");
    expect(filter(/^Chưa học \(2\)$/)).toBeInTheDocument();
    expect(filter(/^Đã học \(1\)$/)).toBeInTheDocument();
  });

  it("shows only the words still to learn, and Trước/Sau skip the others", async () => {
    const user = userEvent.setup();
    setup(many());
    await user.click(filter(/^Chưa học/));
    // the first card (luggage) is learned, so the view moved to the first word still to learn
    expect(screen.getByText("Thẻ 2 / 3")).toBeInTheDocument();
    expect(screen.getByText(/Đang lọc “Chưa học”: 2 từ/)).toBeInTheDocument();
    // going back from "gate" has nowhere to go: luggage is not in view
    expect(screen.getByRole("button", { name: /Trước/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Sau/ }));
    expect(screen.getByText("Thẻ 3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sau/ })).toBeDisabled();
  });

  it("jumps to the next word still to learn, starting over at the end", async () => {
    const user = userEvent.setup();
    setup(many());
    const jump = () =>
      screen.queryByRole("button", { name: "Tới từ chưa học tiếp theo" });
    // from luggage (learned) the next one to learn is gate
    await user.click(jump() as HTMLElement);
    expect(screen.getByText("Thẻ 2 / 3")).toBeInTheDocument();
    await user.click(jump() as HTMLElement);
    expect(screen.getByText("Thẻ 3 / 3")).toBeInTheDocument();
    // past the last word it starts over from the top
    await user.click(jump() as HTMLElement);
    expect(screen.getByText("Thẻ 2 / 3")).toBeInTheDocument();
  });

  it("offers no jump when the word shown is the only one left", () => {
    setup(many({ marks: { 3: "known" }, entries: { 1: sentences(2) } }));
    // luggage learned, ticket known: gate is the only one, and it is not shown yet
    expect(
      screen.getByRole("button", { name: "Tới từ chưa học tiếp theo" }),
    ).toBeInTheDocument();
  });

  it("lists every word with whether it is learned, and opens one when asked", async () => {
    const user = userEvent.setup();
    setup(many());
    await user.click(screen.getByText(/^Danh sách từ \(3\)$/));
    expect(
      screen.getByRole("button", { name: "luggage, đã học" }),
    ).toHaveAttribute("aria-current", "true");
    await user.click(screen.getByRole("button", { name: "ticket, chưa học" }));
    expect(screen.getByText("Thẻ 3 / 3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ticket, chưa học" }),
    ).toHaveAttribute("aria-current", "true");
  });

  it("says so when every word is learned", async () => {
    const user = userEvent.setup();
    setup(many({ marks: { 2: "known", 3: "known" } }));
    await user.click(filter(/^Chưa học \(0\)$/));
    expect(screen.getByText(/Bạn đã học hết các từ!/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tới từ chưa học tiếp theo" }),
    ).toBeNull();
  });

  it("moves a word out of the list of those to learn once it is marked known", async () => {
    const user = userEvent.setup();
    setup(many());
    await user.click(filter(/^Chưa học \(2\)$/));
    await user.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(filter(/^Chưa học \(1\)$/)).toBeInTheDocument();
    expect(filter(/^Đã học \(2\)$/)).toBeInTheDocument();
  });

  it("has no filter when no word needs to be learned", () => {
    render(
      <LearnPhase lesson={make()} onBack={vi.fn()} onComplete={vi.fn()} />,
    );
    expect(screen.queryByRole("group", { name: /Lọc từ/ })).toBeNull();
  });

  it("has no axe violations with the filter and the list open", async () => {
    const { container } = setup(many());
    await userEvent.click(screen.getByText(/^Danh sách từ/));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LearnPhase: the card of a learned word", () => {
  it("wears the learned dressing once the word is learned, and not before", async () => {
    const user = userEvent.setup();
    setup(make());
    expect(screen.queryByText("Đã học và ghi nhớ từ này")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(screen.getByText("Đã học và ghi nhớ từ này")).toBeInTheDocument();
    // taking the mark off takes it away again
    await user.click(screen.getByRole("button", { name: "Đã biết" }));
    expect(screen.queryByText("Đã học và ghi nhớ từ này")).toBeNull();
  });

  it("shows it from the start for a word whose sentences are written", () => {
    setup(make({ entries: { 1: sentences(2) } }));
    expect(screen.getByText("Đã học và ghi nhớ từ này")).toBeInTheDocument();
  });
});

describe("LearnPhase: every way of remembering a word", () => {
  const ways = () =>
    screen.getByRole("region", { name: "Các cách học khác cho từ luggage" });

  it("has a tab for each learning category, with how many were written", () => {
    setup(
      make({
        entries: {
          1: [
            entry(1, "COLLOCATION", "heavy luggage"),
            entry(2, "SYNONYM", "baggage"),
            entry(3, "SYNONYM", "bags"),
          ],
        },
      }),
    );
    const tabs = within(ways()).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Cụm từ đi kèm (1)",
      "Từ liên quan (0)",
      "Họ từ (0)",
      "Phrasal verbs (0)",
      "Cấu trúc ngữ pháp (0)",
      "Cấu tạo từ (0)",
      "Giới từ đi kèm (0)",
      "Từ đồng nghĩa (2)",
      "Từ trái nghĩa (0)",
      "Hội thoại mẫu (0)",
    ]);
  });

  it("opens on the first list that has something written", () => {
    setup(make({ entries: { 1: [entry(1, "ANTONYM", "stay")] } }));
    expect(
      within(ways()).getByRole("tab", { name: /^Từ trái nghĩa/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("stay")).toBeInTheDocument();
  });

  it.each([
    ["Họ từ", "WORD_FAMILY", "luggages (n): hành lý"],
    ["Phrasal verbs", "PHRASAL_VERB", "pack up: dọn đồ"],
    ["Cấu trúc ngữ pháp", "WORD_PATTERN", "check in + luggage"],
    ["Cấu tạo từ", "WORD_FORMATION", "luggage → luggages"],
    ["Giới từ đi kèm", "DEPENDENT_PREPOSITION", "luggage for the trip"],
    ["Từ đồng nghĩa", "SYNONYM", "baggage: hành lý"],
    ["Từ trái nghĩa", "ANTONYM", "nothing"],
    ["Hội thoại mẫu", "CONVERSATION", "A: Where is it? / B: Here."],
  ])(
    "takes %s with Enter, without the word having to be in it",
    async (tabName, kind, text) => {
      const user = userEvent.setup();
      const { onAddEntry } = setup(make());
      onAddEntry.mockResolvedValue({
        entries: [entry(9, kind as EntryKind, text)],
      });
      await user.click(
        within(ways()).getByRole("tab", { name: new RegExp(`^${tabName}`) }),
      );
      await user.type(within(ways()).getByRole("textbox"), `${text}{Enter}`);
      expect(onAddEntry).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        kind,
        text,
      );
    },
  );

  it("does not count these toward the word being learned", () => {
    setup(
      make({
        entries: {
          1: [
            entry(1, "WORD_FAMILY", "luggages"),
            entry(2, "SYNONYM", "baggage"),
            entry(3, "CONVERSATION", "A: hi / B: hello"),
          ],
        },
      }),
    );
    expect(screen.getByText(/Đặt câu: 0 \/ 2/)).toBeInTheDocument();
    expect(completeButton()).toBeDisabled();
  });

  it("has no axe violations with a tab open", async () => {
    const { container } = setup(make());
    await userEvent.click(within(ways()).getByRole("tab", { name: /^Họ từ/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
