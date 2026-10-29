"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createDevTodo,
  deleteDevTodo,
  listDevTodos,
  updateDevTodo,
  type DevTodoPatch,
  type NewDevTodo,
} from "./devTodoApi";
import type { DevTodo } from "./types";

export type DevTodosState = "loading" | "ready" | "error";

export interface DevTodoActions {
  reload: () => void;
  add: (todo: NewDevTodo) => Promise<void>;
  update: (id: string, patch: DevTodoPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export interface UseDevTodosResult {
  todos: DevTodo[];
  state: DevTodosState;
  /** Set when the last add / update / remove failed; cleared by the next action. */
  actionError: boolean;
  actions: DevTodoActions;
}

/** The dev todo list, loaded from and saved to the backend's dev-todos API. */
export function useDevTodos(): UseDevTodosResult {
  const [todos, setTodos] = useState<DevTodo[]>([]);
  const [state, setState] = useState<DevTodosState>("loading");
  const [actionError, setActionError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    listDevTodos()
      .then((list) => {
        if (!isCurrent) return;
        setTodos(list);
        setState("ready");
      })
      .catch(() => {
        if (isCurrent) setState("error");
      });
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const run = useCallback(async (action: () => Promise<void>) => {
    setActionError(false);
    try {
      await action();
    } catch {
      setActionError(true);
    }
  }, []);

  const actions: DevTodoActions = {
    reload: () => {
      setState("loading");
      setReloadKey((key) => key + 1);
    },
    add: (input) =>
      run(async () => {
        const created = await createDevTodo(input);
        setTodos((list) => [...list, created]);
      }),
    update: (id, patch) =>
      run(async () => {
        const updated = await updateDevTodo(id, patch);
        setTodos((list) =>
          list.map((todo) => (todo.id === id ? updated : todo)),
        );
      }),
    remove: (id) =>
      run(async () => {
        await deleteDevTodo(id);
        setTodos((list) => list.filter((todo) => todo.id !== id));
      }),
  };

  return { todos, state, actionError, actions };
}
