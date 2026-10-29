import { vi } from "vitest";

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
const create = vi.hoisted(() => vi.fn());

vi.mock("axios", () => {
  create.mockReturnValue(http);
  return { default: { create } };
});

import {
  createDevTodo,
  deleteDevTodo,
  listDevTodos,
  updateDevTodo,
} from "./devTodoApi";
import { TODO_FIXTURES } from "./fixtures";

beforeEach(() => vi.clearAllMocks());

describe("devTodoApi", () => {
  it("uses its own client for /api/v1/dev-todos, without auth interceptors", () => {
    // `create` ran at import time; clearAllMocks above wiped the record, so
    // check the shape of the call through a fresh import.
    vi.resetModules();
    return import("./devTodoApi").then(() => {
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: "http://localhost:8000/api/v1/dev-todos",
        }),
      );
    });
  });

  it("lists todos, passing the filter as query params", async () => {
    http.get.mockResolvedValue({ data: TODO_FIXTURES });
    await expect(listDevTodos({ status: "done" })).resolves.toBe(TODO_FIXTURES);
    expect(http.get).toHaveBeenCalledWith("", { params: { status: "done" } });
  });

  it("creates, patches and deletes by id", async () => {
    http.post.mockResolvedValue({ data: TODO_FIXTURES[0] });
    http.patch.mockResolvedValue({ data: TODO_FIXTURES[1] });
    http.delete.mockResolvedValue({ data: { success: true } });

    const input = { title: "t", priority: "low", category: "Testing" } as const;
    await expect(createDevTodo(input)).resolves.toBe(TODO_FIXTURES[0]);
    expect(http.post).toHaveBeenCalledWith("", input);

    await expect(updateDevTodo("abc", { status: "done" })).resolves.toBe(
      TODO_FIXTURES[1],
    );
    expect(http.patch).toHaveBeenCalledWith("/abc", { status: "done" });

    await deleteDevTodo("abc");
    expect(http.delete).toHaveBeenCalledWith("/abc");
  });
});
