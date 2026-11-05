import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { useState } from "react";
import { vi } from "vitest";
import type { EditableArticle } from "../types";

expect.extend(toHaveNoViolations);

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: null }),
}));

const study = vi.hoisted(() => ({
  addStep: vi.fn(),
  getStudyList: vi.fn(),
}));
vi.mock("@/features/study-lists", () => study);

const api = vi.hoisted(() => ({
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  publishArticle: vi.fn(),
  listTags: vi.fn(),
  listSeries: vi.fn(),
  uploadImage: vi.fn(),
  listRevisions: vi.fn(),
  restoreRevision: vi.fn(),
}));
vi.mock("../articlesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../articlesApi")>()),
  ...api,
}));

import { ArticleEditor } from "./ArticleEditor";
import { RevisionDiff, RevisionPanel } from "./RevisionPanel";
import { TagPicker } from "./TagPicker";

// ProseMirror measures text with Range rectangles, which jsdom cannot do.
beforeAll(() => {
  document.elementFromPoint = () => null;
  const rect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => ({}),
  };
  Range.prototype.getBoundingClientRect = () => rect as DOMRect;
  Range.prototype.getClientRects = () =>
    ({
      item: () => null,
      length: 0,
      [Symbol.iterator]: [][Symbol.iterator],
    }) as unknown as DOMRectList;
});

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/write/new");
  api.listTags.mockResolvedValue([
    { id: "t1", name: "NestJS", slug: "nestjs", articleCount: 2 },
  ]);
  api.listSeries.mockResolvedValue([]);
  api.listRevisions.mockResolvedValue([]);
});

describe("TagPicker", () => {
  function Harness({ initial = [] as string[] }) {
    const [tags, setTags] = useState(initial);
    return (
      <TagPicker
        value={tags}
        onChange={setTags}
        suggestions={["NestJS", "React"]}
      />
    );
  }

  it("adds a tag on Enter, ignores a repeat, offers existing tags and removes one", async () => {
    const { container } = render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Thêm chủ đề" });

    await userEvent.type(input, "Next{Enter}");
    expect(screen.getByText("Next")).toBeInTheDocument();
    await userEvent.type(input, "next{Enter}");
    expect(screen.getAllByText("Next")).toHaveLength(1);

    await userEvent.type(input, "nest");
    await userEvent.click(screen.getByRole("button", { name: "NestJS" }));
    expect(screen.getByText("NestJS")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Bỏ chủ đề Next" }),
    );
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("RevisionDiff", () => {
  it("shows what changed with signs, not only colour", () => {
    render(
      <RevisionDiff
        before={"Dòng một\nDòng cũ\nDòng ba"}
        after={"Dòng một\nDòng mới\nDòng ba"}
      />,
    );
    expect(screen.getByText("Dòng cũ").closest("li")).toHaveTextContent("Bỏ:");
    expect(screen.getByText("Dòng mới").closest("li")).toHaveTextContent(
      "Thêm:",
    );
  });

  it("says when nothing differs", () => {
    render(<RevisionDiff before="a" after="a" />);
    expect(screen.getByText("Giống hệt bản đang viết.")).toBeInTheDocument();
  });
});

describe("RevisionPanel", () => {
  it("restores a version only after confirming, then reports the article", async () => {
    api.listRevisions.mockResolvedValue([
      {
        id: "r1",
        title: "Bản cũ",
        contentText: "Nội dung cũ",
        createdAt: "2026-11-01T09:44:00.000Z",
      },
    ]);
    const restored = { id: "a1", title: "Bản cũ" } as EditableArticle;
    api.restoreRevision.mockResolvedValue(restored);
    const onRestored = vi.fn();
    render(
      <RevisionPanel
        articleId="a1"
        open
        onClose={vi.fn()}
        currentText="Nội dung mới"
        onRestored={onRestored}
      />,
    );
    await userEvent.click(
      await screen.findByRole("button", { name: /Bản cũ/ }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Khôi phục bản này" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(api.restoreRevision).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Khôi phục" }),
    );
    await waitFor(() =>
      expect(api.restoreRevision).toHaveBeenCalledWith("a1", "r1"),
    );
    expect(onRestored).toHaveBeenCalledWith(restored);
  });
});

// Typing into ProseMirror and running axe is slow when the whole suite runs in parallel.
vi.setConfig({ testTimeout: 20000 });

describe("ArticleEditor", () => {
  const write = async () => {
    await userEvent.type(
      screen.getByRole("textbox", { name: "Tiêu đề" }),
      "Bài đầu tiên",
    );
    const body = await screen.findByRole("textbox", {
      name: "Nội dung bài viết",
    });
    await userEvent.click(body);
    await userEvent.keyboard("Xin chào thế giới");
  };

  it("cannot save or publish before there is a title and some text", async () => {
    render(<ArticleEditor />);
    await screen.findByRole("textbox", { name: "Nội dung bài viết" });
    expect(screen.getByRole("button", { name: "Lưu nháp" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Xuất bản" })).toBeDisabled();
    expect(
      screen.getByText("Nhập tiêu đề và nội dung để bắt đầu"),
    ).toBeInTheDocument();
  });

  describe("tables", () => {
    const insertTable = async () => {
      render(<ArticleEditor />);
      const body = await screen.findByRole("textbox", {
        name: "Nội dung bài viết",
      });
      await userEvent.click(body);
      await userEvent.click(screen.getByRole("button", { name: "Chèn bảng" }));
      return body;
    };
    const tools = () => screen.getByRole("group", { name: "Chỉnh bảng" });
    const size = (text: string) =>
      expect(within(tools()).getByRole("status")).toHaveTextContent(text);
    const press = (name: string) =>
      userEvent.click(within(tools()).getByRole("button", { name }));

    it("has no table tools until the cursor is in a table", async () => {
      render(<ArticleEditor />);
      await screen.findByRole("textbox", { name: "Nội dung bài viết" });
      expect(screen.queryByRole("group", { name: "Chỉnh bảng" })).toBeNull();
    });

    it("adds and removes rows and columns of the table the cursor is in", async () => {
      const body = await insertTable();
      size("Bảng 3 hàng × 3 cột");
      expect(body.querySelectorAll("tr")).toHaveLength(3);

      await press("Thêm hàng phía dưới");
      size("Bảng 4 hàng × 3 cột");
      expect(body.querySelectorAll("tr")).toHaveLength(4);

      await press("Thêm hàng phía trên");
      size("Bảng 5 hàng × 3 cột");

      await press("Thêm cột bên phải");
      size("Bảng 5 hàng × 4 cột");
      expect(body.querySelectorAll("tr")[0].children).toHaveLength(4);

      await press("Thêm cột bên trái");
      size("Bảng 5 hàng × 5 cột");

      await press("Xoá hàng này");
      await press("Xoá hàng này");
      size("Bảng 3 hàng × 5 cột");
      await press("Xoá cột này");
      await press("Xoá cột này");
      size("Bảng 3 hàng × 3 cột");
    });

    it("turns the header row off and on", async () => {
      const body = await insertTable();
      expect(body.querySelectorAll("th").length).toBeGreaterThan(0);
      const toggle = within(tools()).getByRole("button", {
        name: "Hàng tiêu đề",
      });
      await userEvent.click(toggle);
      expect(body.querySelectorAll("th")).toHaveLength(0);
      await userEvent.click(toggle);
      expect(body.querySelectorAll("th").length).toBeGreaterThan(0);
    });

    it("deletes the whole table, and the tools go with it", async () => {
      const body = await insertTable();
      await press("Xoá cả bảng");
      expect(body.querySelector("table")).toBeNull();
      expect(screen.queryByRole("group", { name: "Chỉnh bảng" })).toBeNull();
    });

    it("floats over the table, outside the editor's own box, so nothing can cut it off", async () => {
      const body = await insertTable();
      const bar = tools();
      expect(body.contains(bar)).toBe(false);
      expect(bar).toHaveClass("fixed");
      // it has worked out where to go (over, under or held at the top of the screen)
      expect(["above", "below", "stuck"]).toContain(
        bar.getAttribute("data-placement"),
      );
    });

    it("goes away when you click out of the editor, so it is not left floating over the page", async () => {
      await insertTable();
      expect(
        screen.getByRole("group", { name: "Chỉnh bảng" }),
      ).toBeInTheDocument();
      await userEvent.click(screen.getByRole("textbox", { name: "Tiêu đề" }));
      expect(screen.queryByRole("group", { name: "Chỉnh bảng" })).toBeNull();
    });

    it("has no axe violations with the tools shown", async () => {
      await insertTable();
      expect(await axe(tools())).toHaveNoViolations();
    });
  });

  describe("blank lines", () => {
    it("saves a line left blank as an empty paragraph, and one with spaces as a paragraph of spaces", async () => {
      api.createArticle.mockResolvedValue({ id: "a1", slug: "x" });
      render(<ArticleEditor />);
      await userEvent.type(
        screen.getByRole("textbox", { name: "Tiêu đề" }),
        "Tiêu đề",
      );
      const body = await screen.findByRole("textbox", {
        name: "Nội dung bài viết",
      });
      await userEvent.click(body);
      await userEvent.keyboard(
        "first{Enter}{Enter}third{Enter}   {Enter}fifth{Enter}{Enter}{Enter}last",
      );
      await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
      await waitFor(() => expect(api.createArticle).toHaveBeenCalled());
      // every line the writer made is in what is saved, none swallowed
      expect(api.createArticle.mock.calls[0][0].contentHtml).toBe(
        "<p>first</p><p></p><p>third</p><p>   </p><p>fifth</p><p></p><p></p><p>last</p>",
      );
    });
  });

  describe("inline code beside other text", () => {
    const open = async (inTable: boolean) => {
      render(<ArticleEditor />);
      const body = await screen.findByRole("textbox", {
        name: "Nội dung bài viết",
      });
      await userEvent.click(body);
      if (inTable) {
        await userEvent.click(
          screen.getByRole("button", { name: "Chèn bảng" }),
        );
      }
      return body;
    };
    const cells = (body: HTMLElement) =>
      [...body.querySelectorAll("th, td")].map((cell) => cell.innerHTML);

    it("keeps writing beside `code` in the same table cell after pressing →", async () => {
      const body = await open(true);
      await userEvent.keyboard("`code`");
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("abc");
      const [first, second] = cells(body);
      // the text goes on in the cell the code is in, outside the code, not in the next cell
      expect(first).toContain("<code>code</code>");
      expect(first).toContain("abc");
      expect(first).not.toMatch(/<code>[^<]*abc/);
      expect(second).not.toContain("abc");
    });

    it("does the same when the code was switched on with the toolbar", async () => {
      const body = await open(true);
      await userEvent.click(
        screen.getByRole("button", { name: "Mã nội dòng" }),
      );
      await userEvent.keyboard("ab");
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("cd");
      const [first, second] = cells(body);
      expect(first).toContain("<code>ab</code>");
      expect(first).toContain("cd");
      expect(first).not.toMatch(/<code>[^<]*cd/);
      expect(second).not.toContain("cd");
    });

    it("moves to the next cell with → once it is out of the code", async () => {
      const body = await open(true);
      await userEvent.keyboard("`code`");
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("next");
      const [first, second] = cells(body);
      expect(first).not.toContain("next");
      expect(second).toContain("next");
    });

    it("leaves a paragraph as it was", async () => {
      const body = await open(false);
      await userEvent.keyboard("`code`");
      await userEvent.keyboard("{ArrowRight}");
      await userEvent.keyboard("abc");
      expect(body.querySelector("p")?.innerHTML).toMatch(
        /<code>code<\/code>.*abc/,
      );
    });
  });

  describe("written for a part of a study list", () => {
    const target = { listId: "l1", sectionId: "s1" };
    beforeEach(() => {
      study.getStudyList.mockResolvedValue({
        id: "l1",
        title: "Ôn thi AWS",
        sections: [{ id: "s1", title: "Fundamentals", steps: [] }],
      });
    });

    it("says where the article will go, and adds it as a step once it is first saved", async () => {
      api.createArticle.mockResolvedValue({ id: "a1", slug: "bai-dau-tien" });
      study.addStep.mockResolvedValue({});
      render(<ArticleEditor addToSection={target} />);
      expect(
        await screen.findByText(
          /sẽ được thêm vào phần “Fundamentals” của danh sách “Ôn thi AWS”/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Về danh sách học" }),
      ).toHaveAttribute("href", "/study-lists/l1");
      await write();

      await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
      await waitFor(() =>
        expect(study.addStep).toHaveBeenCalledWith("s1", { articleId: "a1" }),
      );
      expect(
        await screen.findByText(/Đã thêm bài này vào phần/),
      ).toBeInTheDocument();

      // it goes in once, when the article is created
      expect(study.addStep).toHaveBeenCalledTimes(1);
    });

    it("keeps the article and says so when it could not be added", async () => {
      api.createArticle.mockResolvedValue({ id: "a1", slug: "bai-dau-tien" });
      study.addStep.mockRejectedValue(new Error("Máy chủ bận"));
      render(<ArticleEditor addToSection={target} />);
      await write();
      await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
      expect(
        await screen.findByText(
          /Đã lưu bài, nhưng chưa thêm được vào danh sách học/,
        ),
      ).toBeInTheDocument();
      expect(window.location.pathname).toBe("/write/a1");
    });
  });

  it("creates the article on the first save, then publishes it", async () => {
    api.createArticle.mockResolvedValue({ id: "a1", slug: "bai-dau-tien" });
    api.publishArticle.mockResolvedValue({
      id: "a1",
      slug: "bai-dau-tien",
      status: "PUBLISHED",
    });
    const { container } = render(<ArticleEditor />);
    await write();

    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(api.createArticle).toHaveBeenCalledTimes(1));
    const input = api.createArticle.mock.calls[0][0];
    expect(input).toMatchObject({
      title: "Bài đầu tiên",
      visibility: "PUBLIC",
      tags: [],
      seriesId: null,
    });
    expect(input.contentHtml).toContain("Xin chào thế giới");
    expect(input.slug).toBeUndefined(); // the server makes it from the title
    expect(window.location.pathname).toBe("/write/a1");

    await userEvent.click(screen.getByRole("button", { name: "Xuất bản" }));
    await waitFor(() =>
      expect(api.publishArticle).toHaveBeenCalledWith("a1", undefined),
    );
    expect(await screen.findByText(/Đã đăng bài viết/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem bài" })).toHaveAttribute(
      "href",
      "/articles/bai-dau-tien",
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("updates, not creates, once the article exists", async () => {
    api.createArticle.mockResolvedValue({ id: "a1", slug: "bai-dau-tien" });
    api.updateArticle.mockResolvedValue({
      id: "a1",
      slug: "bai-dau-tien",
      status: "DRAFT",
    });
    render(<ArticleEditor />);
    await write();
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(api.createArticle).toHaveBeenCalledTimes(1));

    await userEvent.type(
      screen.getByRole("textbox", { name: "Tiêu đề" }),
      " 2",
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(api.updateArticle).toHaveBeenCalledTimes(1));
    expect(api.createArticle).toHaveBeenCalledTimes(1);
    expect(api.updateArticle.mock.calls[0][0]).toBe("a1");
    expect(api.updateArticle.mock.calls[0][1].title).toBe("Bài đầu tiên 2");
    // A manual save is a revision of its own, never merged like an auto-save.
    expect(api.updateArticle.mock.calls[0][1].isAutosave).toBe(false);
  });

  it("sends the version it holds, and asks before overwriting a newer one", async () => {
    const { ArticlesApiError } = await vi.importActual<
      typeof import("../articlesApi")
    >("../articlesApi");
    api.createArticle.mockResolvedValue({
      id: "a1",
      slug: "bai-dau-tien",
      version: "v1",
    });
    api.updateArticle
      .mockRejectedValueOnce(
        new ArticlesApiError("Bài đã đổi ở nơi khác", 409, "ARTICLE_CONFLICT"),
      )
      .mockResolvedValue({
        id: "a1",
        slug: "bai-dau-tien",
        status: "DRAFT",
        version: "v3",
      });
    render(<ArticleEditor />);
    await write();
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(api.createArticle).toHaveBeenCalledTimes(1));

    await userEvent.type(
      screen.getByRole("textbox", { name: "Tiêu đề" }),
      " 2",
    );
    await userEvent.click(screen.getByRole("button", { name: "Lưu nháp" }));
    await waitFor(() => expect(api.updateArticle).toHaveBeenCalledTimes(1));
    expect(api.updateArticle.mock.calls[0][1].baseVersion).toBe("v1");
    expect(api.updateArticle.mock.calls[0][1].force).toBeUndefined();
    expect(
      await screen.findByText("Bài viết đã được sửa ở nơi khác"),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Giữ bản của tôi/ }),
    );
    await waitFor(() => expect(api.updateArticle).toHaveBeenCalledTimes(2));
    expect(api.updateArticle.mock.calls[1][1].force).toBe(true);
    await waitFor(() =>
      expect(
        screen.queryByText("Bài viết đã được sửa ở nơi khác"),
      ).not.toBeInTheDocument(),
    );
  });

  it("shows the server's message when publishing fails", async () => {
    api.createArticle.mockResolvedValue({ id: "a1", slug: "x" });
    api.publishArticle.mockRejectedValue(new Error("Bạn không có quyền"));
    render(<ArticleEditor />);
    await write();
    await userEvent.click(screen.getByRole("button", { name: "Xuất bản" }));
    expect(await screen.findByText("Bạn không có quyền")).toBeInTheDocument();
  });

  it("refuses an oversized image before any request, with a clear message", async () => {
    render(<ArticleEditor />);
    await screen.findByRole("textbox", { name: "Nội dung bài viết" });
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "lon.png", {
      type: "image/png",
    });
    await userEvent.upload(screen.getByLabelText("Chọn ảnh để chèn"), big);
    expect(
      await screen.findByText("lon.png: Ảnh quá lớn (tối đa 5MB)."),
    ).toBeInTheDocument();
    expect(api.uploadImage).not.toHaveBeenCalled();
  });

  it("opens an existing article without marking it as changed", async () => {
    const article = {
      id: "a9",
      slug: "co-san",
      title: "Bài có sẵn",
      excerpt: "Tóm tắt",
      coverImageUrl: null,
      status: "PUBLISHED",
      visibility: "PREVIEW",
      tags: [{ name: "NestJS", slug: "nestjs" }],
      contentJson: {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Đã có chữ" }] },
        ],
      },
      contentHtml: "<p>Đã có chữ</p>",
      seriesId: null,
      seriesOrder: null,
    } as unknown as EditableArticle;
    render(<ArticleEditor initial={article} />);
    expect(await screen.findByDisplayValue("Bài có sẵn")).toBeInTheDocument();
    expect(await screen.findByText("Đã có chữ")).toBeInTheDocument();
    expect(screen.getByText("Đã đăng")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cập nhật" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Chưa lưu")).toBeInTheDocument();
    // nothing was sent: it only saves after a change
    expect(api.updateArticle).not.toHaveBeenCalled();
  });
});
