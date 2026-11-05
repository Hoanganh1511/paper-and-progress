import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { StudyListDetail, StudyListSummary } from "../types";

expect.extend(toHaveNoViolations);

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));
const auth = vi.hoisted(() => ({ role: "CREATOR" as string }));
vi.mock("@/features/auth", () => ({
  authedApi: {},
  useAuth: () => ({ user: { role: auth.role } }),
}));

const api = vi.hoisted(() => ({
  listStudyLists: vi.fn(),
  getStudyList: vi.fn(),
  searchStudyArticles: vi.fn(),
  createStudyList: vi.fn(),
  addSection: vi.fn(),
  addStep: vi.fn(),
  updateStep: vi.fn(),
  deleteSection: vi.fn(),
  reorderSections: vi.fn(),
  updateSection: vi.fn(),
  deleteStep: vi.fn(),
  reorderSteps: vi.fn(),
}));
vi.mock("../studyListsApi", () => api);

import { StudyListsTab } from "./StudyListsTab";
import { StudyPlan } from "./StudyPlan";

beforeEach(() => {
  vi.clearAllMocks();
  auth.role = "CREATOR";
});

const summary = (over: Partial<StudyListSummary> = {}): StudyListSummary => ({
  id: "l1",
  title: "Ôn thi AWS",
  description: "Theo guide chính thức",
  sectionCount: 2,
  stepCount: 4,
  doneStepCount: 1,
  progress: 25,
  certificates: [{ id: "c1", name: "AWS SAA" }],
  ...over,
});

/** The list as the series card reads it: its first lesson, a step that is not an article. */
const cardDetail = (over: Partial<StudyListSummary> = {}): StudyListDetail => ({
  ...summary(over),
  createdAt: "2026-11-01T00:00:00Z",
  sections: [
    {
      id: "s1",
      title: "Fundamentals",
      description: null,
      steps: [
        {
          id: "t1",
          title: "Read the guide",
          note: null,
          url: null,
          isDone: true,
          doneAt: null,
          article: null,
        },
      ],
    },
  ],
});

describe("StudyListsTab", () => {
  it("shows each study list as a series card with its lessons and the certificates that use it", async () => {
    api.listStudyLists.mockResolvedValue([summary()]);
    api.getStudyList.mockResolvedValue(cardDetail());
    const { container } = render(<StudyListsTab />);
    expect(
      await screen.findByRole("link", { name: "Ôn thi AWS" }),
    ).toHaveAttribute("href", "/study-lists/l1");
    expect(screen.getByText("4 bài")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read the guide" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "AWS SAA" })).toHaveAttribute(
      "href",
      "/certificates/c1",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("opens a form from the button, and opens the new list once it is created", async () => {
    api.listStudyLists.mockResolvedValue([]);
    api.createStudyList.mockResolvedValue({ id: "new1" });
    render(<StudyListsTab />);
    expect(
      await screen.findByText("Chưa có danh sách học nào"),
    ).toBeInTheDocument();
    // the button is always enabled; the form comes after the click
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(
      screen.getByRole("button", { name: "Tạo danh sách" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Tạo danh sách học" });

    await userEvent.click(
      within(dialog).getByRole("button", { name: "Tạo danh sách" }),
    );
    expect(within(dialog).getByText("Nhập tên danh sách.")).toBeInTheDocument();
    expect(api.createStudyList).not.toHaveBeenCalled();

    await userEvent.type(
      within(dialog).getByLabelText(/Tên danh sách/),
      "Học React",
    );
    await userEvent.type(within(dialog).getByLabelText(/Mô tả/), "Từ cơ bản");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Tạo danh sách" }),
    );
    expect(api.createStudyList).toHaveBeenCalledWith({
      title: "Học React",
      description: "Từ cơ bản",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/study-lists/new1"));
    // Coming back to this page, the form is gone and the list is read again.
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(api.listStudyLists).toHaveBeenCalledTimes(2);
  });

  it("shows a failed load with a retry", async () => {
    api.listStudyLists.mockRejectedValueOnce(new Error("Máy chủ bận"));
    api.listStudyLists.mockResolvedValue([summary()]);
    api.getStudyList.mockResolvedValue(cardDetail());
    render(<StudyListsTab />);
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(
      await screen.findByRole("link", { name: "Ôn thi AWS" }),
    ).toBeInTheDocument();
  });
});

describe("StudyPlan", () => {
  const detail = (over: Partial<StudyListDetail> = {}): StudyListDetail => ({
    ...summary({ stepCount: 2, doneStepCount: 1, progress: 50 }),
    createdAt: "2026-10-01T00:00:00.000Z",
    sections: [
      {
        id: "s1",
        title: "Fundamentals",
        description: null,
        steps: [
          {
            id: "t1",
            title: "Read the guide",
            note: null,
            url: null,
            isDone: true,
            doneAt: null,
            article: null,
          },
          {
            id: "t2",
            title: "Do the lab",
            note: null,
            url: null,
            isDone: false,
            doneAt: null,
            article: null,
          },
        ],
      },
    ],
    ...over,
  });

  it("shows the plan and the progress of its steps", async () => {
    const { container } = render(
      <StudyPlan list={detail()} onChange={vi.fn()} />,
    );
    expect(screen.getByText("Phần 1 · Fundamentals")).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Read the guide" }),
    ).toBeChecked();
    expect(
      screen.getByRole("progressbar", {
        name: "Tiến độ lộ trình: 1 trên 2 bước",
      }),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ticks a step and hands up what the server answers", async () => {
    const onChange = vi.fn();
    const next = detail({ doneStepCount: 2, progress: 100 });
    api.updateStep.mockResolvedValue(next);
    render(<StudyPlan list={detail()} onChange={onChange} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Do the lab" }));
    expect(api.updateStep).toHaveBeenCalledWith("t2", { isDone: true });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(next));
  });

  it("adds a part and a step, and moves a part down", async () => {
    const onChange = vi.fn();
    api.addSection.mockResolvedValue(detail());
    api.addStep.mockResolvedValue(detail());
    api.reorderSections.mockResolvedValue(detail());
    const two = detail({
      sections: [
        ...detail().sections,
        { id: "s2", title: "Practice", description: null, steps: [] },
      ],
    });
    render(<StudyPlan list={two} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText("Thêm phần mới"), "Mock exam");
    await userEvent.click(screen.getByRole("button", { name: "Thêm phần" }));
    expect(api.addSection).toHaveBeenCalledWith("l1", { title: "Mock exam" });

    // a step written by hand
    await userEvent.click(
      screen.getAllByRole("button", { name: "Tự ghi bước" })[0],
    );
    await userEvent.type(
      screen.getByLabelText("Tên bước mới trong phần 1"),
      "Review notes",
    );
    await userEvent.click(screen.getByRole("button", { name: "Thêm" }));
    expect(api.addStep).toHaveBeenCalledWith("s1", { title: "Review notes" });

    await userEvent.click(
      screen.getByRole("button", { name: "Chuyển phần “Fundamentals” xuống" }),
    );
    expect(api.reorderSections).toHaveBeenCalledWith("l1", ["s2", "s1"]);
  });

  const article = (over = {}) => ({
    id: "a1",
    slug: "hoc-react",
    title: "Học React từ đầu",
    status: "PUBLISHED" as const,
    readingMinutes: 7,
    publishedAt: "2026-11-03T08:00:00Z",
    ...over,
  });
  const withArticles = (...articles: ReturnType<typeof article>[]) =>
    detail({
      sections: [
        {
          id: "s1",
          title: "Fundamentals",
          description: null,
          steps: articles.map((item, i) => ({
            id: `t${i + 1}`,
            title: item.title,
            note: null,
            url: null,
            isDone: i === 0,
            doneAt: null,
            article: item,
          })),
        },
      ],
    });

  it("shows an article step as a link to the article, and ticks it with the box", async () => {
    api.updateStep.mockResolvedValue(withArticles(article()));
    const { container } = render(
      <StudyPlan
        list={withArticles(
          article(),
          article({ id: "a2", slug: "hooks", title: "Hooks" }),
        )}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Học React từ đầu" }),
    ).toHaveAttribute("href", "/articles/hoc-react");
    expect(screen.getAllByText("7 phút đọc")).toHaveLength(2);
    const box = screen.getByRole("checkbox", { name: "Đã học: Hooks" });
    await userEvent.click(box);
    expect(api.updateStep).toHaveBeenCalledWith("t2", { isDone: true });
    // the name of an article cannot be changed here: it is the article's
    expect(
      screen.queryByRole("button", { name: /Sửa bước “Hooks”/ }),
    ).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sends a draft to the editor and says it is a draft", () => {
    render(
      <StudyPlan
        list={withArticles(
          article({ id: "d1", status: "DRAFT", title: "Bài nháp" }),
        )}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "Bài nháp" })).toHaveAttribute(
      "href",
      "/write/d1",
    );
    expect(screen.getByText("Bản nháp")).toBeInTheDocument();
  });

  it("finds an article by name and adds it as a step", async () => {
    api.searchStudyArticles.mockResolvedValue([
      article(),
      article({
        id: "a3",
        slug: "nhap",
        title: "Bài của tôi",
        status: "DRAFT",
      }),
    ]);
    const next = withArticles(article());
    api.addStep.mockResolvedValue(next);
    const onChange = vi.fn();
    render(<StudyPlan list={detail()} onChange={onChange} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Thêm bài viết" }),
    );
    expect(await screen.findByText("Học React từ đầu")).toBeInTheDocument();
    // the learner's own draft can be chosen too
    expect(screen.getByText("Bản nháp")).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/Tìm bài viết để thêm vào phần 1/),
      "react",
    );
    await waitFor(() =>
      expect(api.searchStudyArticles).toHaveBeenLastCalledWith("react"),
    );

    await userEvent.click(
      (
        await screen.findAllByRole("button", {
          name: /^Thêm “Học React từ đầu”/,
        })
      )[0],
    );
    expect(api.addStep).toHaveBeenCalledWith("s1", { articleId: "a1" });
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(next));
  });

  it("lets an author write a new article for the part, which comes back to it", () => {
    render(<StudyPlan list={detail()} onChange={vi.fn()} />);
    expect(
      screen.getByRole("link", { name: "Tạo bài viết mới" }),
    ).toHaveAttribute("href", "/write/new?list=l1&section=s1");
  });

  it("does not offer to write to a reader, who could not", () => {
    auth.role = "USER";
    render(<StudyPlan list={detail()} onChange={vi.fn()} />);
    expect(screen.queryByRole("link", { name: "Tạo bài viết mới" })).toBeNull();
    // choosing an article that exists stays open to everyone
    expect(
      screen.getByRole("button", { name: "Thêm bài viết" }),
    ).toBeInTheDocument();
  });

  it("says when no article matches", async () => {
    api.searchStudyArticles.mockResolvedValue([]);
    render(<StudyPlan list={detail()} onChange={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Thêm bài viết" }),
    );
    expect(
      await screen.findByText("Không có bài viết nào khớp."),
    ).toBeInTheDocument();
  });

  it("shows an error from the server", async () => {
    api.updateStep.mockRejectedValue(new Error("Máy chủ bận"));
    render(<StudyPlan list={detail()} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Do the lab" }));
    expect(await screen.findByText("Máy chủ bận")).toBeInTheDocument();
  });
});
