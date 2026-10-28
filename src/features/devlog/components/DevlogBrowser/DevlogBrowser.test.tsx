import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type { DevlogEntry } from "../../types";
import { DevlogBrowser } from "./DevlogBrowser";
import { DevlogPreview } from "../DevlogPreview";

expect.extend(toHaveNoViolations);

let search = "";
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

const entries: DevlogEntry[] = [
  {
    slug: "2026-10-27-auth",
    title: "Auth System — Phase 1",
    date: "2026-10-27",
    tags: ["security", "backend"],
    module: "auth",
    status: "in_progress",
    progress: 15,
    phase: "1/6",
    body: [
      { type: "paragraph", text: "Hoàn thành JWT." },
      { type: "code", language: "ts", code: "const a = 1;" },
    ],
  },
  {
    slug: "2026-10-25-text",
    title: "Text Primitive — Done",
    date: "2026-10-25",
    tags: ["design-system", "frontend"],
    module: "design-system",
    status: "done",
    progress: 20,
    body: [{ type: "paragraph", text: "13 tests pass." }],
  },
];

describe("DevlogBrowser", () => {
  beforeEach(() => {
    search = "";
    window.history.replaceState(null, "", "/");
    localStorage.clear();
  });

  it("lists entries newest first under their day and opens the newest", () => {
    render(<DevlogBrowser entries={entries} />);
    const timeline = screen.getByRole("region", { name: "Dòng thời gian" });

    const days = within(timeline).getAllByText(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(days.map((day) => day.textContent)).toEqual([
      "27/10/2026",
      "25/10/2026",
    ]);
    const first = within(timeline).getByRole("button", {
      name: /Auth System — Phase 1/,
    });
    expect(first).toHaveAttribute("aria-current", "true");
    expect(within(first).getByText("Đang làm")).toBeInTheDocument();
    expect(within(first).getByText("Hoàn thành JWT.")).toBeInTheDocument();
    expect(within(first).getByText("15% hoàn thành")).toBeInTheDocument();

    const detail = screen.getByRole("region", { name: "Chi tiết entry" });
    expect(
      within(detail).getByRole("heading", {
        level: 2,
        name: "Auth System — Phase 1",
      }),
    ).toBeInTheDocument();
    expect(within(detail).getByText("#security")).toBeInTheDocument();
    expect(within(detail).getByText(/Phase 1\/6/)).toBeInTheDocument();
    expect(within(detail).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "15",
    );
    expect(within(detail).getByText("const a = 1;")).toBeInTheDocument();
  });

  it("shows the entry named in the URL", () => {
    search = "entry=2026-10-25-text";
    render(<DevlogBrowser entries={entries} />);
    const detail = screen.getByRole("region", { name: "Chi tiết entry" });
    expect(
      within(detail).getByRole("heading", {
        level: 2,
        name: "Text Primitive — Done",
      }),
    ).toBeInTheDocument();
  });

  it("selecting an entry swaps the detail panel and updates the URL", async () => {
    render(<DevlogBrowser entries={entries} />);
    await userEvent.click(
      screen.getByRole("button", { name: /Text Primitive — Done/ }),
    );

    const detail = screen.getByRole("region", { name: "Chi tiết entry" });
    expect(within(detail).getByRole("heading", { level: 2 })).toHaveTextContent(
      "Text Primitive — Done",
    );
    expect(
      screen.getByRole("button", { name: /Text Primitive — Done/ }),
    ).toHaveAttribute("aria-current", "true");
    expect(window.location.search).toBe("?entry=2026-10-25-text");
  });

  it("keeps the search and all filters on one row", () => {
    render(<DevlogBrowser entries={entries} />);
    const row = screen.getByRole("group", { name: "Bộ lọc nhật ký" });
    expect(
      within(row).getByRole("searchbox", { name: "Tìm trong nhật ký" }),
    ).toBeInTheDocument();
    ["Trạng thái", "Tag"].forEach((name) =>
      expect(within(row).getByRole("button", { name })).toBeInTheDocument(),
    );
  });

  it("filters by several options from a menu that stays open, with chips to clear", async () => {
    render(<DevlogBrowser entries={entries} />);
    await userEvent.click(screen.getByRole("button", { name: "Tag" }));
    const menu = screen.getByRole("menu", { name: /Tag/ });

    await userEvent.click(
      within(menu).getByRole("menuitemcheckbox", { name: /#security/ }),
    );
    expect(screen.getByText("1 / 2 entry")).toBeInTheDocument();
    expect(screen.getByRole("menu", { name: /Tag/ })).toBeInTheDocument();
    expect(
      within(menu).getByRole("menuitemcheckbox", { name: /#security/ }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.queryByRole("button", { name: /Text Primitive — Done/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Bỏ lọc #security" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tag, 1 đã chọn" }),
    ).toBeInTheDocument();

    await userEvent.click(
      within(menu).getByRole("menuitemcheckbox", { name: /#frontend/ }),
    );
    expect(screen.getByText("2 / 2 entry")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Xoá tất cả" }));
    expect(screen.getByText("2 / 2 entry")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Bỏ lọc/ }),
    ).not.toBeInTheDocument();
  });

  describe("projects column", () => {
    const projects = () => screen.getByRole("region", { name: "Các dự án" });

    it("lists each project with its logs, status counts, progress and latest log", () => {
      render(<DevlogBrowser entries={entries} />);
      expect(
        within(projects()).getByText("4 dự án · 2 log"),
      ).toBeInTheDocument();

      const auth = within(projects()).getByRole("button", {
        name: /Auth & Security/,
      });
      expect(auth).toHaveTextContent("1 log · 0 hoàn thành · 1 đang làm");
      expect(auth).toHaveTextContent("15% hoàn thành");
      expect(auth).toHaveTextContent("Gần nhất 27/10/2026");
      expect(
        within(projects()).getByRole("button", { name: /Database/ }),
      ).toHaveTextContent("Chưa có log");
      expect(
        within(projects()).getByRole("button", { name: /Tất cả dự án/ }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("narrows the timeline to the chosen project, and back with a second click", async () => {
      render(<DevlogBrowser entries={entries} />);
      const auth = within(projects()).getByRole("button", {
        name: /Auth & Security/,
      });

      await userEvent.click(auth);
      expect(auth).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText("1 / 2 entry")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Bỏ lọc Auth & Security" }),
      ).toBeInTheDocument();

      await userEvent.click(auth);
      expect(screen.getByText("2 / 2 entry")).toBeInTheDocument();
    });

    it("shows a search icon, not an input, until the icon is clicked", async () => {
      render(<DevlogBrowser entries={entries} />);
      expect(
        screen.queryByRole("searchbox", { name: "Từ khoá dự án" }),
      ).not.toBeInTheDocument();
      const icon = within(projects()).getByRole("button", {
        name: "Tìm dự án",
      });
      expect(icon).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(icon);
      const input = screen.getByRole("searchbox", { name: "Từ khoá dự án" });
      expect(input).toHaveFocus();
      expect(icon).toHaveAttribute("aria-expanded", "true");

      await userEvent.type(input, "data");
      expect(
        within(projects()).queryByRole("button", { name: /Auth & Security/ }),
      ).not.toBeInTheDocument();

      // Escape closes the box and clears the words, so the list is whole again.
      await userEvent.keyboard("{Escape}");
      expect(
        screen.queryByRole("searchbox", { name: "Từ khoá dự án" }),
      ).not.toBeInTheDocument();
      expect(icon).toHaveFocus();
      expect(
        within(projects()).getByRole("button", { name: /Auth & Security/ }),
      ).toBeInTheDocument();
    });

    it("searches projects", async () => {
      render(<DevlogBrowser entries={entries} />);
      await userEvent.click(
        within(projects()).getByRole("button", { name: "Tìm dự án" }),
      );
      await userEvent.type(
        screen.getByRole("searchbox", { name: "Từ khoá dự án" }),
        "data",
      );
      expect(
        within(projects()).getByRole("button", { name: /Database/ }),
      ).toBeInTheDocument();
      expect(
        within(projects()).queryByRole("button", { name: /Auth & Security/ }),
      ).not.toBeInTheDocument();

      await userEvent.type(
        screen.getByRole("searchbox", { name: "Từ khoá dự án" }),
        "zzz",
      );
      expect(
        screen.getByRole("heading", { name: "Không có dự án phù hợp" }),
      ).toBeInTheDocument();
    });

    it("creates a project, selects it and keeps it after a reload", async () => {
      const { unmount } = render(<DevlogBrowser entries={entries} />);
      await userEvent.click(screen.getByRole("button", { name: "Dự án mới" }));
      const dialog = screen.getByRole("dialog", { name: "Dự án mới" });
      const nameField = () =>
        within(dialog).getByRole("textbox", { name: /Tên dự án/ });
      const submit = () =>
        within(dialog).getByRole("button", { name: "Tạo dự án" });

      await userEvent.click(submit());
      expect(within(dialog).getByText("Nhập tên dự án.")).toBeInTheDocument();

      await userEvent.type(nameField(), "auth & security");
      await userEvent.click(submit());
      expect(
        within(dialog).getByText("Đã có dự án trùng tên."),
      ).toBeInTheDocument();

      await userEvent.clear(nameField());
      await userEvent.type(nameField(), "Blog cá nhân");
      await userEvent.click(submit());

      expect(
        screen.queryByRole("dialog", { name: "Dự án mới" }),
      ).not.toBeInTheDocument();
      const created = within(projects()).getByRole("button", {
        name: /Blog cá nhân/,
      });
      expect(created).toHaveAttribute("aria-pressed", "true");
      expect(created).toHaveTextContent("0 log");
      expect(
        screen.getByRole("heading", { name: "Không có entry phù hợp" }),
      ).toBeInTheDocument();
      expect(
        within(projects()).getByText("5 dự án · 2 log"),
      ).toBeInTheDocument();

      unmount();
      render(<DevlogBrowser entries={entries} />);
      expect(
        within(projects()).getByRole("button", { name: /Blog cá nhân/ }),
      ).toBeInTheDocument();
    });
  });

  it("searches, and offers to clear when nothing matches", async () => {
    render(<DevlogBrowser entries={entries} />);
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Tìm trong nhật ký" }),
      "jwt",
    );
    expect(screen.getByText("1 / 2 entry")).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("searchbox", { name: "Tìm trong nhật ký" }),
      "zzz",
    );
    expect(
      screen.getByRole("heading", { name: "Không có entry phù hợp" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/jwtzzz/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Bỏ lọc" }));
    expect(screen.getByText("2 / 2 entry")).toBeInTheDocument();
  });

  it("the breadcrumb's module step narrows the timeline to that module", async () => {
    render(<DevlogBrowser entries={entries} />);
    const detail = screen.getByRole("region", { name: "Chi tiết entry" });
    await userEvent.click(
      within(detail).getByRole("button", { name: "Auth & Security" }),
    );
    expect(screen.getByText("1 / 2 entry")).toBeInTheDocument();
  });

  it("shows a start message without entries", () => {
    render(<DevlogBrowser entries={[]} />);
    expect(
      screen.getByRole("heading", {
        name: "Hành trình của bạn bắt đầu từ đây",
      }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DevlogBrowser entries={entries} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DevlogPreview", () => {
  it("shows the newest day's entries as a timeline of links", () => {
    const sameDay: DevlogEntry = {
      ...entries[0],
      slug: "2026-10-27-db",
      title: "Database — Schema",
      module: "database",
    };
    render(<DevlogPreview entries={[sameDay, ...entries]} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Nhật ký trong ngày" }),
    ).toBeInTheDocument();
    expect(screen.getByText("27/10/2026")).toHaveAttribute(
      "datetime",
      "2026-10-27",
    );
    const list = screen.getByRole("list", { name: "Hoạt động trong ngày" });
    const links = within(list).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/devlog?entry=2026-10-27-db");
    expect(links[1]).toHaveAttribute("href", "/devlog?entry=2026-10-27-auth");
    expect(screen.queryByText(/Text Primitive/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem toàn bộ nhật ký" }),
    ).toHaveAttribute("href", "/devlog");
    expect(screen.getByRole("link", { name: "RSS" })).toHaveAttribute(
      "href",
      "/devlog/feed.xml",
    );
  });

  it("shows a start message without entries", () => {
    render(<DevlogPreview entries={[]} />);
    expect(
      screen.getByRole("heading", {
        name: "Hành trình của bạn bắt đầu từ đây",
      }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DevlogPreview entries={entries} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
