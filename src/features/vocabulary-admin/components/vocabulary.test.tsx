import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useState } from "react";
import { vi } from "vitest";
import { CATEGORY_BY_KEY } from "../categories";
import type { CategoryItem, WordDetailFull } from "../types";

expect.extend(toHaveNoViolations);

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => nav,
}));
vi.mock("@/features/auth", () => ({ authedApi: {} }));
const toast = vi.hoisted(() => vi.fn());
vi.mock("@/design-system", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/design-system")>()),
  useToast: () => ({ toast, dismiss: vi.fn(), dismissAll: vi.fn() }),
}));

const api = vi.hoisted(() => ({
  getVocabularyMeta: vi.fn(),
  listVocabulary: vi.fn(),
  getVocabularyWord: vi.fn(),
  createVocabularyWord: vi.fn(),
  updateVocabularyWord: vi.fn(),
  deleteVocabularyWord: vi.fn(),
}));
vi.mock("../vocabularyApi", () => api);

import { BasicInfoForm } from "./BasicInfoForm";
import { CategoryEditor } from "./CategoryEditor";
import { VocabularyEditor } from "./VocabularyEditor";
import { VocabularyList } from "./VocabularyList";
import { emptyForm } from "../form";

const units = [
  { id: 2, unitNumber: 2, topic: "Travel and transport" },
  { id: 4, unitNumber: 4, topic: "Technology" },
];

beforeEach(() => {
  vi.clearAllMocks();
  api.getVocabularyMeta.mockResolvedValue({
    units,
    sections: ["TOPIC_CONTRAST", "PHRASAL_VERB"],
  });
});

/* -------------------------------------------------------------------------- */
/* One category                                                               */
/* -------------------------------------------------------------------------- */

function Harness({
  categoryKey = "wordFamily" as const,
  initial = [] as CategoryItem[],
  onItems = vi.fn(),
}) {
  const [items, setItems] = useState(initial);
  return (
    <CategoryEditor
      category={CATEGORY_BY_KEY[categoryKey]}
      items={items}
      onChange={(next) => {
        setItems(next);
        onItems(next);
      }}
    />
  );
}

const family = (id: string, word: string, partOfSpeech = ""): CategoryItem => ({
  id,
  word,
  partOfSpeech,
  meaningVi: "",
  example: "",
});

describe("CategoryEditor", () => {
  it("shows an empty state with the way to add, and a count of 0", () => {
    render(<Harness />);
    expect(screen.getByText("Chưa có dạng từ nào")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Họ từ/ })).toBeInTheDocument();
    expect(screen.getByLabelText("0 mục")).toBeInTheDocument();
    expect(screen.getByText("Trống")).toBeInTheDocument();
    // no minimum: the text says so
    expect(
      screen.getByText(/không bắt buộc số lượng tối thiểu/),
    ).toBeInTheDocument();
  });

  it("adds an item, opened and ready to fill, and counts it", async () => {
    render(<Harness />);
    await userEvent.click(
      screen.getAllByRole("button", { name: "Thêm dạng từ" })[0],
    );
    expect(screen.getByLabelText("1 mục")).toBeInTheDocument();
    expect(screen.queryByText("Chưa có dạng từ nào")).toBeNull();
    // it is open: its fields can be typed into
    const field = screen.getByRole("textbox", { name: /^Từ/ });
    await userEvent.type(field, "artificially");
    expect(field).toHaveValue("artificially");
    // the card shows the title it was given and what is still missing
    expect(
      screen.getByRole("button", { name: /^artificially/, expanded: true }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Thiếu Từ loại/)).toBeInTheDocument();
    expect(screen.getByText("Đang soạn")).toBeInTheDocument();
  });

  it("accepts as many items as wanted, and is complete with just one", async () => {
    render(<Harness initial={[family("1", "artificially", "adverb")]} />);
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument();
    for (let i = 0; i < 6; i += 1) {
      await userEvent.click(
        screen.getByRole("button", { name: "Thêm dạng từ" }),
      );
    }
    expect(screen.getByLabelText("7 mục")).toBeInTheDocument();
    // the new ones are empty, so the category is in progress again
    expect(screen.getByText("Đang soạn")).toBeInTheDocument();
  });

  it("opens and closes a card, and all of them at once", async () => {
    render(
      <Harness
        initial={[family("1", "one", "noun"), family("2", "two", "noun")]}
      />,
    );
    const first = screen.getByRole("button", { name: /^one/ });
    expect(first).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(
      screen.getByRole("button", { name: "Mở rộng tất cả" }),
    );
    for (const card of screen.getAllByRole("button", { expanded: true })) {
      expect(card).toHaveAttribute("aria-expanded", "true");
    }
    expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(2);
    await userEvent.click(
      screen.getByRole("button", { name: "Thu gọn tất cả" }),
    );
    expect(screen.queryAllByRole("button", { expanded: true })).toHaveLength(0);
  });

  it("duplicates an item right after the original, with the same content", async () => {
    const onItems = vi.fn();
    render(
      <Harness
        onItems={onItems}
        initial={[family("1", "one", "noun"), family("2", "two", "noun")]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Nhân đôi one" }));
    const next = onItems.mock.calls.at(-1)?.[0] as CategoryItem[];
    expect(next.map((item) => item.word)).toEqual(["one", "one", "two"]);
    expect(next[1].id).not.toBe(next[0].id);
  });

  it("reorders items up and down, and cannot go past the ends", async () => {
    const onItems = vi.fn();
    render(
      <Harness
        onItems={onItems}
        initial={[
          family("1", "one", "n"),
          family("2", "two", "n"),
          family("3", "three", "n"),
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Chuyển one lên" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Chuyển three xuống" }),
    ).toBeDisabled();
    await userEvent.click(
      screen.getByRole("button", { name: "Chuyển one xuống" }),
    );
    expect(
      (onItems.mock.calls.at(-1)?.[0] as CategoryItem[]).map((i) => i.word),
    ).toEqual(["two", "one", "three"]);
    // the list on screen follows
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]).getByText("two")).toBeInTheDocument();
  });

  it("asks before deleting, and keeps the item if the answer is no", async () => {
    const onItems = vi.fn();
    render(
      <Harness
        onItems={onItems}
        initial={[family("1", "one", "n"), family("2", "two", "n")]}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Xoá one" }));
    const dialog = await screen.findByRole("alertdialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Hủy" }));
    expect(onItems).not.toHaveBeenCalled();
    expect(screen.getByLabelText("2 mục")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Xoá one" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Xoá",
      }),
    );
    expect(
      (onItems.mock.calls.at(-1)?.[0] as CategoryItem[]).map((i) => i.word),
    ).toEqual(["two"]);
    expect(screen.getByLabelText("1 mục")).toBeInTheDocument();
  });

  it("names an item that has no title yet", () => {
    render(<Harness initial={[family("1", "")]} />);
    expect(
      screen.getByRole("button", { name: "Xoá dạng từ chưa đặt tên" }),
    ).toBeInTheDocument();
  });

  it("offers each category its own fields", () => {
    render(
      <Harness
        categoryKey={"phrasalVerbs" as never}
        initial={[
          {
            id: "1",
            phrasalVerb: "carry out",
            meaning: "thực hiện",
            origin: "RELATED",
            separability: "",
            transitivity: "",
            example: "",
            relatedContext: "",
          },
        ]}
      />,
    );
    // the origin tells a derived phrasal verb from a related expression
    expect(screen.getAllByText(/Biểu thức liên quan/).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByRole("heading", { name: /Phrasal verbs/ }),
    ).toBeInTheDocument();
  });

  it("has no axe violations, open or closed", async () => {
    const { container } = render(
      <Harness initial={[family("1", "one", "noun")]} />,
    );
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(screen.getByRole("button", { name: /^one/ }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* -------------------------------------------------------------------------- */
/* The word's own fields                                                      */
/* -------------------------------------------------------------------------- */

describe("BasicInfoForm", () => {
  function Basics({ errors = {} as Record<string, string> }) {
    const [value, setValue] = useState(emptyForm().basics);
    return (
      <>
        <BasicInfoForm
          value={value}
          errors={errors}
          units={units}
          onChange={(changes) => setValue((c) => ({ ...c, ...changes }))}
        />
        <output data-testid="state">{JSON.stringify(value)}</output>
      </>
    );
  }
  const state = () =>
    JSON.parse(screen.getByTestId("state").textContent as string);

  it("lets one word be several parts of speech", async () => {
    render(<Basics />);
    const group = screen.getByRole("group", { name: "Từ loại" });
    await userEvent.click(
      within(group).getByRole("button", { name: "Danh từ" }),
    );
    await userEvent.click(
      within(group).getByRole("button", { name: "Động từ" }),
    );
    expect(state().partsOfSpeech).toEqual(["noun", "verb"]);
    expect(
      within(group).getByRole("button", { name: "Danh từ" }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(
      within(group).getByRole("button", { name: "Danh từ" }),
    );
    expect(state().partsOfSpeech).toEqual(["verb"]);
  });

  it("adds a topic with Enter, once, and removes it", async () => {
    render(<Basics />);
    const field = screen.getByLabelText(/^Chủ đề/);
    await userEvent.type(field, "Công nghệ{Enter}");
    await userEvent.type(field, "công nghệ{Enter}");
    await userEvent.type(field, "AI{Enter}");
    expect(state().topics).toEqual(["Công nghệ", "AI"]);
    await userEvent.click(screen.getByRole("button", { name: "Bỏ chủ đề AI" }));
    expect(state().topics).toEqual(["Công nghệ"]);
  });

  it("shows what is missing next to the field", () => {
    render(
      <Basics
        errors={{
          word: "Nhập từ.",
          partsOfSpeech: "Chọn ít nhất một từ loại.",
          meaningVi: "Nhập nghĩa tiếng Việt.",
        }}
      />,
    );
    expect(screen.getByText("Nhập từ.")).toBeInTheDocument();
    expect(screen.getByText("Chọn ít nhất một từ loại.")).toBeInTheDocument();
    expect(screen.getByText("Nhập nghĩa tiếng Việt.")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Basics />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* -------------------------------------------------------------------------- */
/* The whole editor                                                           */
/* -------------------------------------------------------------------------- */

const detail = (over: Record<string, unknown> = {}): WordDetailFull =>
  ({
    id: 7,
    unitId: 2,
    unitTopic: "Travel and transport",
    section: "TOPIC_CONTRAST",
    word: "artificial",
    pronunciation: "/ˌɑːtɪˈfɪʃl/",
    partsOfSpeech: ["adjective"],
    level: "B2",
    topics: ["Công nghệ"],
    meaning: "made by people",
    meaningVi: "nhân tạo",
    example: "",
    contrast: "",
    forms: "",
    pattern: "",
    updatedAt: "2026-11-03T00:00:00.000Z",
    categories: {},
    wordFamily: [
      {
        id: "f1",
        word: "artificially",
        partOfSpeech: "adverb",
        meaningVi: "",
        example: "",
      },
    ],
    collocations: [],
    phrasalVerbs: [],
    wordPatterns: [],
    wordFormation: [],
    dependentPrepositions: [],
    synonyms: [],
    antonyms: [],
    relatedVocabulary: [],
    conversations: [],
    ...over,
  }) as unknown as WordDetailFull;

describe("VocabularyEditor: a saved word", () => {
  it("opens with its fields, the sections beside them and the overview", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    render(<VocabularyEditor id={7} />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "artificial" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("artificial")).toBeInTheDocument();
    expect(screen.getByDisplayValue("nhân tạo")).toBeInTheDocument();

    const sections = screen.getByRole("navigation", {
      name: "Các phần của từ",
    });
    for (const name of [
      "Thông tin từ",
      "Họ từ",
      "Cụm từ & Collocations",
      "Phrasal verbs",
      "Cấu trúc ngữ pháp",
      "Cấu tạo từ",
      "Giới từ đi kèm",
      "Từ đồng nghĩa",
      "Từ trái nghĩa",
      "Từ vựng liên quan",
      "Hội thoại mẫu",
    ]) {
      expect(
        within(sections).getByRole("button", { name: new RegExp(`^${name}`) }),
      ).toBeInTheDocument();
    }
    expect(
      screen.getByRole("complementary", { name: "Tổng quan từ vựng" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Mọi thay đổi đã được lưu.")).toBeInTheDocument();
  });

  it("switches section, keeps what was typed in each, and saves everything at once", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    api.updateVocabularyWord.mockImplementation((_id, payload) =>
      Promise.resolve(detail({ ...payload })),
    );
    render(<VocabularyEditor id={7} />);
    await screen.findByRole("heading", { level: 1, name: "artificial" });

    await userEvent.clear(screen.getByDisplayValue("nhân tạo"));
    await userEvent.type(screen.getByLabelText(/^Nghĩa tiếng Việt/), "giả tạo");
    expect(screen.getByText("Có thay đổi chưa lưu.")).toBeInTheDocument();

    const sections = screen.getByRole("navigation", {
      name: "Các phần của từ",
    });
    await userEvent.click(
      within(sections).getByRole("button", { name: /Từ đồng nghĩa/ }),
    );
    await userEvent.click(
      screen.getAllByRole("button", { name: "Thêm từ đồng nghĩa" })[0],
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Từ đồng nghĩa/ }),
      "fake",
    );

    // back to the first section: the edit is still there
    await userEvent.click(
      within(sections).getByRole("button", { name: /Thông tin từ/ }),
    );
    expect(screen.getByDisplayValue("giả tạo")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    await waitFor(() =>
      expect(api.updateVocabularyWord).toHaveBeenCalledTimes(1),
    );
    const [id, payload] = api.updateVocabularyWord.mock.calls[0];
    expect(id).toBe(7);
    expect(payload).toMatchObject({
      word: "artificial",
      meaningVi: "giả tạo",
      level: "B2",
    });
    // all ten lists go, in order, whichever section was open
    expect(payload.wordFamily).toHaveLength(1);
    expect(payload.synonyms).toEqual([
      expect.objectContaining({ word: "fake" }),
    ]);
    expect(payload.antonyms).toEqual([]);
    expect(
      await screen.findByText("Mọi thay đổi đã được lưu."),
    ).toBeInTheDocument();
  });

  it("shows the server's complaint and keeps the work", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    api.updateVocabularyWord.mockRejectedValue(
      new Error("Unit này đã có từ “x”."),
    );
    render(<VocabularyEditor id={7} />);
    await screen.findByRole("heading", { level: 1, name: "artificial" });
    await userEvent.type(screen.getByLabelText(/^Phát âm/), "x");
    await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(
      await screen.findByText("Unit này đã có từ “x”."),
    ).toBeInTheDocument();
    expect(screen.getByText("Có thay đổi chưa lưu.")).toBeInTheDocument();
  });

  it("deletes the word after a confirmation", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    api.deleteVocabularyWord.mockResolvedValue({ deleted: true });
    render(<VocabularyEditor id={7} />);
    await screen.findByRole("heading", { level: 1, name: "artificial" });
    await userEvent.click(screen.getByRole("button", { name: "Xoá từ" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/những gì học viên đã viết/),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Xoá" }));
    await waitFor(() =>
      expect(api.deleteVocabularyWord).toHaveBeenCalledWith(7),
    );
    expect(nav.push).toHaveBeenCalledWith("/admin/vocabulary");
  });

  it("shows a failed load with a retry", async () => {
    api.getVocabularyWord.mockRejectedValueOnce(new Error("Máy chủ bận"));
    api.getVocabularyWord.mockResolvedValue(detail());
    render(<VocabularyEditor id={7} />);
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "artificial" }),
    ).toBeInTheDocument();
  });

  it("marks each section empty, in progress or completed, with no percentages", async () => {
    api.getVocabularyWord.mockResolvedValue(
      detail({
        synonyms: [{ id: "s1", word: "fake" }],
        antonyms: [{ id: "a1", word: "" }],
      }),
    );
    render(<VocabularyEditor id={7} />);
    await screen.findByRole("heading", { level: 1, name: "artificial" });
    const overview = screen.getByRole("complementary", {
      name: "Tổng quan từ vựng",
    });
    const row = (name: RegExp) =>
      within(overview).getByRole("button", { name });
    expect(
      within(row(/Từ đồng nghĩa/)).getByText("Hoàn thành"),
    ).toBeInTheDocument();
    expect(
      within(row(/Từ trái nghĩa/)).getByText("Đang soạn"),
    ).toBeInTheDocument();
    expect(within(row(/Hội thoại mẫu/)).getByText("Trống")).toBeInTheDocument();
    expect(overview.textContent).not.toMatch(/%/);
  });

  it("has no axe violations", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    const { container } = render(<VocabularyEditor id={7} />);
    await screen.findByRole("heading", { level: 1, name: "artificial" });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("VocabularyEditor: a new word", () => {
  it("asks for the required fields, takes you to them, and saves nothing yet", async () => {
    render(<VocabularyEditor />);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Thêm từ mới" }),
    ).toBeInTheDocument();

    // open another section first, so showing the errors has to bring the user back
    const sections = screen.getByRole("navigation", {
      name: "Các phần của từ",
    });
    await userEvent.click(
      within(sections).getByRole("button", { name: /Hội thoại mẫu/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Thêm từ" }));

    expect(await screen.findByText("Nhập từ.")).toBeInTheDocument();
    expect(screen.getByText("Chọn ít nhất một từ loại.")).toBeInTheDocument();
    expect(screen.getByText("Chọn unit.")).toBeInTheDocument();
    expect(screen.getByText("Nhập định nghĩa ngắn.")).toBeInTheDocument();
    expect(screen.getByText("Nhập nghĩa tiếng Việt.")).toBeInTheDocument();
    expect(api.createVocabularyWord).not.toHaveBeenCalled();
  });

  it("clears an error as soon as its field is touched", async () => {
    render(<VocabularyEditor />);
    await screen.findByRole("heading", { level: 1, name: "Thêm từ mới" });
    await userEvent.click(screen.getByRole("button", { name: "Thêm từ" }));
    expect(await screen.findByText("Nhập từ.")).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Từ$|^Từ \*/ }),
      "a",
    );
    expect(screen.queryByText("Nhập từ.")).toBeNull();
  });

  it("saves a word with no learning items at all, then opens it", async () => {
    api.getVocabularyWord.mockResolvedValue(detail());
    api.createVocabularyWord.mockResolvedValue(detail({ id: 31 }));
    render(<VocabularyEditor />);
    await screen.findByRole("heading", { level: 1, name: "Thêm từ mới" });

    await userEvent.click(screen.getByRole("button", { name: "Danh từ" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Từ$|^Từ \*/ }),
      "aim",
    );
    await userEvent.type(screen.getByLabelText(/^Định nghĩa ngắn/), "a goal");
    await userEvent.type(
      screen.getByLabelText(/^Nghĩa tiếng Việt/),
      "mục tiêu",
    );
    // unit and level are Selects
    await userEvent.click(screen.getByRole("combobox", { name: /Unit/ }));
    await userEvent.click(
      await screen.findByRole("option", { name: /Unit 2/ }),
    );
    await userEvent.click(screen.getByRole("combobox", { name: /Cấp độ/ }));
    await userEvent.click(await screen.findByRole("option", { name: "B1" }));

    await userEvent.click(screen.getByRole("button", { name: "Thêm từ" }));
    await waitFor(() =>
      expect(api.createVocabularyWord).toHaveBeenCalledTimes(1),
    );
    const payload = api.createVocabularyWord.mock.calls[0][0];
    expect(payload).toMatchObject({
      word: "aim",
      unitId: 2,
      level: "B1",
      partsOfSpeech: ["noun"],
      meaning: "a goal",
      meaningVi: "mục tiêu",
      wordFamily: [],
      conversations: [],
    });
    await waitFor(() =>
      expect(nav.replace).toHaveBeenCalledWith("/admin/vocabulary/31"),
    );
  });
});

/* -------------------------------------------------------------------------- */
/* The list                                                                   */
/* -------------------------------------------------------------------------- */

describe("VocabularyList", () => {
  const row = (over: Record<string, unknown> = {}) => ({
    id: 7,
    word: "artificial",
    meaning: "made by people",
    meaningVi: "nhân tạo",
    level: "B2",
    partsOfSpeech: ["adjective"],
    section: "TOPIC_CONTRAST",
    unit: units[0],
    updatedAt: "",
    categories: Object.fromEntries(
      Object.keys(CATEGORY_BY_KEY).map((key) => [
        key,
        { count: 0, state: "EMPTY" },
      ]),
    ),
    ...over,
  });

  it("lists the words, each linking to its editor, with how far its categories are", async () => {
    const categories = row().categories as Record<string, unknown>;
    api.listVocabulary.mockResolvedValue({
      total: 2,
      page: 1,
      limit: 20,
      items: [
        row({
          categories: {
            ...categories,
            synonyms: { count: 2, state: "COMPLETED" },
            antonyms: { count: 1, state: "IN_PROGRESS" },
          },
        }),
        row({
          id: 8,
          word: "natural",
          meaningVi: "",
          level: null,
          partsOfSpeech: [],
        }),
      ],
    });
    const { container } = render(<VocabularyList />);
    expect(
      await screen.findByRole("link", { name: "artificial" }),
    ).toHaveAttribute("href", "/admin/vocabulary/7");
    expect(screen.getByText("1 hoàn thành · 1 đang soạn")).toBeInTheDocument();
    expect(screen.getByText("Chưa có")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thêm từ" })).toHaveAttribute(
      "href",
      "/admin/vocabulary/new",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("searches by word or meaning", async () => {
    api.listVocabulary.mockResolvedValue({
      total: 0,
      page: 1,
      limit: 20,
      items: [],
    });
    render(<VocabularyList />);
    await screen.findByText("Không có từ nào khớp.");
    await userEvent.type(
      screen.getByLabelText("Tìm theo từ hoặc nghĩa"),
      "art",
    );
    await waitFor(() =>
      expect(api.listVocabulary).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "art", page: 1 }),
      ),
    );
  });

  it("shows a failed load with a retry", async () => {
    api.listVocabulary.mockRejectedValueOnce(new Error("Máy chủ bận"));
    api.listVocabulary.mockResolvedValue({
      total: 0,
      page: 1,
      limit: 20,
      items: [],
    });
    render(<VocabularyList />);
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByText("Không có từ nào khớp."),
    ).toBeInTheDocument();
  });
});
