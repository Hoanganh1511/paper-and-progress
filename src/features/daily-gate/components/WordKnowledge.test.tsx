import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { LearnWord } from "../types";
import { LearnPhase } from "./LearnPhase";
import { WordKnowledge } from "./WordKnowledge";
import type { LearnResponse } from "../types";
import { vi } from "vitest";

expect.extend(toHaveNoViolations);

const base: LearnWord = {
  id: 1,
  word: "artificial",
  meaning: "made by people",
  example: null,
  contrast: null,
  forms: null,
  pattern: null,
};

const rich: LearnWord = {
  ...base,
  pronunciation: "/ˌɑːtɪˈfɪʃl/",
  partsOfSpeech: ["adjective"],
  level: "B2",
  meaningVi: "nhân tạo",
  content: {
    wordFamily: [
      {
        id: "f1",
        word: "artificially",
        partOfSpeech: "adverb",
        meaningVi: "một cách nhân tạo",
        example: "The lake was artificially made.",
      },
    ],
    collocations: [
      {
        id: "c1",
        phrase: "artificial intelligence",
        patternType: "ADJECTIVE_NOUN",
        meaningVi: "trí tuệ nhân tạo",
        example: "",
        context: "SOFTWARE_ENGINEERING",
      },
      { id: "c2", phrase: "artificial materials" },
    ],
    phrasalVerbs: [
      {
        id: "p1",
        phrasalVerb: "carry out",
        meaning: "thực hiện",
        origin: "RELATED",
      },
    ],
    conversations: [
      {
        id: "v1",
        situation: "Daily stand-up",
        speakerARole: "Manager",
        speakerA: "Is the artificial data ready?",
        speakerBRole: "Developer",
        speakerB: "Yes, I generated it artificially.",
        translationVi: "Dữ liệu nhân tạo đã sẵn sàng chưa?",
        highlight: "artificial, artificially",
      },
    ],
  },
};

describe("WordKnowledge", () => {
  it("shows what kind of word it is: how to say it, level, parts of speech, Vietnamese", () => {
    render(<WordKnowledge word={rich} />);
    expect(screen.getByText("/ˌɑːtɪˈfɪʃl/")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("Tính từ")).toBeInTheDocument();
    expect(screen.getByText("nhân tạo")).toBeInTheDocument();
  });

  it("has a tab for each category that has items, with its count, and none for the empty ones", () => {
    render(<WordKnowledge word={rich} />);
    const tabs = within(
      screen.getByRole("tablist", { name: "Học sâu từ artificial" }),
    ).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      "Họ từ (1)",
      "Cụm từ & Collocations (2)",
      "Phrasal verbs (1)",
      "Hội thoại mẫu (1)",
    ]);
    // the first one is open
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("artificially")).toBeInTheDocument();
    expect(screen.getByText("Trạng từ")).toBeInTheDocument();
    expect(
      screen.getByText(/The lake was artificially made/),
    ).toBeInTheDocument();
  });

  it("shows each item of a category with its title, choices and texts", async () => {
    render(<WordKnowledge word={rich} />);
    await userEvent.click(
      screen.getByRole("tab", { name: /Cụm từ & Collocations/ }),
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(
      within(items[0]).getByText("artificial intelligence"),
    ).toBeInTheDocument();
    expect(within(items[0]).getByText("Tính từ + Danh từ")).toBeInTheDocument();
    expect(within(items[0]).getByText("Kỹ thuật phần mềm")).toBeInTheDocument();
    expect(within(items[0]).getByText(/trí tuệ nhân tạo/)).toBeInTheDocument();
    // an item with nothing but a phrase is just that
    expect(
      within(items[1]).getByText("artificial materials"),
    ).toBeInTheDocument();
  });

  it("tells a related expression from a phrasal verb of the word", async () => {
    render(<WordKnowledge word={rich} />);
    await userEvent.click(screen.getByRole("tab", { name: /Phrasal verbs/ }));
    expect(
      screen.getByText("Biểu thức liên quan (không phái sinh)"),
    ).toBeInTheDocument();
    expect(screen.getByText(/thực hiện/)).toBeInTheDocument();
  });

  it("shows a conversation line by line, with the target words marked", async () => {
    const { container } = render(<WordKnowledge word={rich} />);
    await userEvent.click(screen.getByRole("tab", { name: /Hội thoại mẫu/ }));
    expect(screen.getByText("Daily stand-up")).toBeInTheDocument();
    expect(screen.getByText("Manager:")).toBeInTheDocument();
    expect(screen.getByText("Developer:")).toBeInTheDocument();
    const marked = [...container.querySelectorAll("mark")].map(
      (mark) => mark.textContent,
    );
    expect(marked).toEqual(["artificial", "artificially"]);
    expect(
      screen.getByText("Dữ liệu nhân tạo đã sẵn sàng chưa?"),
    ).toBeInTheDocument();
  });

  it("shows nothing for a word nothing was written for", () => {
    const { container } = render(<WordKnowledge word={base} />);
    expect(container.querySelector("[role=tablist]")).toBeNull();
    expect(screen.queryByText("Tính từ")).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<WordKnowledge word={rich} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LearnPhase shows it under the flashcard", () => {
  const lesson = (word: LearnWord) =>
    ({
      lessonId: 7,
      unitTopic: "Technology",
      totalWords: 1,
      sentencesPerWord: 2,
      sections: [{ type: "TOPIC_CONTRAST", words: [word] }],
    }) as unknown as LearnResponse;

  const setup = (word: LearnWord) =>
    render(
      <LearnPhase
        lesson={lesson(word)}
        onBack={vi.fn()}
        onComplete={vi.fn()}
        onAddEntry={vi.fn()}
        onRemoveEntry={vi.fn()}
        onMark={vi.fn()}
      />,
    );

  it("puts the word's knowledge between the card and the writing", () => {
    setup(rich);
    const knowledge = screen.getByRole("region", {
      name: "Kiến thức về từ artificial",
    });
    const card = screen.getByRole("button", { name: /Lật thẻ artificial/ });
    const sentences = screen.getByRole("heading", { name: /Đặt câu/ });
    expect(
      card.compareDocumentPosition(knowledge) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      knowledge.compareDocumentPosition(sentences) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("leaves a word without content as it was", () => {
    setup(base);
    expect(screen.queryByRole("tablist", { name: /Học sâu/ })).toBeNull();
    expect(
      screen.getByRole("heading", { name: /Đặt câu/ }),
    ).toBeInTheDocument();
  });
});
