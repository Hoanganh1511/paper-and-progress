import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { TODO_FIXTURES } from "../../fixtures";
import type { DevTodo } from "../../types";

expect.extend(toHaveNoViolations);

const api = vi.hoisted(() => ({
  listDevTodos: vi.fn(),
  createDevTodo: vi.fn(),
  updateDevTodo: vi.fn(),
  deleteDevTodo: vi.fn(),
}));
vi.mock("../../devTodoApi", () => api);

import { DevTodoWidget } from "./DevTodoWidget";

/** A tiny in-memory stand-in for the backend. */
function fakeServer(initial: DevTodo[]) {
  let rows = [...initial];
  api.listDevTodos.mockImplementation(async () => rows);
  api.createDevTodo.mockImplementation(async (input) => {
    const row: DevTodo = {
      ...TODO_FIXTURES[0],
      ...input,
      id: `new-${rows.length}`,
      status: "pending",
      completedAt: null,
    };
    rows = [...rows, row];
    return row;
  });
  api.updateDevTodo.mockImplementation(async (id, patch) => {
    const row = {
      ...rows.find((item) => item.id === id)!,
      ...patch,
    } as DevTodo;
    row.completedAt = row.status === "done" ? "2026-10-30T00:00:00Z" : null;
    rows = rows.map((item) => (item.id === id ? row : item));
    return row;
  });
  api.deleteDevTodo.mockImplementation(async (id) => {
    rows = rows.filter((item) => item.id !== id);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fakeServer(TODO_FIXTURES);
});

async function openPanel() {
  const toggle = await screen.findByRole("button", {
    name: /^Dev Todo, còn/,
  });
  await userEvent.click(toggle);
  return screen.getByRole("region", { name: "Dev todo" });
}

describe("DevTodoWidget", () => {
  it("starts collapsed with the open-task count on the button", async () => {
    render(<DevTodoWidget />);
    expect(
      await screen.findByRole("button", {
        name: "Dev Todo, còn 4 task chưa xong",
      }),
    ).toHaveAttribute("aria-expanded", "false");
    // Stays mounted so it can animate; `inert` keeps it out of reach.
    expect(
      screen.getByRole("region", { name: "Dev todo", hidden: true }),
    ).toHaveAttribute("inert");
  });

  it("opens, shows the progress and closes with Escape", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    expect(
      within(panel).getByRole("progressbar", { name: "Tiến độ hoàn thành" }),
    ).toHaveAttribute("aria-valuenow", "60");

    await userEvent.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: /^Dev Todo, còn/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("lists high priority first and done tasks last", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    const titles = within(panel)
      .getAllByRole("listitem")
      .map((item) => item.textContent ?? "");
    expect(titles[0]).toContain("Profile - Trang hồ sơ người dùng");
    expect(titles.at(-1)).toContain("Auth - Token Rotation");
  });

  it("marks a task done from its checkbox with a PATCH", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    await userEvent.click(
      within(panel).getByRole("checkbox", {
        name: "Đánh dấu xong: Profile - Trang hồ sơ người dùng",
      }),
    );
    expect(api.updateDevTodo).toHaveBeenCalledWith("7", { status: "done" });
    expect(
      await screen.findByRole("button", {
        name: "Dev Todo, còn 3 task chưa xong",
      }),
    ).toBeInTheDocument();
  });

  it("cycles a task to in_progress by clicking its label", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    await userEvent.click(
      within(panel).getByRole("button", {
        name: /^Profile - Upload avatar \(S3\)/,
      }),
    );
    expect(api.updateDevTodo).toHaveBeenCalledWith("8", {
      status: "in_progress",
    });
  });

  it("filters by status and category", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    await userEvent.click(
      within(panel).getByRole("button", { name: "Chờ làm" }),
    );
    expect(within(panel).getAllByRole("listitem")).toHaveLength(4);
    await userEvent.selectOptions(
      within(panel).getByLabelText("Lọc theo category"),
      "UI/UX",
    );
    expect(within(panel).getAllByRole("listitem")).toHaveLength(1);
  });

  it("adds and deletes a task through the API", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    await userEvent.type(
      within(panel).getByLabelText("Tên task mới"),
      "Write widget tests",
    );
    await userEvent.click(within(panel).getByRole("button", { name: "Add" }));
    expect(api.createDevTodo).toHaveBeenCalledWith({
      title: "Write widget tests",
      priority: "medium",
      category: "Auth",
    });
    expect(await within(panel).findByText(/Write widget tests/)).toBeVisible();

    await userEvent.click(
      within(panel).getByRole("button", {
        name: "Xoá task: Write widget tests",
      }),
    );
    expect(api.deleteDevTodo).toHaveBeenCalled();
    await waitFor(() =>
      expect(within(panel).queryByText(/Write widget tests/)).toBeNull(),
    );
  });

  it("offers a retry when the backend is unreachable", async () => {
    api.listDevTodos.mockRejectedValueOnce(new Error("Network Error"));
    render(<DevTodoWidget />);
    await userEvent.click(screen.getByRole("button", { name: "Dev Todo" }));
    expect(
      await screen.findByText(/Không kết nối được API dev-todos/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Auth - Refresh Token")).toBeInTheDocument();
  });

  it("tells the user when a change could not be saved", async () => {
    render(<DevTodoWidget />);
    const panel = await openPanel();
    api.updateDevTodo.mockRejectedValueOnce(new Error("500"));
    await userEvent.click(
      within(panel).getByRole("checkbox", {
        name: "Đánh dấu xong: Profile - Trang hồ sơ người dùng",
      }),
    );
    expect(await within(panel).findByRole("alert")).toHaveTextContent(
      "Không lưu được thay đổi",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<DevTodoWidget />);
    await openPanel();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DevTodoWidget and the page behind it", () => {
  // The wrapper stays as big as the panel even when the panel is closed, and it
  // sits above the whole page (z-9999). If it took the mouse it would cover, for
  // example, the account menu in the header and close it on every click there.
  it("lets clicks through everywhere except the button and an open panel", async () => {
    const { container } = render(<DevTodoWidget />);
    const wrapper = container.firstElementChild as HTMLElement;
    const toggle = await screen.findByRole("button", { name: /^Dev Todo/ });
    const panel = screen.getByRole("region", {
      name: "Dev todo",
      hidden: true,
    });

    expect(wrapper).toHaveClass("pointer-events-none");
    expect(toggle).toHaveClass("pointer-events-auto");
    expect(panel).not.toHaveClass("pointer-events-auto");

    await userEvent.click(toggle);
    expect(panel).toHaveClass("pointer-events-auto");
    expect(wrapper).toHaveClass("pointer-events-none");

    await userEvent.click(toggle);
    expect(panel).not.toHaveClass("pointer-events-auto");
  });
});
