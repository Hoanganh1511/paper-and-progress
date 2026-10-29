import { TODO_FIXTURES } from "./fixtures";
import {
  ALL_CATEGORIES,
  computeProgress,
  countOpen,
  filterTodos,
  listCategories,
  nextStatus,
  sortTodos,
  toggleDoneStatus,
} from "./todos";
import type { DevTodo } from "./types";

describe("status changes", () => {
  it("cycles pending -> in_progress -> done -> pending", () => {
    expect(nextStatus("pending")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(nextStatus("done")).toBe("pending");
  });

  it("toggles the checkbox between done and pending", () => {
    expect(toggleDoneStatus("pending")).toBe("done");
    expect(toggleDoneStatus("in_progress")).toBe("done");
    expect(toggleDoneStatus("done")).toBe("pending");
  });
});

describe("filterTodos / computeProgress / countOpen", () => {
  it("filters by status and category together", () => {
    const all = { status: "all", category: ALL_CATEGORIES } as const;
    expect(filterTodos(TODO_FIXTURES, all)).toHaveLength(10);
    expect(
      filterTodos(TODO_FIXTURES, { ...all, status: "pending" }),
    ).toHaveLength(4);
    expect(
      filterTodos(TODO_FIXTURES, { status: "pending", category: "UI/UX" }),
    ).toHaveLength(1);
  });

  it("counts progress and open tasks", () => {
    expect(computeProgress(TODO_FIXTURES)).toBe(60);
    expect(countOpen(TODO_FIXTURES)).toBe(4);
    expect(computeProgress([])).toBe(0);
  });
});

describe("sortTodos", () => {
  it("puts high priority first and done tasks last", () => {
    const sorted = sortTodos(TODO_FIXTURES);
    expect(sorted.slice(0, 4).map((todo) => todo.priority)).toEqual([
      "high",
      "medium",
      "medium",
      "low",
    ]);
    expect(sorted.slice(4).every((todo) => todo.status === "done")).toBe(true);
    expect(sorted.at(4)?.priority).toBe("high");
  });

  it("does not mutate its input", () => {
    const copy = [...TODO_FIXTURES];
    sortTodos(TODO_FIXTURES);
    expect(TODO_FIXTURES).toEqual(copy);
  });
});

describe("listCategories", () => {
  it("adds custom categories after the defaults", () => {
    const custom: DevTodo = { ...TODO_FIXTURES[0], id: "x", category: "Docs" };
    const categories = listCategories([...TODO_FIXTURES, custom]);
    expect(categories).toContain("Auth");
    expect(categories.at(-1)).toBe("Docs");
  });
});
