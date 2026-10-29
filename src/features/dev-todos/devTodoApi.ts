import axios from "axios";
import type { DevTodo, DevTodoPriority, DevTodoStatus } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Not the auth feature's `api`: that one attaches the Bearer token and renews
// the session on 401. The dev-todos endpoints need no auth, so a stale token
// must not touch them (and a 401 here must not end the user's session).
const client = axios.create({
  baseURL: `${API_URL}/api/v1/dev-todos`,
  timeout: 10_000,
});

export interface DevTodoFilter {
  status?: DevTodoStatus;
  category?: string;
}

export interface NewDevTodo {
  title: string;
  priority: DevTodoPriority;
  category: string;
}

export type DevTodoPatch = Partial<NewDevTodo & { status: DevTodoStatus }>;

export async function listDevTodos(filter?: DevTodoFilter): Promise<DevTodo[]> {
  const { data } = await client.get<DevTodo[]>("", { params: filter });
  return data;
}

export async function createDevTodo(todo: NewDevTodo): Promise<DevTodo> {
  const { data } = await client.post<DevTodo>("", todo);
  return data;
}

export async function updateDevTodo(
  id: string,
  patch: DevTodoPatch,
): Promise<DevTodo> {
  const { data } = await client.patch<DevTodo>(`/${id}`, patch);
  return data;
}

export async function deleteDevTodo(id: string): Promise<void> {
  await client.delete(`/${id}`);
}
