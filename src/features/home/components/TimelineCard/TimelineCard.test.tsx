import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { TimelineCard } from "./TimelineCard";

expect.extend(toHaveNoViolations);

const seedLog = (id: string, title: string, learningDate: string) => ({
  id,
  title,
  learningDate,
  createdAt: `${learningDate}T08:00:00.000Z`,
  skillId: "programming",
  status: "completed",
  tags: [],
  referenceUrls: [],
});

function seed() {
  window.localStorage.setItem(
    "pp.learning-logs",
    JSON.stringify([
      seedLog("a", "Log A", "2026-10-27"),
      seedLog("b", "Log B", "2026-10-25"),
    ]),
  );
}

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
    render(<TimelineCard />);
    await userEvent.click(
      screen.getByRole("button", { name: "Viết thêm Log" }),
    );
    expect(screen.getByRole("dialog", { name: "Viết thêm Log" })).toBeVisible();
  });

  it("shows a saved log at once, on its own day, with a confirmation", async () => {
    render(<TimelineCard />);
    await writeLog("React cơ bản");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã lưu log “React cơ bản”.",
    );
    const list = screen.getByRole("list", { name: "Nhật ký học tập của bạn" });
    expect(within(list).getByText("React cơ bản")).toBeInTheDocument();
    expect(screen.getByText(/· 1 mục/)).toBeInTheDocument();
    // Focus goes back to the button that opened the dialog.
    expect(screen.getByRole("button", { name: "Viết thêm Log" })).toHaveFocus();
  });

  it("opens a log's detail and deletes it after confirming", async () => {
    render(<TimelineCard />);
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
    seed();
    render(<TimelineCard />);
    const date = screen.getByRole("button", { name: "Chọn ngày xem nhật ký" });
    expect(date).toHaveTextContent("27/10/2026");
    expect(screen.getByText("Log A")).toBeInTheDocument();

    await userEvent.click(date);
    await userEvent.click(screen.getByRole("button", { name: "25/10/2026" }));
    expect(screen.getByText("Log B")).toBeInTheDocument();
    expect(screen.queryByText("Log A")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Về ngày mới nhất" }),
    );
    expect(screen.getByText("Log A")).toBeInTheDocument();
  });

  it("says so when a day has nothing", async () => {
    seed();
    render(<TimelineCard />);
    await userEvent.click(
      screen.getByRole("button", { name: "Chọn ngày xem nhật ký" }),
    );
    // 1 October 2026: a day in the same month with nothing on it.
    await userEvent.click(screen.getByRole("button", { name: "01/10/2026" }));
    expect(
      screen.getByText("Chưa có hoạt động nào được ghi lại."),
    ).toBeInTheDocument();
  });
});

describe("TimelineCard", () => {
  it("shows only the newest day's logs under the heading", () => {
    seed();
    render(<TimelineCard />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nhật ký trong ngày" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Log A")).toBeInTheDocument();
    expect(screen.queryByText("Log B")).not.toBeInTheDocument();
  });

  it("keeps the button below the list, outside the moving part", () => {
    render(<TimelineCard />);
    const region = screen.getByRole("region", { name: "Hoạt động trong ngày" });
    const write = screen.getByRole("button", { name: "Viết thêm Log" });
    expect(region).not.toContainElement(write);
    expect(
      region.compareDocumentPosition(write) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("offers no pause button while the list fits and does not move", () => {
    render(<TimelineCard />);
    expect(
      screen.queryByRole("button", { name: /cuộn/ }),
    ).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<TimelineCard />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
