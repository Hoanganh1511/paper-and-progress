import { vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import {
  THEME_INIT_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
} from "./theme";
import { ThemeScript } from "./ThemeScript";
import { useTheme } from "./useTheme";

function mockSystemTheme(initial: "light" | "dark") {
  let isDark = initial === "dark";
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes("dark") ? isDark : false;
    },
    media: query,
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  return {
    set(next: "light" | "dark") {
      isDark = next === "dark";
      listeners.forEach((listener) => listener());
    },
  };
}

function reset() {
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
  Reflect.deleteProperty(window, "matchMedia");
}

describe("theme helpers", () => {
  beforeEach(reset);
  afterEach(reset);

  it("reads only valid stored values", () => {
    expect(readStoredTheme()).toBeNull();
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    expect(readStoredTheme()).toBeNull();
  });

  it("falls back to light without matchMedia, and follows the system with it", () => {
    expect(getSystemTheme()).toBe("light");
    mockSystemTheme("dark");
    expect(getSystemTheme()).toBe("dark");
  });

  it("lets a stored choice beat the system", () => {
    mockSystemTheme("dark");
    expect(resolveTheme()).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(resolveTheme()).toBe("light");
  });

  it("applies a theme with the class and the data attribute globals.css reads", () => {
    applyTheme("dark");
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    applyTheme("light");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("survives blocked storage", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(readStoredTheme()).toBeNull();
    spy.mockRestore();
  });
});

describe("ThemeScript", () => {
  beforeEach(reset);
  afterEach(reset);

  it("renders an inline script that applies a saved theme before paint", () => {
    const { container } = render(<ThemeScript />);
    expect(container.querySelector("script")?.innerHTML).toBe(
      THEME_INIT_SCRIPT,
    );

    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement).toHaveClass("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("does nothing when nothing is saved or the value is unknown", () => {
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    window.localStorage.setItem(THEME_STORAGE_KEY, "sepia");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe("useTheme", () => {
  beforeEach(reset);
  afterEach(reset);

  it("starts from the system theme", () => {
    mockSystemTheme("dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("starts from a saved choice and applies it", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("sets a theme: saves it, applies it and re-renders", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("toggles between light and dark", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
  });

  it("toggles away from the system theme when nothing is saved", () => {
    mockSystemTheme("dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("follows the system while no choice is saved", () => {
    const system = mockSystemTheme("light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    act(() => system.set("dark"));
    expect(result.current.theme).toBe("dark");
  });

  it("reports the saved preference, or system when none is saved", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("system");
    act(() => result.current.setPreference("dark"));
    expect(result.current.preference).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("system forgets the saved choice and hands control back to the OS", () => {
    mockSystemTheme("dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setPreference("light"));
    expect(document.documentElement.dataset.theme).toBe("light");

    act(() => result.current.setPreference("system"));
    expect(result.current.preference).toBe("system");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement).not.toHaveClass("dark");
    expect(result.current.theme).toBe("dark");
  });

  it("keeps several users of the hook in step", () => {
    const first = renderHook(() => useTheme());
    const second = renderHook(() => useTheme());
    act(() => first.result.current.setTheme("dark"));
    expect(second.result.current.theme).toBe("dark");
  });

  it("still switches for this page when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(document.documentElement).toHaveClass("dark");
    vi.restoreAllMocks();
  });
});
