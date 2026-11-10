"use client";

import dynamic from "next/dynamic";

// Developer progress tracker. NODE_ENV is inlined at build time, so in a
// production build the ternary collapses and the import() below, and with it
// the whole widget, is left out of the bundle (a plain `import` would keep it).
// Lives in a client file: calling next/dynamic from the server layout made
// Next's dev-only instant validation fail with "module factory is not available".
const DevTodoWidget =
  process.env.NODE_ENV === "development"
    ? dynamic(() =>
        import("@/features/dev-todos").then((module) => module.DevTodoWidget),
      )
    : null;

export function DevTodoLoader() {
  return DevTodoWidget ? <DevTodoWidget /> : null;
}
