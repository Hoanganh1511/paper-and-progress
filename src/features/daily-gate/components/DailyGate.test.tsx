import {
  act,
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type {
  ActiveToday,
  CalendarDay,
  LearnResponse,
  PracticeResponse,
  TestResponse,
} from "../types";

expect.extend(toHaveNoViolations);
configure({ asyncUtilTimeout: 4000 });

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const confetti = vi.hoisted(() => vi.fn());
vi.mock("canvas-confetti", () => ({ default: confetti }));

const api = vi.hoisted(() => ({
  getToday: vi.fn(),
  getLearn: vi.fn(),
  completeLearn: vi.fn(),
  getPractice: vi.fn(),
  submitPractice: vi.fn(),
  getTest: vi.fn(),
  submitTest: vi.fn(),
  getStats: vi.fn(),
  getCalendar: vi.fn(),
}));
vi.mock("../dailyGateApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../dailyGateApi")>()),
  ...api,
}));

import { Flashcard } from "./Flashcard";
import { useState } from "react";
import { useAdminQuery } from "@/features/admin/useAdminQuery";
import { getToday } from "../dailyGateApi";
import { DailyGateLauncher } from "./DailyGateLauncher";
import { DailyGatePanel } from "./DailyGatePanel";
import { Timer } from "./Timer";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                   */
/* -------------------------------------------------------------------------- */

const progress = {
  learnCompleted: false,
  practiceCompleted: false,
  testCompleted: false,
  testScore: null,
  bestScore: null,
  gateUnlocked: false,
};

const today = (overrides: Partial<ActiveToday> = {}): ActiveToday => ({
  active: true,
  lessonId: 5,
  dayNumber: 2,
  date: "2026-11-02",
  type: "NEW",
  units: [{ id: 2, unitNumber: 4, topic: "Hobbies, sport and games" }],
  totalWords: 66,
  isReady: true,
  progress,
  ...overrides,
});

const calendar: CalendarDay[] = Array.from({ length: 30 }, (_, index) => ({
  dayNumber: index + 1,
  date: `2026-11-${String(index + 1).padStart(2, "0")}`,
  type: "NEW",
  topic: `Topic ${index + 1}`,
  completed: index === 0,
  score: index === 0 ? 90 : null,
  isToday: index === 1,
  isPast: index < 1,
}));

const learn: LearnResponse = {
  lessonId: 5,
  unitTopic: "Hobbies, sport and games",
  totalWords: 3,
  sections: [
    {
      type: "TOPIC_CONTRAST",
      words: [
        {
          id: 1,
          word: "pitch",
          meaning: "an area marked out for football",
          example: "The players ran onto the pitch.",
          contrast: "track / court",
          forms: null,
          pattern: null,
        },
        {
          id: 2,
          word: "umpire",
          meaning: "an official in tennis",
          example: "The umpire said it was out.",
          contrast: "referee",
          forms: null,
          pattern: null,
        },
      ],
    },
    {
      type: "PHRASAL_VERB",
      words: [
        {
          id: 3,
          word: "carry on",
          meaning: "to continue",
          example: "Carry on playing.",
          contrast: null,
          forms: null,
          pattern: null,
        },
      ],
    },
  ],
};

const practice: PracticeResponse = {
  lessonId: 5,
  questions: [
    {
      id: 1,
      type: "MATCHING",
      instruction: "Match each word or phrase with its meaning",
      left: ["carry on", "look out"],
      right: ["be careful", "to continue"],
      answer: [1, 0],
    },
    {
      id: 2,
      type: "FILL_BLANK",
      instruction: "Complete the sentence",
      sentence: "Players must _____ to serve.",
      options: ["take turns", "have a go", "mad about", "spare time"],
      correctIndex: 0,
      explanation: '"take turns": to do something one after another.',
    },
  ],
};

const test: TestResponse = {
  lessonId: 5,
  attempt: 1,
  timeLimit: 300,
  passScore: 70,
  questions: [
    {
      id: 1,
      type: "MULTIPLE_CHOICE",
      question: 'What does "carry on" mean?',
      options: ["to continue", "to stop", "to win", "to lose"],
    },
    {
      id: 2,
      type: "MULTIPLE_CHOICE",
      question: 'What does "look out" mean?',
      options: ["be careful", "go away", "take up", "put off"],
    },
  ],
};

const passedResult = {
  score: 100,
  passed: true,
  gateUnlocked: true,
  results: [
    {
      questionId: 1,
      correct: true,
      correctAnswer: 0,
      yourAnswer: 0,
      explanation: '"carry on": to continue.',
    },
    {
      questionId: 2,
      correct: true,
      correctAnswer: 0,
      yourAnswer: 0,
      explanation: '"look out": be careful.',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.getToday.mockResolvedValue(today());
  api.getCalendar.mockResolvedValue(calendar);
  api.getLearn.mockResolvedValue(learn);
  api.completeLearn.mockResolvedValue({ progress });
  api.getPractice.mockResolvedValue(practice);
  api.submitPractice.mockResolvedValue({
    score: 50,
    details: [
      { questionId: 1, correct: true, points: 1 },
      { questionId: 2, correct: false, points: 0 },
    ],
  });
  api.getTest.mockResolvedValue(test);
  api.submitTest.mockResolvedValue(passedResult);
  api.getStats.mockResolvedValue({
    totalDays: 30,
    completedDays: 1,
    currentStreak: 1,
    longestStreak: 1,
    averageScore: 90,
    totalWordsLearned: 66,
    weakWords: [
      { wordId: 1, word: "pitch", meaning: "an area", wrongCount: 3 },
    ],
  });
});

const onClose = vi.fn();

/** The panel with the same "today" query the launcher gives it. */
function Panel() {
  const [version, setVersion] = useState(0);
  const query = useAdminQuery(getToday, `today-${version}`);
  return (
    <DailyGatePanel
      today={query}
      onRefresh={() => setVersion((current) => current + 1)}
      onClose={onClose}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Small components                                                           */
/* -------------------------------------------------------------------------- */

describe("Flashcard", () => {
  it("shows the word, and turns over to the meaning on click", async () => {
    const onFlip = vi.fn();
    const word = learn.sections[0].words[0];
    const { rerender } = render(
      <Flashcard
        word={word}
        section="TOPIC_CONTRAST"
        isFlipped={false}
        onFlip={onFlip}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Lật thẻ pitch/ }),
    );
    expect(onFlip).toHaveBeenCalled();

    rerender(
      <Flashcard
        word={word}
        section="TOPIC_CONTRAST"
        isFlipped
        onFlip={onFlip}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Lật lại thẻ pitch/ }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(word.meaning)).toBeInTheDocument();
  });
});

describe("Timer", () => {
  it("counts down and calls onExpire once when the time is up", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(<Timer seconds={3} onExpire={onExpire} />);
    expect(screen.getByRole("timer")).toHaveTextContent("0:03");
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(screen.getByRole("timer")).toHaveTextContent("0:00");
    expect(onExpire).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});

/* -------------------------------------------------------------------------- */
/* The screen, step by step                                                   */
/* -------------------------------------------------------------------------- */

describe("DailyGatePanel: landing", () => {
  it("shows the day, the topic, the calendar and the three steps", async () => {
    const { container } = render(<Panel />);
    expect(
      await screen.findByRole("heading", { name: "Day 2 / 30" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hobbies, sport and games")).toBeInTheDocument();
    expect(
      await screen.findByRole("list", { name: "Lịch 30 ngày" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Lịch 30 ngày" })).getAllByRole(
        "listitem",
      ),
    ).toHaveLength(30);
    expect(screen.getByRole("list", { name: /Các bước/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bắt đầu học" }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("explains a review day", async () => {
    api.getToday.mockResolvedValue(
      today({
        type: "REVIEW",
        units: [
          { id: 1, unitNumber: 2, topic: "Travel and transport" },
          { id: 2, unitNumber: 4, topic: "Hobbies, sport and games" },
        ],
      }),
    );
    render(<Panel />);
    expect(await screen.findByText(/Review Day/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Ôn tập: Travel and transport, Hobbies, sport and games/,
      ),
    ).toBeInTheDocument();
  });

  it("continues from the step that is next", async () => {
    api.getToday.mockResolvedValue(
      today({
        progress: {
          ...progress,
          learnCompleted: true,
          practiceCompleted: true,
        },
      }),
    );
    render(<Panel />);
    expect(
      await screen.findByRole("button", { name: /Làm bài kiểm tra/ }),
    ).toBeInTheDocument();
  });

  it("shows that the day is done, with the score and a way to close", async () => {
    api.getToday.mockResolvedValue(
      today({
        progress: {
          ...progress,
          learnCompleted: true,
          practiceCompleted: true,
          testCompleted: true,
          testScore: 90,
          bestScore: 90,
          gateUnlocked: true,
        },
      }),
    );
    render(<Panel />);
    expect(
      await screen.findByText(/Đã hoàn thành hôm nay/),
    ).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalled();
  });

  it.each([
    [
      { active: false, reason: "NOT_STARTED", startDate: "2026-11-01" },
      /bắt đầu từ 2026-11-01/,
    ],
    [{ active: false, reason: "FINISHED" }, /đi hết thử thách/],
  ])(
    "shows a day without a lesson, and can be closed (%o)",
    async (response, text) => {
      api.getToday.mockResolvedValue(response);
      render(<Panel />);
      expect(await screen.findByText(text)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
      expect(onClose).toHaveBeenCalled();
    },
  );

  it("says when the words of the day are not written yet", async () => {
    api.getToday.mockResolvedValue(today({ isReady: false, totalWords: 0 }));
    render(<Panel />);
    expect(await screen.findByText(/chưa có bài/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });

  it("offers a retry when today cannot be loaded", async () => {
    api.getToday.mockRejectedValueOnce(new Error("down"));
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Thử lại" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Day 2 / 30" }),
    ).toBeInTheDocument();
  });

  it("opens the stats", async () => {
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Thống kê" }),
    );
    expect(await screen.findByText("10 từ hay sai nhất")).toBeInTheDocument();
    expect(screen.getByText("pitch")).toBeInTheDocument();
    expect(screen.getByText("sai 3 lần")).toBeInTheDocument();
  });
});

describe("DailyGatePanel: learn", () => {
  async function openLearn() {
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Bắt đầu học" }),
    );
    await screen.findByText("Thẻ 1 / 3");
  }

  it("needs every card to be seen before it can be completed", async () => {
    await openLearn();
    const complete = screen.getByRole("button", {
      name: "Hoàn thành phần học",
    });
    expect(complete).toBeDisabled();
    expect(screen.getByText(/Xem hết 3 thẻ/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    expect(screen.getByText("Thẻ 2 / 3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    expect(complete).toBeEnabled();
  });

  it("jumps to a section, flips the card and marks it", async () => {
    await openLearn();
    await userEvent.click(
      screen.getByRole("button", { name: /Phrasal verbs/ }),
    );
    expect(screen.getByText("Thẻ 3 / 3")).toBeInTheDocument();
    expect(screen.getByText("carry on")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Lật thẻ carry on/ }),
    );
    expect(screen.getByText("to continue")).toBeVisible();

    const known = screen.getByRole("button", { name: "Đã biết" });
    await userEvent.click(known);
    expect(known).toHaveAttribute("aria-pressed", "true");
  });

  it("goes back and forward with the arrow keys", async () => {
    await openLearn();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Thẻ 2 / 3")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByText("Thẻ 1 / 3")).toBeInTheDocument();
  });

  it("saves the lesson as learned and moves on to practice", async () => {
    await openLearn();
    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    await userEvent.click(
      screen.getByRole("button", { name: "Hoàn thành phần học" }),
    );
    await waitFor(() => expect(api.completeLearn).toHaveBeenCalledWith(5));
    expect(await screen.findByText("Câu 1 / 2")).toBeInTheDocument();
  });

  it("shows the error and stays when saving fails", async () => {
    api.completeLearn.mockRejectedValueOnce(new Error("Máy chủ bận"));
    await openLearn();
    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    await userEvent.click(screen.getByRole("button", { name: /Sau/ }));
    await userEvent.click(
      screen.getByRole("button", { name: "Hoàn thành phần học" }),
    );
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
  });
});

describe("DailyGatePanel: practice", () => {
  async function openPractice() {
    api.getToday.mockResolvedValue(
      today({ progress: { ...progress, learnCompleted: true } }),
    );
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: /Luyện tập/ }),
    );
    await screen.findByText("Câu 1 / 2");
  }

  it("pairs words with meanings, checks them, and shows the answer to a choice at once", async () => {
    await openPractice();
    const words = screen.getByRole("list", { name: "Từ và cụm từ" });
    const meanings = screen.getByRole("list", { name: "Nghĩa" });
    const check = screen.getByRole("button", { name: "Kiểm tra" });
    expect(check).toBeDisabled();

    await userEvent.click(
      within(words).getByRole("button", { name: "carry on" }),
    );
    await userEvent.click(
      within(meanings).getByRole("button", { name: /to continue/ }),
    );
    await userEvent.click(
      within(words).getByRole("button", { name: /look out/ }),
    );
    await userEvent.click(
      within(meanings).getByRole("button", { name: /be careful/ }),
    );
    await userEvent.click(check);
    expect(
      within(words).getByRole("button", { name: /carry on/ }),
    ).toHaveTextContent("✓");

    await userEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    expect(screen.getByText("Câu 2 / 2")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /have a go/ }));
    expect(screen.getByText("Chưa đúng")).toBeInTheDocument();
    expect(
      screen.getByText(/to do something one after another/),
    ).toBeInTheDocument();
  });

  it("sends the answers, shows the score and what to look at again, then goes to the test", async () => {
    await openPractice();
    const words = screen.getByRole("list", { name: "Từ và cụm từ" });
    const meanings = screen.getByRole("list", { name: "Nghĩa" });
    await userEvent.click(
      within(words).getByRole("button", { name: "carry on" }),
    );
    await userEvent.click(
      within(meanings).getByRole("button", { name: /to continue/ }),
    );
    await userEvent.click(
      within(words).getByRole("button", { name: /look out/ }),
    );
    await userEvent.click(
      within(meanings).getByRole("button", { name: /be careful/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Kiểm tra" }));
    await userEvent.click(screen.getByRole("button", { name: "Câu tiếp" }));
    await userEvent.click(screen.getByRole("radio", { name: /have a go/ }));
    await userEvent.click(screen.getByRole("button", { name: "Xem kết quả" }));

    await waitFor(() =>
      expect(api.submitPractice).toHaveBeenCalledWith(5, [
        { questionId: 1, answer: [1, 0] },
        { questionId: 2, answer: 1 },
      ]),
    );
    expect(await screen.findByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/Những câu cần xem lại \(1\)/)).toBeInTheDocument();
    expect(screen.getByText("Đáp án: take turns")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Tiếp tục làm bài kiểm tra" }),
    );
    expect(await screen.findByText("Bài kiểm tra")).toBeInTheDocument();
  });
});

describe("DailyGatePanel: test", () => {
  async function openTest() {
    api.getToday.mockResolvedValue(
      today({
        progress: {
          ...progress,
          learnCompleted: true,
          practiceCompleted: true,
        },
      }),
    );
    render(<Panel />);
    await userEvent.click(
      await screen.findByRole("button", { name: /Làm bài kiểm tra/ }),
    );
    await screen.findByText("Bài kiểm tra");
  }

  it("shows a timer and no answers, and needs every question answered", async () => {
    await openTest();
    expect(screen.getByRole("timer")).toHaveTextContent("5:00");
    expect(screen.getByRole("button", { name: "Nộp bài" })).toBeDisabled();
    expect(screen.getByText("Còn 2 câu chưa trả lời.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /to continue/ }));
    // No colours or explanation appear before the test is handed in.
    expect(screen.queryByText("Chính xác!")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Câu sau" }));
    await userEvent.click(screen.getByRole("radio", { name: /be careful/ }));
    expect(screen.getByRole("button", { name: "Nộp bài" })).toBeEnabled();
  });

  it("on a pass shows the day as done with confetti", async () => {
    await openTest();
    await userEvent.click(screen.getByRole("radio", { name: /to continue/ }));
    await userEvent.click(screen.getByRole("button", { name: "Câu sau" }));
    await userEvent.click(screen.getByRole("radio", { name: /be careful/ }));
    await userEvent.click(screen.getByRole("button", { name: "Nộp bài" }));

    await waitFor(() =>
      expect(api.submitTest).toHaveBeenCalledWith(5, [
        { questionId: 1, selectedIndex: 0 },
        { questionId: 2, selectedIndex: 0 },
      ]),
    );
    expect(
      await screen.findByText("Hoàn thành bài hôm nay!"),
    ).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    await waitFor(() => expect(confetti).toHaveBeenCalled());
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("on a fail shows what went wrong and asks for a new test", async () => {
    api.submitTest.mockResolvedValue({
      score: 50,
      passed: false,
      gateUnlocked: false,
      results: [
        {
          questionId: 1,
          correct: true,
          correctAnswer: 0,
          yourAnswer: 0,
          explanation: '"carry on": to continue.',
        },
        {
          questionId: 2,
          correct: false,
          correctAnswer: 0,
          yourAnswer: 1,
          explanation: '"look out": be careful.',
        },
      ],
    });
    await openTest();
    await userEvent.click(screen.getByRole("radio", { name: /to continue/ }));
    await userEvent.click(screen.getByRole("button", { name: "Câu sau" }));
    await userEvent.click(screen.getByRole("radio", { name: /go away/ }));
    await userEvent.click(screen.getByRole("button", { name: "Nộp bài" }));

    expect(
      await screen.findByText("Chưa đạt, thử lại nhé"),
    ).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
    expect(screen.getByText(/Cần đạt ít nhất 70%/)).toBeInTheDocument();
    expect(screen.getByText(/Bạn chọn:/)).toHaveTextContent("B. go away");

    api.getTest.mockResolvedValueOnce({ ...test, attempt: 2 });
    await userEvent.click(
      screen.getByRole("button", { name: "Làm lại bài kiểm tra" }),
    );
    expect(await screen.findByText(/Lần 2/)).toBeInTheDocument();
    expect(api.getTest).toHaveBeenCalledTimes(2);
  });

  it("hands in by itself when the time runs out", async () => {
    api.getTest.mockResolvedValue({ ...test, timeLimit: 1 });
    await openTest();
    await userEvent.click(screen.getByRole("radio", { name: /to continue/ }));
    await waitFor(() => expect(api.submitTest).toHaveBeenCalledTimes(1), {
      timeout: 3000,
    });
    expect(api.submitTest).toHaveBeenCalledWith(5, [
      { questionId: 1, selectedIndex: 0 },
    ]);
  });
});

/* -------------------------------------------------------------------------- */
/* The corner button and its modal                                            */
/* -------------------------------------------------------------------------- */

describe("DailyGateLauncher", () => {
  it("never opens by itself, even when today is not done", async () => {
    render(<DailyGateLauncher hasDevTodo />);
    expect(
      await screen.findByRole("button", { name: /chưa làm bài hôm nay/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from the button and closes with the X, Escape or the close button", async () => {
    render(<DailyGateLauncher />);
    const open = async () => {
      await userEvent.click(
        await screen.findByRole("button", { name: /Daily English/ }),
      );
      return screen.findByRole("dialog", { name: "Daily English" });
    };

    let dialog = await open();
    expect(
      await within(dialog).findByRole("heading", { name: "Day 2 / 30" }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getAllByRole("button", { name: "Đóng" })[0],
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    dialog = await open();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("sits right above the dev todo button when there is one, and takes its place when not", async () => {
    api.getToday.mockResolvedValue({ active: false, reason: "NONE" });
    const { unmount } = render(<DailyGateLauncher hasDevTodo />);
    const button = await screen.findByRole("button", { name: "Daily English" });
    expect(button).toHaveClass("bottom-[9.75rem]", "right-4", "fixed");
    unmount();

    render(<DailyGateLauncher />);
    expect(
      await screen.findByRole("button", { name: "Daily English" }),
    ).toHaveClass("bottom-24");
  });

  it("shows a day without a lesson", async () => {
    api.getToday.mockResolvedValue({
      active: false,
      reason: "NOT_STARTED",
      startDate: "2026-11-01",
    });
    render(<DailyGateLauncher />);
    await userEvent.click(
      await screen.findByRole("button", { name: "Daily English" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Daily English" });
    expect(
      within(dialog).getByText(/bắt đầu từ 2026-11-01/),
    ).toBeInTheDocument();
  });

  it("marks the button when today is done", async () => {
    api.getToday.mockResolvedValue(
      today({
        progress: {
          ...progress,
          learnCompleted: true,
          practiceCompleted: true,
          testCompleted: true,
          bestScore: 90,
          testScore: 90,
          gateUnlocked: true,
        },
      }),
    );
    render(<DailyGateLauncher />);
    const button = await screen.findByRole("button", {
      name: /đã hoàn thành bài hôm nay/,
    });
    expect(button).toHaveClass("bg-accent-lime");
  });

  it("updates the button once the test is passed", async () => {
    const ready = {
      ...progress,
      learnCompleted: true,
      practiceCompleted: true,
    };
    api.getToday.mockResolvedValue(today({ progress: ready }));
    api.submitTest.mockImplementation(async () => {
      api.getToday.mockResolvedValue(
        today({
          progress: {
            ...ready,
            testCompleted: true,
            bestScore: 100,
            gateUnlocked: true,
          },
        }),
      );
      return passedResult;
    });
    render(<DailyGateLauncher />);
    await userEvent.click(
      await screen.findByRole("button", { name: /chưa làm bài hôm nay/ }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Daily English" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: /Làm bài kiểm tra/ }),
    );
    await userEvent.click(
      await within(dialog).findByRole("radio", { name: /to continue/ }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Câu sau" }),
    );
    await userEvent.click(
      within(dialog).getByRole("radio", { name: /be careful/ }),
    );
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Nộp bài" }),
    );
    expect(
      await within(dialog).findByText("Hoàn thành bài hôm nay!"),
    ).toBeInTheDocument();

    await userEvent.click(
      within(dialog).getAllByRole("button", { name: "Đóng" })[0],
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /đã hoàn thành bài hôm nay/ }),
    ).toBeInTheDocument();
  });
});
