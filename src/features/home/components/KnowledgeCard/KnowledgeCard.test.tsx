import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import type { Bookmark } from "@/features/bookmarks";
import { KnowledgeCard } from "./KnowledgeCard";

expect.extend(toHaveNoViolations);

const bookmark = (id: string, savedAt: string, tags: string[]): Bookmark => ({
  id,
  title: `Lesson ${id}`,
  description: "",
  href: `/lessons/${id}`,
  folderId: null,
  domain: "it",
  tags,
  contentType: "text",
  level: "beginner",
  status: "not-started",
  progress: 0,
  durationMinutes: 10,
  savedAt,
});

const bookmarks = [
  bookmark("old", "2026-10-01T08:00:00.000Z", ["react"]),
  bookmark("new", "2026-10-27T08:00:00.000Z", ["a", "b", "c", "d"]),
  bookmark("mid", "2026-10-15T08:00:00.000Z", []),
];

describe("KnowledgeCard", () => {
  it("shows the newest saved lessons first, with tags and the saved day", () => {
    render(<KnowledgeCard bookmarks={bookmarks} limit={2} />);
    const card = screen.getByRole("region", { name: "Kiến thức" });
    const links = within(card)
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/lessons"));
    expect(links.map((link) => link.textContent)).toEqual([
      "Lesson new",
      "Lesson mid",
    ]);
    expect(within(card).getByText("27/10/2026")).toHaveAttribute(
      "datetime",
      "2026-10-27T08:00:00.000Z",
    );
    // Only the first three tags are shown.
    expect(within(card).getByText("#c")).toBeInTheDocument();
    expect(within(card).queryByText("#d")).not.toBeInTheDocument();
  });

  it("says so when nothing is saved", () => {
    render(<KnowledgeCard bookmarks={[]} />);
    expect(
      screen.getByText("Chưa có bài học nào được lưu."),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<KnowledgeCard bookmarks={bookmarks} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
