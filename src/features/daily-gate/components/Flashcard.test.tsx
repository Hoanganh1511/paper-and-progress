import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { LearnWord } from "../types";
import { Flashcard } from "./Flashcard";

expect.extend(toHaveNoViolations);

const word: LearnWord = {
  id: 1,
  word: "aim",
  meaning: "mục đích",
  example: "Our aim is to learn.",
  contrast: "cause / reason",
  forms: null,
  pattern: null,
};

describe("Flashcard: a word still to learn", () => {
  it("is the plain card, without the learned dressing", () => {
    render(
      <Flashcard
        word={word}
        section="TOPIC_CONTRAST"
        isFlipped={false}
        onFlip={vi.fn()}
      />,
    );
    expect(screen.queryByText("Đã học")).toBeNull();
    expect(screen.queryByText("Đã học và ghi nhớ từ này")).toBeNull();
    expect(screen.getByText("Chạm để lật thẻ")).toBeInTheDocument();
  });
});

describe("Flashcard: a learned word", () => {
  const setup = (onFlip = vi.fn()) =>
    render(
      <Flashcard
        word={word}
        section="TOPIC_CONTRAST"
        isFlipped={false}
        isLearned
        onFlip={onFlip}
      />,
    );

  it("says it is learned in words, not only in colour", () => {
    setup();
    expect(screen.getByText("Đã học")).toBeInTheDocument();
    expect(screen.getByText("Đã học và ghi nhớ từ này")).toBeInTheDocument();
  });

  it("still shows the word, what it is confused with and the section", () => {
    setup();
    expect(screen.getByText("aim")).toBeInTheDocument();
    // the back of the card repeats it, so look at the front: the one in bold
    expect(screen.getAllByText("cause / reason")[0].tagName).toBe("STRONG");
    expect(screen.getByText(/^Dễ nhầm:/)).toBeInTheDocument();
  });

  it("turns over like any card, and keeps hinting that it can", async () => {
    const onFlip = vi.fn();
    setup(onFlip);
    expect(screen.getByText("Chạm để lật thẻ")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Lật thẻ aim/ }));
    expect(onFlip).toHaveBeenCalledTimes(1);
  });

  it("keeps its pictures out of the way of reading", () => {
    const { container } = setup();
    for (const picture of container.querySelectorAll("img, svg")) {
      expect(picture).toHaveAttribute(
        picture.tagName === "IMG" ? "alt" : "aria-hidden",
        picture.tagName === "IMG" ? "" : "true",
      );
    }
  });

  it("has no axe violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
