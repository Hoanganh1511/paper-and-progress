import { render, screen, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { ProjectsCard } from "./ProjectsCard";

expect.extend(toHaveNoViolations);

const projects = [
  {
    id: "auth",
    label: "Auth & Security",
    entryCount: 3,
    doneCount: 1,
    inProgressCount: 2,
    progress: 40,
    lastEntryAt: "2026-10-27",
  },
  {
    id: "database",
    label: "Database",
    entryCount: 0,
    doneCount: 0,
    inProgressCount: 0,
    progress: 0,
    lastEntryAt: null,
  },
];

describe("ProjectsCard", () => {
  it("lists each project with its logs and a labelled progress bar", () => {
    render(<ProjectsCard projects={projects} />);
    const card = screen.getByRole("region", { name: "Dự án" });
    expect(within(card).getAllByRole("listitem")).toHaveLength(2);
    expect(within(card).getByText("3 log")).toBeInTheDocument();
    expect(
      within(card).getByRole("progressbar", {
        name: "Tiến độ Auth & Security",
      }),
    ).toHaveAttribute("aria-valuenow", "40");
    expect(
      within(card).getByRole("link", { name: "Xem nhật ký" }),
    ).toHaveAttribute("href", "/devlog");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<ProjectsCard projects={projects} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
