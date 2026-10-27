import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { computeProjectStatus } from "../../status";
import type { DevlogEntry } from "../../types";
import { DevlogBrowser } from "./DevlogBrowser";
import { DevlogPreview } from "../DevlogPreview";

expect.extend(toHaveNoViolations);

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

const status = computeProjectStatus(entries);

describe("DevlogBrowser", () => {
  it("shows entries newest first with date, status, tags and progress", () => {
    render(<DevlogBrowser entries={entries} status={status} />);
    const items = screen.getAllByRole("article");
    expect(items).toHaveLength(2);

    const first = items[0];
    expect(
      within(first).getByRole("heading", { name: "Auth System — Phase 1" }),
    ).toBeInTheDocument();
    expect(within(first).getByText("27/10/2026")).toHaveAttribute(
      "datetime",
      "2026-10-27",
    );
    expect(within(first).getByText("Đang làm")).toBeInTheDocument();
    expect(within(first).getByText("#security")).toBeInTheDocument();
    expect(within(first).getByText(/Phase 1\/6/)).toBeInTheDocument();
    expect(within(first).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "15",
    );
    expect(first).toHaveAttribute("id", "2026-10-27-auth");
    expect(within(items[1]).getByText("Hoàn thành")).toBeInTheDocument();
  });

  it("shows the project overview", () => {
    render(<DevlogBrowser entries={entries} status={status} />);
    const overview = screen.getByRole("region", { name: "Tổng quan dự án" });
    expect(within(overview).getByText("Design System")).toBeInTheDocument();
    expect(within(overview).getByText("Tổng thể")).toBeInTheDocument();
    expect(within(overview).getByText("1 ngày")).toBeInTheDocument();
    expect(within(overview).getByText("25/10/2026")).toBeInTheDocument();
  });

  it("filters by module and tag, and offers to clear", async () => {
    render(<DevlogBrowser entries={entries} status={status} />);
    const filters = screen.getByRole("group", { name: "Bộ lọc devlog" });

    await userEvent.click(
      within(filters).getByRole("checkbox", { name: /Auth & Security/ }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("1 / 2 entry")).toBeInTheDocument();

    await userEvent.click(
      within(filters).getByRole("button", { name: "#frontend" }),
    );
    expect(
      screen.getByRole("heading", { name: "Không có entry phù hợp" }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getAllByRole("button", { name: "Xoá bộ lọc" })[1],
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DevlogBrowser entries={entries} status={status} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DevlogPreview", () => {
  it("shows only the latest entries in short form, with links", () => {
    render(<DevlogPreview entries={entries} status={status} limit={1} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nhật ký phát triển" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByText("Hoàn thành JWT.")).toBeInTheDocument();
    expect(screen.queryByText("const a = 1;")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Xem toàn bộ devlog" }),
    ).toHaveAttribute("href", "/devlog");
    expect(screen.getByRole("link", { name: "RSS" })).toHaveAttribute(
      "href",
      "/devlog/feed.xml",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <DevlogPreview entries={entries} status={status} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
