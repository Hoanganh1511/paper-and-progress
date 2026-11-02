"use client";

import { useEffect, useRef } from "react";
import { getAccessToken } from "@/features/auth";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1`;
const RETRY_MS = 5_000;

/**
 * While `isEnabled`, listens to the server's stream for this user and calls
 * `onChange` when their membership changed (an order was paid), so the page can
 * say so at once. The stream is read with `fetch`, not `EventSource`, because
 * `EventSource` cannot send the login header. If the connection drops it is
 * opened again; the page's own timed check is the fallback in the meantime.
 */
export function useMembershipEvents(isEnabled: boolean, onChange: () => void) {
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  });

  useEffect(() => {
    if (!isEnabled) return;
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;

    async function listen() {
      try {
        const response = await fetch(`${API_BASE}/membership/events`, {
          headers: {
            Authorization: `Bearer ${getAccessToken() ?? ""}`,
            Accept: "text/event-stream",
          },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("no stream");
        const reader = response.body
          .pipeThrough(new TextDecoderStream())
          .getReader();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += value;
          const messages = buffer.split("\n\n");
          buffer = messages.pop() ?? "";
          if (
            messages.some((message) => /^event: membership$/m.test(message))
          ) {
            latest.current();
          }
        }
      } catch {
        // Closed on purpose, or the connection dropped: try again below.
      }
      if (!controller.signal.aborted) retry = setTimeout(listen, RETRY_MS);
    }

    void listen();
    return () => {
      controller.abort();
      clearTimeout(retry);
    };
  }, [isEnabled]);
}
