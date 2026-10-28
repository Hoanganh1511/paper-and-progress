import { render, screen, within } from "@testing-library/react";
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
