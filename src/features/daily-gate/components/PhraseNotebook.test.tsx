import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { LearnResponse, Phrase, PhraseSummary } from "../types";

expect.extend(toHaveNoViolations);

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const api = vi.hoisted(() => ({
  listPhrases: vi.fn(),
  getPhraseSummary: vi.fn(),
  createPhrase: vi.fn(),
  updatePhrase: vi.fn(),
  deletePhrase: vi.fn(),
}));
vi.mock("../dailyGateApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../dailyGateApi")>()),
  ...api,
}));

import { LearnPhase } from "./LearnPhase";
import { PhraseNotebook } from "./PhraseNotebook";

const phrase = (overrides: Partial<Phrase> = {}): Phrase => ({
  id: "p1",
  wordId: null,
  phrase: "meet a deadline",
  meaning: "kịp hạn chót",
  sampleSentence: null,
  stage: "RECALL",
  intervalDays: 1,
  nextReviewAt: "2026-11-05",
  easyStreak: 0,
  speakPassed: false,
  createdAt: "2026-11-04T00:00:00.000Z",
  ...overrides,
});

const summary: PhraseSummary = {
  total: 3,
  mastered: 1,
  unwritten: 1,
  due: 1,
  streak: 4,
  practicedToday: true,
};

const duePhrase = phrase();
const unwrittenPhrase = phrase({
  id: "p2",
  phrase: "take part in",
  meaning: "tham gia",
  stage: "WRITE",
});
const masteredPhrase = phrase({
  id: "p3",
  phrase: "run out of time",
  meaning: "hết thời gian",
  stage: "MASTERED",
  nextReviewAt: "2026-12-01",
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getPhraseSummary.mockResolvedValue(summary);
  api.listPhrases.mockImplementation(async (options?: { isDue?: boolean }) =>
    options?.isDue ? [duePhrase] : [duePhrase, unwrittenPhrase, masteredPhrase],
  );
});

describe("PhraseNotebook", () => {
  it("groups phrases into due today, not yet written and the rest, with the stats", async () => {
    const { container } = render(<PhraseNotebook />);

    const due = await screen.findByRole("heading", { name: "Hôm nay ôn (1)" });
    expect(due).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Chưa đặt câu (1)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Các cụm khác (1)" }),
    ).toBeInTheDocument();

    const dueSection = due.closest("section") as HTMLElement;
    expect(within(dueSection).getByText("meet a deadline")).toBeInTheDocument();
    expect(
      within(dueSection).queryByText("take part in"),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Chuỗi ngày ôn cụm từ")).toBeInTheDocument(),
    );
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(
      screen.getByRole("progressbar", {
        name: /“run out of time”: 4 trên 4 bước/,
      }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows an empty state for a new notebook", async () => {
    api.listPhrases.mockResolvedValue([]);
    render(<PhraseNotebook />);
    expect(await screen.findByText("Sổ cụm từ còn trống")).toBeInTheDocument();
  });

  it("shows an error with a retry when the list cannot be loaded", async () => {
    api.listPhrases.mockRejectedValueOnce(new Error("Không kết nối được"));
    api.listPhrases.mockRejectedValueOnce(new Error("Không kết nối được"));
    render(<PhraseNotebook />);
    expect(await screen.findByText("Không kết nối được")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", { name: "Hôm nay ôn (1)" }),
    ).toBeInTheDocument();
  });

  it("adds a phrase: both fields are required and a single word gets a hint", async () => {
    api.createPhrase.mockResolvedValue(phrase({ id: "p9" }));
    render(<PhraseNotebook />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Thêm cụm từ" }),
    );

    await userEvent.type(screen.getByLabelText(/^Cụm từ/), "deadline");
    expect(screen.getByText(/thay vì “deadline”/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Thêm vào sổ" }));
    expect(
      screen.getByText("Hãy tự viết nghĩa hoặc gợi nhớ."),
    ).toBeInTheDocument();
    expect(api.createPhrase).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByLabelText(/^Cụm từ/));
    await userEvent.type(screen.getByLabelText(/^Cụm từ/), "meet a deadline");
    await userEvent.type(screen.getByLabelText(/^Nghĩa \/ gợi nhớ/), "kịp hạn");
    await userEvent.click(screen.getByRole("button", { name: "Thêm vào sổ" }));

    await waitFor(() =>
      expect(api.createPhrase).toHaveBeenCalledWith({
        phrase: "meet a deadline",
        meaning: "kịp hạn",
        sampleSentence: undefined,
      }),
    );
    // The list is read again after saving.
    await waitFor(() =>
      expect(api.listPhrases.mock.calls.length).toBeGreaterThan(2),
    );
  });

  it("shows the server's message when the phrase is a duplicate", async () => {
    api.createPhrase.mockRejectedValue(
      new Error("Cụm từ này đã có trong sổ của bạn."),
    );
    render(<PhraseNotebook />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Thêm cụm từ" }),
    );
    await userEvent.type(screen.getByLabelText(/^Cụm từ/), "meet a deadline");
    await userEvent.type(screen.getByLabelText(/^Nghĩa \/ gợi nhớ/), "x");
    await userEvent.click(screen.getByRole("button", { name: "Thêm vào sổ" }));
    expect(
      await screen.findByText("Cụm từ này đã có trong sổ của bạn."),
    ).toBeInTheDocument();
  });

  it("edits a phrase", async () => {
    api.updatePhrase.mockResolvedValue(duePhrase);
    render(<PhraseNotebook />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Sửa cụm từ: meet a deadline",
      }),
    );
    const meaning = screen.getByLabelText(/^Nghĩa \/ gợi nhớ/);
    await userEvent.clear(meaning);
    await userEvent.type(meaning, "đúng hạn");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() =>
      expect(api.updatePhrase).toHaveBeenCalledWith("p1", {
        phrase: "meet a deadline",
        meaning: "đúng hạn",
        sampleSentence: "",
      }),
    );
  });

  it("asks before deleting, and Cancel keeps the phrase", async () => {
    api.deletePhrase.mockResolvedValue({ deleted: true });
    render(<PhraseNotebook />);
    await userEvent.click(
      await screen.findByRole("button", {
        name: "Xoá cụm từ: meet a deadline",
      }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(api.deletePhrase).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: "Xoá cụm từ: meet a deadline" }),
    );
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Xoá",
      }),
    );
    await waitFor(() => expect(api.deletePhrase).toHaveBeenCalledWith("p1"));
  });
});

describe("LearnPhase: Lưu vào sổ", () => {
  const word = (id: number, text: string) => ({
    id,
    word: text,
    meaning: "to finish on time",
    example: "We met the deadline.",
    contrast: null,
    forms: null,
    pattern: null,
  });
  const lesson: LearnResponse = {
    lessonId: 1,
    unitTopic: "Work",
    totalWords: 2,
    sections: [
      { type: "PHRASE_COLLOCATION", words: [word(11, "meet a deadline")] },
      { type: "WORD_FORMATION", words: [word(12, "arrival")] },
    ],
  };

  it("saves with a meaning the user writes (empty to start), then shows Đã lưu", async () => {
    const onSavePhrase = vi.fn().mockResolvedValue(undefined);
    render(
      <LearnPhase
        lesson={lesson}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onSavePhrase={onSavePhrase}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Lưu vào sổ" }));
    // The lesson's own English meaning is only a reference; the field starts empty.
    expect(
      screen.getByText("Nghĩa trong bài: to finish on time"),
    ).toBeInTheDocument();
    const meaning = screen.getByLabelText(/^Nghĩa \/ gợi nhớ/);
    expect(meaning).toHaveValue("");
    expect(screen.getByLabelText(/^Cụm từ/)).toHaveValue("meet a deadline");

    await userEvent.type(meaning, "kịp hạn chót");
    await userEvent.click(
      screen.getAllByRole("button", { name: "Lưu vào sổ" })[1],
    );

    await waitFor(() =>
      expect(onSavePhrase).toHaveBeenCalledWith(
        expect.objectContaining({ id: 11 }),
        {
          phrase: "meet a deadline",
          meaning: "kịp hạn chót",
          sampleSentence: "We met the deadline.",
        },
      ),
    );
    expect(
      await screen.findByRole("button", { name: "Đã lưu" }),
    ).toBeDisabled();
  });

  it("shows Đã lưu for a word already in the notebook", () => {
    render(
      <LearnPhase
        lesson={lesson}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        savedWordIds={new Set([11])}
        onSavePhrase={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Đã lưu" })).toBeDisabled();
  });

  it("offers no save button on sections that are not phrases", async () => {
    render(
      <LearnPhase
        lesson={lesson}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onSavePhrase={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Sau" }));
    expect(
      screen.queryByRole("button", { name: "Lưu vào sổ" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the arrow keys for the caret while typing in the form", async () => {
    render(
      <LearnPhase
        lesson={lesson}
        onComplete={vi.fn()}
        onBack={vi.fn()}
        onSavePhrase={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu vào sổ" }));
    await userEvent.type(
      screen.getByLabelText(/^Nghĩa \/ gợi nhớ/),
      "ab{ArrowRight}",
    );
    expect(screen.getByText("Thẻ 1 / 2")).toBeInTheDocument();
  });
});
