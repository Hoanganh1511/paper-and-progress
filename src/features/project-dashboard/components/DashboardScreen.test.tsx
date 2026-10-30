import {
  configure,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import type {
  ActivityItem,
  Category,
  CriterionDetail,
  CriterionListItem,
  DashboardStats,
  IssueItem,
} from "../types";

expect.extend(toHaveNoViolations);

// Many multi-step flows with real timers: give them room when the whole suite runs at once.
configure({ asyncUtilTimeout: 4000 });
vi.setConfig({ testTimeout: 20000 });

const api = vi.hoisted(() => ({
  getStats: vi.fn(),
  getCategories: vi.fn(),
  getCriteria: vi.fn(),
  getCriterion: vi.fn(),
  createCriterion: vi.fn(),
  updateCriterion: vi.fn(),
  deleteCriterion: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  reorderCategories: vi.fn(),
  getIssues: vi.fn(),
  getRecentActivities: vi.fn(),
  getActivities: vi.fn(),
}));
vi.mock("../projectDashboardApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../projectDashboardApi")>()),
  ...api,
}));

import { DashboardScreen } from "./DashboardScreen";

const stats: DashboardStats = {
  project: {
    name: "Paper & Progress",
    description: "Học tiếng Anh",
    health: "AT_RISK",
    updatedAt: "2026-10-30T03:00:00.000Z",
  },
  statistics: {
    total: 5,
    completed: 2,
    inProgress: 1,
    notStarted: 1,
    blocked: 1,
  },
  outstanding: { overdue: 2 },
  issues: [
    {
      id: "c3",
      title: "Cài đặt CI",
      description: "Pipeline đang lỗi",
      status: "BLOCKED",
      categoryName: "DevOps",
      issueTypes: ["BLOCKED", "OVERDUE"],
    },
  ],
};

const categories: Category[] = [
  {
    id: "cat1",
    name: "Frontend",
    description: "UI, routing",
    icon: "monitor",
    sortOrder: 0,
    stats: { total: 3, completed: 2, inProgress: 1, notStarted: 0, blocked: 0 },
  },
  {
    id: "cat2",
    name: "DevOps",
    description: null,
    icon: "cloud",
    sortOrder: 1,
    stats: { total: 2, completed: 0, inProgress: 0, notStarted: 1, blocked: 1 },
  },
];

function criterion(
  overrides: Partial<CriterionListItem> = {},
): CriterionListItem {
  return {
    id: "c1",
    categoryId: "cat1",
    title: "Trang chủ",
    description: "Mô tả",
    status: "COMPLETED",
    priority: "MEDIUM",
    deadline: null,
    notes: null,
    evidenceUrl: null,
    completedAt: null,
    sortOrder: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    category: { id: "cat1", name: "Frontend", icon: "monitor" },
    ...overrides,
  };
}

const activity: ActivityItem = {
  id: "a1",
  criteriaId: "c1",
  categoryId: "cat1",
  type: "STATUS_CHANGED",
  title: "Hoàn thành: Trang chủ",
  description: null,
  oldValue: "IN_PROGRESS",
  newValue: "COMPLETED",
  createdAt: "2026-10-30T07:32:00.000Z",
  categoryName: "Frontend",
};

function detail(overrides: Partial<CriterionDetail> = {}): CriterionDetail {
  const { category: _category, ...rest } = criterion();
  void _category;
  return {
    ...rest,
    category: { id: "cat1", name: "Frontend" },
    activities: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getStats.mockResolvedValue(stats);
  api.getCategories.mockResolvedValue(categories);
  api.getCriteria.mockImplementation(async ({ categoryId, search }) => {
    const all = [
      criterion(),
      criterion({ id: "c2", title: "Trang hồ sơ", status: "IN_PROGRESS" }),
      criterion({
        id: "c3",
        categoryId: "cat2",
        title: "Cài đặt CI",
        status: "BLOCKED",
        category: { id: "cat2", name: "DevOps", icon: "cloud" },
      }),
    ];
    const items = all.filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!search || item.title.toLowerCase().includes(search.toLowerCase())),
    );
    return { items, total: items.length, page: 1, limit: 200 };
  });
  api.getCriterion.mockImplementation(async (id: string) => detail({ id }));
  api.updateCriterion.mockResolvedValue(criterion());
  api.createCriterion.mockResolvedValue(criterion({ id: "new" }));
  api.deleteCriterion.mockResolvedValue(undefined);
  api.deleteCategory.mockResolvedValue(undefined);
  api.getIssues.mockImplementation(async ({ type }) => {
    const items: IssueItem[] = [
      { ...stats.issues[0], issueTypes: type ? [type] : ["BLOCKED"] },
    ];
    return { items, total: 1, page: 1, limit: 100 };
  });
  api.getRecentActivities.mockResolvedValue([activity]);
  api.getActivities.mockResolvedValue({
    items: [activity],
    total: 1,
    page: 1,
    limit: 20,
  });
});

async function renderLoaded() {
  const view = render(<DashboardScreen />);
  await screen.findByText("Website Project Overview");
  await screen.findByRole("button", { name: /^Frontend/ });
  return view;
}

const criteriaRegion = () =>
  screen.getByRole("region", { name: "Danh sách tính năng & tiêu chí" });

describe("Module A: overview", () => {
  it("shows the project, its health, the five counts and the outstanding issues", async () => {
    const { container } = await renderLoaded();
    expect(
      screen.getByText(/Paper & Progress · Học tiếng Anh/),
    ).toBeInTheDocument();
    expect(screen.getByText("Cập nhật 30/10/2026")).toBeInTheDocument();
    expect(screen.getByText(/At Risk/)).toBeInTheDocument();
    for (const [label, count] of [
      ["Tổng tiêu chí", "5"],
      ["Đã hoàn thành", "2"],
      ["Đang bị chặn", "1"],
    ]) {
      const card = screen.getByRole("button", { name: new RegExp(label) });
      expect(within(card).getByText(count)).toBeInTheDocument();
    }
    expect(
      within(screen.getByRole("button", { name: /Quá hạn/ })).getByText("2"),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("clicking a count filters the criteria list, and Tổng tiêu chí clears it", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /Đang bị chặn/ }));
    expect(
      screen.getByRole("button", { name: /Bị chặn \(1\)/ }),
    ).toHaveAttribute("aria-pressed", "true");
    // Frontend has nothing blocked, so only DevOps stays.
    expect(
      screen.queryByRole("button", { name: /^Frontend/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^DevOps/ })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /Tổng tiêu chí/ }),
    );
    expect(
      screen.getByRole("button", { name: /^Frontend/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tất cả \(5\)/ }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking an outstanding group lists those issues in Module C", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /Quá hạn/ }));
    await waitFor(() =>
      expect(api.getIssues).toHaveBeenCalledWith({
        type: "OVERDUE",
        limit: 100,
      }),
    );
    const region = criteriaRegion();
    expect(
      await within(region).findByRole("heading", { name: "DevOps" }),
    ).toBeInTheDocument();
    expect(
      within(region).getByRole("button", { name: /Cài đặt CI/ }),
    ).toBeInTheDocument();
  });

  it("shows a retry when the stats fail", async () => {
    api.getStats.mockRejectedValueOnce(new Error("Boom"));
    render(<DashboardScreen />);
    expect(await screen.findAllByText("Boom")).not.toHaveLength(0);
    await userEvent.click(
      screen.getAllByRole("button", { name: "Thử lại" })[0],
    );
    expect(
      await screen.findByText("Website Project Overview"),
    ).toBeInTheDocument();
  });
});

describe("Module B: issues", () => {
  it("shows the top issues with a badge for each type, and opens the detail panel", async () => {
    await renderLoaded();
    const issues = screen.getByRole("region", { name: "Issues & Attention" });
    const card = within(issues).getByRole("button", { name: /Cài đặt CI/ });
    expect(within(card).getByText("Blocked")).toBeInTheDocument();
    expect(within(card).getByText("Overdue")).toBeInTheDocument();
    await userEvent.click(card);
    expect(
      await screen.findByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toBeInTheDocument();
    expect(api.getCriterion).toHaveBeenCalledWith("c3");
  });

  it("Xem tất cả loads the full list", async () => {
    await renderLoaded();
    const issues = screen.getByRole("region", { name: "Issues & Attention" });
    await userEvent.click(
      within(issues).getByRole("button", { name: /Xem tất cả/ }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Tất cả vấn đề" }),
    ).toBeInTheDocument();
    expect(api.getIssues).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it("says when there is nothing to handle", async () => {
    api.getStats.mockResolvedValue({ ...stats, issues: [] });
    await renderLoaded();
    expect(screen.getByText("Không có vấn đề cần xử lý.")).toBeInTheDocument();
  });
});

describe("Module C: criteria", () => {
  it("shows the status counts, progress as a count and no percentage", async () => {
    await renderLoaded();
    expect(
      screen.getByRole("button", { name: /Tất cả \(5\)/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Hoàn thành \(2\)/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("opens a category to load its criteria, and a criterion opens the detail panel", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    expect(await screen.findByText("Trang hồ sơ")).toBeInTheDocument();
    expect(api.getCriteria).toHaveBeenCalledWith({
      categoryId: "cat1",
      status: undefined,
      limit: 200,
    });
    await userEvent.click(screen.getByRole("button", { name: /Trang hồ sơ/ }));
    expect(
      await screen.findByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toBeInTheDocument();
  });

  it("searches and opens only the categories with a match", async () => {
    await renderLoaded();
    await userEvent.type(screen.getByLabelText("Tìm tiêu chí"), "CI");
    await waitFor(() =>
      expect(
        within(criteriaRegion()).queryByRole("button", { name: /^Frontend/ }),
      ).not.toBeInTheDocument(),
    );
    expect(
      await within(criteriaRegion()).findByText("Cài đặt CI"),
    ).toBeInTheDocument();
    expect(api.getCriteria).toHaveBeenLastCalledWith({
      search: "CI",
      status: undefined,
      limit: 200,
    });
  });

  it("says when a search matches nothing", async () => {
    await renderLoaded();
    await userEvent.type(screen.getByLabelText("Tìm tiêu chí"), "zzz");
    expect(
      await screen.findByText("Không có kết quả phù hợp với bộ lọc"),
    ).toBeInTheDocument();
  });

  it("says when there are no categories at all", async () => {
    api.getCategories.mockResolvedValue([]);
    render(<DashboardScreen />);
    expect(await screen.findByText("Chưa có tiêu chí nào")).toBeInTheDocument();
  });

  it("adds a criterion to the category it was opened from, then refreshes everything", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await screen.findByText("Trang hồ sơ");
    const statsCalls = api.getStats.mock.calls.length;

    // The last one is at the end of the open category; the first is in the header.
    await userEvent.click(
      within(criteriaRegion())
        .getAllByRole("button", { name: "Thêm tiêu chí" })
        .at(-1) as HTMLElement,
    );
    const dialog = await screen.findByRole("dialog", { name: "Thêm tiêu chí" });
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Thêm tiêu chí" }),
    );
    expect(within(dialog).getByText("Nhập tiêu đề.")).toBeInTheDocument();
    expect(api.createCriterion).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText(/Tiêu đề/), "Trang mới");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Thêm tiêu chí" }),
    );
    await waitFor(() =>
      expect(api.createCriterion).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: "cat1",
          title: "Trang mới",
          priority: "MEDIUM",
          status: "NOT_STARTED",
        }),
      ),
    );
    await waitFor(() =>
      expect(api.getStats.mock.calls.length).toBeGreaterThan(statsCalls),
    );
  });

  it("will not delete a category that still has criteria", async () => {
    await renderLoaded();
    await userEvent.click(
      screen.getByRole("button", { name: "Thao tác với danh mục Frontend" }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Delete Category" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/còn 3 tiêu chí/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Xóa danh mục" }),
    ).toBeDisabled();
  });

  it("deletes an empty category", async () => {
    api.getCategories.mockResolvedValue([
      {
        ...categories[0],
        stats: {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          blocked: 0,
        },
      },
    ]);
    await renderLoaded();
    await userEvent.click(
      screen.getByRole("button", { name: "Thao tác với danh mục Frontend" }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Delete Category" }),
    );
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Xóa danh mục",
      }),
    );
    await waitFor(() =>
      expect(api.deleteCategory).toHaveBeenCalledWith("cat1"),
    );
  });

  it("moves a category down", async () => {
    api.reorderCategories.mockResolvedValue(categories);
    await renderLoaded();
    await userEvent.click(
      screen.getByRole("button", { name: "Thao tác với danh mục Frontend" }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Move down" }),
    );
    await waitFor(() =>
      expect(api.reorderCategories).toHaveBeenCalledWith([
        { id: "cat2", sortOrder: 0 },
        { id: "cat1", sortOrder: 1 },
      ]),
    );
  });
});

describe("Criteria detail panel", () => {
  async function openDetail() {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await userEvent.click(
      await screen.findByRole("button", { name: /Trang hồ sơ/ }),
    );
    return screen.findByRole("region", { name: "Chi tiết tiêu chí" });
  }

  it("saves a status change, then refreshes the stats, the categories and the activities", async () => {
    const dialog = await openDetail();
    await within(dialog).findByDisplayValue("Trang chủ");
    const before = {
      stats: api.getStats.mock.calls.length,
      categories: api.getCategories.mock.calls.length,
      activities: api.getRecentActivities.mock.calls.length,
    };

    await userEvent.click(
      within(dialog).getByRole("radio", { name: "Blocked" }),
    );
    await waitFor(() =>
      expect(api.updateCriterion).toHaveBeenCalledWith("c2", {
        status: "BLOCKED",
      }),
    );
    await waitFor(() => {
      expect(api.getStats.mock.calls.length).toBeGreaterThan(before.stats);
      expect(api.getCategories.mock.calls.length).toBeGreaterThan(
        before.categories,
      );
      expect(api.getRecentActivities.mock.calls.length).toBeGreaterThan(
        before.activities,
      );
    });
  });

  it("saves an edited title when the field loses focus", async () => {
    const dialog = await openDetail();
    const title = await within(dialog).findByDisplayValue("Trang chủ");
    await userEvent.clear(title);
    await userEvent.type(title, "Trang chủ mới");
    await userEvent.tab();
    await waitFor(() =>
      expect(api.updateCriterion).toHaveBeenCalledWith("c2", {
        title: "Trang chủ mới",
      }),
    );
  });

  it("flags an overdue criterion and rejects a bad evidence link", async () => {
    api.getCriterion.mockResolvedValue(
      detail({ status: "IN_PROGRESS", deadline: "2020-01-01T00:00:00.000Z" }),
    );
    const dialog = await openDetail();
    expect(await within(dialog).findByText("Quá hạn")).toBeInTheDocument();

    const url = within(dialog).getByLabelText("Evidence URL");
    await userEvent.type(url, "not a link");
    await userEvent.tab();
    expect(within(dialog).getByText(/bắt đầu bằng http/)).toBeInTheDocument();
    expect(api.updateCriterion).not.toHaveBeenCalled();
  });

  it("asks before deleting a criterion", async () => {
    const dialog = await openDetail();
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "Xóa tiêu chí" }),
    );
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Xóa",
      }),
    );
    await waitFor(() => expect(api.deleteCriterion).toHaveBeenCalledWith("c2"));
  });
});

describe("Module D: activities", () => {
  it("shows the latest activities and opens the criterion of one", async () => {
    await renderLoaded();
    const section = screen.getByRole("region", { name: "Hoạt động gần đây" });
    expect(
      await within(section).findByText("Hoàn thành: Trang chủ"),
    ).toBeInTheDocument();
    expect(within(section).getByText("30/10/2026 14:32")).toBeInTheDocument();
    await userEvent.click(
      within(section).getByRole("button", { name: /Hoàn thành: Trang chủ/ }),
    );
    expect(
      await screen.findByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toBeInTheDocument();
    expect(api.getCriterion).toHaveBeenCalledWith("c1");
  });

  it("does not link an activity whose criterion was deleted", async () => {
    api.getRecentActivities.mockResolvedValue([
      { ...activity, criteriaId: null, title: "Xóa: Trang cũ" },
    ]);
    await renderLoaded();
    const section = screen.getByRole("region", { name: "Hoạt động gần đây" });
    expect(
      await within(section).findByText("Xóa: Trang cũ"),
    ).toBeInTheDocument();
    expect(
      within(section).queryByRole("button", { name: /Xóa: Trang cũ/ }),
    ).toBeNull();
  });

  it("says when there is no activity yet", async () => {
    api.getRecentActivities.mockResolvedValue([]);
    await renderLoaded();
    expect(await screen.findByText("Chưa có hoạt động.")).toBeInTheDocument();
  });

  it("Xem tất cả opens the history with a type filter", async () => {
    await renderLoaded();
    const section = screen.getByRole("region", { name: "Hoạt động gần đây" });
    await userEvent.click(
      within(section).getByRole("button", { name: /Xem tất cả/ }),
    );
    expect(
      await screen.findByRole("dialog", { name: "Lịch sử hoạt động" }),
    ).toBeInTheDocument();
    expect(api.getActivities).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      type: undefined,
    });
  });
});

describe("Layout when a criterion is open", () => {
  const pageContainer = (container: HTMLElement) =>
    container.firstElementChild as HTMLElement;

  it("goes full width and opens the middle column, keeping the other modules; closing undoes it", async () => {
    const { container } = await renderLoaded();
    expect(pageContainer(container)).toHaveClass(
      "max-w-[var(--width-container-wide)]",
    );
    expect(
      screen.queryByRole("region", { name: "Chi tiết tiêu chí" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await userEvent.click(
      await screen.findByRole("button", { name: /Trang hồ sơ/ }),
    );
    expect(
      await screen.findByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toBeInTheDocument();
    expect(pageContainer(container)).toHaveClass("max-w-full");
    // Nothing is replaced: the overview and list on the left, issues and activity on the right.
    expect(screen.getByText("Website Project Overview")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Issues & Attention" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Hoạt động gần đây" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[class*='5fr']")).toBeInTheDocument();

    await userEvent.click(
      within(
        screen.getByRole("region", { name: "Chi tiết tiêu chí" }),
      ).getByRole("button", { name: "Đóng" }),
    );
    expect(pageContainer(container)).toHaveClass(
      "max-w-[var(--width-container-wide)]",
    );
    // The detail stays while the column closes, then is removed.
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Chi tiết tiêu chí" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("region", { name: "Issues & Attention" }),
    ).toBeInTheDocument();
  });

  it("opens another criterion in the same column", async () => {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await userEvent.click(
      await screen.findByRole("button", { name: /Trang hồ sơ/ }),
    );
    await screen.findByRole("region", { name: "Chi tiết tiêu chí" });
    await userEvent.click(
      within(criteriaRegion()).getByRole("button", { name: /Trang chủ/ }),
    );
    await waitFor(() => expect(api.getCriterion).toHaveBeenCalledWith("c1"));
    expect(
      screen.getAllByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toHaveLength(1);
  });

  it("opens the new criterion in the middle column after it is created", async () => {
    await renderLoaded();
    // From inside a category, so the category is already chosen.
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await screen.findByText("Trang hồ sơ");
    await userEvent.click(
      within(criteriaRegion())
        .getAllByRole("button", { name: "Thêm tiêu chí" })
        .at(-1) as HTMLElement,
    );
    const dialog = await screen.findByRole("dialog", { name: "Thêm tiêu chí" });
    await userEvent.type(within(dialog).getByLabelText(/Tiêu đề/), "Việc mới");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Thêm tiêu chí" }),
    );
    await waitFor(() => expect(api.createCriterion).toHaveBeenCalled());
    expect(
      await screen.findByRole("region", { name: "Chi tiết tiêu chí" }),
    ).toBeInTheDocument();
    expect(api.getCriterion).toHaveBeenCalledWith("new");
  });
});

describe("Criteria detail panel: status, footer and scrolling", () => {
  async function openDetail() {
    await renderLoaded();
    await userEvent.click(screen.getByRole("button", { name: /^Frontend/ }));
    await userEvent.click(
      await screen.findByRole("button", { name: /Trang hồ sơ/ }),
    );
    return screen.findByRole("region", { name: "Chi tiết tiêu chí" });
  }

  it("shows the four statuses as radio choices with the current one checked", async () => {
    api.getCriterion.mockImplementation(async (id: string) =>
      detail({ id, status: "IN_PROGRESS" }),
    );
    const panel = await openDetail();
    const group = await within(panel).findByRole("radiogroup", {
      name: "Trạng thái",
    });
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.textContent),
    ).toEqual(["Completed", "In Progress", "Not Started", "Blocked"]);
    expect(
      within(group).getByRole("radio", { name: "In Progress" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      within(group).getByRole("radio", { name: "Completed" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("changes the status with the arrow keys", async () => {
    api.getCriterion.mockImplementation(async (id: string) =>
      detail({ id, status: "IN_PROGRESS" }),
    );
    const panel = await openDetail();
    const current = await within(panel).findByRole("radio", {
      name: "In Progress",
    });
    current.focus();
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(api.updateCriterion).toHaveBeenCalledWith("c2", {
        status: "NOT_STARTED",
      }),
    );
  });

  it("has a single Đóng button, to the right, and a ghost delete link that asks first", async () => {
    const panel = await openDetail();
    await within(panel).findByRole("button", { name: "Xóa tiêu chí" });
    expect(within(panel).getAllByRole("button", { name: /Đóng/ })).toHaveLength(
      1,
    );

    const remove = within(panel).getByRole("button", { name: "Xóa tiêu chí" });
    await userEvent.click(remove);
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(api.deleteCriterion).not.toHaveBeenCalled();
  });

  it("scrolls the detail into view, smoothly, when a criterion opens", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    await openDetail();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    expect(scrollIntoView).toHaveBeenLastCalledWith(
      expect.objectContaining({ block: "start" }),
    );
  });
});

describe("Collapsible boxes", () => {
  it.each([
    ["Website Project Overview", /Tổng tiêu chí/],
    ["Issues & Attention", /Cài đặt CI/],
    ["Hoạt động gần đây", /Hoàn thành: Trang chủ/],
    ["Danh sách tính năng & tiêu chí", /Tìm tiêu chí|Tất cả \(5\)/],
  ])(
    "folds %s up with the − button and opens it again",
    async (title, content) => {
      await renderLoaded();
      const toggle = screen.getByRole("button", { name: `Thu gọn ${title}` });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      await userEvent.click(toggle);

      const folded = screen.getByRole("button", { name: `Mở rộng ${title}` });
      expect(folded).toHaveAttribute("aria-expanded", "false");
      const body = document.getElementById(
        folded.getAttribute("aria-controls") as string,
      );
      expect(body).toHaveAttribute("hidden");
      expect(body).toHaveTextContent(content);

      await userEvent.click(folded);
      expect(
        screen.getByRole("button", { name: `Thu gọn ${title}` }),
      ).toHaveAttribute("aria-expanded", "true");
    },
  );
});
