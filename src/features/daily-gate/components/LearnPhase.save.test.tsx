import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { LearnResponse } from "../types";
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
const lesson = {
  lessonId: 7,
  unitTopic: "Travel",
  totalWords: 2,
  sections: [
    { type: "VOCABULARY", words: [word(1, "luggage"), word(2, "gate")] },
  ],
} as unknown as LearnResponse;

const setup = () =>
  render(
    <LearnPhase
      lesson={lesson}
      save={{ lessonId: 7, date: "2026-11-02" }}
      onComplete={vi.fn()}
      onBack={vi.fn()}
    />,
  );

beforeEach(() => {
  localStorage.clear();
});

describe("LearnPhase keeps the learner's place", () => {
  it("brings back the card, the mark and the note after being closed", async () => {
    const user = userEvent.setup();
    const first = setup();
    await user.click(screen.getByRole("button", { name: "Cần ôn lại" }));
    await user.type(screen.getByLabelText("Ghi chú cho từ này"), "túi");
    await user.click(screen.getByRole("button", { name: /Sau/ }));
    first.unmount();

    setup();
    expect(screen.getByText("Thẻ 2 / 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Trước/ }));
    expect(screen.getByLabelText("Ghi chú cho từ này")).toHaveValue("túi");
    expect(screen.getByRole("button", { name: "Cần ôn lại" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("copies the notes to English Logs, and links there", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("Ghi chú cho từ này"), "túi");
    const logs = JSON.parse(
      localStorage.getItem("pp.english-diary.logs") ?? "[]",
    );
    expect(logs.at(-1).notes).toContain("• luggage: túi");
    expect(
      await screen.findByRole("link", { name: "Xem trong English Logs" }),
    ).toHaveAttribute("href", "/goals/english/diary");
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
