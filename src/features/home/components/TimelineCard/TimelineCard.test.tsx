import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { DevlogEntry } from "@/features/devlog";
import { TimelineCard } from "./TimelineCard";

expect.extend(toHaveNoViolations);

const entry = (slug: string, date: string): DevlogEntry => ({
  slug,
  title: `Entry ${slug}`,
  date,
  tags: [],
  module: "auth",
  status: "in_progress",
  progress: 30,
  body: [{ type: "paragraph", text: "Done." }],
});

const entries = [entry("a", "2026-10-27"), entry("b", "2026-10-25")];

beforeEach(() => window.localStorage.clear());

async function writeLog(titleText: string) {
  await userEvent.click(screen.getByRole("button", { name: "Viết thêm Log" }));
  const dialog = screen.getByRole("dialog", { name: "Viết thêm Log" });
  await userEvent.type(
    within(dialog).getByLabelText(/Tiêu đề buổi học/),
    titleText,
  );
  await userEvent.selectOptions(
    within(dialog).getByLabelText(/Kỹ năng chính/),
    "programming",
  );
  await userEvent.click(
    within(dialog).getByRole("button", { name: "Lưu log" }),
  );
}

describe("TimelineCard learning logs", () => {
  it("opens the composer from the primary button", async () => {
    render(<TimelineCard entries={entries} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Viết thêm Log" }),
    );
    expect(screen.getByRole("dialog", { name: "Viết thêm Log" })).toBeVisible();
  });

  it("shows a saved log at once, on its own day, with a confirmation", async () => {
    render(<TimelineCard entries={entries} />);
    await writeLog("React cơ bản");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã lưu log “React cơ bản”.",
    );
    const list = screen.getByRole("list", { name: "Nhật ký học tập của bạn" });
    expect(within(list).getByText("React cơ bản")).toBeInTheDocument();
    // The timeline jumped to today (the log's day), so the older devlog entry is not listed.
    expect(screen.queryByText("Entry a")).not.toBeInTheDocument();
    expect(screen.getByText(/· 1 mục/)).toBeInTheDocument();
    // Focus goes back to the button that opened the dialog.
    expect(screen.getByRole("button", { name: "Viết thêm Log" })).toHaveFocus();
  });

  it("opens a log's detail and deletes it after confirming", async () => {
    render(<TimelineCard entries={entries} />);
    await writeLog("React cơ bản");
    await userEvent.click(
      await screen.findByRole("button", { name: /React cơ bản/ }),
    );
    const detail = screen.getByRole("dialog", { name: "React cơ bản" });
    expect(within(detail).getByText(/Lập trình/)).toBeInTheDocument();

    await userEvent.click(
      within(detail).getByRole("button", { name: "Xoá log" }),
    );
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Xoá",
      }),
    );
    expect(screen.queryByText("React cơ bản")).not.toBeInTheDocument();
    expect(
      JSON.parse(window.localStorage.getItem("pp.learning-logs")!),
    ).toEqual([]);
  });

  it("lets the visitor pick another day and go back to the newest", async () => {
    render(<TimelineCard entries={entries} />);
    const date = screen.getByLabelText("Chọn ngày xem nhật ký");
    expect(date).toHaveValue("2026-10-27");

    fireEvent.change(date, { target: { value: "2026-10-25" } });
    expect(screen.getByText("Entry b")).toBeInTheDocument();
    expect(screen.queryByText("Entry a")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Về ngày mới nhất" }),
    );
    expect(screen.getByText("Entry a")).toBeInTheDocument();
  });

  it("says so when a day has nothing", async () => {
    render(<TimelineCard entries={entries} />);
    const date = screen.getByLabelText("Chọn ngày xem nhật ký");
    fireEvent.change(date, { target: { value: "2026-01-01" } });
    expect(
      screen.getByText("Chưa có hoạt động nào được ghi lại."),
    ).toBeInTheDocument();
  });
});

describe("TimelineCard", () => {
  it("shows only the newest day as a timeline with a progress bar per entry", () => {
    render(<TimelineCard entries={entries} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nhật ký trong ngày" }),
    ).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Hoạt động trong ngày" });
    expect(within(list).getAllByRole("link")).toHaveLength(1);
    expect(within(list).getByText("30% hoàn thành")).toBeInTheDocument();
    expect(screen.queryByText("Entry b")).not.toBeInTheDocument();
  });

  it("keeps the two buttons below the list, outside the moving part", () => {
    render(<TimelineCard entries={entries} />);
    const region = screen.getByRole("region", { name: "Hoạt động trong ngày" });
    const all = screen.getByRole("link", { name: "Xem toàn bộ nhật ký" });
    const rss = screen.getByRole("link", { name: "RSS" });
    expect(all).toHaveAttribute("href", "/devlog");
    expect(rss).toHaveAttribute("href", "/devlog/feed.xml");
    expect(region).not.toContainElement(all);
    expect(
      region.compareDocumentPosition(all) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("offers no pause button while the list fits and does not move", () => {
    render(<TimelineCard entries={entries} />);
    expect(
      screen.queryByRole("button", { name: /cuộn/ }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TimelineCard entries={entries} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
