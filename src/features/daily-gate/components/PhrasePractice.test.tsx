import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { Phrase } from "../types";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  addPhraseExample: vi.fn(),
  reviewPhrase: vi.fn(),
  recordSpoken: vi.fn(),
}));
vi.mock("../dailyGateApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../dailyGateApi")>()),
  ...api,
}));

const speech = vi.hoisted(() => ({ canListen: vi.fn(() => false) }));
vi.mock("../speech", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../speech")>()),
  ...speech,
}));

import { PhrasePractice } from "./PhrasePractice";

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

beforeEach(() => {
  vi.clearAllMocks();
  speech.canListen.mockReturnValue(false);
});

describe("PhrasePractice: write (step 2)", () => {
  it("only lets a sentence with the phrase through, then shows the schedule", async () => {
    const saved = phrase({ stage: "RECALL", nextReviewAt: "2026-11-06" });
    api.addPhraseExample.mockResolvedValue({
      example: { id: "e1", text: "x" },
      phrase: saved,
    });
    const onChanged = vi.fn();
    const { container } = render(
      <PhrasePractice
        phrase={phrase({ stage: "WRITE" })}
        onChanged={onChanged}
        onBack={vi.fn()}
      />,
    );
    const save = screen.getByRole("button", { name: "Lưu câu" });
    const field = screen.getByLabelText(/^Câu của bạn/);

    await userEvent.type(field, "I like tea.");
    expect(screen.getByText(/Chưa thấy “meet a deadline”/)).toBeInTheDocument();
    expect(save).toBeDisabled();

    await userEvent.clear(field);
    await userEvent.type(field, "We met the deadline.");
    expect(screen.getByText("Câu đã có cụm từ.")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(save);
    await waitFor(() =>
      expect(api.addPhraseExample).toHaveBeenCalledWith(
        "p1",
        "We met the deadline.",
      ),
    );
    expect(await screen.findByText("Đã lưu câu của bạn")).toBeInTheDocument();
    expect(screen.getByText(/06\/11/)).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalled();
  });

  it("shows the server's message when it rejects the sentence", async () => {
    api.addPhraseExample.mockRejectedValue(new Error("Câu chưa chứa cụm từ."));
    render(
      <PhrasePractice
        phrase={phrase({ stage: "WRITE" })}
        onChanged={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    await userEvent.type(
      screen.getByLabelText(/^Câu của bạn/),
      "We met the deadline.",
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu câu" }));
    expect(
      await screen.findByText("Câu chưa chứa cụm từ."),
    ).toBeInTheDocument();
  });
});

describe("PhrasePractice: recall (step 3)", () => {
  const start = async (answer: string) => {
    render(
      <PhrasePractice phrase={phrase()} onChanged={vi.fn()} onBack={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText(/^Gõ lại cụm từ/), answer);
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
  };

  it("after a wrong answer only 'Quên' is left, and no sentence is asked", async () => {
    api.reviewPhrase.mockResolvedValue({
      isAnswerCorrect: false,
      phrase: phrase({ nextReviewAt: "2026-11-06" }),
    });
    await start("meet deadline now");

    expect(screen.getByRole("button", { name: "Khó" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Dễ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quên" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu kết quả" }));
    await waitFor(() =>
      expect(api.reviewPhrase).toHaveBeenCalledWith("p1", {
        answer: "meet deadline now",
        usedHint: false,
        grade: "FORGOT",
        sentence: undefined,
      }),
    );
    expect(await screen.findByText("Đã ghi nhận")).toBeInTheDocument();
  });

  it("'Dễ' needs a new sentence that uses the phrase", async () => {
    api.reviewPhrase.mockResolvedValue({
      isAnswerCorrect: true,
      phrase: phrase({ stage: "SPEAK", nextReviewAt: "2026-11-08" }),
    });
    await start("meet a deadline");

    await userEvent.click(screen.getByRole("button", { name: "Dễ" }));
    const save = screen.getByRole("button", { name: "Lưu kết quả" });
    expect(save).toBeDisabled();
    await userEvent.type(
      screen.getByLabelText(/^Một câu mới/),
      "She always meets a deadline.",
    );
    await userEvent.click(save);
    await waitFor(() =>
      expect(api.reviewPhrase).toHaveBeenCalledWith(
        "p1",
        expect.objectContaining({
          grade: "EASY",
          sentence: "She always meets a deadline.",
        }),
      ),
    );
  });

  it("a hint rules out 'Dễ'", async () => {
    render(
      <PhrasePractice phrase={phrase()} onChanged={vi.fn()} onBack={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Gợi ý" }));
    expect(screen.getByText(/m___ a d______/)).toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText(/^Gõ lại cụm từ/),
      "meet a deadline",
    );
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    expect(screen.getByRole("button", { name: "Dễ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Khó" })).toBeEnabled();
  });
});

describe("PhrasePractice: speak (step 4)", () => {
  it("falls back to typing where speech recognition is missing", async () => {
    api.recordSpoken.mockResolvedValue({
      containsPhrase: true,
      matchedIndexes: [1, 2, 3],
      phrase: phrase({ stage: "MASTERED" }),
    });
    const { container } = render(
      <PhrasePractice phrase={phrase()} onChanged={vi.fn()} onBack={vi.fn()} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Luyện nói" }));
    expect(
      screen.getByText(/không hỗ trợ nhận dạng giọng nói/),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/^Câu bạn vừa nói/),
      "we met the deadline",
    );
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    await waitFor(() =>
      expect(api.recordSpoken).toHaveBeenCalledWith(
        "p1",
        "we met the deadline",
      ),
    );
    expect(
      await screen.findByText("Bạn đã dùng được cụm từ"),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tells the user when Chrome sends the audio to Google", async () => {
    speech.canListen.mockReturnValue(true);
    render(
      <PhrasePractice
        phrase={phrase({ stage: "SPEAK" })}
        onChanged={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/gửi âm thanh lên dịch vụ của Google/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bắt đầu nói" }),
    ).toBeInTheDocument();
  });
});
