import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth", () => ({ getAccessToken: () => "tok" }));

import { useMembershipEvents } from "./useMembershipEvents";

/** A response whose body yields the given chunks, then ends (or stays open). */
function streamOf(chunks: string[], stayOpen = false) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        if (!stayOpen) controller.close();
      },
    }),
    { status: 200 },
  );
}

const flush = () => act(async () => new Promise((r) => setTimeout(r, 0)));

describe("useMembershipEvents", () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not connect while it is off", () => {
    renderHook(() => useMembershipEvents(false, vi.fn()));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("connects with the login token and calls back on a membership event", async () => {
    fetchMock.mockResolvedValue(
      streamOf(
        [
          "event: ping\ndata: {}\n\n",
          'event: membership\ndata: {"changed":true}\n\n',
        ],
        true,
      ),
    );
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useMembershipEvents(true, onChange));
    await flush();
    await flush();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    expect(onChange).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("ignores pings and reads an event split across chunks", async () => {
    fetchMock.mockResolvedValue(
      streamOf(
        ["event: ping\ndata: {}\n\n", "event: membe", "rship\ndata: {}\n\n"],
        true,
      ),
    );
    const onChange = vi.fn();
    const { unmount } = renderHook(() => useMembershipEvents(true, onChange));
    await flush();
    await flush();
    expect(onChange).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("closes the connection when it is turned off", async () => {
    fetchMock.mockResolvedValue(streamOf([], true));
    const { rerender } = renderHook(
      ({ on }) => useMembershipEvents(on, vi.fn()),
      { initialProps: { on: true } },
    );
    await flush();
    const signal: AbortSignal = fetchMock.mock.calls[0][1].signal;
    expect(signal.aborted).toBe(false);
    rerender({ on: false });
    expect(signal.aborted).toBe(true);
  });
});
