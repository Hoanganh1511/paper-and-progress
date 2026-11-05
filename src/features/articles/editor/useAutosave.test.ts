import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { AUTOSAVE_DELAY_MS } from "./autosaveDelay";
import { useAutosave } from "./useAutosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const flush = () => act(async () => vi.advanceTimersByTimeAsync(0));

describe("useAutosave", () => {
  it("saves once, after the user stops changing the value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 3000 }),
      { initialProps: { value: "a" } },
    );
    expect(result.current.isDirty).toBe(false);

    rerender({ value: "ab" });
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    rerender({ value: "abc" });
    await act(async () => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled(); // the countdown restarted

    await act(async () => vi.advanceTimersByTimeAsync(1500));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("abc");
    expect(result.current.status).toBe("saved");
    expect(result.current.savedAt).toBeInstanceOf(Date);
    expect(result.current.isDirty).toBe(false);
  });

  it("never sends two saves at once; a change during a save is saved right after", async () => {
    let finishFirst!: () => void;
    const save = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (finishFirst = resolve)),
      )
      .mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 1000 }),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "b" });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saving");

    rerender({ value: "c" });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1); // still waiting for the first

    await act(async () => finishFirst());
    await flush();
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("c");
    expect(result.current.status).toBe("saved");
  });

  it("reports an error and keeps the changes dirty", async () => {
    const save = vi.fn().mockRejectedValue(new Error("Mất mạng"));
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 500 }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "b" });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Mất mạng");
    expect(result.current.isDirty).toBe(true);
  });

  it("waits while disabled, and saveNow saves without waiting", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value, isEnabled }) => useAutosave({ value, save, isEnabled }),
      { initialProps: { value: "a", isEnabled: false } },
    );
    rerender({ value: "b", isEnabled: false });
    await act(async () => vi.advanceTimersByTimeAsync(10000));
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.saveNow();
    });
    expect(save).toHaveBeenCalledWith("b");
  });

  it("asks the browser to confirm closing the tab while there are unsaved changes", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, save }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "b" });
    await flush();
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("the draft is saved once the writer has stopped for 5 seconds", () => {
  it("waits 5 seconds of quiet", () => {
    expect(AUTOSAVE_DELAY_MS).toBe(5000);
  });

  it("does not save while the writer keeps going, and saves once after the pause", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: AUTOSAVE_DELAY_MS }),
      { initialProps: { value: "" } },
    );

    // typing with pauses shorter than 5 seconds: each change restarts the count
    for (const text of ["H", "He", "Hel", "Hell", "Hello"]) {
      rerender({ value: text });
      await act(async () => vi.advanceTimersByTimeAsync(4000));
    }
    expect(save).not.toHaveBeenCalled();

    // stopped: one second more makes it 5 seconds since the last change
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("Hello");

    // nothing changed since, so waiting longer does not save again
    await act(async () => vi.advanceTimersByTimeAsync(30000));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("saves again after the next pause, only when something changed", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: AUTOSAVE_DELAY_MS }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "ab" });
    await act(async () => vi.advanceTimersByTimeAsync(5000));
    expect(save).toHaveBeenCalledTimes(1);
    rerender({ value: "abc" });
    await act(async () => vi.advanceTimersByTimeAsync(4999));
    expect(save).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("abc");
  });

  it("saves what is waiting when the editor is closed before the countdown ends", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 5000 }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "ab" });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).not.toHaveBeenCalled();

    unmount(); // a link inside the app was clicked
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("ab");
  });

  it("does not save on close when nothing changed, or when saving is turned off", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const clean = renderHook(() => useAutosave({ value: "a", save }));
    clean.unmount();

    const off = renderHook(
      ({ value }) => useAutosave({ value, save, isEnabled: false }),
      { initialProps: { value: "a" } },
    );
    off.rerender({ value: "ab" });
    off.unmount();
    await act(async () => vi.advanceTimersByTimeAsync(0));
    expect(save).not.toHaveBeenCalled();
  });

  it("saves right away when the tab is hidden", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 5000 }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "ab" });
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    visibility.mockRestore();
    expect(save).toHaveBeenCalledWith("ab");
  });

  it("retries a failed save by itself, then settles once it works", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Mất mạng"))
      .mockRejectedValueOnce(new Error("Mất mạng"))
      .mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) =>
        useAutosave({
          value,
          save,
          delay: 100,
          maxRetries: 3,
          retryDelay: () => 1000,
        }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "b" });
    await act(async () => vi.advanceTimersByTimeAsync(100));
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("error");
    expect(result.current.isRetrying).toBe(true);

    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(2);
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe("saved");
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("gives up after maxRetries, and does not retry what shouldRetry refuses", async () => {
    const save = vi.fn().mockRejectedValue(new Error("Mất mạng"));
    const { result, rerender } = renderHook(
      ({ value }) =>
        useAutosave({
          value,
          save,
          delay: 100,
          maxRetries: 2,
          retryDelay: () => 1000,
        }),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "b" });
    await act(async () => vi.advanceTimersByTimeAsync(100 + 5000));
    expect(save).toHaveBeenCalledTimes(3); // the first try and two retries
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.isDirty).toBe(true);

    const refused = vi.fn().mockRejectedValue(new Error("409"));
    const other = renderHook(
      ({ value }) =>
        useAutosave({
          value,
          save: refused,
          delay: 100,
          maxRetries: 3,
          shouldRetry: () => false,
        }),
      { initialProps: { value: "a" } },
    );
    other.rerender({ value: "b" });
    await act(async () => vi.advanceTimersByTimeAsync(100 + 20000));
    expect(refused).toHaveBeenCalledTimes(1);
  });

  it("still saves after a manual save when nothing had changed (it must not stay marked as running)", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutosave({ value, save, delay: 1000 }),
      { initialProps: { value: "a" } },
    );
    await act(async () => result.current.saveNow()); // the button, with nothing new to save
    expect(save).not.toHaveBeenCalled();

    rerender({ value: "ab" });
    await act(async () => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("ab");

    rerender({ value: "abc" });
    await act(async () => result.current.saveNow());
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("abc");
    expect(result.current.status).toBe("saved");
  });
});
