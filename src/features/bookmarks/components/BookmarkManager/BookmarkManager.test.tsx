import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { BOOKMARK_DRAG_TYPE } from "../FolderTree";
import type { Bookmark, BookmarkLibrary } from "../../types";
import { BookmarkManager } from "./BookmarkManager";

expect.extend(toHaveNoViolations);

const NOW = "2026-10-27T12:00:00.000Z";

function makeBookmark(
  index: number,
  overrides: Partial<Bookmark> = {},
): Bookmark {
  return {
    id: `b${index}`,
    title: `Bài học số ${index}`,
    description: "Mô tả",
    href: `/learn/${index}`,
    folderId: null,
    domain: "it",
    tags: ["React"],
    contentType: "text",
    level: "beginner",
    status: "not-started",
    progress: index,
    durationMinutes: 30,
    savedAt: new Date(Date.parse(NOW) - index * 3_600_000).toISOString(),
    ...overrides,
  };
}

function makeLibrary(count = 5): BookmarkLibrary {
  return {
    now: NOW,
    folders: [
      { id: "react", label: "React", parentId: null },
      { id: "aws", label: "AWS", parentId: null },
    ],
    bookmarks: Array.from({ length: count }, (_, i) =>
      makeBookmark(i + 1, {
        folderId: i === 0 ? "react" : null,
        title: i === 1 ? "Lambda và API Gateway" : `Bài học số ${i + 1}`,
        tags: i === 1 ? ["AWS"] : ["React"],
        domain: i === 1 ? "english" : "it",
      }),
    ),
  };
}

describe("BookmarkManager", () => {
  it("shows the bookmarks as cards with a count", () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getByText("5 / 5 bookmark")).toBeInTheDocument();
  });

  it("has a card with title link, folder, progress, level and saved time", () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    const card = screen.getAllByRole("article")[0];
    expect(
      within(card).getByRole("link", { name: "Bài học số 1" }),
    ).toHaveAttribute("href", "/learn/1");
    // "React" is both the folder and a tag.
    expect(within(card).getAllByText("React")).toHaveLength(2);
    expect(within(card).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(within(card).getByText("Cơ bản")).toBeInTheDocument();
    expect(within(card).getByText(/1 giờ trước/)).toBeInTheDocument();
  });

  it("filters instantly while typing and offers to clear when nothing matches", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    await userEvent.type(screen.getByRole("searchbox"), "lambda");
    expect(screen.getAllByRole("article")).toHaveLength(1);

    await userEvent.clear(screen.getByRole("searchbox"));
    await userEvent.type(screen.getByRole("searchbox"), "zzzz");
    expect(
      screen.getByRole("heading", { name: "Không tìm thấy bookmark phù hợp" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xoá filter" }));
    expect(screen.getAllByRole("article")).toHaveLength(5);
  });

  it("filters by a sidebar option and by folder", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    const sidebar = screen.getByRole("complementary", {
      name: "Thư mục và bộ lọc",
    });
    await userEvent.click(
      within(sidebar).getByRole("checkbox", { name: /Tiếng Anh/ }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    await userEvent.click(
      within(sidebar).getByRole("button", { name: "Xoá tất cả filter" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(5);

    await userEvent.click(
      within(sidebar).getByRole("button", { name: /^React Số bookmark/ }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("shows an empty state when there are no bookmarks at all", () => {
    render(<BookmarkManager library={{ ...makeLibrary(0), bookmarks: [] }} />);
    expect(
      screen.getByRole("heading", { name: "Chưa có bookmark nào" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Khám phá bài học" }),
    ).toHaveAttribute("href", "/learn");
  });

  it("splits long lists into pages", async () => {
    render(<BookmarkManager library={makeLibrary(14)} />);
    expect(screen.getAllByRole("article")).toHaveLength(12);
    await userEvent.click(screen.getByRole("button", { name: "Trang 2" }));
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("switches to a table whose headers sort", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Dạng danh sách" }),
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    const progressHeader = screen.getByRole("columnheader", {
      name: /Tiến độ/,
    });
    expect(progressHeader).toHaveAttribute("aria-sort", "none");
    await userEvent.click(within(progressHeader).getByRole("button"));
    expect(progressHeader).toHaveAttribute("aria-sort", "descending");
    const firstRow = screen.getAllByRole("row")[1];
    expect(within(firstRow).getByText("Bài học số 5")).toBeInTheDocument();
    await userEvent.click(within(progressHeader).getByRole("button"));
    expect(progressHeader).toHaveAttribute("aria-sort", "ascending");
  });

  it("sorts with the dropdown", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    await userEvent.click(screen.getByRole("combobox", { name: "Sắp xếp" }));
    await userEvent.click(screen.getByRole("option", { name: "Cũ nhất" }));
    const first = screen.getAllByRole("article")[0];
    expect(within(first).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Bài học số 5",
    );
  });

  it("swaps the toolbar for the bulk bar while bookmarks are ticked", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Chọn Bài học số 1" }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Chọn Lambda và API Gateway" }),
    );
    const bar = screen.getByRole("region", { name: "Thao tác hàng loạt" });
    expect(within(bar).getByText("Đã chọn 2")).toBeInTheDocument();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();

    await userEvent.click(within(bar).getByRole("button", { name: "Huỷ" }));
    expect(
      screen.queryByRole("region", { name: "Thao tác hàng loạt" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("deletes the selected bookmarks after confirming", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Chọn Bài học số 1" }),
    );
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Chọn Bài học số 3" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Xoá" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Xoá 2 bookmark?")).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Huỷ" }));
    expect(screen.getAllByRole("article")).toHaveLength(5);

    await userEvent.click(screen.getByRole("button", { name: "Xoá" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Xoá",
      }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.getByText("3 / 3 bookmark")).toBeInTheDocument();
  });

  it("moves a bookmark to a folder by dropping it on the folder", () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    const sidebar = screen.getByRole("complementary", {
      name: "Thư mục và bộ lọc",
    });
    const awsRow = within(sidebar).getByRole("button", {
      name: /^AWS Số bookmark/,
    }).parentElement as HTMLElement;
    expect(
      within(sidebar).getByRole("button", { name: /^AWS Số bookmark/ }),
    ).toHaveTextContent("0");

    const dataTransfer = {
      types: [BOOKMARK_DRAG_TYPE],
      getData: () => JSON.stringify(["b2", "b3"]),
      setData: () => {},
      dropEffect: "none",
    };
    fireEvent.dragOver(awsRow, { dataTransfer });
    fireEvent.drop(awsRow, { dataTransfer });

    expect(
      within(sidebar).getByRole("button", { name: /^AWS Số bookmark/ }),
    ).toHaveTextContent("2");
  });

  it("creates a folder and opens it", async () => {
    render(<BookmarkManager library={makeLibrary(5)} />);
    const sidebar = screen.getByRole("complementary", {
      name: "Thư mục và bộ lọc",
    });
    await userEvent.click(
      within(sidebar).getByRole("button", { name: "Tạo thư mục" }),
    );
    await userEvent.type(
      within(sidebar).getByLabelText("Tên thư mục mới"),
      "Grammar{Enter}",
    );
    expect(
      within(sidebar).getByRole("button", { name: /^Grammar/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(
      screen.getByRole("heading", { name: "Không tìm thấy bookmark phù hợp" }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations in either layout", async () => {
    const { container } = render(<BookmarkManager library={makeLibrary(5)} />);
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      screen.getByRole("button", { name: "Dạng danh sách" }),
    );
    expect(await axe(container)).toHaveNoViolations();
    // Two axe runs on a full grid take over the default 5s.
  }, 20_000);
});
