import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { computePeriodProgress, type DevlogEntry } from "@/features/devlog";
import { toLocalDateKey } from "@/features/learning-log";
import { GoalsCard } from "./GoalsCard";

expect.extend(toHaveNoViolations);

const entry = (
  slug: string,
  date: string,
  module: string,
  progress: number,
): DevlogEntry => ({
  slug,
  title: slug,
  date,
  tags: [],
  module,
  status: "in_progress",
  progress,
  body: [],
});

const entries = [
  entry("a", "2026-10-27", "auth", 40),
  entry("b", "2026-10-26", "auth", 25),
  entry("c", "2026-10-01", "design-system", 60),
  entry("d", "2026-09-01", "auth", 10),
];

const logRecord = (id: string, learningDate: string, minutes: number) => ({
  id,
  title: id,
  skillId: "programming",
  durationMinutes: minutes,
  learningDate,
  goal: "",
  notes: "",
  tags: [],
  referenceUrls: [],
  status: "completed",
  createdAt: `${learningDate}T08:00:00.000Z`,
  updatedAt: `${learningDate}T08:00:00.000Z`,
});

beforeEach(() => window.localStorage.clear());

describe("GoalsCard learning logs", () => {
  it("adds nothing when the visitor has no logs", () => {
    setup();
    expect(screen.queryByText(/Nhật ký học tập của bạn/)).toBeNull();
  });

  it("counts the visitor's own logs for the selected period", async () => {
    const today = toLocalDateKey();
    const longAgo = toLocalDateKey(new Date(Date.now() - 20 * 86_400_000));
    window.localStorage.setItem(
      "pp.learning-logs",
      JSON.stringify([
        logRecord("today", today, 30),
        logRecord("earlier", longAgo, 45),
      ]),
    );
    setup();

    // Week: only today's log. Month: both.
    const week = screen.getByRole("tabpanel");
    expect(week).toHaveTextContent("1 log · 30 phút trong 7 ngày qua");
    await userEvent.click(screen.getByRole("tab", { name: "Tháng" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "2 log · 75 phút trong 30 ngày qua",
    );
  });
});

function setup() {
  return render(
    <GoalsCard
      week={computePeriodProgress(entries, 7)}
      month={computePeriodProgress(entries, 30)}
    />,
  );
}

describe("GoalsCard", () => {
  it("opens on the week, with what each module gained and the mascot's words", () => {
    setup();
    const panel = screen.getByRole("tabpanel", { name: "Tuần" });
    // Auth went from 10% (before the week) to 40%.
    expect(within(panel).getByText("+30 điểm")).toBeInTheDocument();
    expect(
      within(panel).getByRole("progressbar", {
        name: "Tiến độ Auth & Security",
      }),
    ).toHaveAttribute("aria-valuenow", "40");
    expect(within(panel).getByRole("status")).toHaveTextContent(
      "Tuyệt vời! 2 entry và tiến thêm 30 điểm.",
    );
    expect(within(panel).getByText("27/10/2026")).toBeInTheDocument();
  });

  it("switches to the month", async () => {
    setup();
    await userEvent.click(screen.getByRole("tab", { name: "Tháng" }));
    const panel = screen.getByRole("tabpanel", { name: "Tháng" });
    expect(within(panel).getByRole("status")).toHaveTextContent("3 entry");
  });

  it("encourages a first entry when the period is empty", () => {
    render(
      <GoalsCard
        week={computePeriodProgress([], 7)}
        month={computePeriodProgress([], 30)}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Chưa có hoạt động nào trong kỳ này.",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container)).toHaveNoViolations();
  });
});
