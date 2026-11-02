import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/topics/react",
}));
vi.mock("@/features/auth", () => ({
  useAuth: () => ({ isAuthenticated: false, isLoading: false }),
  loginHref: (path: string) => `/login?next=${path}`,
}));

import type { TopicDetail } from "../types";
import { TopicView } from "./TopicView";

const topic: TopicDetail = {
  topic: {
    slug: "react",
    name: "React",
    description: "Thư viện giao diện.",
    icon: null,
    groupLabel: "Framework",
  },
  breadcrumb: [],
  counts: { articles: 3, paths: 1, resources: 0 },
  isFollowing: false,
  resources: [],
  paths: [
    {
      slug: "react-roadmap",
      title: "React Roadmap",
      description: "Từng bước.",
      phaseCount: 2,
      stepCount: 5,
    },
  ],
  recentArticles: [
    {
      slug: "hooks",
      title: "Hooks",
      excerpt: null,
      coverImageUrl: null,
      readingMinutes: 4,
      publishedAt: null,
      author: "An",
    },
  ],
};

describe("TopicView", () => {
  it("shows the overview first, with the counts in the tab names", () => {
    render(<TopicView initial={topic} />);
    expect(screen.getByRole("tab", { name: "Tổng quan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Bài viết (3)" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Lộ trình (1)" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Tài liệu (0)" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Hooks" })).toBeVisible();
  });

  it("says how many of the articles are shown", () => {
    render(<TopicView initial={topic} />);
    expect(
      screen.getAllByText("Đang hiển thị 1/3 bài mới nhất."),
    ).not.toHaveLength(0);
  });

  it("gives a tab with nothing in it its own empty state", async () => {
    render(<TopicView initial={topic} />);
    await userEvent.click(screen.getByRole("tab", { name: "Tài liệu (0)" }));
    expect(screen.getByText("Chủ đề này chưa có tài liệu.")).toBeVisible();
  });

  it("has no axe violations", async () => {
    const { container } = render(<TopicView initial={topic} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
