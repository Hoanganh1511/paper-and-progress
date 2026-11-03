import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { splitMeaning } from "../../logs";
import type { DailyEnglishNotes } from "../../types";
import { DailyEnglishSection } from "./DailyEnglishSection";

expect.extend(toHaveNoViolations);

const data: DailyEnglishNotes = {
  learned: 1,
  total: 3,
  words: [
    {
      word: "observe",
      isLearned: true,
      isKnown: false,
      isReview: false,
      note: "nhớ: observe = watch carefully",
      sentences: ["Please observe how the API responds."],
      collocations: [
        "observe a phenomenon: quan sát một hiện tượng",
        "observe the rules",
      ],
      related: ["observation (n): sự quan sát", "notice (v): nhận thấy"],
    },
    {
      word: "gate",
      isLearned: false,
      isKnown: false,
      isReview: true,
      sentences: [],
      collocations: [],
      related: [],
    },
  ],
};

describe("splitMeaning", () => {
  it("splits a phrase from what it means at the first colon", () => {
    expect(splitMeaning("observe a pattern: nhận thấy một quy luật")).toEqual({
      term: "observe a pattern",
      meaning: "nhận thấy một quy luật",
    });
    expect(splitMeaning("a: b: c")).toEqual({ term: "a", meaning: "b: c" });
  });

  it("keeps a phrase without a meaning whole", () => {
    expect(splitMeaning("observe the rules")).toEqual({
      term: "observe the rules",
    });
    expect(splitMeaning("observe the rules:")).toEqual({
      term: "observe the rules",
    });
  });
});

describe("DailyEnglishSection", () => {
  it("shows how many words were learned", () => {
    render(<DailyEnglishSection data={data} />);
    expect(
      screen.getByRole("progressbar", { name: "Đã học 1 trên 3 từ" }),
    ).toBeInTheDocument();
  });

  it("gives each word a card with its own groups, one item per row", async () => {
    const { container } = render(<DailyEnglishSection data={data} />);
    const observe = screen
      .getByRole("heading", { name: "observe" })
      .closest("li") as HTMLElement;

    expect(within(observe).getByText("Đã học")).toBeInTheDocument();
    expect(
      within(observe).getByText(/nhớ: observe = watch/),
    ).toBeInTheDocument();

    const group = (name: RegExp) =>
      within(observe)
        .getByRole("heading", { name })
        .closest("section") as HTMLElement;
    expect(within(group(/Ví dụ/)).getAllByRole("listitem")).toHaveLength(1);

    const collocations = within(group(/Cụm từ đi kèm/)).getAllByRole(
      "listitem",
    );
    expect(collocations).toHaveLength(2);
    // the phrase and its meaning are separate parts of the row
    expect(
      within(collocations[0]).getByText("observe a phenomenon"),
    ).toBeInTheDocument();
    expect(
      within(collocations[0]).getByText("quan sát một hiện tượng"),
    ).toBeInTheDocument();

    expect(within(group(/Từ liên quan/)).getAllByRole("listitem")).toHaveLength(
      2,
    );

    // a word with nothing written has no empty groups
    const gate = screen
      .getByRole("heading", { name: "gate" })
      .closest("li") as HTMLElement;
    expect(within(gate).getByText("Cần ôn lại")).toBeInTheDocument();
    expect(
      within(gate).queryByRole("heading", {
        name: /Ví dụ|Cụm từ|Từ liên quan/,
      }),
    ).toBeNull();

    expect(await axe(container)).toHaveNoViolations();
  });
});
